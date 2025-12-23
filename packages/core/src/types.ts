// Core type definitions for Traceflow

import type { ThemeSpec } from '@traceflow/themes'

// Re-export theme types from themes package
export type {
  ThemeSpec,
  ThemeSpecObject,
  ThemeOverrides,
  ResolvedTheme,
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeShapes,
  ThemeConnectors,
  ThemeLayout,
  ThemeBackground,
  ColorSchemeMode,
} from '@traceflow/themes'

/**
 * Direction of the diagram flow
 */
export type Direction = 'TB' | 'LR' | 'BT' | 'RL'

/**
 * Node types determine visual shape
 */
export type NodeType =
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'database'
  | 'external'
  | 'manual'
  | 'delay'

/**
 * Emphasis level affects visual prominence
 */
export type Emphasis = 'low' | 'normal' | 'high'

/**
 * Status affects color treatment
 */
export type Status = 'default' | 'success' | 'warning' | 'error'

/**
 * Edge line styles
 */
export type EdgeStyle = 'solid' | 'dashed' | 'dotted'

/**
 * A node in the diagram
 */
export interface TraceNode {
  id: string
  label: string
  type?: NodeType
  description?: string
  icon?: string
  emphasis?: Emphasis
  status?: Status
}

/**
 * An edge connecting two nodes
 */
export interface TraceEdge {
  from: string
  to: string
  label?: string
  description?: string
  style?: EdgeStyle
  animate?: boolean
}

/**
 * A group of nodes (swimlane)
 */
export interface TraceGroup {
  id: string
  label: string
  nodes: string[]
  color?: string
}

/**
 * The complete Trace document structure
 */
export interface TraceDocument {
  title?: string
  description?: string
  theme?: ThemeSpec
  direction?: Direction
  nodes: TraceNode[]
  edges: TraceEdge[]
  groups?: TraceGroup[]
}

/**
 * Positioned node after layout computation
 */
export interface PositionedNode extends TraceNode {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Edge path point
 */
export interface Point {
  x: number
  y: number
}

/**
 * Positioned edge after layout computation
 */
export interface PositionedEdge extends TraceEdge {
  points: Point[]
}

/**
 * Layout result from Dagre
 */
export interface LayoutResult {
  nodes: PositionedNode[]
  edges: PositionedEdge[]
  width: number
  height: number
}
