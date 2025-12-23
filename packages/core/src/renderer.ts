// SVG renderer for Trace diagrams

import type { LayoutResult, PositionedNode, PositionedEdge, Point, ResolvedTheme } from './types'
import { escapeXml, escapeXmlAttr, sanitizeId } from './escape'

/**
 * Render options
 */
export interface RenderOptions {
  /** Resolved theme for styling */
  theme?: ResolvedTheme
}

/**
 * Default style values (used when no theme provided)
 */
const DEFAULTS = {
  colors: {
    background: '#F8F8F8',
    nodeBackground: '#FFFFFF',
    nodeBorder: '#E0E0E0',
    text: '#1A1A1A',
    textMuted: '#6B6B6B',
    connectorStroke: '#E0E0E0',
    accent: '#3a7d69',
    accentMuted: '#d4e8e2',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSizeLabel: 14,
    fontSizeDescription: 12,
    fontWeightLabel: 600,
    fontWeightDescription: 500,
  },
  shapes: {
    nodeCornerRadius: 12,
    nodeShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  connectors: {
    strokeWidth: 2,
  },
  background: {
    showGrid: true,
    gridStyle: 'dots' as const,
    gridSpacing: 20,
    gridColor: '#E0E0E0',
  },
  layout: {
    canvasPadding: 40,
  },
}

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
 * Simple hash function for consistent color assignment
 * Returns a positive integer hash for any string
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get shape path for a node based on its type
 */
function getNodeShape(node: PositionedNode, cornerRadius: number = 12): string {
  const { x, y, width, height, type = 'process' } = node
  const left = x - width / 2
  const top = y - height / 2
  const right = x + width / 2
  const bottom = y + height / 2
  const r = cornerRadius

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
export function render(layout: LayoutResult, options: RenderOptions = {}): string {
  const { nodes, edges, width, height } = layout
  const { theme } = options

  // Extract theme values or use defaults
  const colors = {
    background: theme?.colors.background ?? DEFAULTS.colors.background,
    nodeBackground: theme?.colors.nodeBackground ?? DEFAULTS.colors.nodeBackground,
    nodeBorder: theme?.colors.nodeBorder ?? DEFAULTS.colors.nodeBorder,
    text: theme?.colors.text ?? DEFAULTS.colors.text,
    textMuted: theme?.colors.textMuted ?? DEFAULTS.colors.textMuted,
    connectorStroke: theme?.colors.connectorStroke ?? DEFAULTS.colors.connectorStroke,
    accent: theme?.colors.accent ?? DEFAULTS.colors.accent,
    accentMuted: theme?.colors.accentMuted ?? DEFAULTS.colors.accentMuted,
  }

  const typography = {
    fontFamily: theme?.typography.fontFamily ?? DEFAULTS.typography.fontFamily,
    fontSizeLabel: theme?.typography.fontSizeLabel ?? DEFAULTS.typography.fontSizeLabel,
    fontSizeDescription: theme?.typography.fontSizeDescription ?? DEFAULTS.typography.fontSizeDescription,
    fontWeightLabel: theme?.typography.fontWeightLabel ?? DEFAULTS.typography.fontWeightLabel,
    fontWeightDescription: theme?.typography.fontWeightDescription ?? DEFAULTS.typography.fontWeightDescription,
  }

  const shapes = {
    nodeCornerRadius: theme?.shapes.nodeCornerRadius ?? DEFAULTS.shapes.nodeCornerRadius,
    nodeShadow: theme?.shapes.nodeShadow ?? DEFAULTS.shapes.nodeShadow,
    nodeBorderWidth: theme?.shapes.nodeBorderWidth ?? 1,
    nodeColors: theme?.shapes.nodeColors,
  }

  const connectors = {
    strokeWidth: theme?.connectors.strokeWidth ?? DEFAULTS.connectors.strokeWidth,
  }

  const background = {
    showGrid: theme?.background.showGrid ?? DEFAULTS.background.showGrid,
    gridStyle: theme?.background.gridStyle ?? DEFAULTS.background.gridStyle,
    gridSpacing: theme?.background.gridSpacing ?? DEFAULTS.background.gridSpacing,
    gridColor: theme?.background.gridColor ?? DEFAULTS.background.gridColor,
  }

  const padding = theme?.layout.canvasPadding ?? DEFAULTS.layout.canvasPadding
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
        <!-- Invisible hit area for easier hover -->
        <path
          d="${path}"
          fill="none"
          stroke="transparent"
          stroke-width="16"
          class="trace-edge-hit"
        />
        <path
          id="${edgeId}"
          d="${path}"
          fill="none"
          stroke="${colors.connectorStroke}"
          stroke-width="${connectors.strokeWidth}"
          stroke-dasharray="${strokeDasharray}"
          marker-end="url(#arrowhead)"
        />
        ${edge.label ? `
        <rect
          x="${midpoint.x - 16}"
          y="${midpoint.y - 10}"
          width="32"
          height="20"
          fill="${colors.background}"
          rx="4"
        />
        <text
          class="trace-edge-label"
          x="${midpoint.x}"
          y="${midpoint.y}"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="${colors.textMuted}"
          font-family="${escapeXmlAttr(typography.fontFamily)}"
          font-size="${typography.fontSizeDescription}"
          font-weight="${typography.fontWeightDescription}"
        >${escapeXml(edge.label)}</text>` : ''}
      </g>`
    })
    .join('\n')

  // Render nodes
  const nodeElements = nodes
    .map((node) => {
      const shapePath = getNodeShape(node, shapes.nodeCornerRadius)
      const isHighEmphasis = node.emphasis === 'high'
      const isEnd = node.type === 'end'
      const hasNodeColors = shapes.nodeColors && shapes.nodeColors.length > 0

      // Determine fill color:
      // - End nodes always use accent color
      // - If theme has nodeColors array, cycle through them based on node ID hash
      // - Otherwise use nodeBackground
      let fill: string
      if (isEnd) {
        fill = colors.accent
      } else if (hasNodeColors) {
        const colorIndex = hashCode(node.id) % shapes.nodeColors!.length
        fill = shapes.nodeColors![colorIndex]
      } else {
        fill = colors.nodeBackground
      }

      // Use accent for emphasis, normal border for others
      const stroke = isHighEmphasis ? colors.accentMuted : colors.nodeBorder

      // Determine text color:
      // - End nodes: inverted (white on accent)
      // - Nodes with custom colors (sticky notes): always dark for readability
      // - Otherwise: theme text color
      let textColor: string
      if (isEnd) {
        textColor = colors.nodeBackground
      } else if (hasNodeColors) {
        textColor = '#1F2937' // Dark gray for sticky notes
      } else {
        textColor = colors.text
      }

      // Sanitize ID and escape label for safe SVG output
      const nodeId = sanitizeId(node.id)
      const nodeType = escapeXmlAttr(node.type ?? 'process')
      const nodeLabel = escapeXml(node.label)

      // Only apply shadow filter if theme has shadows
      const filterAttr = shapes.nodeShadow !== 'none' ? 'filter="url(#shadow)"' : ''

      return `
      <g class="trace-node" data-id="${escapeXmlAttr(node.id)}" data-type="${nodeType}">
        <path
          id="node-${nodeId}"
          d="${shapePath}"
          fill="${fill}"
          stroke="${stroke}"
          stroke-width="${shapes.nodeBorderWidth}"
          ${filterAttr}
        />
        <text
          x="${node.x}"
          y="${node.y}"
          dy="0.35em"
          text-anchor="middle"
          fill="${textColor}"
          font-family="${escapeXmlAttr(typography.fontFamily)}"
          font-size="${typography.fontSizeLabel}"
          font-weight="${typography.fontWeightLabel}"
        >${nodeLabel}</text>
      </g>`
    })
    .join('\n')

  // Generate grid pattern based on style
  const gridPattern = background.showGrid
    ? background.gridStyle === 'lines'
      ? `<pattern id="gridPattern" width="${background.gridSpacing}" height="${background.gridSpacing}" patternUnits="userSpaceOnUse">
          <path d="M ${background.gridSpacing} 0 L 0 0 0 ${background.gridSpacing}" fill="none" stroke="${background.gridColor}" stroke-width="0.5"/>
        </pattern>`
      : background.gridStyle === 'blueprint'
        ? `<pattern id="gridPattern" width="${background.gridSpacing}" height="${background.gridSpacing}" patternUnits="userSpaceOnUse">
          <path d="M ${background.gridSpacing} 0 L 0 0 0 ${background.gridSpacing}" fill="none" stroke="${background.gridColor}" stroke-width="1"/>
        </pattern>`
        : `<pattern id="gridPattern" width="${background.gridSpacing}" height="${background.gridSpacing}" patternUnits="userSpaceOnUse">
          <circle cx="${background.gridSpacing / 2}" cy="${background.gridSpacing / 2}" r="1" fill="${background.gridColor}"/>
        </pattern>`
    : ''

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${viewBox}"
    width="${width + padding * 2}"
    height="${height + padding * 2}"
    class="trace-diagram"
  >
    <defs>
      <!-- CSS Variables for hover effects -->
      <style>
        .trace-diagram {
          --trace-accent: ${colors.accent};
          --trace-accent-muted: ${colors.accentMuted};
          --trace-connector: ${colors.connectorStroke};
          --trace-node-border: ${colors.nodeBorder};
        }
        .trace-node path {
          transition: stroke 0.15s ease, stroke-width 0.15s ease;
        }
        .trace-node:hover path {
          stroke: var(--trace-accent);
          stroke-width: 2;
        }
        .trace-edge path:not(.trace-edge-hit) {
          transition: stroke 0.15s ease;
        }
        .trace-edge:hover path:not(.trace-edge-hit) {
          stroke: var(--trace-accent);
        }
      </style>

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
          stroke="context-stroke"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </marker>

      ${gridPattern}
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="${colors.background}"/>

    ${background.showGrid ? `<!-- Grid pattern -->
    <rect width="100%" height="100%" fill="url(#gridPattern)"/>` : ''}

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
