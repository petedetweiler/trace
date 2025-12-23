// Dagre-based layout engine

import dagre from 'dagre'
import type { TraceDocument, LayoutResult, PositionedNode, PositionedEdge } from './types'

/**
 * Default node dimensions
 */
const DEFAULT_NODE_WIDTH = 180
const DEFAULT_NODE_HEIGHT = 60

/**
 * Compute layout positions for all nodes and edges
 */
export function computeLayout(doc: TraceDocument): LayoutResult {
  const g = new dagre.graphlib.Graph()

  // Set graph direction
  const rankdir = doc.direction ?? 'TB'
  g.setGraph({
    rankdir,
    nodesep: 50,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes
  for (const node of doc.nodes) {
    g.setNode(node.id, {
      label: node.label,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    })
  }

  // Add edges
  for (const edge of doc.edges) {
    g.setEdge(edge.from, edge.to)
  }

  // Run layout
  dagre.layout(g)

  // Extract positioned nodes
  const nodes: PositionedNode[] = doc.nodes.map((node) => {
    const layoutNode = g.node(node.id)
    return {
      ...node,
      x: layoutNode.x,
      y: layoutNode.y,
      width: layoutNode.width,
      height: layoutNode.height,
    }
  })

  // Extract positioned edges
  const edges: PositionedEdge[] = doc.edges.map((edge) => {
    const layoutEdge = g.edge(edge.from, edge.to)
    return {
      ...edge,
      points: layoutEdge.points,
    }
  })

  // Get graph dimensions
  const graph = g.graph()

  return {
    nodes,
    edges,
    width: graph.width ?? 800,
    height: graph.height ?? 600,
  }
}
