import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const liveSpecPath = fileURLToPath(new URL('./live.spec.ts', import.meta.url))

describe('live suite environment gate', () => {
  it('uses the documented canonical environment variable', () => {
    const source = readFileSync(liveSpecPath, 'utf8')
    expect(source).toContain('process.env.ANYROUTER_LIVE_KEY')
    expect(source).not.toContain('ANYEROUTER_LIVE_KEY')
  })
})
