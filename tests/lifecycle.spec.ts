import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime from '@deepseek-ai/dsh-llm'
import CredentialProvider, { credentialRef } from '@deepseek-ai/dsh-credentials'
import type {
  CredentialInfo,
  CredentialKey,
  CredentialRecord,
  CredentialRecordEntry,
  CredentialRecordInfo,
  CredentialRef,
} from '@deepseek-ai/dsh-credentials'
import { DEFAULT_API_KEY_ENV } from '../src/config.ts'
import * as anyrouter from '../src/index.ts'

class MemoryCredentials extends CredentialProvider {
  present = false

  resolve(_ref: CredentialRef) {
    return Promise.resolve(this.present ? { value: 'sk-test', source: 'test' } : undefined)
  }
  describe(_ref: CredentialRef): Promise<CredentialInfo> {
    return Promise.resolve({ configured: this.present, source: 'test', writable: true })
  }
  set(ref: CredentialRef, _value: string) {
    this.present = true
    this.ctx.emit('credentials/reference-updated', ref)
    return Promise.resolve()
  }
  unset(ref: CredentialRef) {
    this.present = false
    this.ctx.emit('credentials/reference-updated', ref)
    return Promise.resolve()
  }
  readRecord(_key: CredentialKey): Promise<CredentialRecord | undefined> { return Promise.resolve(undefined) }
  describeRecord(_key: CredentialKey): Promise<CredentialRecordInfo> {
    return Promise.resolve({ configured: false, writable: true })
  }
  listRecords(): Promise<readonly CredentialRecordEntry[]> { return Promise.resolve([]) }
  modifyRecord(
    _key: CredentialKey,
    mutate: (current: CredentialRecord | undefined) => Promise<CredentialRecord | undefined>,
  ) { return mutate(undefined) }
  deleteRecord(_key: CredentialKey) { return Promise.resolve() }
}

const settled = () => new Promise(resolve => setTimeout(resolve, 0))

function withoutAmbientKey<T>(run: () => Promise<T>): Promise<T> {
  const previous = process.env[DEFAULT_API_KEY_ENV]
  delete process.env[DEFAULT_API_KEY_ENV]
  return run().finally(() => {
    if (previous === undefined) delete process.env[DEFAULT_API_KEY_ENV]
    else process.env[DEFAULT_API_KEY_ENV] = previous
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('Cordis plugin lifecycle', () => {
  it('registers the catalog, retry policy, and discovery once a key exists', async () => {
    await withoutAmbientKey(async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: [
        { id: 'claude-opus-5' },
        { id: 'gpt-5.6-sol' },
        { id: 'gemini-2.5-pro' },
      ] }), { status: 200, headers: { 'content-type': 'application/json' } })))
      const ctx = new Context()
      await ctx.plugin(LlmRuntime)
      await ctx.plugin(MemoryCredentials)
      ;(ctx.get('credentials') as MemoryCredentials).present = true
      const fiber = await ctx.plugin(anyrouter, {
        models: [{ id: 'claude-opus-5', protocol: 'claude-code' }],
      })
      await settled()

      await expect(ctx.llm.listModels('anyrouter')).resolves.toEqual([
        expect.objectContaining({ id: 'claude-opus-5' }),
      ])
      expect(ctx.llm.providerRetryPolicy('anyrouter')).toMatchObject({ mode: 'normal', maxRetries: 5 })
      await expect(ctx.llm.discoverModels('llm-anyrouter', {
        provider: 'anyrouter',
        baseURL: 'https://anyrouter.top',
        apiKey: 'sk-draft',
      })).resolves.toEqual([
        expect.objectContaining({ id: 'claude-opus-5' }),
        expect.objectContaining({ id: 'gpt-5.6-sol' }),
      ])
      expect(ctx.llm.listProviders().map(provider => provider.id)).toContain('anyrouter')

      await fiber.dispose()
      await expect(ctx.llm.listModels('anyrouter')).rejects.toThrow(/not registered|no adapter/i)
    })
  })

  it('stays dormant without a key: declared, discoverable, but absent from the selector', async () => {
    await withoutAmbientKey(async () => {
      const ctx = new Context()
      await ctx.plugin(LlmRuntime)
      await ctx.plugin(MemoryCredentials)
      const fiber = await ctx.plugin(anyrouter, {
        models: [{ id: 'claude-opus-5', protocol: 'claude-code' }],
      })
      await settled()

      expect(ctx.llm.listProviders()).toEqual([])
      expect(ctx.llm.listConfigurableProviders().map(entry => entry.provider)).toContain('anyrouter')
      await expect(ctx.llm.listModels('anyrouter')).rejects.toThrow(/not registered|no adapter/i)

      await fiber.dispose()
    })
  })

  it('a missing ambient key keeps the route dormant without a credentials service', async () => {
    await withoutAmbientKey(async () => {
      const ctx = new Context()
      await ctx.plugin(LlmRuntime)
      const fiber = await ctx.plugin(anyrouter, {
        models: [{ id: 'gpt-5.6-sol', protocol: 'codex-responses' }],
      })
      await settled()
      expect(ctx.llm.listProviders()).toEqual([])
      await fiber.dispose()
    })
  })

  it('an ambient key activates the route without a credentials service', async () => {
    const previous = process.env[DEFAULT_API_KEY_ENV]
    process.env[DEFAULT_API_KEY_ENV] = 'sk-ambient'
    try {
      const ctx = new Context()
      await ctx.plugin(LlmRuntime)
      const fiber = await ctx.plugin(anyrouter, {
        models: [{ id: 'gpt-5.6-sol', protocol: 'codex-responses' }],
      })
      await settled()
      await expect(ctx.llm.listModels('anyrouter')).resolves.toHaveLength(1)
      await fiber.dispose()
    } finally {
      if (previous === undefined) delete process.env[DEFAULT_API_KEY_ENV]
      else process.env[DEFAULT_API_KEY_ENV] = previous
    }
  })

  it('tracks a preconfigured credentials service mounted after the provider plugin', async () => {
    await withoutAmbientKey(async () => {
      class PreconfiguredCredentials extends MemoryCredentials {
        override present = true
      }

      const ctx = new Context()
      await ctx.plugin(LlmRuntime)
      await ctx.plugin(anyrouter, {
        models: [{ id: 'claude-opus-5', protocol: 'claude-code' }],
      })
      await settled()
      expect(ctx.llm.listProviders()).toEqual([])

      const credentialsFiber = await ctx.plugin(PreconfiguredCredentials)
      await settled()
      await expect(ctx.llm.listModels('anyrouter')).resolves.toHaveLength(1)

      await credentialsFiber.dispose()
      await settled()
      expect(ctx.llm.listProviders()).toEqual([])
      await expect(ctx.llm.listModels('anyrouter')).rejects.toThrow(/not registered|no adapter/i)
    })
  })

  it('credential updates swap the route live', async () => {
    await withoutAmbientKey(async () => {
      const ctx = new Context()
      await ctx.plugin(LlmRuntime)
      await ctx.plugin(MemoryCredentials)
      const credentials = ctx.get('credentials') as MemoryCredentials
      await ctx.plugin(anyrouter, {
        models: [{ id: 'claude-opus-5', protocol: 'claude-code' }],
      })
      await settled()
      expect(ctx.llm.listProviders()).toEqual([])

      await credentials.set(credentialRef(DEFAULT_API_KEY_ENV), 'sk-test')
      await settled()
      await expect(ctx.llm.listModels('anyrouter')).resolves.toHaveLength(1)

      await credentials.unset(credentialRef(DEFAULT_API_KEY_ENV))
      await settled()
      expect(ctx.llm.listProviders()).toEqual([])
      await expect(ctx.llm.listModels('anyrouter')).rejects.toThrow(/not registered|no adapter/i)
    })
  })
})
