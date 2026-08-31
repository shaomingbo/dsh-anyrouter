import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../src/client/index.tsx'

afterEach(() => vi.unstubAllGlobals())

describe('AnyRouter settings client composition', () => {
  it('registers a dedicated settings section and scoped refresh listeners', () => {
    const appended: any[] = []
    const listeners = new Map<string, (...args: any[]) => void>()
    const slotRegistrations: any[] = []
    vi.stubGlobal('document', {
      createElement: () => ({ dataset: {}, remove: vi.fn(), textContent: '' }),
      head: { appendChild: (element: any) => appended.push(element) },
    })
    const remote = {
      $on: vi.fn((event: string, listener: (...args: any[]) => void) => {
        listeners.set(event, listener)
        return vi.fn()
      }),
    }
    const api = { settings: {}, credentials: {}, llm: {} }
    const scope = {
      getSnapshot: () => ({ status: 'ready', value: {}, writable: true, mode: 'host' }),
      subscribe: vi.fn(() => vi.fn()),
      set: vi.fn(async () => undefined),
    }
    const settingsScope = { bind: vi.fn(() => scope) }
    const ctx: any = {
      get: (name: string) => {
        if (name === 'connection') return { api }
        if (name === 'settingsScope') return settingsScope
        return remote
      },
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

    apply(ctx)

    expect(inject).toEqual(['slots', 'connection', 'remote', 'settingsScope'])
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
    expect(props.api).toBe(api)
    expect(props.scope).toBe(scope)

    const refresh = vi.fn()
    const dispose = props.subscribeCredentials(refresh)
    listeners.get('credentials/reference-updated')?.('OTHER_API_KEY')
    expect(refresh).not.toHaveBeenCalled()
    listeners.get('credentials/reference-updated')?.('ANYROUTER_API_KEY')
    expect(refresh).toHaveBeenCalledTimes(1)
    dispose()
  })
})
