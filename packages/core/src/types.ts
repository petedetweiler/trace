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
 * Traceflow document schema version
 */
export type DocumentVersion = 1

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
 * Semantic meaning of an edge. Themes can style these independently from the
 * edge's purely visual line style.
 */
export type EdgeKind =
  | 'primary'
  | 'success'
  | 'failure'
  | 'warning'
  | 'retry'
  | 'alternate'

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
  id?: string
  from: string
  to: string
  label?: string
  description?: string
  kind?: EdgeKind
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
  description?: string
  icon?: string
  color?: string
}

/**
 * The complete Trace document structure
 */
export interface TraceDocument {
  version?: DocumentVersion
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
  /** Deterministic wrapped label lines calculated during layout */
  labelLines?: string[]
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
 * Positioned swimlane/group after layout computation
 */
export interface PositionedGroup extends TraceGroup {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Layout result from Dagre
 */
export interface LayoutResult {
  version?: DocumentVersion
  title?: string
  description?: string
  direction: Direction
  groups?: PositionedGroup[]
  nodes: PositionedNode[]
  edges: PositionedEdge[]
  width: number
  height: number
}
