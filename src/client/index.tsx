import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { MODEL_PROFILES_BY_ID } from '../model-profiles.generated.ts'

const SETTINGS_NS = 'llm-anyrouter'
const PROVIDER = 'anyrouter'
const API_KEY_REF = 'ANYROUTER_API_KEY'
const DEFAULT_BASE_URL = 'https://anyrouter.top'
const LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const
type Level = (typeof LEVELS)[number]
type Protocol = 'claude-code' | 'codex-responses'

interface ReasoningConfig {
  disabled?: boolean
  efforts?: Level[]
  defaultEffort?: Level
  adaptive?: boolean
}

interface SyncedModel {
  id: string
  name?: string
  protocol: Protocol
  contextWindow?: number
  maxTokens?: number
  reasoning?: ReasoningConfig
}

interface SettingsValue {
  baseURL?: string
  models?: SyncedModel[]
}

interface PickerRow {
  id: string
  name?: string
  protocol: Protocol
  contextWindow?: number
  maxTokens?: number
  checked: boolean
  reasoningOn: boolean
  efforts: Level[]
  defaultEffort: Level | undefined
  adaptive: boolean
}

interface SettingsScopeSnapshot {
  status: 'loading' | 'ready' | 'unavailable'
  value: SettingsValue | undefined
  writable: boolean
  mode: 'host' | 'memory'
}

interface SettingsScope {
  getSnapshot(): SettingsScopeSnapshot
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

interface ApiEnvelope<T> {
  result: { ok: true; value: T } | { ok: false; error: unknown }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; code?: unknown }
    if (typeof candidate.message === 'string') return candidate.message
    if (typeof candidate.code === 'string') return candidate.code
  }
  return String(error)
}

async function unwrap<T>(call: Promise<ApiEnvelope<T>>): Promise<T> {
  const envelope = await call
  if (envelope.result.ok) return envelope.result.value
  throw new Error(errorMessage(envelope.result.error))
}

function protocolFor(id: string): Protocol | undefined {
  const normalized = id.toLowerCase()
  if (normalized.startsWith('claude-')) return 'claude-code'
  if (normalized.startsWith('gpt-')) return 'codex-responses'
  return undefined
}

// Mirrors the host catalog's DEFAULT_UNCHECKED_MODELS: the relay's Responses
// endpoint answers 404 for gpt-5-codex, so it starts unchecked.
const DEFAULT_UNCHECKED = new Set(['gpt-5-codex'])

function orderedLevels(levels: Iterable<Level>): Level[] {
  const selected = new Set(levels)
  return LEVELS.filter(level => selected.has(level))
}

function referenceRow(id: string, protocol: Protocol): PickerRow {
  const reference = MODEL_PROFILES_BY_ID.get(id)
  const referenceEfforts = orderedLevels(
    (reference?.efforts ?? []).filter(level => (LEVELS as readonly string[]).includes(level)) as Level[],
  )
  const efforts = referenceEfforts.length > 0 ? referenceEfforts : [...LEVELS]
  const defaultEffort = efforts.includes('high') ? 'high' : efforts[efforts.length - 1]
  return {
    id,
    ...reference?.name === undefined ? {} : { name: reference.name },
    protocol,
    ...reference?.contextWindow === undefined ? {} : { contextWindow: reference.contextWindow },
    ...reference?.maxTokens === undefined ? {} : { maxTokens: reference.maxTokens },
    checked: !DEFAULT_UNCHECKED.has(id),
    reasoningOn: true,
    efforts,
    defaultEffort,
    adaptive: protocol === 'claude-code' && (reference?.adaptive ?? true),
  }
}

function rowFromSaved(saved: SyncedModel): PickerRow {
  const base = referenceRow(saved.id, saved.protocol)
  const reasoning = saved.reasoning
  const savedEfforts = reasoning?.efforts === undefined ? [] : orderedLevels(reasoning.efforts)
  return {
    ...base,
    ...saved.name === undefined ? {} : { name: saved.name },
    ...saved.contextWindow === undefined ? {} : { contextWindow: saved.contextWindow },
    ...saved.maxTokens === undefined ? {} : { maxTokens: saved.maxTokens },
    checked: true,
    reasoningOn: reasoning?.disabled !== true,
    ...savedEfforts.length > 0 ? { efforts: savedEfforts } : {},
    defaultEffort: reasoning?.defaultEffort !== undefined
      && (savedEfforts.length > 0 ? savedEfforts : base.efforts).includes(reasoning.defaultEffort)
      ? reasoning.defaultEffort
      : base.defaultEffort,
    adaptive: saved.protocol === 'claude-code' ? reasoning?.adaptive ?? base.adaptive : base.adaptive,
  }
}

function rowToSaved(row: PickerRow): SyncedModel {
  return {
    id: row.id,
    ...row.name === undefined ? {} : { name: row.name },
    protocol: row.protocol,
    ...row.contextWindow === undefined ? {} : { contextWindow: row.contextWindow },
    ...row.maxTokens === undefined ? {} : { maxTokens: row.maxTokens },
    reasoning: {
      ...!row.reasoningOn ? { disabled: true } : {},
      ...row.reasoningOn && row.efforts.length > 0 ? { efforts: orderedLevels(row.efforts) } : {},
      ...row.reasoningOn && row.defaultEffort !== undefined && row.efforts.includes(row.defaultEffort)
        ? { defaultEffort: row.defaultEffort }
        : {},
      ...row.reasoningOn && row.protocol === 'claude-code' ? { adaptive: row.adaptive } : {},
    },
  }
}

function credentialConfigured(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const credentials = (value as { credentials?: unknown }).credentials
  if (Array.isArray(credentials)) {
    return credentials.some(row => typeof row === 'object'
      && row !== null
      && (row as { ref?: unknown }).ref === API_KEY_REF
      && (row as { configured?: unknown }).configured === true)
  }
  if (typeof credentials === 'object' && credentials !== null) {
    return (credentials as Record<string, { configured?: unknown }>)[API_KEY_REF]?.configured === true
  }
  return false
}

// Tokens come from @deepseek-ai/dsh-client-ui-theme: aliases are defined on
// body for the light theme and overridden by body[data-ds-dark-theme], so the
// section follows the host day/night theme automatically. Fallbacks mirror the
// light values and only apply if the host theme stylesheet is missing.
const styles = `
.dsh-any { color: var(--dsw-alias-label-primary, #0f1115); max-width: 880px; padding: 8px 4px 28px; }
.dsh-any h2 { margin: 0 0 8px; font-size: 22px; }
.dsh-any p { color: var(--dsw-alias-label-secondary, #61666b); line-height: 1.55; }
.dsh-any-card { background: var(--dsw-alias-bg-module-platform, #f5f6f7); border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .04)); border-radius: 12px; padding: 18px; margin-top: 16px; }
.dsh-any-field { display: grid; gap: 7px; margin-top: 14px; }
.dsh-any-field label { font-size: 13px; color: var(--dsw-alias-label-secondary, #61666b); }
.dsh-any-field input { width: 100%; box-sizing: border-box; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, .12)); background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #0f1115); padding: 10px 12px; }
.dsh-any-field input::placeholder { color: var(--dsw-alias-label-dimmed, #e1e5ee); }
.dsh-any-field input:focus-visible { outline: 2px solid var(--dsw-alias-button-primary-hover, #43454a); outline-offset: 1px; }
.dsh-any-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.dsh-any button { border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .1)); border-radius: 8px; background: var(--dsw-alias-button-elevated-fill, #fff); color: var(--dsw-alias-label-primary, #0f1115); padding: 9px 14px; cursor: pointer; }
.dsh-any button:hover:enabled { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, .06)); }
.dsh-any button:focus-visible { outline: 2px solid var(--dsw-alias-button-primary-hover, #43454a); outline-offset: 1px; }
.dsh-any button[data-primary=true] { background: var(--dsw-alias-button-primary-fill, #0f1115); border-color: transparent; color: var(--dsw-alias-label-primary-foreground, #fff); }
.dsh-any button[data-primary=true]:hover:enabled { background: var(--dsw-alias-button-primary-hover, #43454a); }
.dsh-any button:disabled { opacity: .5; cursor: default; }
.dsh-any-status { display: inline-flex; gap: 7px; align-items: center; font-size: 13px; color: var(--dsw-alias-label-secondary, #61666b); }
.dsh-any-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-error-primary, #ec1313); }
.dsh-any-dot[data-ready=true] { background: var(--dsw-alias-state-success-primary, #22c55e); }
.dsh-any-error { margin-top: 12px; color: var(--dsw-alias-state-error-primary, #ec1313); white-space: pre-wrap; }
.dsh-any-success { margin-top: 12px; color: var(--dsw-alias-state-success-primary, #22c55e); }
.dsh-any-models { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 7px; }
.dsh-any-models li { display: flex; gap: 10px; justify-content: space-between; align-items: center; padding: 9px 10px; border-radius: 8px; background: var(--dsw-alias-bg-base, #fff); }
.dsh-any-model-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-any-badge { flex: none; font-size: 11px; border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .1)); border-radius: 99px; padding: 3px 7px; color: var(--dsw-alias-label-secondary, #61666b); }
.dsh-any-picker { margin-top: 14px; display: grid; gap: 8px; }
.dsh-any-row { border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .1)); border-radius: 10px; padding: 10px 12px; background: var(--dsw-alias-bg-base, #fff); }
.dsh-any-row[data-checked=false] { opacity: .62; }
.dsh-any-row-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dsh-any-row-head label { flex: 1; min-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.dsh-any-row-meta { font-size: 12px; color: var(--dsw-alias-label-tertiary, #81858c); }
.dsh-any-levels { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 9px; }
.dsh-any-levels button { padding: 4px 9px; font-size: 12px; border-radius: 99px; }
.dsh-any-levels button[data-on=true] { background: var(--dsw-alias-button-primary-fill, #0f1115); border-color: transparent; color: var(--dsw-alias-label-primary-foreground, #fff); }
.dsh-any-levels button[data-on=true]:hover:enabled { background: var(--dsw-alias-button-primary-hover, #43454a); }
.dsh-any-levels select { border-radius: 8px; border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, .12)); background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #0f1115); padding: 4px 8px; }
.dsh-any-empty { margin-top: 10px; font-size: 13px; color: var(--dsw-alias-label-caption, #adb2b8); }
`

interface SectionProps {
  api: IApiClient
  scope: SettingsScope
  subscribeCredentials: (refresh: () => void) => () => void
}

function LevelChips({ row, onChange }: { row: PickerRow; onChange: (row: PickerRow) => void }): ReactElement {
  if (!row.reasoningOn) return <></>
  const toggle = (level: Level) => {
    const next = row.efforts.includes(level)
      ? row.efforts.filter(candidate => candidate !== level)
      : orderedLevels([...row.efforts, level])
    onChange({
      ...row,
      efforts: next,
      defaultEffort: row.defaultEffort !== undefined && next.includes(row.defaultEffort)
        ? row.defaultEffort
        : next[next.length - 1],
    })
  }
  return (
    <div className="dsh-any-levels" data-testid="reasoning-editor">
      {LEVELS.map(level => (
        <button
          key={level}
          type="button"
          data-on={row.efforts.includes(level)}
          disabled={!row.checked}
          onClick={() => toggle(level)}
        >{level}</button>
      ))}
      <label>
        {' 默认 '}
        <select
          disabled={!row.checked || row.efforts.length === 0}
          value={row.defaultEffort ?? ''}
          onChange={event => onChange({
            ...row,
            defaultEffort: event.target.value === '' ? undefined : event.target.value as Level,
          })}
        >
          {row.defaultEffort === undefined || !row.efforts.includes(row.defaultEffort)
            ? <option value="" />
            : null}
          {row.efforts.map(level => <option key={level} value={level}>{level}</option>)}
        </select>
      </label>
      {row.protocol === 'claude-code'
        ? (
          <label>
            <input
              type="checkbox"
              disabled={!row.checked}
              checked={row.adaptive}
              onChange={event => onChange({ ...row, adaptive: event.target.checked })}
            />
            {' 自适应思考'}
          </label>
        )
        : null}
    </div>
  )
}

function Picker({ rows, onChange }: { rows: PickerRow[]; onChange: (next: PickerRow[]) => void }): ReactElement {
  const update = (row: PickerRow) => onChange(rows.map(candidate => candidate.id === row.id ? row : candidate))
  return (
    <div className="dsh-any-picker" data-testid="model-picker">
      {rows.map(row => (
        <div key={row.id} className="dsh-any-row" data-checked={row.checked}>
          <div className="dsh-any-row-head">
            <label title={row.id}>
              <input
                type="checkbox"
                checked={row.checked}
                onChange={event => update({ ...row, checked: event.target.checked })}
              />
              {' '}
              {row.name ?? row.id}
            </label>
            <span className="dsh-any-badge">{row.protocol === 'claude-code' ? 'Claude' : 'Codex'}</span>
            <span className="dsh-any-row-meta">
              {`${Math.round((row.contextWindow ?? 0) / 1000)}k ctx · ${Math.round((row.maxTokens ?? 0) / 1000)}k out`}
            </span>
          </div>
          <div className="dsh-any-levels">
            <label>
              <input
                type="checkbox"
                disabled={!row.checked}
                checked={row.reasoningOn}
                onChange={event => update({ ...row, reasoningOn: event.target.checked })}
              />
              {' 推理'}
            </label>
          </div>
          <LevelChips row={row} onChange={update} />
        </div>
      ))}
    </div>
  )
}

function ReasoningSummary({ model }: { model: SyncedModel }): ReactElement {
  const reasoning = model.reasoning
  if (reasoning === undefined) {
    return <span className="dsh-any-badge">推理 · 参考默认</span>
  }
  if (reasoning.disabled === true) {
    return <span className="dsh-any-badge">无推理</span>
  }
  const efforts = reasoning.efforts?.length ? reasoning.efforts.join('/') : '参考默认'
  const suffix = reasoning.defaultEffort === undefined ? '' : ` · 默认 ${reasoning.defaultEffort}`
  return <span className="dsh-any-badge">{`推理 ${efforts}${suffix}`}</span>
}

function Section({ api, scope, subscribeCredentials }: SectionProps): ReactElement {
  const snapshot = useSyncExternalStore(
    listener => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const models = Array.isArray(snapshot.value?.models) ? snapshot.value.models : []
  const loading = snapshot.status === 'loading'
  const writable = snapshot.status === 'ready' && snapshot.writable && snapshot.mode === 'host'
  const [configured, setConfigured] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [baseURL, setBaseURL] = useState(DEFAULT_BASE_URL)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [credentialRevision, setCredentialRevision] = useState(0)
  const [picker, setPicker] = useState<PickerRow[] | null>(null)
  const alive = useRef(true)
  const generation = useRef(0)
  const activeController = useRef<AbortController | null>(null)

  useEffect(() => {
    const next = snapshot.value?.baseURL ?? DEFAULT_BASE_URL
    if (!busy) setBaseURL(next)
  }, [busy, snapshot.value?.baseURL])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      generation.current += 1
      activeController.current?.abort()
    }
  }, [])

  const refreshCredential = useCallback(() => setCredentialRevision(value => value + 1), [])
  useEffect(() => subscribeCredentials(refreshCredential), [refreshCredential, subscribeCredentials])
  useEffect(() => {
    const controller = new AbortController()
    let live = true
    void unwrap<any>((api.credentials.describe as any)({ refs: [API_KEY_REF] }, controller.signal))
      .then(credentials => {
        if (!live) return
        setConfigured(credentialConfigured(credentials))
      })
      .catch(reason => { if (live) setError(errorMessage(reason)) })
    return () => { live = false; controller.abort() }
  }, [api, credentialRevision])

  const beginOperation = useCallback(() => {
    activeController.current?.abort()
    const controller = new AbortController()
    activeController.current = controller
    const token = ++generation.current
    const active = (): boolean => alive.current && generation.current === token && !controller.signal.aborted
    return { controller, active }
  }, [])

  const persistBaseURL = async (operation: ReturnType<typeof beginOperation>): Promise<void> => {
    const nextBaseURL = baseURL.trim() || DEFAULT_BASE_URL
    await scope.set('baseURL', nextBaseURL)
    if (!operation.active()) throw new Error('操作已中断。')
    if (scope.getSnapshot().value?.baseURL !== nextBaseURL) {
      throw new Error('API 地址未能保存，请检查格式后重试。')
    }
  }

  const save = useCallback(async () => {
    const operation = beginOperation()
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      if (apiKey.trim().length > 0) {
        await unwrap<any>((api.credentials.set as any)(
          { ref: API_KEY_REF, value: apiKey.trim() }, operation.controller.signal,
        ))
      }
      if (!operation.active()) return
      await persistBaseURL(operation)
      setApiKey('')
      setConfigured(true)
      setSuccess('API Key 已保存。提供方已启用，模型将出现在模型选择器。')
      refreshCredential()
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason))
    } finally {
      if (operation.active()) setBusy(false)
    }
  }, [api, apiKey, baseURL, beginOperation, refreshCredential, scope])

  const discover = useCallback(async () => {
    const operation = beginOperation()
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      if (apiKey.trim().length > 0) {
        await unwrap<any>((api.credentials.set as any)(
          { ref: API_KEY_REF, value: apiKey.trim() }, operation.controller.signal,
        ))
        if (!operation.active()) return
      }
      const result = await unwrap<any>((api.llm.discoverModels as any)({
        settingsNs: SETTINGS_NS,
        provider: PROVIDER,
        baseURL: baseURL.trim() || DEFAULT_BASE_URL,
      }, operation.controller.signal))
      if (!operation.active()) return
      const discovered: { id: string; name?: string; contextWindow?: number; maxTokens?: number }[] =
        result.models ?? []
      const saved = new Map(models.map(model => [model.id, model]))
      const rows: PickerRow[] = []
      for (const row of discovered) {
        const protocol = protocolFor(row.id)
        if (protocol === undefined) continue
        const existing = saved.get(row.id)
        rows.push(existing !== undefined
          ? rowFromSaved({
            ...existing,
            ...typeof row.contextWindow === 'number' && existing.contextWindow === undefined
              ? { contextWindow: row.contextWindow }
              : {},
            ...typeof row.maxTokens === 'number' && existing.maxTokens === undefined
              ? { maxTokens: row.maxTokens }
              : {},
          })
          : {
            ...referenceRow(row.id, protocol),
            ...typeof row.name === 'string' && row.name.length > 0 ? { name: row.name } : {},
            ...typeof row.contextWindow === 'number' ? { contextWindow: row.contextWindow } : {},
            ...typeof row.maxTokens === 'number' ? { maxTokens: row.maxTokens } : {},
          })
      }
      setApiKey('')
      setConfigured(true)
      setPicker(rows)
      setSuccess(`发现 ${rows.length} 个 Claude / Codex 模型，勾选后保存所选。`)
      refreshCredential()
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason))
    } finally {
      if (operation.active()) setBusy(false)
    }
  }, [api, apiKey, baseURL, beginOperation, models, refreshCredential])

  const saveSelection = useCallback(async () => {
    if (picker === null) return
    const operation = beginOperation()
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await persistBaseURL(operation)
      const nextModels = picker.filter(row => row.checked).map(rowToSaved)
      await scope.set('models', nextModels)
      if (!operation.active()) throw new Error('操作已中断。')
      const savedModels = scope.getSnapshot().value?.models
      if (!Array.isArray(savedModels) || savedModels.length !== nextModels.length
        || savedModels.some((model, index) => model.id !== nextModels[index]?.id)) {
        throw new Error('模型列表未能保存，请重试。')
      }
      setPicker(null)
      setSuccess(`已保存 ${nextModels.length} 个模型，含各自推理参数。`)
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason))
    } finally {
      if (operation.active()) setBusy(false)
    }
  }, [baseURL, beginOperation, picker, scope])

  const removeSaved = useCallback(async (id: string) => {
    const operation = beginOperation()
    setBusy(true)
    setError(null)
    try {
      const nextModels = models.filter(model => model.id !== id)
      await scope.set('models', nextModels)
      if (!operation.active()) throw new Error('操作已中断。')
      setSuccess(`已移除 ${id}。`)
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason))
    } finally {
      if (operation.active()) setBusy(false)
    }
  }, [beginOperation, models, scope])

  const grouped = useMemo(() => ({
    claude: models.filter(model => model.protocol === 'claude-code').length,
    codex: models.filter(model => model.protocol === 'codex-responses').length,
  }), [models])

  return (
    <section className="dsh-any" aria-label="AnyRouter 设置">
      <h2>AnyRouter</h2>
      <p>同步 Claude（Agent SDK 兼容请求）与 GPT/Codex（Responses）模型，并为每个模型保存推理参数。</p>
      <div className="dsh-any-card">
        <span className="dsh-any-status">
          <span className="dsh-any-dot" data-ready={configured} />
          {configured ? 'API Key 已配置（提供方已启用）' : '未配置 API Key（提供方已禁用，不出现在模型选择器）'}
        </span>
        <div className="dsh-any-field">
          <label htmlFor="dsh-any-key">API Key（仅写入，不回显）</label>
          <input
            id="dsh-any-key"
            type="password"
            autoComplete="off"
            placeholder={configured ? '输入新 Key 以替换' : 'sk-…'}
            value={apiKey}
            disabled={busy || !writable}
            onChange={event => setApiKey(event.target.value)}
          />
        </div>
        <div className="dsh-any-field">
          <label htmlFor="dsh-any-url">API 地址</label>
          <input
            id="dsh-any-url"
            type="url"
            value={baseURL}
            disabled={busy || !writable}
            onChange={event => setBaseURL(event.target.value)}
          />
        </div>
        <div className="dsh-any-actions">
          <button type="button" disabled={busy || loading || !writable || (apiKey.trim().length === 0 && !configured)} onClick={save}>保存配置</button>
          <button type="button" data-primary="true" disabled={busy || loading || !writable || (apiKey.trim().length === 0 && !configured)} onClick={discover}>
            {busy ? '处理中…' : '同步模型'}
          </button>
        </div>
        {snapshot.status === 'unavailable'
          ? <div className="dsh-any-error" role="alert">当前连接不能修改设置，请在本机 Web 页面操作。</div>
          : null}
        {error === null ? null : <div className="dsh-any-error" role="alert">{error}</div>}
        {success === null ? null : <div className="dsh-any-success" role="status">{success}</div>}
      </div>
      {picker !== null
        ? (
          <div className="dsh-any-card">
            <strong>选择纳入模型选择器的模型</strong>
            <p>勾选模型、调整推理档位与默认力度，然后保存所选。gpt-5-codex 默认不勾选（Responses 端点不支持）。</p>
            <Picker rows={picker} onChange={setPicker} />
            <div className="dsh-any-actions">
              <button type="button" disabled={busy} onClick={() => setPicker(picker.map(row => ({ ...row, checked: true })))}>全选</button>
              <button type="button" disabled={busy} onClick={() => setPicker(picker.map(row => ({ ...row, checked: false })))}>全不选</button>
              <button type="button" data-primary="true" disabled={busy} onClick={saveSelection}>保存所选</button>
              <button type="button" disabled={busy} onClick={() => setPicker(null)}>取消</button>
            </div>
          </div>
        )
        : null}
      <div className="dsh-any-card">
        <strong>已保存模型</strong>
        <p>{models.length === 0 ? '尚未保存。' : `Claude ${grouped.claude} 个，Codex ${grouped.codex} 个。`}</p>
        <ul className="dsh-any-models">
          {models.map(model => (
            <li key={model.id}>
              <span className="dsh-any-model-name" title={model.id}>{model.name ?? model.id}</span>
              <ReasoningSummary model={model} />
              <button type="button" disabled={busy || !writable} onClick={() => removeSaved(model.id)}>移除</button>
            </li>
          ))}
        </ul>
        <p className="dsh-any-empty">模型列表是建议性的：上游通道不可用或满载时，请求仍可能失败（429/500）。</p>
      </div>
    </section>
  )
}

export const inject = ['slots', 'connection', 'remote', 'settingsScope']

export function apply(ctx: any): void {
  const connection = ctx.get('connection')
  const remote = ctx.get('remote')
  const scope: SettingsScope = ctx.get('settingsScope').bind({
    namespace: SETTINGS_NS,
    decode: (section: unknown): SettingsValue | undefined => typeof section === 'object'
      && section !== null
      && !Array.isArray(section)
      ? section as SettingsValue
      : undefined,
  })
  const subscribeCredentials = (refresh: () => void): (() => void) => {
    const disposers: Array<() => void> = []
    for (const [event, listener] of [
      ['credentials/reference-updated', (ref: string) => { if (ref === API_KEY_REF) refresh() }],
      ['credentials/updated', refresh],
    ] as const) {
      try { disposers.push(remote.$on(event, listener)) } catch { /* older/newer event spelling */ }
    }
    try { disposers.push(ctx.on('connection/reset', refresh)) } catch { /* optional during tests */ }
    return () => { for (const dispose of disposers) dispose() }
  }
  ctx.effect(() => {
    const element = document.createElement('style')
    element.dataset.plugin = 'dsh-anyrouter'
    element.textContent = styles
    document.head.appendChild(element)
    return () => element.remove()
  }, 'dsh-anyrouter: settings styles')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: PROVIDER,
    order: 11,
    label: () => 'AnyRouter',
    inject: () => ({ api: connection.api, scope, subscribeCredentials }),
  }, Section))
}
