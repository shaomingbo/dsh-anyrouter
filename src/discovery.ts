import { attributionHeaders, LlmError, normalizeApiKey, type LlmDiscoveredModel } from '@deepseek-ai/dsh-llm'
import { classifyProtocol, normalizeBaseURL } from './config.ts'
import { metadataForDiscoveredModel } from './catalog.ts'

const MAX_RESPONSE_BYTES = 4 * 1024 * 1024

interface ModelRow {
  id?: unknown
  name?: unknown
  display_name?: unknown
  context_window?: unknown
  context_length?: unknown
  max_tokens?: unknown
  max_output_tokens?: unknown
}

function positiveInteger(...values: unknown[]): number | undefined {
  return values.find(value => typeof value === 'number' && Number.isSafeInteger(value) && value > 0) as number | undefined
}

function nonEmptyString(...values: unknown[]): string | undefined {
  return values.find(value => typeof value === 'string' && value.length > 0) as string | undefined
}

function modelURL(baseURL: string): string {
  const url = new URL(baseURL)
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/v1/models`
  url.search = ''
  url.hash = ''
  return url.toString()
}

async function readBounded(response: Response, signal?: AbortSignal): Promise<string> {
  if (response.body === null) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let text = ''
  try {
    while (true) {
      if (signal?.aborted) throw signal.reason
      const next = await reader.read()
      if (next.done) break
      bytes += next.value.byteLength
      if (bytes > MAX_RESPONSE_BYTES) {
        throw new LlmError(`AnyRouter model listing exceeds ${MAX_RESPONSE_BYTES} bytes`, 'DISCOVERY_FAILED')
      }
      text += decoder.decode(next.value, { stream: true })
    }
    text += decoder.decode()
    return text
  } finally {
    await reader.cancel().catch(() => undefined)
  }
}

function rowsOf(body: unknown): ModelRow[] {
  if (typeof body !== 'object' || body === null || !Array.isArray((body as { data?: unknown }).data)) {
    throw new LlmError('AnyRouter model listing is not an OpenAI-compatible data array', 'DISCOVERY_FAILED')
  }
  return (body as { data: unknown[] }).data.filter((row): row is ModelRow => typeof row === 'object' && row !== null)
}

export async function discoverAnyRouterModels(options: {
  baseURL: string
  apiKey: string
  signal?: AbortSignal
  fetch?: typeof fetch
}): Promise<LlmDiscoveredModel[]> {
  const keyCheck = normalizeApiKey(options.apiKey)
  if (!keyCheck.ok) {
    throw new LlmError(`AnyRouter model discovery received an unusable API key (${keyCheck.reason})`, 'INVALID_CREDENTIAL')
  }
  const key = keyCheck.value
  const url = modelURL(normalizeBaseURL(options.baseURL))
  let response: Response
  try {
    response = await (options.fetch ?? fetch)(url, {
      headers: {
        ...attributionHeaders(),
        accept: 'application/json',
        authorization: `Bearer ${key}`,
      },
      ...options.signal === undefined ? {} : { signal: options.signal },
    })
  } catch (cause) {
    if (options.signal?.aborted) throw new LlmError('AnyRouter model discovery aborted', 'ABORTED', { cause })
    throw new LlmError(`failed to fetch AnyRouter models from ${url}`, 'DISCOVERY_FAILED', { cause })
  }
  if (!response.ok) {
    throw new LlmError(
      `${url} answered ${response.status}${response.status === 401 || response.status === 403 ? '; check the API key' : ''}`,
      response.status === 401 || response.status === 403 ? 'INVALID_CREDENTIAL' : 'DISCOVERY_FAILED',
    )
  }
  let text: string
  try {
    text = await readBounded(response, options.signal)
  } catch (cause) {
    if (options.signal?.aborted) throw new LlmError('AnyRouter model discovery aborted', 'ABORTED', { cause })
    throw new LlmError(`failed to read AnyRouter models from ${url}`, 'DISCOVERY_FAILED', { cause })
  }
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch (cause) {
    throw new LlmError(`${url} did not answer with JSON`, 'DISCOVERY_FAILED', { cause })
  }

  const discovered: LlmDiscoveredModel[] = []
  const seen = new Set<string>()
  for (const row of rowsOf(body)) {
    if (typeof row.id !== 'string' || row.id.length === 0 || seen.has(row.id)) continue
    const protocol = classifyProtocol(row.id)
    if (protocol === undefined) continue
    seen.add(row.id)
    const fallback = metadataForDiscoveredModel(row.id, protocol)
    const name = nonEmptyString(row.name, row.display_name, fallback.name)
    const contextWindow = positiveInteger(row.context_window, row.context_length, fallback.contextWindow)
    const maxTokens = positiveInteger(row.max_tokens, row.max_output_tokens, fallback.maxTokens)
    discovered.push({
      id: row.id,
      ...name === undefined ? {} : { name },
      ...contextWindow === undefined ? {} : { contextWindow },
      ...maxTokens === undefined ? {} : { maxTokens },
    })
  }
  return discovered
}
