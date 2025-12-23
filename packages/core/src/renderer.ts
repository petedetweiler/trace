// SVG renderer for Trace diagrams

import type { LayoutResult, PositionedNode, PositionedEdge, Point } from './types'
import { escapeXml, escapeXmlAttr, sanitizeId } from './escape'

/**
 * Generate a path with rounded corners at bend points
 * Uses straight lines with quadratic bezier curves at corners
 */
function generateCurvePath(points: Point[]): string {
  if (points.length < 2) return ''

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  const radius = 16 // Corner rounding radius

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    // Calculate vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y }
    const v2 = { x: next.x - curr.x, y: next.y - curr.y }

    // Normalize and get distances
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

    if (len1 === 0 || len2 === 0) {
      path += ` L ${curr.x} ${curr.y}`
      continue
    }

    // Clamp radius to half the shortest segment
    const maxRadius = Math.min(len1, len2) / 2
    const r = Math.min(radius, maxRadius)

    // Points where curve starts and ends
    const startX = curr.x - (v1.x / len1) * r
    const startY = curr.y - (v1.y / len1) * r
    const endX = curr.x + (v2.x / len2) * r
    const endY = curr.y + (v2.y / len2) * r

    // Line to curve start, then quadratic bezier through corner
    path += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`
  }

  // Final line to last point
  const last = points[points.length - 1]
  path += ` L ${last.x} ${last.y}`

  return path
}

/**
 * Calculate the midpoint along a path for label positioning
 */
function getPathMidpoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]
  if (points.length === 2) {
    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
    }
  }

  // For multiple points, find the middle segment
  const midIndex = Math.floor(points.length / 2)
  const p1 = points[midIndex - 1]
  const p2 = points[midIndex]

  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

/**
 * Get shape path for a node based on its type
 */
function getNodeShape(node: PositionedNode): string {
  const { x, y, width, height, type = 'process' } = node
  const left = x - width / 2
  const top = y - height / 2
  const right = x + width / 2
  const bottom = y + height / 2
  const r = 12 // corner radius

  switch (type) {
    case 'start':
    case 'end':
      // Pill shape
      const pillR = height / 2
      return `M ${left + pillR} ${top}
              L ${right - pillR} ${top}
              A ${pillR} ${pillR} 0 0 1 ${right - pillR} ${bottom}
              L ${left + pillR} ${bottom}
              A ${pillR} ${pillR} 0 0 1 ${left + pillR} ${top} Z`

    case 'decision':
      // Diamond
      return `M ${x} ${top}
              L ${right} ${y}
              L ${x} ${bottom}
              L ${left} ${y} Z`

    case 'database':
      // Cylinder (simplified as rounded rect for now)
      return `M ${left + r} ${top}
              L ${right - r} ${top}
              Q ${right} ${top} ${right} ${top + r}
              L ${right} ${bottom - r}
              Q ${right} ${bottom} ${right - r} ${bottom}
              L ${left + r} ${bottom}
              Q ${left} ${bottom} ${left} ${bottom - r}
              L ${left} ${top + r}
              Q ${left} ${top} ${left + r} ${top} Z`

    case 'process':
    default:
      // Rounded rectangle
      return `M ${left + r} ${top}
              L ${right - r} ${top}
              Q ${right} ${top} ${right} ${top + r}
              L ${right} ${bottom - r}
              Q ${right} ${bottom} ${right - r} ${bottom}
              L ${left + r} ${bottom}
              Q ${left} ${bottom} ${left} ${bottom - r}
              L ${left} ${top + r}
              Q ${left} ${top} ${left + r} ${top} Z`
  }
}

/**
 * Render a TraceDocument layout to SVG string
 */
export function render(layout: LayoutResult): string {
  const { nodes, edges, width, height } = layout

  const padding = 40
  const viewBox = `0 0 ${width + padding * 2} ${height + padding * 2}`

  // Render edges
  const edgeElements = edges
    .map((edge) => {
      const path = generateCurvePath(edge.points)
      const strokeDasharray = edge.style === 'dashed' ? '8 4' : edge.style === 'dotted' ? '2 4' : ''

      // Sanitize IDs for safe attribute use
      const fromId = sanitizeId(edge.from)
      const toId = sanitizeId(edge.to)
      const edgeId = `edge-${fromId}-${toId}`

      // Calculate label position at edge midpoint (always horizontal)
      const midpoint = getPathMidpoint(edge.points)

      return `
      <g class="trace-edge" data-from="${escapeXmlAttr(edge.from)}" data-to="${escapeXmlAttr(edge.to)}">
        <path
          id="${edgeId}"
          d="${path}"
          fill="none"
          stroke="#E0E0E0"
          stroke-width="2"
          stroke-dasharray="${strokeDasharray}"
          marker-end="url(#arrowhead)"
        />
        ${edge.label ? `
        <rect
          x="${midpoint.x - 16}"
          y="${midpoint.y - 10}"
          width="32"
          height="20"
          fill="#F8F8F8"
          rx="4"
        />
        <text
          class="trace-edge-label"
          x="${midpoint.x}"
          y="${midpoint.y}"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#666666"
          font-family="Inter, system-ui, sans-serif"
          font-size="12"
          font-weight="500"
        >${escapeXml(edge.label)}</text>` : ''}
      </g>`
    })
    .join('\n')

  // Render nodes
  const nodeElements = nodes
    .map((node) => {
      const shapePath = getNodeShape(node)
      const isHighEmphasis = node.emphasis === 'high'
      const isEnd = node.type === 'end'

      const fill = isEnd ? '#3a7d69' : '#FFFFFF'
      const stroke = isHighEmphasis ? '#3a7d69' : '#E0E0E0'
      const textColor = isEnd ? '#FFFFFF' : '#1A1A1A'

      // Sanitize ID and escape label for safe SVG output
      const nodeId = sanitizeId(node.id)
      const nodeType = escapeXmlAttr(node.type ?? 'process')
      const nodeLabel = escapeXml(node.label)

      return `
      <g class="trace-node" data-id="${escapeXmlAttr(node.id)}" data-type="${nodeType}">
        <path
          id="node-${nodeId}"
          d="${shapePath}"
          fill="${fill}"
          stroke="${stroke}"
          stroke-width="1"
          filter="url(#shadow)"
        />
        <text
          x="${node.x}"
          y="${node.y}"
          dy="0.35em"
          text-anchor="middle"
          fill="${textColor}"
          font-family="Inter, system-ui, sans-serif"
          font-size="14"
          font-weight="600"
        >${nodeLabel}</text>
      </g>`
    })
    .join('\n')

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${viewBox}"
    width="${width + padding * 2}"
    height="${height + padding * 2}"
    class="trace-diagram"
  >
    <defs>
      <!-- Shadow filter -->
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.08"/>
      </filter>

      <!-- Chevron arrowhead marker -->
      <marker
        id="arrowhead"
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
      >
        <polyline
          points="0 0, 4 3, 0 6"
          fill="none"
          stroke="#D0D0D0"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </marker>
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="#F8F8F8"/>

    <!-- Dot grid -->
    <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1" fill="#E0E0E0"/>
    </pattern>
    <rect width="100%" height="100%" fill="url(#dotGrid)"/>

    <!-- Content group with padding offset -->
    <g transform="translate(${padding}, ${padding})">
      <!-- Edges -->
      <g class="trace-edges">
        ${edgeElements}
      </g>

      <!-- Nodes -->
      <g class="trace-nodes">
        ${nodeElements}
      </g>
    </g>
  </svg>`
}
