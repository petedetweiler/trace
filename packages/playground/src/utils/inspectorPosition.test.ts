import { describe, expect, it } from 'vitest'

import { calculateInspectorPosition } from './inspectorPosition'

const baseAnchor = {
  top: 200,
  bottom: 280,
  centerY: 240,
  containerWidth: 900,
  containerHeight: 700,
}

describe('contextual inspector positioning', () => {
  it('places the panel to the right of a left-side selection', () => {
    const position = calculateInspectorPosition({
      ...baseAnchor,
      left: 100,
      right: 260,
      centerX: 180,
    }, 420)

    expect(position.left).toBe(278)
    expect(position.width).toBe(344)
  })

  it('places the panel to the left of a right-side selection', () => {
    const position = calculateInspectorPosition({
      ...baseAnchor,
      left: 650,
      right: 810,
      centerX: 730,
    }, 420)

    expect(position.left + position.width).toBe(632)
  })

  it('shrinks within available space rather than overlapping a centered selection', () => {
    const anchor = {
      ...baseAnchor,
      left: 360,
      right: 560,
      centerX: 460,
    }
    const position = calculateInspectorPosition(anchor, 420)

    expect(position.left + position.width).toBe(anchor.left - 18)
    expect(position.width).toBeGreaterThanOrEqual(280)
  })

  it('clamps vertical placement within the preview', () => {
    const position = calculateInspectorPosition({
      ...baseAnchor,
      left: 650,
      right: 810,
      centerX: 730,
      centerY: 680,
    }, 420)

    expect(position.top).toBe(264)
  })
})
