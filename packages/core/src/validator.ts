// Schema validation for Trace documents

import type {
  Direction,
  EdgeKind,
  EdgeStyle,
  Emphasis,
  NodeType,
  Status,
} from './types'

/**
 * Default limits for DoS protection
 */
export const DEFAULT_LIMITS = {
  maxNodes: 100,
  maxEdges: 200,
  maxLabelLength: 200,
  maxDescriptionLength: 1000,
}

const DIRECTIONS = new Set<Direction>(['TB', 'LR', 'BT', 'RL'])
const NODE_TYPES = new Set<NodeType>([
  'start',
  'end',
  'process',
  'decision',
  'database',
  'external',
  'manual',
  'delay',
])
const EMPHASIS_LEVELS = new Set<Emphasis>(['low', 'normal', 'high'])
const STATUSES = new Set<Status>(['default', 'success', 'warning', 'error'])
const EDGE_STYLES = new Set<EdgeStyle>(['solid', 'dashed', 'dotted'])
const EDGE_KINDS = new Set<EdgeKind>([
  'primary',
  'success',
  'failure',
  'warning',
  'retry',
  'alternate',
])
const DOCUMENT_KEYS = new Set(['version', 'title', 'description', 'theme', 'direction', 'nodes', 'edges', 'groups'])
const THEME_KEYS = new Set(['name', 'mode', 'overrides'])
const NODE_KEYS = new Set(['id', 'label', 'type', 'description', 'icon', 'emphasis', 'status'])
const EDGE_KEYS = new Set(['id', 'from', 'to', 'label', 'description', 'kind', 'style', 'animate'])
const GROUP_KEYS = new Set(['id', 'label', 'description', 'icon', 'nodes', 'color'])

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  path: string,
  errors: ValidationError[]
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push({
        path: path ? `${path}.${key}` : key,
        message: 'is not a supported property',
      })
    }
  }
}

function requiredString(
  value: unknown,
  path: string,
  errors: ValidationError[],
  maxLength?: number
): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push({ path, message: 'is required and must be a non-empty string' })
    return null
  }
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push({
      path,
      message: `Too long (${value.length} chars). Maximum: ${maxLength}`,
    })
  }
  return value
}

function optionalString(
  value: unknown,
  path: string,
  errors: ValidationError[],
  maxLength?: number
): void {
  if (value === undefined) return
  if (typeof value !== 'string') {
    errors.push({ path, message: 'must be a string' })
    return
  }
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push({
      path,
      message: `Too long (${value.length} chars). Maximum: ${maxLength}`,
    })
  }
}

function optionalEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
  path: string,
  errors: ValidationError[]
): void {
  if (value === undefined) return
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    errors.push({
      path,
      message: `must be one of: ${Array.from(allowed).join(', ')}`,
    })
  }
}

/**
 * Validate parsed input against the Traceflow schema.
 *
 * The input is deliberately `unknown`: YAML is untyped at runtime, and callers
 * should receive actionable validation errors instead of renderer exceptions.
 */
export function validate(
  input: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const limits = {
    maxNodes: options.maxNodes ?? DEFAULT_LIMITS.maxNodes,
    maxEdges: options.maxEdges ?? DEFAULT_LIMITS.maxEdges,
    maxLabelLength: options.maxLabelLength ?? DEFAULT_LIMITS.maxLabelLength,
    maxDescriptionLength: options.maxDescriptionLength ?? DEFAULT_LIMITS.maxDescriptionLength,
  }
  const errors: ValidationError[] = []

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [{ path: 'document', message: 'must be a YAML object' }],
    }
  }

  const doc = input
  rejectUnknownKeys(doc, DOCUMENT_KEYS, '', errors)

  if (doc.version !== undefined && doc.version !== 1) {
    errors.push({ path: 'version', message: 'must be 1' })
  }
  optionalString(doc.title, 'title', errors, limits.maxLabelLength)
  optionalString(doc.description, 'description', errors, limits.maxDescriptionLength)
  optionalEnum(doc.direction, DIRECTIONS, 'direction', errors)

  if (doc.theme !== undefined) {
    if (typeof doc.theme !== 'string' && !isRecord(doc.theme)) {
      errors.push({ path: 'theme', message: 'must be a theme name or configuration object' })
    } else if (isRecord(doc.theme)) {
      rejectUnknownKeys(doc.theme, THEME_KEYS, 'theme', errors)
      optionalString(doc.theme.name, 'theme.name', errors, limits.maxLabelLength)
      optionalEnum(
        doc.theme.mode,
        new Set(['light', 'dark', 'system']),
        'theme.mode',
        errors
      )
      if (doc.theme.overrides !== undefined && !isRecord(doc.theme.overrides)) {
        errors.push({ path: 'theme.overrides', message: 'must be an object' })
      }
    }
  }

  const nodeIds = new Set<string>()
  if (!Array.isArray(doc.nodes)) {
    errors.push({ path: 'nodes', message: 'is required and must be an array' })
  } else {
    if (doc.nodes.length === 0) {
      errors.push({ path: 'nodes', message: 'must contain at least one node' })
    }
    if (doc.nodes.length > limits.maxNodes) {
      errors.push({
        path: 'nodes',
        message: `Too many nodes (${doc.nodes.length}). Maximum allowed: ${limits.maxNodes}`,
      })
    }

    doc.nodes.forEach((rawNode, index) => {
      const path = `nodes[${index}]`
      if (!isRecord(rawNode)) {
        errors.push({ path, message: 'must be an object' })
        return
      }
      rejectUnknownKeys(rawNode, NODE_KEYS, path, errors)

      const id = requiredString(rawNode.id, `${path}.id`, errors, limits.maxLabelLength)
      if (id !== null) {
        if (nodeIds.has(id)) {
          errors.push({ path: `${path}.id`, message: `duplicate node id "${id}"` })
        }
        nodeIds.add(id)
      }

      requiredString(rawNode.label, `${path}.label`, errors, limits.maxLabelLength)
      optionalString(rawNode.description, `${path}.description`, errors, limits.maxDescriptionLength)
      optionalString(rawNode.icon, `${path}.icon`, errors, limits.maxLabelLength)
      optionalEnum(rawNode.type, NODE_TYPES, `${path}.type`, errors)
      optionalEnum(rawNode.emphasis, EMPHASIS_LEVELS, `${path}.emphasis`, errors)
      optionalEnum(rawNode.status, STATUSES, `${path}.status`, errors)
    })
  }

  const edgeIds = new Set<string>()
  if (!Array.isArray(doc.edges)) {
    errors.push({ path: 'edges', message: 'is required and must be an array' })
  } else {
    if (doc.edges.length > limits.maxEdges) {
      errors.push({
        path: 'edges',
        message: `Too many edges (${doc.edges.length}). Maximum allowed: ${limits.maxEdges}`,
      })
    }

    doc.edges.forEach((rawEdge, index) => {
      const path = `edges[${index}]`
      if (!isRecord(rawEdge)) {
        errors.push({ path, message: 'must be an object' })
        return
      }
      rejectUnknownKeys(rawEdge, EDGE_KEYS, path, errors)

      if (rawEdge.id !== undefined) {
        const id = requiredString(rawEdge.id, `${path}.id`, errors, limits.maxLabelLength)
        if (id !== null) {
          if (edgeIds.has(id)) {
            errors.push({ path: `${path}.id`, message: `duplicate edge id "${id}"` })
          }
          edgeIds.add(id)
        }
      }

      const from = requiredString(rawEdge.from, `${path}.from`, errors, limits.maxLabelLength)
      const to = requiredString(rawEdge.to, `${path}.to`, errors, limits.maxLabelLength)
      if (from !== null && !nodeIds.has(from)) {
        errors.push({ path: `${path}.from`, message: `node "${from}" not found` })
      }
      if (to !== null && !nodeIds.has(to)) {
        errors.push({ path: `${path}.to`, message: `node "${to}" not found` })
      }

      optionalString(rawEdge.label, `${path}.label`, errors, limits.maxLabelLength)
      optionalString(rawEdge.description, `${path}.description`, errors, limits.maxDescriptionLength)
      optionalEnum(rawEdge.kind, EDGE_KINDS, `${path}.kind`, errors)
      optionalEnum(rawEdge.style, EDGE_STYLES, `${path}.style`, errors)
      if (rawEdge.animate !== undefined && typeof rawEdge.animate !== 'boolean') {
        errors.push({ path: `${path}.animate`, message: 'must be a boolean' })
      }
    })
  }

  const groupIds = new Set<string>()
  const groupedNodeIds = new Map<string, string>()
  if (doc.groups !== undefined && !Array.isArray(doc.groups)) {
    errors.push({ path: 'groups', message: 'must be an array' })
  } else if (Array.isArray(doc.groups)) {
    doc.groups.forEach((rawGroup, index) => {
      const path = `groups[${index}]`
      if (!isRecord(rawGroup)) {
        errors.push({ path, message: 'must be an object' })
        return
      }
      rejectUnknownKeys(rawGroup, GROUP_KEYS, path, errors)

      const id = requiredString(rawGroup.id, `${path}.id`, errors, limits.maxLabelLength)
      if (id !== null) {
        if (groupIds.has(id)) {
          errors.push({ path: `${path}.id`, message: `duplicate group id "${id}"` })
        }
        groupIds.add(id)
      }
      requiredString(rawGroup.label, `${path}.label`, errors, limits.maxLabelLength)
      optionalString(rawGroup.description, `${path}.description`, errors, limits.maxDescriptionLength)
      optionalString(rawGroup.icon, `${path}.icon`, errors, limits.maxLabelLength)
      optionalString(rawGroup.color, `${path}.color`, errors, limits.maxLabelLength)

      if (!Array.isArray(rawGroup.nodes)) {
        errors.push({ path: `${path}.nodes`, message: 'is required and must be an array' })
        return
      }
      if (rawGroup.nodes.length === 0) {
        errors.push({ path: `${path}.nodes`, message: 'must contain at least one node' })
      }
      const groupNodeIds = new Set<string>()
      rawGroup.nodes.forEach((nodeId, nodeIndex) => {
        const nodePath = `${path}.nodes[${nodeIndex}]`
        if (typeof nodeId !== 'string' || nodeId.trim().length === 0) {
          errors.push({ path: nodePath, message: 'must be a non-empty node id' })
          return
        }
        if (groupNodeIds.has(nodeId)) {
          errors.push({ path: nodePath, message: `duplicate node reference "${nodeId}"` })
        }
        groupNodeIds.add(nodeId)
        const existingGroup = groupedNodeIds.get(nodeId)
        if (existingGroup && existingGroup !== id) {
          errors.push({
            path: nodePath,
            message: `node "${nodeId}" already belongs to group "${existingGroup}"`,
          })
        } else if (id !== null) {
          groupedNodeIds.set(nodeId, id)
        }
        if (!nodeIds.has(nodeId)) {
          errors.push({ path: nodePath, message: `node "${nodeId}" not found` })
        }
      })
    })
  }

  return { valid: errors.length === 0, errors }
}
