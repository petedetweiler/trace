import { describe, expect, it } from 'vitest'

import { applyNodeAttributeUpdates } from './nodeAuthoring'

const source = `version: 1
nodes:
  - id: review
    type: process
    label: Review request
    description: Existing context
    icon: search
  - id: finish
    label: Finish
edges:
  - from: review
    to: finish`

describe('node attribute authoring', () => {
  it('updates string fields with YAML-safe values and preserves unrelated content', () => {
    const updated = applyNodeAttributeUpdates(source, 'review', {
      label: 'Review: supplier #42',
      description: 'Confirm the supplier\'s current status.',
    })

    expect(updated).toContain('label: "Review: supplier #42"')
    expect(updated).toContain('description: Confirm the supplier\'s current status.')
    expect(updated).toContain('icon: search')
    expect(updated).toContain('edges:\n  - from: review')
  })

  it('adds appearance fields in a stable order', () => {
    const updated = applyNodeAttributeUpdates(source, 'finish', {
      type: 'end',
      emphasis: 'high',
      status: 'success',
    })

    expect(updated).toContain(
      '  - id: finish\n    type: end\n    label: Finish\n    emphasis: high\n    status: success'
    )
  })

  it('keeps simple prose readable while quoting ambiguous YAML strings', () => {
    const simple = applyNodeAttributeUpdates(source, 'review', { label: 'Review supplier request' })
    const reserved = applyNodeAttributeUpdates(source, 'review', { label: 'true' })

    expect(simple).toContain('label: Review supplier request')
    expect(reserved).toContain('label: "true"')
  })

  it('removes optional fields when reset to their defaults', () => {
    const updated = applyNodeAttributeUpdates(source, 'review', {
      type: null,
      description: null,
      emphasis: null,
      status: null,
    })

    expect(updated).not.toContain('type: process')
    expect(updated).not.toContain('description: Existing context')
    expect(updated).toContain('label: Review request')
  })

  it('leaves the document unchanged when the node does not exist', () => {
    expect(applyNodeAttributeUpdates(source, 'missing', { label: 'Nope' })).toBe(source)
  })
})
