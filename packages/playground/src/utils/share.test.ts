import { describe, expect, it } from 'vitest'

import {
  ShareLinkError,
  createShareUrl,
  decodeShareHash,
  encodeShareHash,
} from './share'

const YAML = `version: 1
title: Café delivery 🚲
nodes:
  - id: start
    label: Begin
edges: []
`

describe('Traceflow share links', () => {
  it('round-trips Unicode YAML through a versioned edit hash', () => {
    const hash = encodeShareHash(YAML)

    expect(hash).toMatch(/^#v=1&flow=/)
    expect(hash).toContain('&sig=')
    expect(decodeShareHash(hash)).toEqual({ yaml: YAML, mode: 'edit' })
  })

  it('preserves presentation mode in a complete URL', () => {
    const url = createShareUrl('https://trace.example/playground?source=test#old', YAML, 'presentation')
    const parsed = new URL(url)

    expect(parsed.search).toBe('?source=test')
    expect(decodeShareHash(parsed.hash)).toEqual({ yaml: YAML, mode: 'presentation' })
  })

  it('round-trips a responsive embed link', () => {
    const hash = encodeShareHash(YAML, 'embed')
    expect(hash).toContain('&embed=1')
    expect(decodeShareHash(hash)).toEqual({ yaml: YAML, mode: 'embed' })
  })

  it('returns null for ordinary hashes and rejects incompatible versions', () => {
    expect(decodeShareHash('#section')).toBeNull()
    expect(() => decodeShareHash('#v=2&flow=anything')).toThrow(ShareLinkError)
    expect(() => decodeShareHash('#v=1&flow=%25')).toThrow(ShareLinkError)
  })
})
