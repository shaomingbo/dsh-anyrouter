// Live endpoint verification against the real AnyRouter relay.
//
// Gated on the environment: these tests make real, billable requests and only
// run when ANYEROUTER_LIVE_KEY is exported. The key is never logged, never
// written to disk, and never appears in a snapshot — assertions only inspect
// event shapes and assistant text.
//
//   ANYEROUTER_LIVE_KEY=sk-… pnpm vitest run tests/live.spec.ts
//
// The relay is capacity-flaky by design (README: the model list is advisory —
// a model can answer 429/500 while its upstream channel is busy). A capacity
// failure here is reported as such and retried by the outer loop, not treated
// as a transport-contract regression.

import { describe, expect, it } from 'vitest'
import type { AssistantMessageEvent, Context } from '@earendil-works/pi-ai'
import { DEFAULT_BASE_URL } from '../src/config.ts'
import { resolveModel } from '../src/catalog.ts'
import { discoverAnyRouterModels } from '../src/discovery.ts'
import { claudeCodeStreams } from '../src/transports/claude.ts'
import { codexResponsesStreams } from '../src/transports/codex.ts'

const LIVE_KEY = process.env.ANYEROUTER_LIVE_KEY
const live = LIVE_KEY === undefined || LIVE_KEY.length === 0 ? describe.skip : describe
const REQUEST_TIMEOUT_MS = 180_000

function isCapacityFailure(message: string): boolean {
  return /负载已经达到上限|Service Unavailable|rate.?limit|上游负载|请稍后重试/i.test(message)
}

function userContext(text: string): Context {
  return {
    messages: [{
      role: 'user',
      timestamp: Date.now(),
      content: [{ type: 'text', text }],
    }],
  }
}

async function collectText(
  events: AsyncIterable<AssistantMessageEvent>,
): Promise<string> {
  let text = ''
  for await (const event of events) {
    if (event.type === 'text_delta') text += event.delta
    else if (event.type === 'error') {
      const message = typeof event.error.errorMessage === 'string'
        ? event.error.errorMessage
        : JSON.stringify(event.error.errorMessage)
      throw new Error(message)
    }
  }
  return text
}

live('live endpoint', { timeout: REQUEST_TIMEOUT_MS }, () => {
  it('discovery lists only Claude and GPT/Codex models', async () => {
    const models = await discoverAnyRouterModels({
      baseURL: DEFAULT_BASE_URL,
      apiKey: LIVE_KEY!,
      signal: AbortSignal.timeout(60_000),
    })
    expect(models.length).toBeGreaterThan(0)
    for (const model of models) {
      expect(model.id).toMatch(/^(claude-|gpt-)/)
    }
    expect(models.map(model => model.id)).toContain('claude-opus-5')
    expect(models.map(model => model.id)).toContain('gpt-5.6-sol')
  })

  it('claude-code transport streams a reply from claude-opus-5 with a reasoning effort', async () => {
    const model = resolveModel({ id: 'claude-opus-5', protocol: 'claude-code' }, DEFAULT_BASE_URL)
    let text = ''
    try {
      text = await collectText(claudeCodeStreams.streamSimple(model, userContext('Reply with exactly: OK'), {
        apiKey: LIVE_KEY!,
        reasoning: 'low',
        maxTokens: 512,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (isCapacityFailure(message)) throw new Error(`CAPACITY(claude-opus-5): ${message}`)
      throw error
    }
    expect(text.trim().length).toBeGreaterThan(0)
  })

  it('codex-responses transport streams a reply from gpt-5.6-sol with a reasoning effort', async () => {
    const model = resolveModel({ id: 'gpt-5.6-sol', protocol: 'codex-responses' }, DEFAULT_BASE_URL)
    let text = ''
    try {
      text = await collectText(codexResponsesStreams.streamSimple(model, userContext('Reply with exactly: OK'), {
        apiKey: LIVE_KEY!,
        reasoning: 'low',
        maxTokens: 512,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (isCapacityFailure(message)) throw new Error(`CAPACITY(gpt-5.6-sol): ${message}`)
      throw error
    }
    expect(text.trim().length).toBeGreaterThan(0)
  })
})
