import type { Api, Model } from '@earendil-works/pi-ai'
import { MODEL_PROFILES_BY_ID, type GeneratedModelProfile } from './model-profiles.generated.ts'
import { REASONING_LEVELS, type AnyRouterModelConfig, type AnyRouterProtocol, type ReasoningLevel } from './config.ts'

const FALLBACK_CONTEXT: Record<AnyRouterProtocol, number> = {
  'claude-code': 1_000_000,
  'codex-responses': 400_000,
}

const FALLBACK_MAX_TOKENS: Record<AnyRouterProtocol, number> = {
  'claude-code': 128_000,
  'codex-responses': 128_000,
}

/** Wire value each protocol family sends for a selectable level. */
const LEVEL_WIRE: Record<AnyRouterProtocol, Partial<Record<ReasoningLevel, string | null>>> = {
  'claude-code': { off: 'off', minimal: 'low' },
  'codex-responses': { off: 'none', minimal: 'low' },
}

export interface EffectiveReasoning {
  enabled: boolean
  efforts: readonly ReasoningLevel[]
  defaultEffort?: ReasoningLevel
  adaptive: boolean
}

/**
 * The reasoning profile one synchronized model runs with. A persisted profile
 * (written by the settings section's picker) wins; anything it leaves empty
 * falls back to the build-time reference profile from pi-ai's catalog, and a
 * model neither knows falls back to the protocol default — the Claude
 * fingerprint's adaptive efforts, or the Codex Responses set.
 */
export function effectiveReasoning(config: AnyRouterModelConfig): EffectiveReasoning {
  if (config.reasoning?.disabled === true) {
    return { enabled: false, efforts: [], adaptive: false }
  }
  const reference = MODEL_PROFILES_BY_ID.get(config.id)
  const referenceEfforts = (reference?.efforts ?? []).filter(level =>
    (REASONING_LEVELS as readonly string[]).includes(level)) as ReasoningLevel[]
  const persisted = config.reasoning
  const efforts = persisted?.efforts !== undefined && persisted.efforts.length > 0
    ? persisted.efforts
    : referenceEfforts.length > 0
      ? referenceEfforts
      : [...REASONING_LEVELS]
  const adaptive = persisted?.adaptive ?? reference?.adaptive ?? config.protocol === 'claude-code'
  return {
    enabled: efforts.length > 0,
    efforts,
    ...persisted?.defaultEffort === undefined ? {} : { defaultEffort: persisted.defaultEffort },
    adaptive: adaptive && config.protocol === 'claude-code',
  }
}

/**
 * pi-ai's `getSupportedThinkingLevels` rules, inverted: every canonical level
 * maps to its wire value when selectable and to `null` (explicitly absent)
 * when not, so the level list offered by the model selector is exactly the
 * persisted effort set.
 */
export function thinkingLevelMapOf(
  protocol: AnyRouterProtocol,
  efforts: readonly ReasoningLevel[],
): NonNullable<Model<Api>['thinkingLevelMap']> {
  const selected = new Set<string>(efforts)
  const map: Record<string, string | null> = {}
  for (const level of REASONING_LEVELS) {
    map[level] = selected.has(level)
      ? LEVEL_WIRE[protocol][level] ?? level
      : null
  }
  return map as NonNullable<Model<Api>['thinkingLevelMap']>
}

function referenceProfile(id: string): GeneratedModelProfile | undefined {
  return MODEL_PROFILES_BY_ID.get(id)
}

export function resolveModel(config: AnyRouterModelConfig, baseURL: string): Model<Api> {
  const reference = referenceProfile(config.id)
  const api = config.protocol === 'claude-code' ? 'anthropic-messages' : 'openai-responses'
  const reasoning = effectiveReasoning(config)
  const compatSource = reference?.compat
  // An explicit adaptive statement only rewrites the reference flag; anything
  // else (capacities, protocol quirks like temperature support) rides along
  // untouched so the request fingerprint keeps matching the reference model.
  const compat = config.protocol === 'claude-code' && config.reasoning?.adaptive !== undefined
    ? { ...compatSource, forceAdaptiveThinking: reasoning.adaptive }
    : compatSource

  const model: Model<Api> = {
    id: config.id,
    name: config.name ?? reference?.name ?? config.id,
    api,
    provider: 'anyrouter',
    baseUrl: config.protocol === 'codex-responses' ? `${baseURL}/v1` : baseURL,
    reasoning: reasoning.enabled,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: config.contextWindow ?? reference?.contextWindow ?? FALLBACK_CONTEXT[config.protocol],
    maxTokens: config.maxTokens ?? reference?.maxTokens ?? FALLBACK_MAX_TOKENS[config.protocol],
  }
  if (reasoning.enabled) {
    model.thinkingLevelMap = thinkingLevelMapOf(config.protocol, reasoning.efforts)
  }
  if (compat !== undefined) {
    model.compat = { ...compat } as NonNullable<Model<Api>['compat']>
  }
  return model
}

/**
 * Advisory metadata for one discovered row: capacities and display name from
 * the build-time reference profile, with protocol fallbacks for relay-only
 * ids pi-ai has never heard of.
 */
export function metadataForDiscoveredModel(id: string, protocol: AnyRouterProtocol): {
  name?: string
  contextWindow?: number
  maxTokens?: number
} {
  const reference = referenceProfile(id)
  if (reference === undefined) {
    return {
      contextWindow: FALLBACK_CONTEXT[protocol],
      maxTokens: FALLBACK_MAX_TOKENS[protocol],
    }
  }
  return {
    name: reference.name,
    contextWindow: reference.contextWindow,
    maxTokens: reference.maxTokens,
  }
}

/**
 * Models the picker starts unchecked: the relay's Responses endpoint answers
 * 404 "当前 API 不支持所选模型" for gpt-5-codex (verified 2026-08-31), so
 * adopting it by default would publish a model that cannot answer.
 */
export const DEFAULT_UNCHECKED_MODELS: ReadonlySet<string> = new Set(['gpt-5-codex'])
