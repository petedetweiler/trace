import { describe, expect, it } from 'vitest'

import { parse } from './parser'

describe('parse', () => {
  it('parses a safe YAML document', () => {
    const yaml = `
title: Example
steps:
  - id: start
    label: Begin
`

    const doc = parse(yaml)

    expect(doc.title).toBe('Example')
    expect(doc.steps?.[0]?.id).toBe('start')
  })

  it('rejects prototype pollution keys', () => {
    const maliciousYaml = `
__proto__:
  poisoned: true
`

    expect(() => parse(maliciousYaml)).toThrowError(/Unsafe key "__proto__"/)
  })
})
