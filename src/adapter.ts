import { createProvider, type Api, type Model, type Provider } from '@earendil-works/pi-ai'
import { PiAiAdapter, type ResolvedPiAiProviderProfile } from '@deepseek-ai/dsh-llm-pi-ai'
import { ReasoningEffortId } from '@deepseek-ai/dsh-llm'
import type { AttachmentStore } from '@deepseek-ai/dsh-attachment'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import type { ResolvedConfig } from './config.ts'
import { effectiveReasoning, resolveModel } from './catalog.ts'
import { claudeCodeStreams } from './transports/claude.ts'
import { codexResponsesStreams } from './transports/codex.ts'

const ambientAuth = {
  apiKey: {
    name: 'AnyRouter API key',
    resolve: ({ credential }: { credential?: { key?: string } }) => Promise.resolve(
      credential?.key === undefined
        ? undefined
        : { auth: { apiKey: credential.key }, source: 'DSH credential seam' },
    ),
  },
}

function providerOf(config: ResolvedConfig): Provider {
  const models: Model<Api>[] = config.models.map(model => resolveModel(model, config.baseURL))
  return createProvider({
    id: 'anyrouter',
    name: 'AnyRouter',
    baseUrl: config.baseURL,
    auth: ambientAuth,
    models,
    api: {
      'anthropic-messages': claudeCodeStreams,
      'openai-responses': codexResponsesStreams,
    },
  })
}

/**
 * The resolved profile this route hands the seam. `modelErrors` is
 * adapter-owned and dereferenced before every request and every model-catalog
 * projection, but the Host only introduced it in
 * `@deepseek-ai/dsh-llm-pi-ai@0.1.5-rc.1`; this package's pinned peers predate
 * that release, so the field is declared here instead of inherited. Older Hosts
 * ignore the extra key, so one profile shape serves both.
 */
export type HostResolvedProfile = ResolvedPiAiProviderProfile & { modelErrors: ReadonlyMap<string, string> }

/**
 * The single resolved profile this route publishes to the seam. Exported for
 * the contract tests that pin the adapter-owned fields: the seam dereferences
 * them before a request, so an absent map fails the whole route — including the
 * model catalog the selector renders — with "Cannot read properties of
 * undefined (reading 'get')".
 * @param config - resolved AnyRouter settings.
 * @returns the route's profile, ready for `PiAiAdapter`.
 */
export function providerProfileOf(config: ResolvedConfig): HostResolvedProfile {
  const profile: HostResolvedProfile = {
    provider: 'anyrouter',
    displayName: 'AnyRouter',
    apiKeyEnv: config.apiKeyEnv,
    baseURL: config.baseURL,
    streamIdleTimeoutMs: config.streamIdleTimeoutMs,
    maxRequestImageBytes: 32 * 1024 * 1024,
    requestImagePixelBudget: 100_000_000,
    requestImageMaxBytes: 32 * 1024 * 1024,
    retryPolicy: config.retryPolicy,
    piProvider: providerOf(config),
    // Both maps are read unconditionally by the seam: `modelErrors` before every
    // request and catalog projection, and `configuredMaxTokens` when a request
    // names no cap of its own. This route builds its models from validated
    // settings, so it reports no per-model construction failure and configures
    // no cap here.
    modelErrors: new Map(),
    configuredMaxTokens: new Map(),
    transport: 'sse',
  }
  return profile
}

export class AnyRouterAdapter extends PiAiAdapter {
  constructor(options: {
    config: () => ResolvedConfig
    resolveApiKey: (ref: CredentialRef) => Promise<string>
    resolveAttachments?: () => AttachmentStore | undefined
  }) {
    let snapshotConfig: ResolvedConfig | undefined
    let snapshotProfiles: ReadonlyMap<string, ResolvedPiAiProviderProfile> | undefined
    const profiles = (): ReadonlyMap<string, ResolvedPiAiProviderProfile> => {
      const config = options.config()
      if (config === snapshotConfig && snapshotProfiles !== undefined) return snapshotProfiles
      snapshotConfig = config
      snapshotProfiles = new Map([['anyrouter', providerProfileOf(config)]])
      return snapshotProfiles
    }
    const auth = {
      credentials: {
        read: () => Promise.resolve(undefined),
        list: () => Promise.resolve([]),
        modify: (_providerId: string, update: (current: undefined) => Promise<undefined>) => update(undefined),
        delete: () => Promise.resolve(),
      },
      authContext: {
        env: (name: string) => Promise.resolve(process.env[name]),
        fileExists: () => Promise.resolve(false),
      },
    }
    super({
      profiles,
      resolveApiKey: async (_provider, profile) => {
        if (profile.apiKeyEnv === undefined) throw new Error('dsh-anyrouter: resolved profile lost its credential ref')
        return options.resolveApiKey(profile.apiKeyEnv)
      },
      auth,
      resolveAttachments: options.resolveAttachments ?? (() => undefined),
    })
    this.modelOptions = options
  }

  private readonly modelOptions: {
    config: () => ResolvedConfig
    resolveApiKey: (ref: CredentialRef) => Promise<string>
    resolveAttachments?: () => AttachmentStore | undefined
  }

  /**
   * Surface the per-model default effort the persisted reasoning profile
   * carries. The generic adapter can only mark a profile-wide default, which
   * for a multi-model route like this one would be wrong for every model but
   * one; patching the resolved info keeps the selector's marked default equal
   * to what the settings section saved.
   */
  override async resolveModel(provider: string, model: string, signal?: AbortSignal) {
    const info = await super.resolveModel(provider, model, signal)
    if (info.reasoning === undefined) return info
    const row = this.modelOptions.config().models.find(candidate => candidate.id === model)
    const defaultEffort = row === undefined ? undefined : effectiveReasoning(row).defaultEffort
    if (row === undefined || defaultEffort === undefined) return info
    return {
      ...info,
      reasoning: { ...info.reasoning, defaultEffort: ReasoningEffortId(defaultEffort) },
    }
  }
}
