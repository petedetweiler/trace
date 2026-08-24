// Dagre-based layout engine

import dagre from '@dagrejs/dagre'
import type {
  TraceDocument,
  LayoutResult,
  PositionedNode,
  PositionedEdge,
  PositionedGroup,
  Point,
  TraceEdge,
  ResolvedTheme,
} from './types'
import {
  APPROXIMATE_GLYPH_WIDTH_RATIO,
  DECISION_ICON_GAP,
  DECISION_ICON_SURFACE_SCALE,
  DECISION_LABEL_MAX_WIDTH,
  DECISION_LABEL_PADDING_X,
  DECISION_LABEL_PADDING_Y,
  estimateTextWidth,
} from './visualMetrics'

/**
 * Layout options
 */
export interface LayoutOptions {
  /** Resolved theme for layout dimensions */
  theme?: ResolvedTheme
}

/**
 * Default layout values (used when no theme provided)
 */
const DEFAULTS = {
  nodeMinWidth: 120,
  nodeMaxWidth: 280,
  nodeMinHeight: 72,
  decisionNodeHeight: 80,
  nodeSpacingX: 60,
  nodeSpacingY: 80,
  canvasPadding: 40,
  nodePadding: 16,
  nodeIconSize: 20,
  groupHeaderSize: 76,
  groupGap: 16,
  fontSizeLabel: 14,
}

/**
 * Deterministically wrap a node label without requiring browser font metrics.
 * This keeps server-side and browser rendering consistent.
 */
export function wrapLabel(
  label: string,
  fontSize: number,
  maxTextWidth: number
): string[] {
  const maxCharacters = Math.max(
    1,
    Math.floor(maxTextWidth / (fontSize * APPROXIMATE_GLYPH_WIDTH_RATIO))
  )
  const words = label.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const tokens = words.flatMap((word) => {
    if (word.length <= maxCharacters) return [word]
    const parts: string[] = []
    for (let index = 0; index < word.length; index += maxCharacters) {
      parts.push(word.slice(index, index + maxCharacters))
    }
    return parts
  })

  const lines: string[] = []
  let currentLine = ''
  for (const token of tokens) {
    const candidate = currentLine ? `${currentLine} ${token}` : token
    if (currentLine && estimateTextWidth(candidate, fontSize) > maxTextWidth) {
      lines.push(currentLine)
      currentLine = token
    } else {
      currentLine = candidate
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function isAlternativeEdge(edge: TraceEdge): boolean {
  return (
    edge.kind === 'failure' ||
    edge.kind === 'warning' ||
    edge.kind === 'retry' ||
    edge.kind === 'alternate' ||
    edge.style === 'dashed' ||
    edge.style === 'dotted'
  )
}

interface LaneDefinition {
  groupId: string | null
  nodeIds: string[]
}

function positionSwimlanes(
  nodes: PositionedNode[],
  groups: TraceDocument['groups'],
  direction: TraceDocument['direction'],
  groupPadding: number,
  groupHeaderSize: number,
  groupGap: number,
  fontSize: number
): PositionedGroup[] {
  if (!groups?.length || nodes.length === 0) return []

  const isVertical = direction === 'TB' || direction === 'BT' || direction === undefined
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const groupedNodeIds = new Set(groups.flatMap((group) => group.nodes))
  const lanes: LaneDefinition[] = groups.map((group) => ({
    groupId: group.id,
    nodeIds: group.nodes.filter((nodeId) => nodeById.has(nodeId)),
  }))
  const ungrouped = nodes.filter((node) => !groupedNodeIds.has(node.id)).map((node) => node.id)
  if (ungrouped.length > 0) lanes.push({ groupId: null, nodeIds: ungrouped })

  const groupById = new Map(groups.map((group) => [group.id, group]))
  const laneBounds = new Map<string, { start: number; size: number }>()
  const laneGap = Math.max(8, groupGap)
  const headerSize = Math.max(48, groupHeaderSize)
  let cursor = 0

  for (const lane of lanes) {
    const laneNodes = lane.nodeIds.map((id) => nodeById.get(id)!).filter(Boolean)
    if (laneNodes.length === 0) continue

    const rawMin = Math.min(...laneNodes.map((node) => (
      isVertical ? node.x - node.width / 2 : node.y - node.height / 2
    )))
    const rawMax = Math.max(...laneNodes.map((node) => (
      isVertical ? node.x + node.width / 2 : node.y + node.height / 2
    )))
    const group = lane.groupId ? groupById.get(lane.groupId) : undefined
    const labelWidth = group
      ? Math.max(
          estimateTextWidth(group.label, fontSize),
          estimateTextWidth(group.description ?? '', Math.max(10, fontSize * 0.75))
        ) + groupPadding * 2
      : 0
    const naturalSize = rawMax - rawMin + groupPadding * 2
    const size = Math.max(naturalSize, labelWidth)
    const contentStart = cursor + groupPadding
    const offset = contentStart - rawMin

    for (const node of laneNodes) {
      if (isVertical) node.x += offset
      else node.y += offset
    }

    if (lane.groupId) laneBounds.set(lane.groupId, { start: cursor, size })
    cursor += size + laneGap
  }

  // Horizontal swimlanes are visual rows, not one endlessly advancing rank.
  // Preserve Dagre's ordering inside each lane, but align each row's leading
  // edge so cross-lane transitions wrap naturally into the next band.
  if (!isVertical && lanes.length > 1) {
    const populatedLanes = lanes
      .map((lane) => lane.nodeIds.map((id) => nodeById.get(id)!).filter(Boolean))
      .filter((laneNodes) => laneNodes.length > 0)
    if (direction === 'RL') {
      const targetEnd = Math.max(...populatedLanes.map((laneNodes) => (
        Math.max(...laneNodes.map((node) => node.x + node.width / 2))
      )))
      for (const laneNodes of populatedLanes) {
        const laneEnd = Math.max(...laneNodes.map((node) => node.x + node.width / 2))
        const offset = targetEnd - laneEnd
        for (const node of laneNodes) node.x += offset
      }
    } else {
      const targetStart = Math.min(...populatedLanes.map((laneNodes) => (
        Math.min(...laneNodes.map((node) => node.x - node.width / 2))
      )))
      for (const laneNodes of populatedLanes) {
        const laneStart = Math.min(...laneNodes.map((node) => node.x - node.width / 2))
        const offset = targetStart - laneStart
        for (const node of laneNodes) node.x += offset
      }
    }
  }

  const flowMin = Math.min(...nodes.map((node) => (
    isVertical ? node.y - node.height / 2 : node.x - node.width / 2
  )))
  const flowMax = Math.max(...nodes.map((node) => (
    isVertical ? node.y + node.height / 2 : node.x + node.width / 2
  )))

  return groups.flatMap((group) => {
    const lane = laneBounds.get(group.id)
    if (!lane) return []
    if (isVertical) {
      const top = flowMin - groupPadding - headerSize
      const bottom = flowMax + groupPadding
      return [{
        ...group,
        x: lane.start + lane.size / 2,
        y: (top + bottom) / 2,
        width: lane.size,
        height: bottom - top,
      }]
    }

    const left = flowMin - groupPadding - headerSize
    const right = flowMax + groupPadding
    return [{
      ...group,
      x: (left + right) / 2,
      y: lane.start + lane.size / 2,
      width: right - left,
      height: lane.size,
    }]
  })
}

/**
 * Check if a vertical line segment would intersect with any nodes (excluding source/target)
 */
function wouldIntersectNodes(
  x: number,
  y1: number,
  y2: number,
  source: PositionedNode,
  target: PositionedNode,
  allNodes: PositionedNode[]
): boolean {
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  const padding = 10 // Small padding around nodes

  for (const node of allNodes) {
    // Skip source and target nodes
    if (node.id === source.id || node.id === target.id) continue

    const nodeLeft = node.x - node.width / 2 - padding
    const nodeRight = node.x + node.width / 2 + padding
    const nodeTop = node.y - node.height / 2 - padding
    const nodeBottom = node.y + node.height / 2 + padding

    // Check if the vertical line passes through this node
    if (x >= nodeLeft && x <= nodeRight && maxY >= nodeTop && minY <= nodeBottom) {
      return true
    }
  }
  return false
}

/**
 * Compute orthogonal edge points between two nodes
 * Creates paths with only horizontal and vertical segments
 * Smart routing to avoid node collisions
 */
export function computeOrthogonalPath(
  source: PositionedNode,
  target: PositionedNode,
  edge: TraceEdge,
  rankdir: string,
  allNodes: PositionedNode[]
): Point[] {
  const sourceLeft = source.x - source.width / 2
  const sourceRight = source.x + source.width / 2
  const sourceTop = source.y - source.height / 2
  const sourceBottom = source.y + source.height / 2

  const targetLeft = target.x - target.width / 2
  const targetRight = target.x + target.width / 2
  const targetTop = target.y - target.height / 2
  const targetBottom = target.y + target.height / 2

  // Determine if this is primarily vertical or horizontal flow
  const isVertical = rankdir === 'TB' || rankdir === 'BT'

  // Check if this is an "alternative" path (dashed edges usually represent failures/alternatives)
  const isAlternativePath = isAlternativeEdge(edge)

  if (isVertical) {
    const goingDown = target.y > source.y
    const isForward = rankdir === 'BT' ? target.y < source.y : goingDown
    const sourceY = goingDown ? sourceBottom : sourceTop
    const targetY = goingDown ? targetTop : targetBottom
    const margin = 40

    // Forward edge (going with the flow)
    if (isForward) {
      // For alternative paths from decision nodes, or when path would collide,
      // route around the side
      const needsSideRoute =
        isAlternativePath &&
        (source.type === 'decision' || wouldIntersectNodes(source.x, sourceY, targetY, source, target, allNodes))

      if (needsSideRoute) {
        // Determine which side to route based on target position
        const routeRight = target.x >= source.x

        if (routeRight) {
          // Route around right side
          const maxX = Math.max(...allNodes.map((n) => n.x + n.width / 2))
          const routeX = maxX + margin

          return [
            { x: sourceRight, y: source.y },
            { x: routeX, y: source.y },
            { x: routeX, y: target.y },
            { x: targetRight, y: target.y },
          ]
        } else {
          // Route around left side
          const minX = Math.min(...allNodes.map((n) => n.x - n.width / 2))
          const routeX = minX - margin

          return [
            { x: sourceLeft, y: source.y },
            { x: routeX, y: source.y },
            { x: routeX, y: target.y },
            { x: targetLeft, y: target.y },
          ]
        }
      }

      // Standard forward edge routing
      // Only use a straight vertical line when both node centers align.
      // Averaging nearby centers leaves the path detached from both ports.
      if (source.x === target.x) {
        return [
          { x: source.x, y: sourceY },
          { x: target.x, y: targetY },
        ]
      }

      // Need a horizontal jog whenever the centers differ
      const midY = (sourceY + targetY) / 2
      return [
        { x: source.x, y: sourceY },
        { x: source.x, y: midY },
        { x: target.x, y: midY },
        { x: target.x, y: targetY },
      ]
    }

    // Back edge (going against the flow - target is above source)
    // Route around the side of the diagram
    const maxX = Math.max(...allNodes.map((n) => n.x + n.width / 2))
    const routeX = maxX + margin

    return [
      { x: sourceRight, y: source.y },
      { x: routeX, y: source.y },
      { x: routeX, y: target.y },
      { x: targetRight, y: target.y },
    ]
  }

  // Horizontal flow (LR/RL)
  const goingRight = target.x > source.x
  const isForward = rankdir === 'RL' ? target.x < source.x : goingRight

  if (isForward) {
    const sourceX = goingRight ? sourceRight : sourceLeft
    const targetX = goingRight ? targetLeft : targetRight

    if (isAlternativePath && source.type === 'decision') {
      const routeBelow = target.y >= source.y
      const boundaryY = routeBelow
        ? Math.max(...allNodes.map((node) => node.y + node.height / 2))
        : Math.min(...allNodes.map((node) => node.y - node.height / 2))
      const routeY = boundaryY + (routeBelow ? 40 : -40)
      const sourcePortY = routeBelow ? sourceBottom : sourceTop
      const targetPortY = routeBelow ? targetBottom : targetTop

      return [
        { x: source.x, y: sourcePortY },
        { x: source.x, y: routeY },
        { x: target.x, y: routeY },
        { x: target.x, y: targetPortY },
      ]
    }

    // Only use a straight horizontal line when both node centers align.
    // A small vertical offset still requires an orthogonal dogleg.
    if (source.y === target.y) {
      return [
        { x: sourceX, y: source.y },
        { x: targetX, y: target.y },
      ]
    }

    const midX = (sourceX + targetX) / 2
    return [
      { x: sourceX, y: source.y },
      { x: midX, y: source.y },
      { x: midX, y: target.y },
      { x: targetX, y: target.y },
    ]
  }

  // Back edge in horizontal flow
  const margin = 40
  const maxY = Math.max(...allNodes.map((n) => n.y + n.height / 2))
  const routeY = maxY + margin

  return [
    { x: source.x, y: sourceBottom },
    { x: source.x, y: routeY },
    { x: target.x, y: routeY },
    { x: target.x, y: targetBottom },
  ]
}

/**
 * Compute layout positions for all nodes and edges
 */
export function computeLayout(doc: TraceDocument, options: LayoutOptions = {}): LayoutResult {
  const { theme } = options

  // Get layout values from theme or use defaults
  const nodeMinWidth = theme?.shapes.nodeMinWidth ?? DEFAULTS.nodeMinWidth
  const nodeMaxWidth = theme?.shapes.nodeMaxWidth ?? DEFAULTS.nodeMaxWidth
  const nodeMinHeight = theme?.shapes.nodeMinHeight ?? DEFAULTS.nodeMinHeight
  const decisionNodeHeight = Math.max(DEFAULTS.decisionNodeHeight, nodeMinHeight)
  const nodeSpacingX = theme?.layout.nodeSpacingX ?? DEFAULTS.nodeSpacingX
  const nodeSpacingY = theme?.layout.nodeSpacingY ?? DEFAULTS.nodeSpacingY
  const groupPadding = theme?.layout.groupPadding ?? 32
  const nodePadding = theme?.shapes.nodePadding ?? DEFAULTS.nodePadding
  const nodeIconSize = theme?.shapes.nodeIconSize ?? DEFAULTS.nodeIconSize
  const nodeIconPosition = theme?.shapes.nodeIconPosition ?? 'top'
  const groupHeaderSize = theme?.layout.groupHeaderSize ?? DEFAULTS.groupHeaderSize
  const groupGap = theme?.layout.groupGap ?? DEFAULTS.groupGap
  const fontSize = theme?.typography.fontSizeLabel ?? DEFAULTS.fontSizeLabel

  const g = new dagre.graphlib.Graph()

  // Set graph direction
  const rankdir = doc.direction ?? 'TB'
  const isVerticalLayout = rankdir === 'TB' || rankdir === 'BT'
  g.setGraph({
    rankdir,
    // Dagre's nodesep is perpendicular to rank direction; ranksep is along it.
    nodesep: isVerticalLayout ? nodeSpacingX : nodeSpacingY,
    ranksep: isVerticalLayout ? nodeSpacingY : nodeSpacingX,
    marginx: 0,
    marginy: 0,
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes with dynamic widths based on label length
  const labelLinesById = new Map<string, string[]>()
  for (const node of doc.nodes) {
    const useInlineIcon = Boolean(node.icon) && node.type !== 'decision' && nodeIconPosition === 'left'
    const iconGap = node.icon ? Math.max(10, nodeIconSize * 0.46) : 0
    const inlineIconWidth = useInlineIcon ? nodeIconSize + iconGap : 0
    const availableTextWidth = Math.max(
      fontSize,
      nodeMaxWidth - nodePadding * 2 - inlineIconWidth
    )
    const maxTextWidth = node.type === 'decision'
      ? Math.min(availableTextWidth, DECISION_LABEL_MAX_WIDTH)
      : availableTextWidth
    const labelLines = wrapLabel(node.label, fontSize, maxTextWidth)
    const textWidth = Math.max(...labelLines.map((line) => estimateTextWidth(line, fontSize)))
    const horizontalPadding = node.type === 'decision'
      ? DECISION_LABEL_PADDING_X * 2 + nodePadding
      : nodePadding * 2
    const calculatedWidth = textWidth + horizontalPadding + inlineIconWidth
    const width = Math.max(nodeMinWidth, Math.min(nodeMaxWidth, calculatedWidth))
    const baseHeight = node.type === 'decision'
      ? Math.max(decisionNodeHeight, Math.min(width, 150))
      : nodeMinHeight
    const lineHeight = fontSize * 1.35
    const labelHeight = labelLines.length * lineHeight
    const iconHeight = node.icon && !useInlineIcon ? nodeIconSize + iconGap : 0
    const decisionLabelHeight = labelHeight + DECISION_LABEL_PADDING_Y * 2
    const decisionIconHeight = node.icon
      ? nodeIconSize * DECISION_ICON_SURFACE_SCALE + DECISION_ICON_GAP
      : 0
    const contentHeight = node.type === 'decision'
      ? decisionLabelHeight + decisionIconHeight + nodePadding
      : labelHeight + iconHeight + nodePadding * 2
    const height = Math.max(baseHeight, contentHeight)
    labelLinesById.set(node.id, labelLines)

    g.setNode(node.id, {
      label: node.label,
      width,
      height,
    })
  }

  // Add edges
  for (const edge of doc.edges) {
    g.setEdge(edge.from, edge.to)
  }

  // Run layout
  dagre.layout(g)

  // Build node map for edge routing
  const nodeMap = new Map<string, PositionedNode>()

  // Extract positioned nodes
  const nodes: PositionedNode[] = doc.nodes.map((node) => {
    const layoutNode = g.node(node.id)
    const positioned: PositionedNode = {
      ...node,
      x: layoutNode.x,
      y: layoutNode.y,
      width: layoutNode.width,
      height: layoutNode.height,
      labelLines: labelLinesById.get(node.id),
    }
    nodeMap.set(node.id, positioned)
    return positioned
  })

  const groups = positionSwimlanes(
    nodes,
    doc.groups,
    rankdir,
    groupPadding,
    groupHeaderSize,
    groupGap,
    fontSize
  )

  // Compute orthogonal edge paths
  const edges: PositionedEdge[] = doc.edges.map((edge) => {
    const source = nodeMap.get(edge.from)!
    const target = nodeMap.get(edge.to)!
    const points = computeOrthogonalPath(source, target, edge, rankdir, nodes)
    return {
      ...edge,
      points,
    }
  })

  // Calculate actual bounds including edge routing
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.width / 2)
    maxX = Math.max(maxX, node.x + node.width / 2)
    minY = Math.min(minY, node.y - node.height / 2)
    maxY = Math.max(maxY, node.y + node.height / 2)
  }

  for (const edge of edges) {
    for (const point of edge.points) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }
  }


  for (const group of groups) {
    minX = Math.min(minX, group.x - group.width / 2)
    maxX = Math.max(maxX, group.x + group.width / 2)
    minY = Math.min(minY, group.y - group.height / 2)
    maxY = Math.max(maxY, group.y + group.height / 2)
  }

  if (nodes.length === 0) {
    return {
      version: doc.version,
      title: doc.title,
      description: doc.description,
      direction: rankdir,
      groups,
      nodes,
      edges,
      width: 0,
      height: 0,
    }
  }

  // Normalize content to a 0,0 origin. The renderer adds canvas padding once,
  // which prevents clipped side routes and avoids double-counting padding.
  const offsetX = -minX
  const offsetY = -minY
  for (const node of nodes) {
    node.x += offsetX
    node.y += offsetY
  }
  for (const edge of edges) {
    edge.points = edge.points.map((point) => ({
      x: point.x + offsetX,
      y: point.y + offsetY,
    }))
  }
  for (const group of groups) {
    group.x += offsetX
    group.y += offsetY
  }

  return {
    version: doc.version,
    title: doc.title,
    description: doc.description,
    direction: rankdir,
    groups,
    nodes,
    edges,
    width: maxX - minX,
    height: maxY - minY,
  }
}
