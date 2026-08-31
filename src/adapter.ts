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

function profileOf(config: ResolvedConfig): ResolvedPiAiProviderProfile {
  return {
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
    configuredMaxTokens: new Map(),
    transport: 'sse',
  }
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
      snapshotProfiles = new Map([['anyrouter', profileOf(config)]])
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
