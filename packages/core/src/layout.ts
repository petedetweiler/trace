// Dagre-based layout engine

import dagre from 'dagre'
import type { TraceDocument, LayoutResult, PositionedNode, PositionedEdge, Point, TraceEdge, ResolvedTheme } from './types'

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
  nodeWidth: 180,
  nodeHeight: 60,
  decisionNodeHeight: 80,
  nodeSpacingX: 60,
  nodeSpacingY: 80,
  canvasPadding: 40,
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
function computeOrthogonalPath(
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
  const isAlternativePath = edge.style === 'dashed' || edge.style === 'dotted'

  if (isVertical) {
    const goingDown = target.y > source.y
    const margin = 40

    // Forward edge (going with the flow)
    if (goingDown) {
      // For alternative paths from decision nodes, or when path would collide,
      // route around the side
      const needsSideRoute =
        isAlternativePath &&
        (source.type === 'decision' || wouldIntersectNodes(source.x, sourceBottom, targetTop, source, target, allNodes))

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
      const sourceY = sourceBottom
      const targetY = targetTop

      // If horizontally aligned (or close enough), straight vertical line
      if (Math.abs(source.x - target.x) < 60) {
        const midX = (source.x + target.x) / 2
        return [
          { x: midX, y: sourceY },
          { x: midX, y: targetY },
        ]
      }

      // Need a horizontal jog for larger offsets
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

  if (goingRight) {
    const sourceX = sourceRight
    const targetX = targetLeft

    if (Math.abs(source.y - target.y) < 20) {
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
  const nodeWidth = theme?.shapes.nodeMinWidth ?? DEFAULTS.nodeWidth
  const nodeHeight = DEFAULTS.nodeHeight // Could be computed from theme.shapes.nodePadding
  const decisionNodeHeight = DEFAULTS.decisionNodeHeight
  const nodeSpacingX = theme?.layout.nodeSpacingX ?? DEFAULTS.nodeSpacingX
  const nodeSpacingY = theme?.layout.nodeSpacingY ?? DEFAULTS.nodeSpacingY
  const canvasPadding = theme?.layout.canvasPadding ?? DEFAULTS.canvasPadding

  const g = new dagre.graphlib.Graph()

  // Set graph direction
  const rankdir = doc.direction ?? 'TB'
  g.setGraph({
    rankdir,
    nodesep: nodeSpacingX,
    ranksep: nodeSpacingY,
    marginx: canvasPadding,
    marginy: canvasPadding,
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes
  for (const node of doc.nodes) {
    const height = node.type === 'decision' ? decisionNodeHeight : nodeHeight
    g.setNode(node.id, {
      label: node.label,
      width: nodeWidth,
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
    }
    nodeMap.set(node.id, positioned)
    return positioned
  })

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

  return {
    nodes,
    edges,
    width: maxX - minX + canvasPadding * 2,
    height: maxY - minY + canvasPadding * 2,
  }
}
