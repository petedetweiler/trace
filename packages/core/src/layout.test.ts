import { describe, expect, it } from 'vitest'
import { resolveTheme } from '@traceflow/themes'

import { computeLayout, computeOrthogonalPath, wrapLabel } from './layout'
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

describe('computeLayout', () => {
  it('wraps long labels and expands node height deterministically', () => {
    const layout = computeLayout({
      direction: 'LR',
      nodes: [{ id: 'long', label: 'This is a deliberately long node label that must wrap' }],
      edges: [],
    })
    const positioned = layout.nodes[0]

    expect(positioned.labelLines?.length).toBeGreaterThan(1)
    expect(positioned.height).toBeGreaterThan(60)
    expect(layout.direction).toBe('LR')
  })

  it('breaks a single oversized token instead of overflowing it', () => {
    const lines = wrapLabel('supercalifragilisticexpialidocious', 14, 60)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every((line) => line.length <= 7)).toBe(true)
  })

  it('keeps decision diamonds visually substantial', () => {
    const theme = resolveTheme('editorial')
    const layout = computeLayout({
      nodes: [{ id: 'decision', label: 'Is this an incident?', type: 'decision', icon: 'help-circle' }],
      edges: [],
    }, { theme })

    expect(layout.nodes[0].height).toBe(150)
    expect(layout.nodes[0].width).toBeGreaterThanOrEqual(160)
  })

  it('positions groups as non-overlapping swimlanes and keeps members inside them', () => {
    const layout = computeLayout({
      direction: 'TB',
      nodes: [
        { id: 'request', label: 'Submit request' },
        { id: 'approve', label: 'Approve', type: 'manual' },
        { id: 'store', label: 'Store', type: 'database' },
      ],
      edges: [
        { from: 'request', to: 'approve' },
        { from: 'approve', to: 'store' },
      ],
      groups: [
        { id: 'customer', label: 'Customer', nodes: ['request'] },
        { id: 'operations', label: 'Operations', nodes: ['approve'] },
        { id: 'system', label: 'System', nodes: ['store'] },
      ],
    })

    expect(layout.groups).toHaveLength(3)
    const sortedGroups = [...(layout.groups ?? [])].sort((a, b) => a.x - b.x)
    for (let index = 1; index < sortedGroups.length; index += 1) {
      const previousRight = sortedGroups[index - 1].x + sortedGroups[index - 1].width / 2
      const currentLeft = sortedGroups[index].x - sortedGroups[index].width / 2
      expect(currentLeft).toBeGreaterThan(previousRight)
    }

    for (const group of layout.groups ?? []) {
      for (const nodeId of group.nodes) {
        const member = layout.nodes.find((node) => node.id === nodeId)!
        expect(member.x - member.width / 2).toBeGreaterThan(group.x - group.width / 2)
        expect(member.x + member.width / 2).toBeLessThan(group.x + group.width / 2)
      }
    }
  })

  it('reserves a label rail and roomy icon-led cards for horizontal swimlanes', () => {
    const theme = resolveTheme('editorial')
    const layout = computeLayout({
      direction: 'LR',
      nodes: [
        { id: 'alert', label: 'Alert received', icon: 'bell' },
        { id: 'triage', label: 'Triage incident', icon: 'search' },
      ],
      edges: [{ from: 'alert', to: 'triage' }],
      groups: [{ id: 'detection', label: 'Detection', nodes: ['alert', 'triage'] }],
    }, { theme })

    const group = layout.groups![0]
    const firstNode = layout.nodes[0]
    expect(firstNode.width).toBeGreaterThanOrEqual(160)
    expect(firstNode.height).toBeGreaterThanOrEqual(88)
    expect(firstNode.x - firstNode.width / 2 - (group.x - group.width / 2)).toBeGreaterThan(88)
  })

  it('aligns the leading edges of horizontal swimlanes for a natural row wrap', () => {
    const theme = resolveTheme('editorial')
    const layout = computeLayout({
      direction: 'LR',
      nodes: [
        { id: 'detect', label: 'Detect', icon: 'bell' },
        { id: 'triage', label: 'Triage', icon: 'search' },
        { id: 'investigate', label: 'Investigate', icon: 'search' },
        { id: 'resolve', label: 'Resolve', icon: 'check' },
      ],
      edges: [
        { from: 'detect', to: 'triage' },
        { from: 'triage', to: 'investigate' },
        { from: 'investigate', to: 'resolve' },
      ],
      groups: [
        { id: 'detection', label: 'Detection', nodes: ['detect', 'triage'] },
        { id: 'response', label: 'Response', nodes: ['investigate', 'resolve'] },
      ],
    }, { theme })

    const detectionStart = Math.min(...layout.nodes
      .filter((node) => ['detect', 'triage'].includes(node.id))
      .map((node) => node.x - node.width / 2))
    const responseStart = Math.min(...layout.nodes
      .filter((node) => ['investigate', 'resolve'].includes(node.id))
      .map((node) => node.x - node.width / 2))
    expect(responseStart).toBeCloseTo(detectionStart)
  })
})
