#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PACKAGE_NAME = 'dsh-anyrouter'
export const DEFAULT_SOURCE = 'github:shaomingbo/dsh-anyrouter#v0.2.2'
const COMMANDS = ['install', 'status', 'uninstall']

export function parseArgs(argv) {
  const result = {
    command: 'install',
    profile: 'web',
    source: process.env.DSH_ANYROUTER_SOURCE || DEFAULT_SOURCE,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--profile') result.profile = argv[++index]
    else if (arg === '--source') result.source = argv[++index]
    else if (arg === '--help' || arg === '-h') result.help = true
    else if (COMMANDS.includes(arg)) {
      if (result.command !== 'install') throw new Error(`unexpected argument: ${arg}`)
      result.command = arg
    }
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (!result.profile || !result.source) throw new Error('--profile and --source require values')
  return result
}

export function applyManifest(manifest, source) {
  const next = {
    ...manifest,
    dependencies: { ...(manifest.dependencies ?? {}) },
    dsh: {
      ...(manifest.dsh ?? {}),
      profile: {
        ...(manifest.dsh?.profile ?? {}),
        bundles: [...(manifest.dsh?.profile?.bundles ?? [])],
      },
    },
  }
  next.dependencies[PACKAGE_NAME] = source
  if (!next.dsh.profile.bundles.includes(PACKAGE_NAME)) {
    next.dsh.profile.bundles.push(PACKAGE_NAME)
  }
  return next
}

export function removeManifest(manifest) {
  const next = { ...manifest }
  if (next.dependencies && PACKAGE_NAME in next.dependencies) {
    next.dependencies = { ...next.dependencies }
    delete next.dependencies[PACKAGE_NAME]
  }
  if (Array.isArray(next.dsh?.profile?.bundles)) {
    const bundles = next.dsh.profile.bundles.filter((name) => name !== PACKAGE_NAME)
    if (bundles.length !== next.dsh.profile.bundles.length) {
      next.dsh = {
        ...next.dsh,
        profile: { ...next.dsh.profile, bundles },
      }
    }
  }
  return next
}

export function describeStatus(manifest) {
  const source = manifest.dependencies?.[PACKAGE_NAME] ?? null
  const bundled = Array.isArray(manifest.dsh?.profile?.bundles)
    && manifest.dsh.profile.bundles.includes(PACKAGE_NAME)
  return { installed: Boolean(source) && bundled, source, bundled }
}

export function runPnpmInstall(profileDir, { spawn = spawnSync } = {}) {
  const attempts = [
    ['pnpm', ['install', '--ignore-scripts']],
    ['corepack', ['pnpm', 'install', '--ignore-scripts']],
  ]
  for (const [command, args] of attempts) {
    const result = spawn(command, args, { cwd: profileDir, stdio: 'inherit' })
    if (!result.error && result.status === 0) return
    if (result.error?.code !== 'ENOENT') {
      throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
    }
  }
  throw new Error('pnpm is unavailable; install pnpm or enable it with corepack')
}

async function atomicWrite(path, content) {
  const temp = `${path}.${PACKAGE_NAME}.tmp`
  try {
    await writeFile(temp, content, 'utf8')
    await rename(temp, path)
  } catch (error) {
    await unlink(temp).catch(() => {})
    throw error
  }
}

function printHelp() {
  console.log(`Usage: ${PACKAGE_NAME} [command] [--profile web] [--source ${DEFAULT_SOURCE}]

Commands:
  install     Add the AnyRouter provider bundle to the profile (default)
  status      Show whether the bundle is installed
  uninstall   Remove the bundle from the profile (idempotent)

Options:
  --profile <name>   Target DSH profile (default: web)
  --source <source>  Package source (default: ${DEFAULT_SOURCE},
                     override with the DSH_ANYROUTER_SOURCE environment variable)
  -h, --help         Show this help

The installer only edits dependencies.${PACKAGE_NAME} and dsh.profile.bundles in
the profile package.json, then runs pnpm install --ignore-scripts there.
It never stops or restarts DSH; restart DSH manually afterwards.
Your credentials and synchronized models are kept on uninstall.`)
}

export async function run(argv = process.argv.slice(2), deps = {}) {
  const installDeps = deps.installDeps ?? runPnpmInstall
  const options = parseArgs(argv)
  if (options.help) {
    printHelp()
    return
  }

  const home = resolve(deps.home ?? process.env.DSH_HOME ?? join(homedir(), '.dsh'))
  const profileDir = join(home, 'profiles', options.profile)
  const packagePath = join(profileDir, 'package.json')

  if (options.command === 'status') {
    const manifest = JSON.parse(await readFile(packagePath, 'utf8'))
    const status = describeStatus(manifest)
    console.log(`${PACKAGE_NAME} in profile ${options.profile}: ${status.installed ? 'installed' : 'not installed'}`)
    console.log(`  dependency: ${status.source ?? '(absent)'}`)
    console.log(`  bundle entry: ${status.bundled ? 'present' : 'absent'}`)
    if (!status.installed) process.exitCode = 1
    return
  }

  if (options.command === 'uninstall') {
    const original = await readFile(packagePath, 'utf8')
    const manifest = JSON.parse(original)
    const status = describeStatus(manifest)
    if (!status.source && !status.bundled) {
      console.log(`${PACKAGE_NAME} is not installed in profile ${options.profile}; nothing to do.`)
      return
    }
    const next = removeManifest(manifest)
    await atomicWrite(packagePath, `${JSON.stringify(next, null, 2)}\n`)
    try {
      await installDeps(profileDir)
    } catch (error) {
      await atomicWrite(packagePath, original)
      throw error
    }
    console.log(`\nRemoved ${PACKAGE_NAME} from ${profileDir}`)
    console.log('The API key stays in the credentials store; remove it there if you want a full wipe.')
    console.log('Restart DSH and hard-refresh the Web page to unload the bundle.')
    return
  }

  const original = await readFile(packagePath, 'utf8')
  const next = applyManifest(JSON.parse(original), options.source)
  await atomicWrite(packagePath, `${JSON.stringify(next, null, 2)}\n`)
  try {
    await installDeps(profileDir)
  } catch (error) {
    await atomicWrite(packagePath, original)
    throw error
  }

  console.log(`\nInstalled ${PACKAGE_NAME} into ${profileDir}`)
  console.log('Restart DSH and hard-refresh the Web page, then open Settings → Anyrouter to store the API key.')
}

async function main() {
  await run()
}

// Node resolves the ESM entry through symlinks, so /var/folders/… or /tmp/…
// scripts would silently no-op if argv[1] were compared without realpath.
function invokedDirectly() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))
  } catch {
    return false
  }
}

const invoked = invokedDirectly()
if (invoked) {
  main().catch((error) => {
    const script = fileURLToPath(import.meta.url)
    console.error(`${script}: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
