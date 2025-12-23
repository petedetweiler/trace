// SVG renderer for Trace diagrams

import type { LayoutResult, PositionedNode, PositionedEdge, Point } from './types'
import { escapeXml, escapeXmlAttr, sanitizeId } from './escape'

/**
 * Generate a smooth bezier curve path from points
 */
function generateCurvePath(points: Point[]): string {
  if (points.length < 2) return ''

  const [start, ...rest] = points

  if (rest.length === 1) {
    // Simple line
    return `M ${start.x} ${start.y} L ${rest[0].x} ${rest[0].y}`
  }

  // Create smooth bezier curve
  let path = `M ${start.x} ${start.y}`

  for (let i = 0; i < rest.length; i++) {
    const curr = rest[i]
    const prev = i === 0 ? start : rest[i - 1]

    // Use quadratic bezier for smoother curves
    const midX = (prev.x + curr.x) / 2
    const midY = (prev.y + curr.y) / 2

    if (i === 0) {
      path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`
    } else if (i === rest.length - 1) {
      path += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`
    } else {
      path += ` T ${midX} ${midY}`
    }
  }

  return path
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
        ${edge.label ? `<text class="trace-edge-label" dy="-8"><textPath href="#${edgeId}" startOffset="50%" text-anchor="middle">${escapeXml(edge.label)}</textPath></text>` : ''}
      </g>`
    })
    .join('\n')

  // Render nodes
  const nodeElements = nodes
    .map((node) => {
      const shapePath = getNodeShape(node)
      const isHighEmphasis = node.emphasis === 'high'
      const isEnd = node.type === 'end'

      const fill = isEnd ? '#FF6B35' : '#FFFFFF'
      const stroke = isHighEmphasis ? '#FF6B35' : '#E0E0E0'
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
          stroke-width="2"
          filter="url(#shadow)"
        />
        <text
          x="${node.x}"
          y="${node.y}"
          text-anchor="middle"
          dominant-baseline="middle"
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

      <!-- Arrowhead marker -->
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#E0E0E0"/>
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
