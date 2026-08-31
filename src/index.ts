import type { Context } from '@deepseek-ai/cordis'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import { assertUsableApiKey, LlmError } from '@deepseek-ai/dsh-llm'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import { deepEqualJson, installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { AnyRouterAdapter } from './adapter.ts'
import {
  Config,
  PROVIDER,
  SETTINGS_NS,
  resolveConfig,
  type Config as AnyRouterConfig,
  type ResolvedConfig,
} from './config.ts'
import { discoverAnyRouterModels } from './discovery.ts'

export { AnyRouterAdapter } from './adapter.ts'
export { Config, resolveConfig } from './config.ts'
export { discoverAnyRouterModels } from './discovery.ts'
export { claudeCodeStreams, codexResponsesStreams } from './transports/index.ts'
export type * from './types.ts'

export const name = 'dsh-anyrouter'
export const inject = ['llm']

export function apply(ctx: Context, config: AnyRouterConfig): void {
  let current: () => AnyRouterConfig = () => config
  let lastRaw: AnyRouterConfig | undefined
  let lastGood: ResolvedConfig | undefined
  const options = (): ResolvedConfig => {
    const raw = current()
    if (raw === lastRaw && lastGood !== undefined) return lastGood
    try {
      const next = resolveConfig(raw)
      lastRaw = raw
      lastGood = next
      return next
    } catch (error) {
      if (lastGood === undefined) throw error
      lastRaw = raw
      ctx.logger.error('dsh-anyrouter: keeping the last good configuration after an invalid settings update')
      ctx.logger.error(error)
      return lastGood
    }
  }
  options()

  const resolveApiKey = async (ref: CredentialRef): Promise<string> => {
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      const hit = await credentials.resolve(ref)
      if (hit !== undefined) return assertUsableApiKey(hit.value, 'dsh-anyrouter', ref)
    } else {
      const ambient = launchEnvironmentOf(ctx).get(ref)
      if (ambient !== undefined && ambient.value.length > 0) {
        return assertUsableApiKey(ambient.value, 'dsh-anyrouter', ref)
      }
    }
    throw new LlmError(
      `dsh-anyrouter: no API key; store ${ref} in the credentials service or export it before launching DSH`,
      'MISSING_CREDENTIAL',
    )
  }

  const adapter = new AnyRouterAdapter({
    config: options,
    resolveApiKey,
    resolveAttachments: () => ctx.get('attachments'),
  })
  // The directory entry is unconditional: configuration surfaces can offer
  // the provider (dormant, `active: false`) before any key exists. The route
  // itself is keyed on the credential — without a key the adapter stays
  // unregistered, so the model selector drops the whole group.
  ctx.llm.registerConfigurableProviders([
    { provider: PROVIDER, displayName: 'AnyRouter', settingsNs: SETTINGS_NS, settingsPath: [] },
  ])

  const keyPresent = async (): Promise<boolean> => {
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      const hit = await credentials.resolve(options().apiKeyEnv)
      return hit !== undefined && hit.value.length > 0
    }
    // Without the service the environment is the whole credential plane, and
    // it is immutable at runtime — the boot evaluation below is final.
    const ambient = launchEnvironmentOf(ctx).get(options().apiKeyEnv)
    return ambient !== undefined && ambient.value.length > 0
  }

  let registration: ReturnType<typeof ctx.llm.registerAdapter> | undefined
  let registeredPolicy: ReturnType<typeof options>['retryPolicy'] | undefined
  let evaluating = false
  let dirty = false
  let disposed = false
  const ensureRoute = async (): Promise<void> => {
    if (disposed) return
    if (evaluating) {
      dirty = true
      return
    }
    evaluating = true
    try {
      let present: boolean
      try {
        present = await keyPresent()
      } catch (error) {
        ctx.logger.error('dsh-anyrouter: credential presence check failed; keeping the current route state')
        ctx.logger.error(error)
        return
      }
      if (disposed) return
      if (!present) {
        if (registration !== undefined) {
          registration()
          registration = undefined
          registeredPolicy = undefined
        }
        return
      }
      const policy = options().retryPolicy
      if (registration === undefined) {
        registration = ctx.llm.registerAdapter([PROVIDER], adapter)
        registeredPolicy = policy
        return
      }
      if (registeredPolicy === undefined || !deepEqualJson(policy, registeredPolicy)) {
        registration.replace([PROVIDER])
        registeredPolicy = policy
      }
    } finally {
      evaluating = false
      if (dirty && !disposed) {
        dirty = false
        void ensureRoute()
      }
    }
  }
  ctx.effect(() => () => { disposed = true }, 'dsh-anyrouter: route activation lifecycle')
  const scheduleRouteCheck = (): void => { void ensureRoute() }
  void ensureRoute()
  // The bundle can start before the credentials provider. Re-evaluate when that
  // service becomes active (or disappears), otherwise a persisted key loaded
  // later leaves the provider directory visible but the selector route dormant.
  ctx.inject(['credentials'], () => {
    scheduleRouteCheck()
    return () => scheduleRouteCheck()
  })
  ctx.on('credentials/reference-updated', ref => {
    if ((ref as string) === (options().apiKeyEnv as string)) scheduleRouteCheck()
  })

  ctx.llm.registerModelDiscovery(settingsNamespace(SETTINGS_NS), async request => {
    const resolved = options()
    const apiKey = request.apiKey ?? await resolveApiKey(resolved.apiKeyEnv)
    return discoverAnyRouterModels({
      baseURL: request.baseURL?.trim() || resolved.baseURL,
      apiKey,
      ...request.signal === undefined ? {} : { signal: request.signal },
    })
  })

  installSettingsSection(ctx, settingsNamespace(SETTINGS_NS), Config, config, {
    setSource: source => { current = source },
    onChange: scheduleRouteCheck,
    validate: value => { resolveConfig(value) },
  })
}
