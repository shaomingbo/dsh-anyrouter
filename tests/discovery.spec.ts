import { describe, expect, it, vi } from 'vitest'
import { discoverAnyRouterModels } from '../src/discovery.ts'

function listing(data: unknown[]): Response {
  return new Response(JSON.stringify({ object: 'list', data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('AnyRouter model discovery', () => {
  it('uses bearer auth and keeps only Claude and GPT models', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => listing([
      { id: 'claude-opus-5', owned_by: 'custom' },
      { id: 'gpt-5.6-sol', owned_by: 'custom' },
      { id: 'gemini-2.5-pro', owned_by: 'custom' },
      { id: 'claude-opus-5', owned_by: 'duplicate' },
    ]))

    const models = await discoverAnyRouterModels({
      baseURL: 'https://anyrouter.top/',
      apiKey: ' sk-test ',
      fetch: fetcher,
    })

    expect(fetcher).toHaveBeenCalledOnce()
    const [url, init] = fetcher.mock.calls[0]!
    expect(url).toBe('https://anyrouter.top/v1/models')
    expect(init?.headers).toEqual(expect.objectContaining({
      authorization: 'Bearer sk-test',
      'user-agent': expect.stringContaining('deepseek-harness/'),
    }))
    expect(models.map(model => model.id)).toEqual(['claude-opus-5', 'gpt-5.6-sol'])
    expect(models[0]).toMatchObject({ contextWindow: 1_000_000, maxTokens: 128_000 })
  })

  it('constructs a listing URL from an endpoint path', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => listing([]))
    await discoverAnyRouterModels({ baseURL: 'https://example.com/api/', apiKey: 'sk-test', fetch: fetcher })
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://example.com/api/v1/models')
  })

  it('normalizes cancellation while reading a response body', async () => {
    const controller = new AbortController()
    controller.abort(new Error('cancelled'))
    await expect(discoverAnyRouterModels({
      baseURL: 'https://anyrouter.top',
      apiKey: 'sk-test',
      signal: controller.signal,
      fetch: vi.fn(async () => listing([])),
    })).rejects.toMatchObject({ code: 'ABORTED' })
  })

  it('reports credential and response-shape failures without returning an empty catalog', async () => {
    await expect(discoverAnyRouterModels({
      baseURL: 'https://anyrouter.top',
      apiKey: '',
      fetch: vi.fn(),
    })).rejects.toMatchObject({ code: 'INVALID_CREDENTIAL' })

    await expect(discoverAnyRouterModels({
      baseURL: 'https://anyrouter.top',
      apiKey: 'sk-test',
      fetch: vi.fn(async () => new Response('{"models":[]}', { status: 200 })),
    })).rejects.toMatchObject({ code: 'DISCOVERY_FAILED' })
  })

  it('classifies authentication failures', async () => {
    await expect(discoverAnyRouterModels({
      baseURL: 'https://anyrouter.top',
      apiKey: 'bad',
      fetch: vi.fn(async () => new Response('{}', { status: 401 })),
    })).rejects.toMatchObject({ code: 'INVALID_CREDENTIAL' })
  })
})
