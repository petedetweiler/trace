import type { Emphasis, NodeType, Status } from '@traceflow/core'

export interface NodeAttributeUpdates {
  label?: string
  description?: string | null
  type?: NodeType | null
  status?: Status | null
  emphasis?: Emphasis | null
}

type EditableNodeField = keyof NodeAttributeUpdates

interface NodeEntry {
  start: number
  end: number
  indent: string
}

const FIELD_ORDER = ['id', 'type', 'label', 'description', 'icon', 'emphasis', 'status'] as const

function unquoteScalar(value: string): string {
  const trimmed = value.trim().replace(/\s+#.*$/, '')
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    try {
      return trimmed.startsWith('"')
        ? JSON.parse(trimmed) as string
        : trimmed.slice(1, -1).replace(/''/g, "'")
    } catch {
      return trimmed.slice(1, -1)
    }
  }
  return trimmed
}

function findNodeEntry(lines: string[], nodeId: string): NodeEntry | null {
  const nodesIndex = lines.findIndex((line) => /^nodes:\s*$/.test(line))
  if (nodesIndex < 0) return null

  let entry: NodeEntry | null = null
  for (let index = nodesIndex + 1; index < lines.length; index += 1) {
    if (/^\S/.test(lines[index])) {
      if (entry) entry.end = index
      break
    }
    const match = /^(\s*)-\s+id:\s*(.+?)\s*$/.exec(lines[index])
    if (!match) continue
    if (entry) {
      entry.end = index
      break
    }
    if (unquoteScalar(match[2]) === nodeId) {
      entry = { start: index, end: lines.length, indent: match[1] }
    }
  }
  return entry
}

function formatFieldValue(field: EditableNodeField, value: string): string {
  if (field === 'label' || field === 'description') {
    const safePlainValue = value === value.trim()
      && /[a-z]/i.test(value)
      && /^[a-z0-9][a-z0-9 _./@()+,&'-]*$/i.test(value)
      && !/^(?:null|true|false|yes|no|on|off)$/i.test(value)
    return safePlainValue ? value : JSON.stringify(value)
  }
  return value
}

function applyNodeField(
  source: string,
  nodeId: string,
  field: EditableNodeField,
  value: string | null
): string {
  const lines = source.split('\n')
  const entry = findNodeEntry(lines, nodeId)
  if (!entry) return source

  const fieldPattern = new RegExp(`^\\s*${field}:\\s*`)
  const existingIndex = lines
    .slice(entry.start + 1, entry.end)
    .findIndex((line) => fieldPattern.test(line))
  const absoluteExistingIndex = existingIndex < 0 ? -1 : entry.start + 1 + existingIndex

  if (value === null) {
    if (absoluteExistingIndex >= 0) lines.splice(absoluteExistingIndex, 1)
    return lines.join('\n')
  }

  const nextLine = `${entry.indent}  ${field}: ${formatFieldValue(field, value)}`
  if (absoluteExistingIndex >= 0) {
    lines[absoluteExistingIndex] = nextLine
    return lines.join('\n')
  }

  const targetOrder = FIELD_ORDER.indexOf(field)
  let insertionIndex = entry.start + 1
  for (let index = entry.start + 1; index < entry.end; index += 1) {
    const fieldMatch = /^\s*([a-zA-Z][\w-]*):\s*/.exec(lines[index])
    if (!fieldMatch) continue
    const order = FIELD_ORDER.indexOf(fieldMatch[1] as typeof FIELD_ORDER[number])
    if (order >= 0 && order < targetOrder) insertionIndex = index + 1
  }
  lines.splice(insertionIndex, 0, nextLine)
  return lines.join('\n')
}

export function applyNodeAttributeUpdates(
  source: string,
  nodeId: string,
  updates: NodeAttributeUpdates
): string {
  let nextSource = source
  for (const field of ['type', 'label', 'description', 'emphasis', 'status'] as const) {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) continue
    nextSource = applyNodeField(nextSource, nodeId, field, updates[field] ?? null)
  }
  return nextSource
}
