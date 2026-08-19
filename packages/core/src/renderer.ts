// SVG renderer for Trace diagrams

import type { LayoutResult, PositionedNode, Point, ResolvedTheme } from './types'
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
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
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
    nodeChamfer: 0,
    nodePadding: 16,
    nodeIconSize: 20,
    nodeIconPosition: 'top' as const,
    nodeIconColor: 'accent' as const,
    decisionColor: 'text' as const,
    terminalNodeStyle: 'pill' as const,
    fillTerminalNodes: true,
    nodeShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  connectors: {
    strokeWidth: 2,
    curveStyle: 'bezier' as const,
    arrowSize: 10,
  },
  background: {
    showGrid: true,
    gridStyle: 'dots' as const,
    gridSpacing: 20,
    gridColor: '#E0E0E0',
    decoration: 'none' as const,
  },
  layout: {
    canvasPadding: 40,
    groupHeaderSize: 76,
  },
}

/**
 * Generate a path with rounded corners at bend points
 * Uses straight lines with quadratic bezier curves at corners
 */
function generateCurvePath(points: Point[], radius: number = 16): string {
  if (points.length < 2) return ''

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

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

function generateOrthogonalPath(points: Point[]): string {
  if (points.length < 2) return ''
  return points
    .slice(1)
    .reduce((path, point) => `${path} L ${point.x} ${point.y}`, `M ${points[0].x} ${points[0].y}`)
}

function generateOrganicPath(points: Point[]): string {
  if (points.length < 2) return ''
  if (points.length > 2) return generateCurvePath(points, 28)

  const [start, end] = points
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    const midX = start.x + deltaX / 2
    return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`
  }
  const midY = start.y + deltaY / 2
  return `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`
}

function generateEdgePath(
  points: Point[],
  curveStyle: 'bezier' | 'orthogonal' | 'organic'
): string {
  if (curveStyle === 'orthogonal') return generateOrthogonalPath(points)
  if (curveStyle === 'organic') return generateOrganicPath(points)
  return generateCurvePath(points)
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

function findLabelPosition(midpoint: Point, occupied: Point[]): Point {
  const candidate = { ...midpoint }
  let attempt = 0
  while (
    occupied.some(
      (point) => Math.abs(point.x - candidate.x) < 72 && Math.abs(point.y - candidate.y) < 24
    )
  ) {
    attempt += 1
    const direction = attempt % 2 === 0 ? -1 : 1
    candidate.y = midpoint.y + Math.ceil(attempt / 2) * 24 * direction
  }
  occupied.push(candidate)
  return candidate
}

function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim()
  const shortHex = /^#([0-9a-f]{3})$/i.exec(normalized)
  const longHex = /^#([0-9a-f]{6})$/i.exec(normalized)
  const hex = shortHex
    ? shortHex[1].split('').map((character) => character + character).join('')
    : longHex?.[1]
  if (!hex) return normalized
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

interface ParsedShadow {
  dx: number
  dy: number
  blur: number
  color: string
}

function parseNodeShadow(value: string): ParsedShadow | null {
  if (value.trim() === 'none') return null
  const match = /^\s*(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(#[0-9a-f]{3,8}|rgba?\([^)]+\))\s*$/i.exec(value)
  if (!match) return null
  return {
    dx: Number(match[1]),
    dy: Number(match[2]),
    blur: Number(match[3]),
    color: match[4],
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
function getNodeShape(
  node: PositionedNode,
  cornerRadius: number = 12,
  chamfer: number = 0,
  terminalNodeStyle: 'pill' | 'card' = 'pill'
): string {
  const { x, y, width, height, type = 'process' } = node
  const shapeType = terminalNodeStyle === 'card' && (type === 'start' || type === 'end')
    ? 'process'
    : type
  const left = x - width / 2
  const top = y - height / 2
  const right = x + width / 2
  const bottom = y + height / 2
  const r = cornerRadius

  if (chamfer > 0 && ['start', 'end', 'process', 'external'].includes(shapeType)) {
    const cut = Math.min(chamfer, width / 4, height / 3)
    return `M ${left + cut} ${top}
            L ${right - cut} ${top}
            L ${right} ${top + cut}
            L ${right} ${bottom - cut}
            L ${right - cut} ${bottom}
            L ${left + cut} ${bottom}
            L ${left} ${bottom - cut}
            L ${left} ${top + cut} Z`
  }

  switch (shapeType) {
    case 'start':
    case 'end': {
      // Pill shape
      const pillR = height / 2
      return `M ${left + pillR} ${top}
              L ${right - pillR} ${top}
              A ${pillR} ${pillR} 0 0 1 ${right - pillR} ${bottom}
              L ${left + pillR} ${bottom}
              A ${pillR} ${pillR} 0 0 1 ${left + pillR} ${top} Z`
    }

    case 'decision':
      // Diamond
      return `M ${x} ${top}
              L ${right} ${y}
              L ${x} ${bottom}
              L ${left} ${y} Z`

    case 'database': {
      // Cylinder silhouette
      const capHeight = Math.min(12, height / 4)
      return `M ${left} ${top + capHeight}
              C ${left} ${top}, ${right} ${top}, ${right} ${top + capHeight}
              L ${right} ${bottom - capHeight}
              C ${right} ${bottom}, ${left} ${bottom}, ${left} ${bottom - capHeight} Z`
    }

    case 'external':
      // External systems use the standard card silhouette with a dashed border.
      return `M ${left + r} ${top}
              L ${right - r} ${top}
              Q ${right} ${top} ${right} ${top + r}
              L ${right} ${bottom - r}
              Q ${right} ${bottom} ${right - r} ${bottom}
              L ${left + r} ${bottom}
              Q ${left} ${bottom} ${left} ${bottom - r}
              L ${left} ${top + r}
              Q ${left} ${top} ${left + r} ${top} Z`

    case 'manual': {
      // Trapezoid for a human/manual step
      const inset = Math.min(18, width / 6)
      return `M ${left + inset} ${top} L ${right} ${top} L ${right - inset} ${bottom} L ${left} ${bottom} Z`
    }

    case 'delay': {
      // D-shaped delay/wait symbol
      const delayRadius = height / 2
      return `M ${left} ${top} L ${right - delayRadius} ${top}
              A ${delayRadius} ${delayRadius} 0 0 1 ${right - delayRadius} ${bottom}
              L ${left} ${bottom} Z`
    }

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

const BUILTIN_ICONS: Record<string, string> = {
  bell: '<path d="M3 11.5h10l-1.2-1.7V7a3.8 3.8 0 0 0-7.6 0v2.8L3 11.5Z"/><path d="M6.5 13.2a1.8 1.8 0 0 0 3 0"/>',
  box: '<path d="m8 1.8 5.5 3v6.4L8 14.2l-5.5-3V4.8L8 1.8Z"/><path d="m2.7 4.9 5.3 3 5.3-3M8 7.9v6"/>',
  check: '<path d="M3 8.5 6.5 12 13 4"/>',
  checklist: '<rect x="2.5" y="1.8" width="11" height="12.4" rx="1.5"/><path d="m5 6 1.2 1.2L8.4 5M5 10l1.2 1.2L8.4 9M10 6h1M10 10h1"/>',
  clock: '<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8L10.5 9.5"/>',
  cloud: '<path d="M4.5 12.5h7a3 3 0 0 0 .3-6A4 4 0 0 0 4.2 5.5a3.5 3.5 0 0 0 .3 7Z"/>',
  code: '<path d="m5.5 4-4 4 4 4M10.5 4l4 4-4 4M9 2 7 14"/>',
  'credit-card': '<rect x="1.5" y="3" width="13" height="10" rx="1.7"/><path d="M1.5 6.2h13M4 10h2"/>',
  'file-text': '<path d="M4 1.5h5l3 3V14H4V1.5Z"/><path d="M9 1.5V5h3M6 8h4M6 10.5h4"/>',
  'git-branch': '<circle cx="4" cy="3" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="4" cy="13" r="1.5"/><path d="M4 4.5v7M5.5 6.5H8A4 4 0 0 0 12 5"/>',
  globe: '<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2C6 4 6 12 8 14"/>',
  'help-circle': '<circle cx="8" cy="8" r="6"/><path d="M6.3 6.1A1.9 1.9 0 1 1 9 7.8c-.8.4-1 1-1 1.7M8 12h.01"/>',
  inbox: '<path d="M2 3h12v9H2V3Z"/><path d="M2 8h3l1.4 2h3.2L11 8h3"/>',
  lock: '<rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/>',
  mail: '<rect x="2" y="3.5" width="12" height="9" rx="2"/><path d="m3 5 5 4 5-4"/>',
  package: '<path d="m8 1.8 5.5 3v6.4L8 14.2l-5.5-3V4.8L8 1.8Z"/><path d="m2.7 4.9 5.3 3 5.3-3M8 7.9v6M5.3 3.3l5.4 3"/>',
  'package-search': '<path d="m7 1.8 5 2.7v4.1M7 7.4 2 4.6v5.7l3.2 1.8M2.2 4.7 7 2l4.8 2.7M7 7.4v2"/><circle cx="10.8" cy="11" r="2.3"/><path d="m12.5 12.7 1.7 1.7"/>',
  search: '<circle cx="7" cy="7" r="4.7"/><path d="m10.6 10.6 3.2 3.2"/>',
  server: '<rect x="2" y="2" width="12" height="5" rx="1.2"/><rect x="2" y="9" width="12" height="5" rx="1.2"/><path d="M4.5 4.5h.01M4.5 11.5h.01M7 4.5h5M7 11.5h5"/>',
  settings: '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1"/>',
  'shopping-cart': '<path d="M1.5 2.5h2l1.3 7.1h7.5l1.4-5H4"/><circle cx="6" cy="12.7" r="1"/><circle cx="11.5" cy="12.7" r="1"/>',
  truck: '<path d="M1.5 3h8v8h-8V3ZM9.5 6h2.3l2.7 2.7V11h-5V6Z"/><circle cx="4.2" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/>',
  user: '<circle cx="8" cy="5" r="3"/><path d="M2.5 14a5.5 5.5 0 0 1 11 0"/>',
  warning: '<path d="M8 2 15 14H1L8 2Z"/><path d="M8 6v4M8 12v.2"/>',
  wrench: '<path d="M9.7 2.2a3.5 3.5 0 0 0-4.2 4.5L2 10.2a2.1 2.1 0 1 0 3 3l3.5-3.5a3.5 3.5 0 0 0 4.5-4.2l-2 2-2.5-2.5 2-2Z"/>',
  x: '<circle cx="8" cy="8" r="6"/><path d="m5.5 5.5 5 5M10.5 5.5l-5 5"/>',
}

function renderIcon(
  icon: string | undefined,
  centerX: number,
  centerY: number,
  size: number,
  color: string,
  className: string = 'trace-node-icon'
): string {
  if (!icon) return ''
  const iconName = icon.trim().toLowerCase()
  const builtIn = BUILTIN_ICONS[iconName]
  if (builtIn) {
    const scale = size / 16
    return `<g
      class="${className}"
      transform="translate(${centerX - size / 2} ${centerY - size / 2}) scale(${scale})"
      fill="none"
      stroke="${escapeXmlAttr(color)}"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >${builtIn}</g>`
  }

  const glyph = Array.from(icon.trim()).slice(0, 2).join('')
  return `<text
    class="${className} ${className}-glyph"
    x="${centerX}"
    y="${centerY}"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="${escapeXmlAttr(color)}"
    font-family="system-ui, sans-serif"
    font-size="${size * 0.82}"
    aria-hidden="true"
  >${escapeXml(glyph)}</text>`
}

function safeGroupColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const color = value.trim()
  if (
    /^#[0-9a-f]{3,8}$/i.test(color) ||
    /^rgba?\([\d\s.,%]+\)$/i.test(color) ||
    /^hsla?\([\d\s.,%a-z-]+\)$/i.test(color) ||
    /^[a-z]{3,20}$/i.test(color)
  ) return color
  return fallback
}

function compactText(value: string | undefined, limit: number): string {
  if (!value) return ''
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > limit ? `${normalized.slice(0, limit - 1).trimEnd()}…` : normalized
}

/**
 * Render a TraceDocument layout to SVG string
 */
export function render(layout: LayoutResult, options: RenderOptions = {}): string {
  const { nodes, edges, groups = [], width, height, title, description, direction } = layout
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
    success: theme?.colors.success ?? DEFAULTS.colors.success,
    warning: theme?.colors.warning ?? DEFAULTS.colors.warning,
    error: theme?.colors.error ?? DEFAULTS.colors.error,
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
    nodeChamfer: theme?.shapes.nodeChamfer ?? DEFAULTS.shapes.nodeChamfer,
    nodePadding: theme?.shapes.nodePadding ?? DEFAULTS.shapes.nodePadding,
    nodeIconSize: theme?.shapes.nodeIconSize ?? DEFAULTS.shapes.nodeIconSize,
    nodeIconPosition: theme?.shapes.nodeIconPosition ?? DEFAULTS.shapes.nodeIconPosition,
    nodeIconColor: theme?.shapes.nodeIconColor ?? DEFAULTS.shapes.nodeIconColor,
    decisionColor: theme?.shapes.decisionColor ?? DEFAULTS.shapes.decisionColor,
    terminalNodeStyle: theme?.shapes.terminalNodeStyle ?? DEFAULTS.shapes.terminalNodeStyle,
    fillTerminalNodes: theme?.shapes.fillTerminalNodes ?? DEFAULTS.shapes.fillTerminalNodes,
    nodeShadow: theme?.shapes.nodeShadow ?? DEFAULTS.shapes.nodeShadow,
    nodeBorderWidth: theme?.shapes.nodeBorderWidth ?? 1,
    nodeColors: theme?.shapes.nodeColors,
  }

  const connectors = {
    strokeWidth: theme?.connectors.strokeWidth ?? DEFAULTS.connectors.strokeWidth,
    curveStyle: theme?.connectors.curveStyle ?? DEFAULTS.connectors.curveStyle,
    arrowSize: theme?.connectors.arrowSize ?? DEFAULTS.connectors.arrowSize,
  }

  const background = {
    showGrid: theme?.background.showGrid ?? DEFAULTS.background.showGrid,
    gridStyle: theme?.background.gridStyle ?? DEFAULTS.background.gridStyle,
    gridSpacing: theme?.background.gridSpacing ?? DEFAULTS.background.gridSpacing,
    gridColor: theme?.background.gridColor ?? DEFAULTS.background.gridColor,
    decoration: theme?.background.decoration ?? DEFAULTS.background.decoration,
  }

  const padding = theme?.layout.canvasPadding ?? DEFAULTS.layout.canvasPadding
  const groupHeaderSize = theme?.layout.groupHeaderSize ?? DEFAULTS.layout.groupHeaderSize
  const viewBox = `0 0 ${width + padding * 2} ${height + padding * 2}`
  const parsedShadow = parseNodeShadow(shapes.nodeShadow)
  const occupiedLabelPositions: Point[] = []

  const groupElements = groups
    .map((group) => {
      const color = safeGroupColor(group.color, colors.nodeBorder)
      const left = group.x - group.width / 2
      const top = group.y - group.height / 2
      const isHorizontalFlow = direction === 'LR' || direction === 'RL'
      const railSize = Math.min(
        groupHeaderSize,
        Math.max(36, (isHorizontalFlow ? group.width : group.height) * 0.32)
      )
      const groupDescription = compactText(group.description, 58)
      const groupLabelSize = Math.max(typography.fontSizeLabel + 4, 18)
      const rail = isHorizontalFlow
        ? `<rect
            class="trace-group-rail"
            x="${left}"
            y="${top}"
            width="${railSize}"
            height="${group.height}"
            rx="${Math.max(0, shapes.nodeCornerRadius)}"
            fill="${escapeXmlAttr(colors.nodeBackground)}"
            fill-opacity="${theme?.mode === 'dark' ? 0.42 : 0.68}"
          />
          <line x1="${left + railSize}" y1="${top}" x2="${left + railSize}" y2="${top + group.height}" stroke="${escapeXmlAttr(color)}" stroke-opacity="0.6"/>
          ${renderIcon(group.icon, left + railSize / 2, top + 22, 18, colors.accent, 'trace-group-icon')}
          <g transform="translate(${left + railSize / 2} ${group.y + (group.icon ? 8 : 0)}) rotate(-90)">
            <text
              text-anchor="middle"
              y="${groupDescription ? -8 : 2}"
              fill="${escapeXmlAttr(colors.text)}"
              font-family="${escapeXmlAttr(typography.fontFamily)}"
              font-size="${groupLabelSize}"
              font-weight="${Math.max(650, typography.fontWeightLabel)}"
            >${escapeXml(group.label)}</text>
            ${groupDescription ? `<text
              text-anchor="middle"
              y="12"
              fill="${escapeXmlAttr(colors.textMuted)}"
              font-family="${escapeXmlAttr(typography.fontFamily)}"
              font-size="${Math.max(10, typography.fontSizeDescription)}"
              font-weight="${typography.fontWeightDescription}"
            >${escapeXml(groupDescription)}</text>` : ''}
          </g>`
        : `<rect
            class="trace-group-rail"
            x="${left}"
            y="${top}"
            width="${group.width}"
            height="${railSize}"
            rx="${Math.max(0, shapes.nodeCornerRadius)}"
            fill="${escapeXmlAttr(colors.nodeBackground)}"
            fill-opacity="${theme?.mode === 'dark' ? 0.42 : 0.68}"
          />
          <line x1="${left}" y1="${top + railSize}" x2="${left + group.width}" y2="${top + railSize}" stroke="${escapeXmlAttr(color)}" stroke-opacity="0.6"/>
          ${renderIcon(group.icon, left + 22, top + railSize / 2, 18, colors.accent, 'trace-group-icon')}
          <text
            x="${left + (group.icon ? 42 : 16)}"
            y="${top + (groupDescription ? railSize / 2 - 7 : railSize / 2)}"
            dominant-baseline="middle"
            fill="${escapeXmlAttr(colors.text)}"
            font-family="${escapeXmlAttr(typography.fontFamily)}"
            font-size="${groupLabelSize}"
            font-weight="${Math.max(650, typography.fontWeightLabel)}"
          >${escapeXml(group.label)}</text>
          ${groupDescription ? `<text
            x="${left + (group.icon ? 42 : 16)}"
            y="${top + railSize / 2 + 13}"
            dominant-baseline="middle"
            fill="${escapeXmlAttr(colors.textMuted)}"
            font-family="${escapeXmlAttr(typography.fontFamily)}"
            font-size="${Math.max(10, typography.fontSizeDescription)}"
            font-weight="${typography.fontWeightDescription}"
          >${escapeXml(groupDescription)}</text>` : ''}`
      return `<g
        class="trace-group"
        data-id="${escapeXmlAttr(group.id)}"
        role="group"
        tabindex="0"
        aria-label="${escapeXmlAttr(group.label)} swimlane"
      >
        <rect
          class="trace-group-surface"
          x="${left}"
          y="${top}"
          width="${group.width}"
          height="${group.height}"
          rx="${Math.max(0, shapes.nodeCornerRadius)}"
          fill="${escapeXmlAttr(color)}"
          fill-opacity="${theme?.mode === 'dark' ? 0.055 : 0.032}"
          stroke="${escapeXmlAttr(color)}"
          stroke-opacity="0.52"
          stroke-width="1"
        />
        ${rail}
      </g>`
    })
    .join('\n')

  // Render edges
  const edgeElements = edges
    .map((edge, edgeIndex) => {
      const path = generateEdgePath(edge.points, connectors.curveStyle)
      const strokeDasharray = edge.style === 'dashed'
        ? '8 4'
        : edge.style === 'dotted'
          ? '2 4'
          : edge.animate
            ? '8 6'
            : ''
      const edgeStroke = edge.kind === 'success'
        ? colors.success
        : edge.kind === 'failure'
          ? colors.error
          : edge.kind === 'warning' || edge.kind === 'retry'
            ? colors.warning
            : colors.connectorStroke

      // Sanitize IDs for safe attribute use
      const fromId = sanitizeId(edge.from)
      const toId = sanitizeId(edge.to)
      const edgeId = sanitizeId(edge.id ?? `edge-${edgeIndex}-${fromId}-${toId}`)

      // Calculate label position at edge midpoint (always horizontal)
      const midpoint = edge.label
        ? findLabelPosition(getPathMidpoint(edge.points), occupiedLabelPositions)
        : getPathMidpoint(edge.points)
      const labelWidth = edge.label
        ? Math.max(32, Math.min(220, edge.label.length * typography.fontSizeDescription * 0.58 + 16))
        : 0
      const edgeAriaLabel = edge.description
        ? `${edge.label ?? `${edge.from} to ${edge.to}`}: ${edge.description}`
        : edge.label ?? `${edge.from} to ${edge.to}`

      return `
      <g
        class="trace-edge trace-edge-${escapeXmlAttr(edge.kind ?? 'primary')}"
        data-id="${escapeXmlAttr(edge.id ?? edgeId)}"
        data-index="${edgeIndex}"
        data-from="${escapeXmlAttr(edge.from)}"
        data-to="${escapeXmlAttr(edge.to)}"
        role="group"
        tabindex="0"
        aria-label="${escapeXmlAttr(edgeAriaLabel)}"
      >
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
          stroke="${edgeStroke}"
          stroke-width="${connectors.strokeWidth}"
          stroke-dasharray="${strokeDasharray}"
          marker-end="url(#arrowhead)"
          class="trace-edge-path${edge.animate ? ' trace-edge-animated' : ''}"
        />
        ${edge.label ? `
        <rect
          x="${midpoint.x - labelWidth / 2}"
          y="${midpoint.y - 10}"
          width="${labelWidth}"
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
      const shapePath = getNodeShape(
        node,
        shapes.nodeCornerRadius,
        shapes.nodeChamfer,
        shapes.terminalNodeStyle
      )
      const isHighEmphasis = node.emphasis === 'high'
      const isLowEmphasis = node.emphasis === 'low'
      const isEnd = node.type === 'end'
      const hasNodeColors = shapes.nodeColors && shapes.nodeColors.length > 0
      const statusColor = node.status === 'success'
        ? colors.success
        : node.status === 'warning'
          ? colors.warning
          : node.status === 'error'
            ? colors.error
            : null

      // Determine fill color:
      // - End nodes always use accent color
      // - If theme has nodeColors array, cycle through them based on node ID hash
      // - Otherwise use nodeBackground
      let fill: string
      if (statusColor) {
        fill = withAlpha(statusColor, theme?.mode === 'dark' ? 0.2 : 0.12)
      } else if (isEnd && shapes.fillTerminalNodes) {
        fill = colors.accent
      } else if (hasNodeColors) {
        const colorIndex = hashCode(node.id) % shapes.nodeColors!.length
        fill = shapes.nodeColors![colorIndex]
      } else {
        fill = colors.nodeBackground
      }

      const decisionColor = node.type === 'decision'
        ? shapes.decisionColor === 'warning'
          ? colors.warning
          : shapes.decisionColor === 'accent'
            ? colors.accent
            : colors.text
        : null
      // Use the theme's decision color and accent for emphasized nodes.
      const stroke = statusColor ?? decisionColor ?? (isHighEmphasis ? colors.accent : colors.nodeBorder)
      const strokeWidth = shapes.nodeBorderWidth + (isHighEmphasis ? 1 : 0)

      // Determine text color:
      // - End nodes: inverted (white on accent)
      // - Nodes with custom colors (sticky notes): always dark for readability
      // - Otherwise: theme text color
      let textColor: string
      if (statusColor) {
        textColor = colors.text
      } else if (isEnd && shapes.fillTerminalNodes) {
        textColor = colors.nodeBackground
      } else if (hasNodeColors) {
        textColor = '#1F2937' // Dark gray for sticky notes
      } else {
        textColor = colors.text
      }

      // Sanitize ID and escape label for safe SVG output
      const nodeId = sanitizeId(node.id)
      const nodeType = escapeXmlAttr(node.type ?? 'process')
      const labelLines = node.labelLines?.length ? node.labelLines : [node.label]
      const lineHeight = typography.fontSizeLabel * 1.35
      const iconGap = node.icon ? Math.max(8, shapes.nodeIconSize * 0.42) : 0
      const useInlineIcon = Boolean(node.icon)
        && node.type !== 'decision'
        && shapes.nodeIconPosition === 'left'
      const iconBlockHeight = node.icon && !useInlineIcon
        ? shapes.nodeIconSize + iconGap
        : 0
      const contentHeight = iconBlockHeight + labelLines.length * lineHeight
      const contentTop = node.y - contentHeight / 2
      const iconCenterX = useInlineIcon
        ? node.x - node.width / 2 + shapes.nodePadding + shapes.nodeIconSize / 2
        : node.x
      const iconCenterY = useInlineIcon
        ? node.y
        : contentTop + shapes.nodeIconSize / 2
      const labelX = useInlineIcon
        ? node.x + (shapes.nodeIconSize + iconGap) / 2
        : node.x
      const lineStartY = useInlineIcon
        ? node.y - ((labelLines.length - 1) * lineHeight) / 2
        : contentTop + iconBlockHeight + lineHeight / 2
      const nodeLabel = labelLines
        .map((line, lineIndex) => `<tspan x="${labelX}" y="${lineStartY + lineIndex * lineHeight}">${escapeXml(line)}</tspan>`)
        .join('')
      const nodeAriaLabel = node.description ? `${node.label}: ${node.description}` : node.label
      const iconColor = statusColor ?? decisionColor
        ?? (isEnd && shapes.fillTerminalNodes
          ? colors.nodeBackground
          : shapes.nodeIconColor === 'text'
            ? textColor
            : colors.accent)

      // Only apply shadow filter if theme has shadows
      const filterAttr = parsedShadow ? 'filter="url(#shadow)"' : ''
      const nodeStrokeDasharray = node.type === 'external' ? '6 4' : ''
      const databaseDetail = node.type === 'database'
        ? `<path d="M ${node.x - node.width / 2} ${node.y - node.height / 2 + Math.min(12, node.height / 4)} C ${node.x - node.width / 2} ${node.y - node.height / 2 + Math.min(24, node.height / 2)}, ${node.x + node.width / 2} ${node.y - node.height / 2 + Math.min(24, node.height / 2)}, ${node.x + node.width / 2} ${node.y - node.height / 2 + Math.min(12, node.height / 4)}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
        : ''

      return `
      <g
        class="trace-node trace-node-${nodeType}"
        data-id="${escapeXmlAttr(node.id)}"
        data-type="${nodeType}"
        role="group"
        tabindex="0"
        aria-label="${escapeXmlAttr(nodeAriaLabel)}"
        opacity="${isLowEmphasis ? 0.68 : 1}"
      >
        <path
          id="node-${nodeId}"
          d="${shapePath}"
          fill="${fill}"
          stroke="${stroke}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${nodeStrokeDasharray}"
          ${filterAttr}
        />
        ${databaseDetail}
        ${renderIcon(node.icon, iconCenterX, iconCenterY, shapes.nodeIconSize, iconColor)}
        <text
          x="${labelX}"
          y="${node.y}"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="${textColor}"
          font-family="${escapeXmlAttr(typography.fontFamily)}"
          font-size="${typography.fontSizeLabel}"
          font-weight="${Math.min(900, typography.fontWeightLabel + (isHighEmphasis ? 100 : 0))}"
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

  const canvasWidth = width + padding * 2
  const canvasHeight = height + padding * 2
  const decorationDefs = background.decoration === 'scanlines'
    ? `<pattern id="scanlinePattern" width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M 0 3.5 H 4" stroke="${background.gridColor}" stroke-width="0.5"/>
      </pattern>`
    : background.decoration === 'eclipse'
      ? `<filter id="eclipseGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12"/>
        </filter>`
      : ''

  const decorationElements = background.decoration === 'scanlines'
    ? `<rect class="trace-decoration trace-scanlines" width="100%" height="100%" fill="url(#scanlinePattern)" opacity="0.44" pointer-events="none"/>`
    : background.decoration === 'eclipse'
      ? `<g class="trace-decoration trace-eclipse" fill="none" pointer-events="none">
          <path d="M -${canvasWidth * 0.04} ${canvasHeight * 0.38} C ${canvasWidth * 0.04} ${canvasHeight * 0.1}, ${canvasWidth * 0.2} -${canvasHeight * 0.02}, ${canvasWidth * 0.43} -${canvasHeight * 0.01}" stroke="${colors.accent}" stroke-width="28" stroke-linecap="round" opacity="0.1" filter="url(#eclipseGlow)"/>
          <path d="M -${canvasWidth * 0.04} ${canvasHeight * 0.38} C ${canvasWidth * 0.04} ${canvasHeight * 0.1}, ${canvasWidth * 0.2} -${canvasHeight * 0.02}, ${canvasWidth * 0.43} -${canvasHeight * 0.01}" stroke="${colors.accent}" stroke-width="1.5" stroke-linecap="round" opacity="0.62"/>
          <path d="M ${canvasWidth * 0.62} ${canvasHeight * 1.02} C ${canvasWidth * 0.86} ${canvasHeight * 1.01}, ${canvasWidth * 0.99} ${canvasHeight * 0.82}, ${canvasWidth * 1.02} ${canvasHeight * 0.5}" stroke="${colors.warning}" stroke-width="34" stroke-linecap="round" opacity="0.11" filter="url(#eclipseGlow)"/>
          <path d="M ${canvasWidth * 0.62} ${canvasHeight * 1.02} C ${canvasWidth * 0.86} ${canvasHeight * 1.01}, ${canvasWidth * 0.99} ${canvasHeight * 0.82}, ${canvasWidth * 1.02} ${canvasHeight * 0.5}" stroke="${colors.warning}" stroke-width="1.75" stroke-linecap="round" opacity="0.76"/>
        </g>`
      : ''

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="${viewBox}"
    width="${width + padding * 2}"
    height="${height + padding * 2}"
    class="trace-diagram"
    role="img"
    aria-label="${escapeXmlAttr(title ?? 'Traceflow diagram')}"
    preserveAspectRatio="xMidYMid meet"
  >
    <title>${escapeXml(title ?? 'Traceflow diagram')}</title>
    ${description ? `<desc>${escapeXml(description)}</desc>` : ''}
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
        .trace-group-surface {
          transition: stroke-opacity 0.15s ease, fill-opacity 0.15s ease;
        }
        .trace-group:hover .trace-group-surface,
        .trace-group:focus .trace-group-surface {
          stroke-opacity: 0.8;
          fill-opacity: 0.13;
        }
        .trace-node:hover > path,
        .trace-node:focus > path,
        .trace-node:focus-visible > path {
          stroke: var(--trace-accent);
          stroke-width: 2;
        }
        .trace-edge path:not(.trace-edge-hit) {
          transition: stroke 0.15s ease;
        }
        .trace-edge:hover path:not(.trace-edge-hit),
        .trace-edge:focus path:not(.trace-edge-hit),
        .trace-edge:focus-visible path:not(.trace-edge-hit) {
          stroke: var(--trace-accent);
        }
        .trace-node:focus,
        .trace-group:focus,
        .trace-edge:focus {
          outline: none;
        }
        .trace-edge-animated {
          animation: trace-flow 1s linear infinite;
        }
        @keyframes trace-flow {
          to { stroke-dashoffset: -14; }
        }
        @media (prefers-reduced-motion: reduce) {
          .trace-edge-animated { animation: none; }
        }
      </style>

      <!-- Shadow filter -->
      ${parsedShadow ? `<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="${parsedShadow.dx}" dy="${parsedShadow.dy}" stdDeviation="${parsedShadow.blur / 2}" flood-color="${escapeXmlAttr(parsedShadow.color)}"/>
      </filter>` : ''}

      <!-- Chevron arrowhead marker -->
      <marker
        id="arrowhead"
        viewBox="0 0 ${connectors.arrowSize} ${connectors.arrowSize}"
        markerWidth="${connectors.arrowSize}"
        markerHeight="${connectors.arrowSize}"
        refX="${connectors.arrowSize - 1}"
        refY="${connectors.arrowSize / 2}"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <polyline
          points="1 1, ${connectors.arrowSize - 2} ${connectors.arrowSize / 2}, 1 ${connectors.arrowSize - 1}"
          fill="none"
          stroke="context-stroke"
          stroke-width="${Math.max(1, connectors.strokeWidth * 0.75)}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </marker>

      ${gridPattern}
      ${decorationDefs}
    </defs>

    <!-- Background -->
    <rect width="100%" height="100%" fill="${colors.background}"/>

    ${decorationElements}

    ${background.showGrid ? `<!-- Grid pattern -->
    <rect width="100%" height="100%" fill="url(#gridPattern)"/>` : ''}

    <!-- Content group with padding offset -->
    <g class="trace-content" transform="translate(${padding}, ${padding})">
      <!-- Groups / swimlanes -->
      <g class="trace-groups">
        ${groupElements}
      </g>

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
