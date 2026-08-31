import { describe, expect, it } from 'vitest'
import { canonicalReasoningProfile, resolveConfig, REASONING_LEVELS } from '../src/config.ts'
import { DEFAULT_UNCHECKED_MODELS, effectiveReasoning, resolveModel, thinkingLevelMapOf } from '../src/catalog.ts'

describe('reasoning profile persistence', () => {
  it('canonicalizes efforts, validates the default, and gates adaptive to claude', () => {
    expect(canonicalReasoningProfile(
      { efforts: ['max', 'low', 'low', 'high'] },
      'claude-code',
      'claude-opus-5',
    )).toEqual({ efforts: ['low', 'high', 'max'] })
    expect(() => canonicalReasoningProfile(
      { efforts: ['low'], defaultEffort: 'high' },
      'claude-code',
      'claude-opus-5',
    )).toThrow(/defaultEffort/)
    expect(() => canonicalReasoningProfile(
      { efforts: ['low'], adaptive: true },
      'codex-responses',
      'gpt-5.6-sol',
    )).toThrow(/adaptive/)
    expect(canonicalReasoningProfile(
      { efforts: ['low'], adaptive: true, defaultEffort: 'low', disabled: true },
      'claude-code',
      'claude-opus-5',
    )).toEqual({ disabled: true })
    const resolved = resolveConfig({
      models: [{ id: 'claude-opus-5', protocol: 'claude-code', reasoning: { efforts: ['medium', 'high'], defaultEffort: 'high' } }],
    })
    expect(resolved.models[0]!.reasoning).toEqual({ efforts: ['medium', 'high'], defaultEffort: 'high' })
  })

  it('a persisted effort set becomes the exact selector level list', () => {
    const model = resolveModel({
      id: 'claude-opus-5',
      protocol: 'claude-code',
      reasoning: { efforts: ['low', 'medium', 'high'] },
    }, 'https://anyrouter.top')
    expect(model.reasoning).toBe(true)
    const map = model.thinkingLevelMap!
    for (const level of REASONING_LEVELS) {
      expect(map[level]).toBe(['low', 'medium', 'high'].includes(level) ? (level === 'minimal' ? 'low' : level) : null)
    }
    expect(map.off).toBe(null)
    expect(map.max).toBe(null)
  })

  it('codex maps off to none and minimal to low; claude keeps off selectable', () => {
    expect(thinkingLevelMapOf('codex-responses', ['off', 'low', 'high'])).toMatchObject({
      off: 'none', minimal: null, low: 'low', medium: null, high: 'high', xhigh: null, max: null,
    })
    expect(thinkingLevelMapOf('claude-code', ['off', 'low'])).toMatchObject({
      off: 'off', minimal: null, low: 'low', medium: null, high: null, xhigh: null, max: null,
    })
    expect(thinkingLevelMapOf('claude-code', ['off', 'minimal', 'low'])).toMatchObject({
      off: 'off', minimal: 'low', low: 'low',
    })
  })

  it('a persisted adaptive statement rewrites the reference flag only', () => {
    const adaptive = resolveModel({
      id: 'claude-opus-5', protocol: 'claude-code', reasoning: { adaptive: false, efforts: ['low'] },
    }, 'https://anyrouter.top')
    expect(adaptive.compat).toMatchObject({ forceAdaptiveThinking: false, supportsTemperature: false })

    const untouched = resolveModel({
      id: 'claude-opus-5', protocol: 'claude-code', reasoning: { efforts: ['low'] },
    }, 'https://anyrouter.top')
    expect(untouched.compat).toMatchObject({ forceAdaptiveThinking: true })
  })

  it('disabled reasoning offers no thinking control, even for a known model', () => {
    const model = resolveModel({
      id: 'claude-opus-5', protocol: 'claude-code', reasoning: { disabled: true, efforts: ['low'] },
    }, 'https://anyrouter.top')
    expect(model.reasoning).toBe(false)
    expect(model.thinkingLevelMap).toBeUndefined()
    expect(effectiveReasoning({
      id: 'claude-opus-5', protocol: 'claude-code', reasoning: { disabled: true },
    })).toMatchObject({ enabled: false, efforts: [] })
  })

  it('unknown relay ids fall back to protocol defaults with full levels', () => {
    const model = resolveModel({ id: 'claude-opus-9', protocol: 'claude-code' }, 'https://anyrouter.top')
    expect(model.reasoning).toBe(true)
    expect(model.contextWindow).toBe(1_000_000)
    expect(effectiveReasoning({ id: 'claude-opus-9', protocol: 'claude-code' }).efforts).toEqual([...REASONING_LEVELS])
    expect(DEFAULT_UNCHECKED_MODELS.has('gpt-5-codex')).toBe(true)
  })
})
