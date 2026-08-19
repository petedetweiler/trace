import { stringify } from 'yaml'
import type { Direction, EdgeKind, EdgeStyle, NodeType, TraceDocument, TraceEdge, TraceNode } from '@traceflow/core'

export class MermaidImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MermaidImportError'
  }
}

const MAX_MERMAID_SIZE = 100_000

function cleanLabel(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '').trim()
}

function humanizeId(id: string): string {
  return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function inferNodeType(shape: string, label: string): NodeType {
  if (shape.startsWith('{')) return 'decision'
  if (shape.startsWith('[(')) return 'database'
  if (shape.startsWith('>')) return 'manual'
  if (/\b(start|begin|trigger|entry)\b/i.test(label)) return 'start'
  if (/\b(end|done|finish|complete|exit)\b/i.test(label)) return 'end'
  return 'process'
}

function parseNodeExpression(value: string): TraceNode | null {
  const match = /^([A-Za-z_][\w-]*)(.*)$/.exec(value.trim())
  if (!match) return null
  const id = match[1]
  const shape = match[2].trim()
  if (!shape) return { id, label: humanizeId(id), type: 'process' }

  const wrappers: Array<[RegExp, string]> = [
    [/^\[\((.*)\)\]$/, '$1'],
    [/^\(\((.*)\)\)$/, '$1'],
    [/^\(\[(.*)\]\)$/, '$1'],
    [/^\(\/(.*)\/\)$/, '$1'],
    [/^\(\[(.*)\]\)$/, '$1'],
    [/^\(?(?:\[|\()(.*)(?:\]|\))\)?$/, '$1'],
    [/^\{(.*)\}$/, '$1'],
    [/^>(.*)\]$/, '$1'],
  ]
  for (const [pattern] of wrappers) {
    const labelMatch = pattern.exec(shape)
    if (labelMatch) {
      const label = cleanLabel(labelMatch[1]) || humanizeId(id)
      return { id, label, type: inferNodeType(shape, label) }
    }
  }
  return null
}

function edgeSemantics(label: string | undefined, operator: string): Pick<TraceEdge, 'kind' | 'style'> {
  const normalized = label?.toLowerCase() ?? ''
  let kind: EdgeKind = 'primary'
  if (/\b(yes|true|success|pass|approved|clear)\b/.test(normalized)) kind = 'success'
  else if (/\b(no|false|fail|failed|reject|error)\b/.test(normalized)) kind = 'failure'
  else if (/\b(warn|warning|risk)\b/.test(normalized)) kind = 'warning'
  else if (/\b(retry|again|loop)\b/.test(normalized)) kind = 'retry'
  else if (operator.includes('.')) kind = 'alternate'
  const style: EdgeStyle = operator.includes('.') ? 'dashed' : operator.includes('=') ? 'solid' : 'solid'
  return { kind, style }
}

/** Convert the common Mermaid flowchart subset into a Traceflow document. */
export function importMermaid(source: string): string {
  if (source.length > MAX_MERMAID_SIZE) throw new MermaidImportError('Mermaid input is larger than 100 KB.')
  const lines = source.split(/\r?\n/)
  let direction: Direction = 'TB'
  let hasHeader = false
  const nodes = new Map<string, TraceNode>()
  const edges: TraceEdge[] = []

  const rememberNode = (expression: string): TraceNode => {
    const parsed = parseNodeExpression(expression)
    if (!parsed) throw new MermaidImportError(`Could not understand node expression: ${expression.trim()}`)
    const existing = nodes.get(parsed.id)
    const next = existing && parsed.label === humanizeId(parsed.id) ? existing : { ...existing, ...parsed }
    nodes.set(parsed.id, next)
    return next
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/%%.*$/, '').trim().replace(/;$/, '')
    if (!line) continue
    const header = /^(?:flowchart|graph)\s+(TD|TB|LR|BT|RL)\b/i.exec(line)
    if (header) {
      direction = (header[1].toUpperCase() === 'TD' ? 'TB' : header[1].toUpperCase()) as Direction
      hasHeader = true
      continue
    }
    if (/^(?:sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey)\b/i.test(line)) {
      throw new MermaidImportError(`Line ${index + 1} starts a different Mermaid diagram type. Import supports flowcharts only.`)
    }
    if (/^(subgraph|end|classDef|class|style|linkStyle|click)\b/i.test(line)) continue

    const edge = /^(.*?)\s*(-{2,}>|={2,}>|-\.->)\s*(?:\|([^|]*)\|\s*)?(.*?)$/.exec(line)
    if (edge) {
      const from = rememberNode(edge[1])
      const to = rememberNode(edge[4])
      const label = edge[3] ? cleanLabel(edge[3]) : undefined
      edges.push({ from: from.id, to: to.id, ...(label ? { label } : {}), ...edgeSemantics(label, edge[2]) })
      continue
    }

    if (parseNodeExpression(line)) {
      rememberNode(line)
      continue
    }
    throw new MermaidImportError(`Line ${index + 1} is outside the supported flowchart subset: ${line}`)
  }

  if (!hasHeader) throw new MermaidImportError('Start with “flowchart TD” (or LR, BT, RL).')
  if (nodes.size === 0) throw new MermaidImportError('No flowchart nodes were found.')

  const document: TraceDocument = {
    version: 1,
    title: 'Imported Mermaid Flow',
    direction,
    nodes: Array.from(nodes.values()),
    edges,
  }
  return stringify(document, { lineWidth: 0 })
}
