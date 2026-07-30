import { describe, expect, it } from 'vitest'

import { computeOrthogonalPath } from './layout'
import type { PositionedNode, TraceEdge } from './types'

const edge: TraceEdge = { from: 'source', to: 'target' }

function node(overrides: Partial<PositionedNode>): PositionedNode {
  return {
    id: 'node',
    label: 'Node',
    type: 'process',
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    ...overrides,
  }
}

describe('computeOrthogonalPath', () => {
  it('keeps a nearby vertical edge attached to both node centers', () => {
    const source = node({ id: 'source', type: 'decision', x: 100, y: 100, height: 80 })
    const target = node({ id: 'target', x: 150, y: 280 })

    expect(computeOrthogonalPath(source, target, edge, 'TB', [source, target])).toEqual([
      { x: 100, y: 140 },
      { x: 100, y: 195 },
      { x: 150, y: 195 },
      { x: 150, y: 250 },
    ])
  })

  it('keeps a nearby horizontal edge orthogonal and attached to both node centers', () => {
    const source = node({ id: 'source', x: 100, y: 100 })
    const target = node({ id: 'target', x: 300, y: 112 })

    expect(computeOrthogonalPath(source, target, edge, 'LR', [source, target])).toEqual([
      { x: 160, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 112 },
      { x: 240, y: 112 },
    ])
  })

  it('uses the correct ports for bottom-to-top layout', () => {
    const source = node({ id: 'source', x: 100, y: 280 })
    const target = node({ id: 'target', x: 150, y: 100 })

    expect(computeOrthogonalPath(source, target, edge, 'BT', [source, target])).toEqual([
      { x: 100, y: 250 },
      { x: 100, y: 190 },
      { x: 150, y: 190 },
      { x: 150, y: 130 },
    ])
  })

  it('uses the correct ports for right-to-left layout', () => {
    const source = node({ id: 'source', x: 300, y: 100 })
    const target = node({ id: 'target', x: 100, y: 112 })

    expect(computeOrthogonalPath(source, target, edge, 'RL', [source, target])).toEqual([
      { x: 240, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 112 },
      { x: 160, y: 112 },
    ])
  })
})
