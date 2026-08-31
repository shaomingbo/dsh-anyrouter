import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, runPnpmInstall, parseArgs, applyManifest, removeManifest, describeStatus, PACKAGE_NAME, DEFAULT_SOURCE } from '../bin/install.js'

function tempHome() {
  const home = mkdtempSync(join(tmpdir(), 'dsh-any-home-'))
  return { home, cleanup: () => rmSync(home, { recursive: true, force: true }) }
}

function writeProfile(home, profile = 'web', manifest = {}) {
  const profileDir = join(home, 'profiles', profile)
  mkdirSync(profileDir, { recursive: true })
  writeFileSync(join(profileDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  return profileDir
}

function readProfile(profileDir) {
  return JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'))
}

const failingInstall = async () => { throw new Error('pnpm exploded') }
const okInstall = async () => {}

test('parseArgs defaults to install on the web profile with the pinned source', () => {
  const options = parseArgs([])
  assert.equal(options.command, 'install')
  assert.equal(options.profile, 'web')
  assert.equal(options.source, DEFAULT_SOURCE)
  assert.match(DEFAULT_SOURCE, /^github:shaomingbo\/dsh-[a-z-]+#v0\.2\.0$/)
  assert.throws(() => parseArgs(['--profile']), /require values/)
  assert.throws(() => parseArgs(['--source']), /require values/)
  assert.throws(() => parseArgs(['bogus']), /unknown argument/)
  assert.equal(parseArgs(['uninstall']).command, 'uninstall')
  assert.equal(parseArgs(['--help']).help, true)
  assert.deepEqual(parseArgs(['--profile', 'headless', '--source', 'link:/tmp/x']), {
    command: 'install', profile: 'headless', source: 'link:/tmp/x',
  })
})

test('environment source override is honored without changing the pinned default', () => {
  const previous = process.env.DSH_ANYROUTER_SOURCE
  process.env.DSH_ANYROUTER_SOURCE = 'link:/tmp/checkout'
  try { assert.equal(parseArgs([]).source, 'link:/tmp/checkout') }
  finally {
    if (previous === undefined) delete process.env.DSH_ANYROUTER_SOURCE
    else process.env.DSH_ANYROUTER_SOURCE = previous
  }
  assert.equal(DEFAULT_SOURCE, parseArgs([]).source)
})

test('dependency installation falls back from pnpm to corepack and reports dual failure', () => {
  const calls = []
  let attempt = 0
  runPnpmInstall('/tmp/profile', { spawn(command, args) {
    calls.push([command, args])
    attempt += 1
    return attempt === 1
      ? { error: { code: 'ENOENT' } }
      : { error: undefined, status: 0 }
  } })
  assert.deepEqual(calls, [
    ['pnpm', ['install', '--ignore-scripts']],
    ['corepack', ['pnpm', 'install', '--ignore-scripts']],
  ])
  assert.throws(
    () => runPnpmInstall('/tmp/profile', { spawn: () => ({ error: { code: 'ENOENT' } }) }),
    /pnpm is unavailable/,
  )
  assert.throws(
    () => runPnpmInstall('/tmp/profile', { spawn: () => ({ error: undefined, status: 1 }) }),
    /failed with exit code 1/,
  )
})

test('applyManifest only touches the dependency and bundle entry, idempotently', () => {
  const baseline = {
    name: 'dsh-profile-web',
    private: true,
    dependencies: { other: '1.0.0' },
    dsh: { profile: { bundles: ['other'] } },
  }
  const first = applyManifest(baseline, 'github:acme/pkg#v1.0.0')
  assert.equal(first.dependencies[PACKAGE_NAME], 'github:acme/pkg#v1.0.0')
  assert.equal(first.dependencies.other, '1.0.0')
  assert.deepEqual(first.dsh.profile.bundles, ['other', PACKAGE_NAME])
  const again = applyManifest(first, 'github:acme/pkg#v1.0.0')
  assert.equal(again.dsh.profile.bundles.filter((name) => name === PACKAGE_NAME).length, 1)
  const restored = removeManifest(again)
  assert.equal(PACKAGE_NAME in restored.dependencies, false)
  assert.deepEqual(restored.dsh.profile.bundles, ['other'])
  assert.deepEqual(describeStatus(restored), { installed: false, source: null, bundled: false })
  assert.deepEqual(describeStatus(first), {
    installed: true, source: 'github:acme/pkg#v1.0.0', bundled: true,
  })
})

test('install writes the manifest, and a dependency failure restores it exactly', async () => {
  const { home, cleanup } = tempHome()
  const profileDir = writeProfile(home, 'web', { name: 'dsh-profile-web', dependencies: {} })
  try {
    await run(['--source', 'link:/tmp/checkout'], { home, installDeps: okInstall })
    const manifest = readProfile(profileDir)
    assert.equal(manifest.dependencies[PACKAGE_NAME], 'link:/tmp/checkout')
    assert.ok(manifest.dsh.profile.bundles.includes(PACKAGE_NAME))

    await run([], { home, installDeps: okInstall })
    assert.equal(readProfile(profileDir).dependencies[PACKAGE_NAME], DEFAULT_SOURCE)

    const before = readFileSync(join(profileDir, 'package.json'), 'utf8')
    await assert.rejects(
      () => run(['--source', 'link:/tmp/other'], { home, installDeps: failingInstall }),
      /pnpm exploded/,
    )
    assert.equal(readFileSync(join(profileDir, 'package.json'), 'utf8'), before)
  } finally { cleanup() }
})

test('repeat install is idempotent and reports status', async () => {
  const { home, cleanup } = tempHome()
  const profileDir = writeProfile(home)
  try {
    await run([], { home, installDeps: okInstall })
    const first = readProfile(profileDir)
    await run([], { home, installDeps: okInstall })
    const second = readProfile(profileDir)
    assert.deepEqual(second, first)
    assert.equal(second.dsh.profile.bundles.filter((name) => name === PACKAGE_NAME).length, 1)
  } finally { cleanup() }
})

test('status reports installed state and exits non-zero when absent', async () => {
  const { home, cleanup } = tempHome()
  writeProfile(home)
  try {
    const exitBefore = process.exitCode
    await run(['status'], { home, installDeps: okInstall })
    assert.equal(process.exitCode, 1)
    process.exitCode = exitBefore
    await run([], { home, installDeps: okInstall })
    await run(['status'], { home, installDeps: okInstall })
    assert.equal(process.exitCode, undefined)
  } finally {
    process.exitCode = 0
    cleanup()
  }
})

test('uninstall removes both fields and is a no-op when already absent', async () => {
  const { home, cleanup } = tempHome()
  const profileDir = writeProfile(home, 'web', { dependencies: { other: '1.0.0' }, dsh: { profile: { bundles: ['other'] } } })
  try {
    await run(['uninstall'], { home, installDeps: okInstall })
    assert.equal(PACKAGE_NAME in readProfile(profileDir).dependencies, false)
    assert.deepEqual(readProfile(profileDir).dsh.profile.bundles, ['other'])
    await run(['uninstall'], { home, installDeps: okInstall })
    assert.deepEqual(readProfile(profileDir).dsh.profile.bundles, ['other'])
  } finally { cleanup() }
})

test('a malformed profile manifest fails loud without writing', async () => {
  const { home, cleanup } = tempHome()
  const profileDir = writeProfile(home)
  writeFileSync(join(profileDir, 'package.json'), '{ not json')
  try {
    const original = readFileSync(join(profileDir, 'package.json'), 'utf8')
    await assert.rejects(() => run([], { home, installDeps: okInstall }))
    await assert.rejects(() => run(['status'], { home, installDeps: okInstall }))
    await assert.rejects(() => run(['uninstall'], { home, installDeps: okInstall }))
    assert.equal(readFileSync(join(profileDir, 'package.json'), 'utf8'), original)
  } finally { cleanup() }
})

test('a missing profile manifest fails loud', async () => {
  const { home, cleanup } = tempHome()
  try {
    await assert.rejects(() => run([], { home, installDeps: okInstall }))
  } finally { cleanup() }
})
