import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const entry = resolve(process.argv[2] ?? 'lib/index.js')
const require = createRequire(entry)
const { Context } = await import(require.resolve('@deepseek-ai/cordis'))
const { default: LlmRuntime } = await import(require.resolve('@deepseek-ai/dsh-llm'))
const { default: CredentialProvider } = await import(require.resolve('@deepseek-ai/dsh-credentials'))
const { default: SettingsProvider } = await import(require.resolve('@deepseek-ai/dsh-settings'))
const plugin = await import(pathToFileURL(entry).href)

class MemorySettings extends SettingsProvider {
  writable = true
  async load() { return {} }
  async persist() {}
}
class SyntheticCredentials extends CredentialProvider {
  async resolve() { return { value: 'synthetic-test-key', source: 'test' } }
}
const settle = () => new Promise(resolve => setTimeout(resolve, 0))
const ctx = new Context()
await ctx.plugin(LlmRuntime)
await ctx.plugin(SyntheticCredentials)
const fiber = await ctx.plugin(plugin, {
  models: [{ id: 'claude-opus-5', protocol: 'claude-code' }],
  retryPolicy: { mode: 'normal', maxRetries: 2 },
})
await settle()
assert.equal(ctx.llm.providerRetryPolicy('anyrouter').maxRetries, 2)

// The browser model catalog lists every route and resolves each model through
// these two calls; a profile missing an adapter-owned field fails the whole
// provider group there ("Cannot read properties of undefined (reading 'get')").
assert.deepEqual((await ctx.llm.listModels('anyrouter')).map(model => model.id), ['claude-opus-5'])
assert.equal((await ctx.llm.resolveModelInfo('anyrouter', 'claude-opus-5')).id, 'claude-opus-5')

// Attach settings after the plugin, then exercise the actual provider API.
const settings = await ctx.plugin(MemorySettings)
await settle()
assert.equal(ctx.settings.get('llm-anyrouter').retryPolicy.maxRetries, 2)
await ctx.settings.update('llm-anyrouter', { retryPolicy: { maxRetries: 3 } })
await settle()
assert.equal(ctx.llm.providerRetryPolicy('anyrouter').maxRetries, 3)
await ctx.settings.update('llm-anyrouter', { retryPolicy: { maxRetries: 3 } })
await settle()
assert.equal(ctx.llm.providerRetryPolicy('anyrouter').maxRetries, 3)

await settings.dispose()
await settle()
assert.equal(ctx.llm.providerRetryPolicy('anyrouter').maxRetries, 2)
await fiber.dispose()
await assert.rejects(ctx.llm.listModels('anyrouter'), /not registered|no adapter/i)
console.log(JSON.stringify({
  status: 'passed', settings: require('@deepseek-ai/dsh-settings/package.json').version,
  checks: ['entry import', 'model catalog listing and resolution', 'late settings attachment', 'live retry policy update', 'equivalent update', 'settings detach fallback', 'plugin disposal'],
}))
