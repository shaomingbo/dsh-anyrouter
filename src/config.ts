import z from '@deepseek-ai/schemastery'
import { credentialRef, type CredentialRef } from '@deepseek-ai/dsh-credentials'
import {
  resolveRetryPolicy,
  RetryPolicySchema,
  type ResolvedRetryPolicy,
  type RetryPolicyConfig,
} from '@deepseek-ai/dsh-llm'
import { MAX_TIMER_DELAY_MS } from '@deepseek-ai/dsh-timeout'

export const PROVIDER = 'anyrouter'
export const SETTINGS_NS = 'llm-anyrouter'
export const DEFAULT_API_KEY_ENV = 'ANYROUTER_API_KEY'
export const DEFAULT_BASE_URL = 'https://anyrouter.top'
export const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 300_000

export const REASONING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export type ReasoningLevel = (typeof REASONING_LEVELS)[number]

export type AnyRouterProtocol = 'claude-code' | 'codex-responses'

/**
 * Persisted reasoning profile for one synchronized model. `efforts` is the
 * authoritative enable flag: an empty (or absent) list keeps whatever the
 * generated reference profile says, and a non-empty list replaces it.
 */
export interface ReasoningProfile {
  /** Explicitly offer the model without a reasoning control. */
  disabled?: boolean
  /** Selectable levels in canonical order; empty falls back to the reference. */
  efforts?: ReasoningLevel[]
  /** Level the model selector marks as default; must be one of `efforts`. */
  defaultEffort?: ReasoningLevel
  /** Claude-only: send adaptive `effort` instead of a thinking budget. */
  adaptive?: boolean
}

export interface AnyRouterModelConfig {
  id: string
  name?: string
  protocol: AnyRouterProtocol
  contextWindow?: number
  maxTokens?: number
  reasoning?: ReasoningProfile
}

export interface Config {
  apiKeyEnv?: string
  baseURL?: string
  models?: AnyRouterModelConfig[]
  streamIdleTimeoutMs?: number
  retryPolicy?: RetryPolicyConfig
}

export interface ResolvedConfig {
  apiKeyEnv: CredentialRef
  baseURL: string
  models: readonly AnyRouterModelConfig[]
  streamIdleTimeoutMs: number
  retryPolicy: ResolvedRetryPolicy
}

const ReasoningProfileSchema: z<ReasoningProfile> = z.object({
  disabled: z.boolean(),
  efforts: z.array(z.union([...REASONING_LEVELS])),
  defaultEffort: z.union([...REASONING_LEVELS]),
  adaptive: z.boolean(),
})

const ModelSchema: z<AnyRouterModelConfig> = z.object({
  id: z.string().required(),
  name: z.string(),
  protocol: z.union(['claude-code', 'codex-responses']).required(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
  reasoning: ReasoningProfileSchema,
})

export const Config: z<Config> = z.object({
  apiKeyEnv: z.string().role('credential-ref').default(DEFAULT_API_KEY_ENV),
  baseURL: z.string().default(DEFAULT_BASE_URL),
  models: z.array(ModelSchema).default([]),
  streamIdleTimeoutMs: z.number()
    .min(Number.MIN_VALUE)
    .max(MAX_TIMER_DELAY_MS)
    .default(DEFAULT_STREAM_IDLE_TIMEOUT_MS),
  retryPolicy: RetryPolicySchema,
})

export function normalizeBaseURL(raw: string | undefined): string {
  const value = (raw ?? DEFAULT_BASE_URL).trim()
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch (cause) {
    throw new Error(`dsh-anyrouter: invalid baseURL ${JSON.stringify(value)}`, { cause })
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    throw new Error('dsh-anyrouter: baseURL must not contain user information')
  }
  if (parsed.search.length > 0 || parsed.hash.length > 0) {
    throw new Error('dsh-anyrouter: baseURL must not contain a query or fragment')
  }
  const loopback = parsed.hostname === 'localhost'
    || parsed.hostname === '127.0.0.1'
    || parsed.hostname === '[::1]'
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    throw new Error('dsh-anyrouter: baseURL must use https (http is allowed only for loopback development)')
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, '')
  return parsed.toString().replace(/\/+$/, '')
}

export function resolveConfig(config: Config): ResolvedConfig {
  const apiKeyEnv = config.apiKeyEnv ?? DEFAULT_API_KEY_ENV
  if (apiKeyEnv !== DEFAULT_API_KEY_ENV) {
    throw new Error(`dsh-anyrouter: apiKeyEnv is fixed to ${DEFAULT_API_KEY_ENV}`)
  }
  const streamIdleTimeoutMs = config.streamIdleTimeoutMs ?? DEFAULT_STREAM_IDLE_TIMEOUT_MS
  if (!Number.isFinite(streamIdleTimeoutMs)
    || streamIdleTimeoutMs <= 0
    || streamIdleTimeoutMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`dsh-anyrouter: streamIdleTimeoutMs must be between 0 and ${MAX_TIMER_DELAY_MS}`)
  }

  const models = config.models ?? []
  const seen = new Set<string>()
  for (const model of models) {
    const id = model.id.trim()
    if (id.length === 0) throw new Error('dsh-anyrouter: model ids must be non-empty')
    if (seen.has(id)) throw new Error(`dsh-anyrouter: duplicate model id ${JSON.stringify(id)}`)
    seen.add(id)
    if (model.contextWindow !== undefined
      && (!Number.isSafeInteger(model.contextWindow) || model.contextWindow <= 0)) {
      throw new Error(`dsh-anyrouter: model ${JSON.stringify(id)} has invalid contextWindow`)
    }
    if (model.maxTokens !== undefined
      && (!Number.isSafeInteger(model.maxTokens) || model.maxTokens <= 0)) {
      throw new Error(`dsh-anyrouter: model ${JSON.stringify(id)} has invalid maxTokens`)
    }
    if (model.reasoning !== undefined) canonicalReasoningProfile(model.reasoning, model.protocol, id)
  }

  return {
    apiKeyEnv: credentialRef(DEFAULT_API_KEY_ENV),
    baseURL: normalizeBaseURL(config.baseURL),
    models: models.map(model => ({
      ...model,
      id: model.id.trim(),
      ...model.reasoning === undefined
        ? {}
        : { reasoning: canonicalReasoningProfile(model.reasoning, model.protocol, model.id.trim()) },
    })),
    streamIdleTimeoutMs,
    retryPolicy: resolveRetryPolicy(config.retryPolicy, 'dsh-anyrouter: retryPolicy'),
  }
}

export function classifyProtocol(id: string): AnyRouterProtocol | undefined {
  const normalized = id.toLowerCase()
  if (normalized.startsWith('claude-')) return 'claude-code'
  if (normalized.startsWith('gpt-')) return 'codex-responses'
  return undefined
}

const LEVEL_SET: ReadonlySet<string> = new Set(REASONING_LEVELS)

/**
 * Validate and canonicalize one persisted reasoning profile: efforts are
 * deduplicated into canonical order, `defaultEffort` must be selectable, and
 * `adaptive` is a Claude-only statement (it switches the transport from a
 * thinking budget to the adaptive `effort` field).
 */
export function canonicalReasoningProfile(
  reasoning: ReasoningProfile,
  protocol: AnyRouterProtocol,
  id: string,
): ReasoningProfile {
  const label = `dsh-anyrouter: model ${JSON.stringify(id)} reasoning`
  const selected = new Set((reasoning.efforts ?? []).filter(level => LEVEL_SET.has(level)))
  const efforts = REASONING_LEVELS.filter(level => selected.has(level))
  if (reasoning.defaultEffort !== undefined && !efforts.includes(reasoning.defaultEffort)) {
    throw new Error(`${label}.defaultEffort ${JSON.stringify(reasoning.defaultEffort)} must be one of its efforts`)
  }
  if (reasoning.adaptive === true && protocol !== 'claude-code') {
    throw new Error(`${label}.adaptive is only valid for claude-code models`)
  }
  if (reasoning.disabled === true) {
    return { disabled: true }
  }
  return {
    ...efforts.length === 0 ? {} : { efforts },
    ...reasoning.defaultEffort === undefined ? {} : { defaultEffort: reasoning.defaultEffort },
    ...reasoning.adaptive === undefined ? {} : { adaptive: reasoning.adaptive },
  }
}
