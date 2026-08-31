// Generates src/model-profiles.generated.ts from the pi-ai builtin catalog.
//
// The browser settings section cannot query pi-ai (it is a Node-side peer
// dependency) and the `llm.discoverModels` wire schema strips unknown fields,
// so the reasoning profile each synchronized model carries (efforts, adaptive
// thinking, capacities, compat flags) is baked at build time from the exact
// pi-ai version this package pins, and shared by the host catalog and the
// browser bundle. One deterministic source of truth: regenerate after a pi-ai
// bump with `node scripts/generate-model-profiles.mjs` and commit the diff.
//
//   node scripts/generate-model-profiles.mjs

import { writeFile } from 'node:fs/promises'
import { builtinModels } from '@earendil-works/pi-ai/providers/all'
import { getSupportedThinkingLevels } from '@earendil-works/pi-ai'

const OUT = new URL('../src/model-profiles.generated.ts', import.meta.url)

function protocolOf(id) {
  if (id.startsWith('claude-')) return 'claude-code'
  if (id.startsWith('gpt-')) return 'codex-responses'
  return undefined
}

// Same preference order as the runtime catalog: Claude models reference the
// anthropic provider entry, GPT/Codex models reference the openai-codex one,
// so capacities and compat flags match the request identity the transports
// reproduce.
function pick(candidates, protocol) {
  if (protocol === 'claude-code') {
    return candidates.find(model => model.provider === 'anthropic')
      ?? candidates.find(model => model.api === 'anthropic-messages')
  }
  return candidates.find(model => model.provider === 'openai-codex')
    ?? candidates.find(model => model.provider === 'openai')
    ?? candidates.find(model => model.api === 'openai-responses')
}

const byId = new Map()
for (const model of builtinModels().getModels()) {
  const protocol = protocolOf(model.id)
  if (protocol === undefined) continue
  if (!byId.has(model.id)) byId.set(model.id, [])
  byId.get(model.id).push(model)
}

const rows = []
for (const [id, candidates] of byId) {
  const protocol = protocolOf(id)
  const reference = pick(candidates, protocol)
  if (reference === undefined) continue
  rows.push({
    id,
    protocol,
    name: reference.name,
    // A non-reasoning catalog model reports ['off']; persisted as an empty
    // effort set, which the runtime resolves to `reasoning: false`.
    efforts: reference.reasoning === true ? getSupportedThinkingLevels(reference) : [],
    adaptive: reference.compat?.forceAdaptiveThinking === true,
    contextWindow: reference.contextWindow,
    maxTokens: reference.maxTokens,
    ...(reference.compat === undefined ? {} : { compat: reference.compat }),
  })
}
rows.sort((a, b) => a.protocol.localeCompare(b.protocol) || a.id.localeCompare(b.id))

const header = `// GENERATED FILE — do not edit by hand.
// Source: scripts/generate-model-profiles.mjs over @earendil-works/pi-ai's
// builtin catalog. Regenerate after a pi-ai version bump and commit the diff;
// tests fail when a referenced profile is missing at runtime.

export type AnyRouterProtocolFamily = 'claude-code' | 'codex-responses'

export interface GeneratedModelProfile {
  readonly id: string
  readonly protocol: AnyRouterProtocolFamily
  readonly name: string
  /** Empty means the reference model is non-reasoning. */
  readonly efforts: readonly string[]
  readonly adaptive: boolean
  readonly contextWindow: number
  readonly maxTokens: number
  readonly compat?: Readonly<Record<string, unknown>>
}

export const MODEL_PROFILES: readonly GeneratedModelProfile[] = [
`

const body = rows.map(row => `  ${JSON.stringify(row)
  .replace('"id":', 'id:')
  .replace('"protocol":', 'protocol:')
  .replace('"name":', 'name:')
  .replace('"efforts":', 'efforts:')
  .replace('"adaptive":', 'adaptive:')
  .replace('"contextWindow":', 'contextWindow:')
  .replace('"maxTokens":', 'maxTokens:')
  .replace('"compat":', 'compat:')},`).join('\n')

const footer = `
]

export const MODEL_PROFILES_BY_ID: ReadonlyMap<string, GeneratedModelProfile> = new Map(
  MODEL_PROFILES.map(profile => [profile.id, profile]),
)
`

await writeFile(OUT, `${header}${body}${footer}`, 'utf8')
console.log(`wrote ${rows.length} model profiles (${OUT.pathname})`)
