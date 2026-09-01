import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../src/client/index.tsx'

afterEach(() => vi.unstubAllGlobals())

/** Minimal browser surface the section's style effect needs. */
function stubDocument(appended: any[]): void {
  vi.stubGlobal('document', {
    createElement: () => ({ dataset: {}, remove: vi.fn(), textContent: '' }),
    head: { appendChild: (element: any) => appended.push(element) },
  })
}

/**
 * A Client context shaped like DSH 0.1.2-alpha.3: credentials and model
 * discovery live on typed `ctx.remote` namespaces, not on `connection.api`.
 */
function createContext(options: { remoteOverride?: any } = {}) {
  const listeners = new Map<string, (...args: any[]) => void>()
  const slotRegistrations: any[] = []
  const credentials = {
    describe: vi.fn(async (refs: string[]) => ({
      ok: true,
      value: Object.fromEntries(refs.map(ref => [ref, { configured: true, writable: true }])),
    })),
    set: vi.fn(async () => ({ ok: true, value: undefined })),
  }
  const llm = {
    discoverModels: vi.fn(async () => ({ ok: true, value: [{ id: 'claude-opus-5' }] })),
  }
  const remote = options.remoteOverride ?? {
    credentials,
    llm,
    $on: vi.fn((event: string, listener: (...args: any[]) => void) => {
      listeners.set(event, listener)
      return vi.fn()
    }),
  }
  const scope = {
    getSnapshot: () => ({ status: 'ready', value: {}, writable: true, mode: 'host' }),
    subscribe: vi.fn(() => vi.fn()),
    set: vi.fn(async () => undefined),
  }
  const settingsScope = { bind: vi.fn(() => scope) }
  const ctx: any = {
    remote,
    get: (name: string) => (name === 'settingsScope' ? settingsScope : remote),
    effect: (effect: () => () => void) => effect(),
    on: vi.fn(() => vi.fn()),
    slots: {
      inject: (_name: string, install: () => void) => install(),
      register: (spec: any, component: any) => {
        slotRegistrations.push({ spec, component })
        return vi.fn()
      },
    },
  }
  return { ctx, credentials, listeners, llm, scope, settingsScope, slotRegistrations }
}

describe('AnyRouter settings client composition', () => {
  it('declares the Remote namespaces it calls', () => {
    expect(inject).toEqual(['slots', 'remote', 'remote.credentials', 'remote.llm', 'settingsScope'])
  })

  it('registers a dedicated settings section and scoped refresh listeners', () => {
    const appended: any[] = []
    stubDocument(appended)
    const { ctx, listeners, scope, settingsScope, slotRegistrations } = createContext()

    apply(ctx)

    expect(settingsScope.bind).toHaveBeenCalledWith(expect.objectContaining({ namespace: 'llm-anyrouter' }))
    expect(appended).toHaveLength(1)
    expect(appended[0].dataset.plugin).toBe('dsh-anyrouter')
    expect(slotRegistrations).toHaveLength(1)
    expect(slotRegistrations[0].spec).toMatchObject({
      name: 'settings.section',
      id: 'anyrouter',
      order: 11,
    })
    expect(slotRegistrations[0].spec.label()).toBe('AnyRouter')
    const props = slotRegistrations[0].spec.inject()
    expect(props.scope).toBe(scope)
    expect(typeof props.ops.credentialConfigured).toBe('function')

    const refresh = vi.fn()
    const dispose = props.subscribeCredentials(refresh)
    listeners.get('credentials/reference-updated')?.('OTHER_API_KEY')
    expect(refresh).not.toHaveBeenCalled()
    listeners.get('credentials/reference-updated')?.('ANYROUTER_API_KEY')
    expect(refresh).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('binds Host operations to the Remote namespaces and unwraps their envelopes', async () => {
    stubDocument([])
    const { ctx, credentials, llm, slotRegistrations } = createContext()

    apply(ctx)
    const { ops } = slotRegistrations[0].spec.inject()

    await expect(ops.credentialConfigured()).resolves.toBe(true)
    expect(credentials.describe).toHaveBeenCalledWith(['ANYROUTER_API_KEY'])

    await ops.storeCredential('sk-test')
    expect(credentials.set).toHaveBeenCalledWith('ANYROUTER_API_KEY', 'sk-test')

    await expect(ops.discoverModels('https://anyrouter.top')).resolves.toEqual([{ id: 'claude-opus-5' }])
    expect(llm.discoverModels).toHaveBeenCalledWith('llm-anyrouter', {
      provider: 'anyrouter',
      baseURL: 'https://anyrouter.top',
    })
  })

  it('surfaces a refused Remote call as an error instead of a blank panel', async () => {
    stubDocument([])
    const { ctx, credentials, slotRegistrations } = createContext()
    credentials.describe.mockResolvedValueOnce({ ok: false, error: { message: 'refused' } } as any)

    apply(ctx)
    const { ops } = slotRegistrations[0].spec.inject()

    await expect(ops.credentialConfigured()).rejects.toThrow('refused')
  })

  it('fails loudly on a Host without the required Remote namespaces', () => {
    stubDocument([])
    const { ctx } = createContext({ remoteOverride: { $on: vi.fn() } })

    expect(() => apply(ctx)).toThrow(/remote\.credentials\/remote\.llm/)
    expect(() => apply(ctx)).toThrow(/0\.1\.2-alpha\.3/)
  })
})
