// Schema validation for Trace documents

import type { TraceDocument } from './types'

/**
 * Default limits for DoS protection
 */
export const DEFAULT_LIMITS = {
  maxNodes: 100,
  maxEdges: 200,
  maxLabelLength: 200,
  maxDescriptionLength: 1000,
}

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationOptions {
  /** Maximum number of nodes allowed (default: 100) */
  maxNodes?: number
  /** Maximum number of edges allowed (default: 200) */
  maxEdges?: number
  /** Maximum label length in characters (default: 200) */
  maxLabelLength?: number
  /** Maximum description length in characters (default: 1000) */
  maxDescriptionLength?: number
}

/**
 * Validate a TraceDocument against the schema
 */
export function validate(
  doc: TraceDocument,
  options: ValidationOptions = {}
): ValidationResult {
  const limits = {
    maxNodes: options.maxNodes ?? DEFAULT_LIMITS.maxNodes,
    maxEdges: options.maxEdges ?? DEFAULT_LIMITS.maxEdges,
    maxLabelLength: options.maxLabelLength ?? DEFAULT_LIMITS.maxLabelLength,
    maxDescriptionLength: options.maxDescriptionLength ?? DEFAULT_LIMITS.maxDescriptionLength,
  }

  const errors: ValidationError[] = []

  // Check required fields
  if (!doc.nodes || !Array.isArray(doc.nodes)) {
    errors.push({ path: 'nodes', message: 'nodes is required and must be an array' })
  } else {
    // Check node count limit
    if (doc.nodes.length > limits.maxNodes) {
      errors.push({
        path: 'nodes',
        message: `Too many nodes (${doc.nodes.length}). Maximum allowed: ${limits.maxNodes}`,
      })
    }

    // Validate each node
    doc.nodes.forEach((node, i) => {
      if (!node.id) {
        errors.push({ path: `nodes[${i}].id`, message: 'node id is required' })
      }
      if (!node.label) {
        errors.push({ path: `nodes[${i}].label`, message: 'node label is required' })
      } else if (node.label.length > limits.maxLabelLength) {
        errors.push({
          path: `nodes[${i}].label`,
          message: `Label too long (${node.label.length} chars). Maximum: ${limits.maxLabelLength}`,
        })
      }
      if (node.description && node.description.length > limits.maxDescriptionLength) {
        errors.push({
          path: `nodes[${i}].description`,
          message: `Description too long (${node.description.length} chars). Maximum: ${limits.maxDescriptionLength}`,
        })
      }
    })
  }

  if (!doc.edges || !Array.isArray(doc.edges)) {
    errors.push({ path: 'edges', message: 'edges is required and must be an array' })
  } else {
    // Check edge count limit
    if (doc.edges.length > limits.maxEdges) {
      errors.push({
        path: 'edges',
        message: `Too many edges (${doc.edges.length}). Maximum allowed: ${limits.maxEdges}`,
      })
    }

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
      if (edge.label && edge.label.length > limits.maxLabelLength) {
        errors.push({
          path: `edges[${i}].label`,
          message: `Label too long (${edge.label.length} chars). Maximum: ${limits.maxLabelLength}`,
        })
      }
      if (edge.description && edge.description.length > limits.maxDescriptionLength) {
        errors.push({
          path: `edges[${i}].description`,
          message: `Description too long (${edge.description.length} chars). Maximum: ${limits.maxDescriptionLength}`,
        })
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
