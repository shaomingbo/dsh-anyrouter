import { describe, expect, it } from 'vitest'
import { AnyRouterAdapter } from '../src/adapter.ts'
import { resolveConfig } from '../src/config.ts'

function adapter() {
  const config = resolveConfig({
    models: [
      { id: 'claude-opus-5', protocol: 'claude-code' },
      { id: 'gpt-5.6-sol', protocol: 'codex-responses' },
    ],
  })
  return new AnyRouterAdapter({
    config: () => config,
    resolveApiKey: async () => 'sk-test',
  })
}

describe('AnyRouterAdapter catalog', () => {
  it('advertises synchronized models and exact capacities', async () => {
    const subject = adapter()
    await expect(subject.listModels('anyrouter')).resolves.toEqual([
      expect.objectContaining({ provider: 'anyrouter', id: 'claude-opus-5' }),
      expect.objectContaining({ provider: 'anyrouter', id: 'gpt-5.6-sol' }),
    ])
    await expect(subject.resolveModel('anyrouter', 'claude-opus-5')).resolves.toMatchObject({
      provider: 'anyrouter',
      id: 'claude-opus-5',
      context: { contextWindow: 1_000_000 },
      reasoning: {
        efforts: expect.arrayContaining([
          expect.objectContaining({ id: 'off' }),
          expect.objectContaining({ id: 'high' }),
          expect.objectContaining({ id: 'max' }),
        ]),
      },
    })
  })

  it('surfaces the persisted default effort per model', async () => {
    const config = resolveConfig({
      models: [
        { id: 'claude-opus-5', protocol: 'claude-code', reasoning: { efforts: ['medium', 'high'], defaultEffort: 'medium' } },
        { id: 'gpt-5.6-sol', protocol: 'codex-responses', reasoning: { efforts: ['low', 'high'] } },
      ],
    })
    const subject = new (await import('../src/adapter.ts')).AnyRouterAdapter({
      config: () => config,
      resolveApiKey: async () => 'sk-test',
    })
    await expect(subject.resolveModel('anyrouter', 'claude-opus-5')).resolves.toMatchObject({
      reasoning: expect.objectContaining({ defaultEffort: 'medium' }),
    })
    await expect(subject.resolveModel('anyrouter', 'gpt-5.6-sol')).resolves.toMatchObject({
      reasoning: expect.not.objectContaining({ defaultEffort: expect.anything() }),
    })
  })

  it('publishes the dedicated provider name and retry policy', () => {
    const subject = adapter()
    expect(subject.providerInfo('anyrouter')).toEqual({ id: 'anyrouter', name: 'AnyRouter' })
    expect(subject.providerRetryPolicy('anyrouter')).toMatchObject({ mode: 'normal', maxRetries: 5 })
  })
})
