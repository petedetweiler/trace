// Schema validation for Trace documents

import type { TraceDocument } from './types'

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validate a TraceDocument against the schema
 */
export function validate(doc: TraceDocument): ValidationResult {
  const errors: ValidationError[] = []

  // Check required fields
  if (!doc.nodes || !Array.isArray(doc.nodes)) {
    errors.push({ path: 'nodes', message: 'nodes is required and must be an array' })
  } else {
    // Validate each node
    doc.nodes.forEach((node, i) => {
      if (!node.id) {
        errors.push({ path: `nodes[${i}].id`, message: 'node id is required' })
      }
      if (!node.label) {
        errors.push({ path: `nodes[${i}].label`, message: 'node label is required' })
      }
    })
  }

  if (!doc.edges || !Array.isArray(doc.edges)) {
    errors.push({ path: 'edges', message: 'edges is required and must be an array' })
  } else {
    // Validate each edge
    const nodeIds = new Set(doc.nodes?.map((n) => n.id) ?? [])
    doc.edges.forEach((edge, i) => {
      if (!edge.from) {
        errors.push({ path: `edges[${i}].from`, message: 'edge from is required' })
      } else if (!nodeIds.has(edge.from)) {
        errors.push({ path: `edges[${i}].from`, message: `node "${edge.from}" not found` })
      }
      if (!edge.to) {
        errors.push({ path: `edges[${i}].to`, message: 'edge to is required' })
      } else if (!nodeIds.has(edge.to)) {
        errors.push({ path: `edges[${i}].to`, message: `node "${edge.to}" not found` })
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
