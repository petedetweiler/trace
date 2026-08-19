import { parse, validate } from '@traceflow/core'

export interface EditorRepair {
  label: string
  from: number
  to: number
  insert: string
}

export interface EditorDiagnostic {
  from: number
  to: number
  severity: 'error' | 'warning' | 'info'
  message: string
  repair?: EditorRepair
}

interface SourceLine {
  text: string
  from: number
  to: number
  number: number
}

function sourceLines(source: string): SourceLine[] {
  const values = source.split('\n')
  let offset = 0
  return values.map((text, index) => {
    const line = { text, from: offset, to: offset + text.length, number: index + 1 }
    offset += text.length + 1
    return line
  })
}

function lineRangeForPath(source: string, path: string): SourceLine | null {
  const lines = sourceLines(source)
  const arrayPath = /^(nodes|edges|groups)\[(\d+)\](?:\.([a-zA-Z][\w-]*))?/.exec(path)
  if (arrayPath) {
    const [, section, rawIndex, field] = arrayPath
    const sectionIndex = lines.findIndex((line) => line.text.trim() === `${section}:`)
    if (sectionIndex < 0) return null
    const entries: Array<{ start: number; end: number }> = []
    let currentStart = -1
    for (let index = sectionIndex + 1; index < lines.length; index += 1) {
      if (/^[a-zA-Z][\w-]*:\s*/.test(lines[index].text)) break
      if (/^\s*-\s+/.test(lines[index].text)) {
        if (currentStart >= 0) entries.push({ start: currentStart, end: index })
        currentStart = index
      }
    }
    if (currentStart >= 0) entries.push({ start: currentStart, end: lines.length })
    const entry = entries[Number(rawIndex)]
    if (!entry) return null
    if (!field) return lines[entry.start]
    const fieldPattern = new RegExp(`^\\s*(?:-\\s*)?${field}:\\s*`)
    return lines.slice(entry.start, entry.end).find((line) => fieldPattern.test(line.text)) ?? lines[entry.start]
  }

  const topLevelKey = path.split('.')[0]
  return lines.find((line) => new RegExp(`^${topLevelKey}:\\s*`).test(line.text)) ?? null
}

function lineRepairRange(source: string, line: SourceLine): { from: number; to: number } {
  return {
    from: line.from,
    to: Math.min(source.length, line.to + (line.to < source.length ? 1 : 0)),
  }
}

function repairForValidationError(
  source: string,
  path: string,
  message: string,
  line: SourceLine | null
): EditorRepair | undefined {
  if (path === 'version') {
    if (line) return { label: 'Set version to 1', from: line.from, to: line.to, insert: 'version: 1' }
    return { label: 'Add schema version', from: 0, to: 0, insert: 'version: 1\n' }
  }
  if (path === 'edges' && message.includes('required')) {
    return {
      label: 'Add empty edges list',
      from: source.length,
      to: source.length,
      insert: `${source.endsWith('\n') ? '' : '\n'}edges: []\n`,
    }
  }
  if (path === 'direction' && line) {
    const valueStart = line.from + Math.max(0, line.text.indexOf(':') + 1)
    return { label: 'Use top-to-bottom direction', from: valueStart, to: line.to, insert: ' TB' }
  }
  if (message === 'is not a supported property' && line) {
    const range = lineRepairRange(source, line)
    return { label: 'Remove unsupported property', ...range, insert: '' }
  }
  return undefined
}

function parserPosition(source: string, error: unknown): { from: number; to: number } {
  const typed = error as { linePos?: Array<{ line: number; col: number }> }
  const first = typed.linePos?.[0]
  if (!first) return { from: 0, to: Math.min(1, source.length) }
  const line = sourceLines(source)[Math.max(0, first.line - 1)]
  if (!line) return { from: 0, to: Math.min(1, source.length) }
  const from = Math.min(line.to, line.from + Math.max(0, first.col - 1))
  return { from, to: Math.min(line.to, from + 1) }
}

export function analyzeTraceflowYaml(source: string): EditorDiagnostic[] {
  try {
    const document = parse(source)
    const result = validate(document)
    const diagnostics: EditorDiagnostic[] = result.errors.map((error) => {
      const line = lineRangeForPath(source, error.path)
      return {
        from: line?.from ?? 0,
        to: Math.max(line?.to ?? 0, Math.min(1, source.length)),
        severity: 'error' as const,
        message: `${error.path}: ${error.message}`,
        repair: repairForValidationError(source, error.path, error.message, line),
      }
    })

    if (document.version === undefined) {
      diagnostics.unshift({
        from: 0,
        to: Math.min(1, source.length),
        severity: 'warning',
        message: 'Add version: 1 so this document has an explicit schema contract.',
        repair: { label: 'Add schema version', from: 0, to: 0, insert: 'version: 1\n' },
      })
    }
    return diagnostics
  } catch (error) {
    const range = parserPosition(source, error)
    return [{
      ...range,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Invalid YAML',
    }]
  }
}

const VALUE_COMPLETIONS: Record<string, string[]> = {
  direction: ['TB', 'LR', 'BT', 'RL'],
  type: ['process', 'decision', 'start', 'end', 'database', 'external', 'manual', 'delay'],
  status: ['default', 'success', 'warning', 'error'],
  emphasis: ['normal', 'high', 'low'],
  kind: ['primary', 'success', 'failure', 'warning', 'retry', 'alternate'],
  style: ['solid', 'dashed', 'dotted'],
  mode: ['system', 'light', 'dark'],
  theme: ['editorial', 'werkstatt', 'blueprint', 'terminal', 'nocturne'],
  icon: [
    'bell', 'box', 'check', 'checklist', 'clock', 'cloud', 'code', 'credit-card',
    'file-text', 'git-branch', 'globe', 'help-circle', 'inbox', 'lock', 'mail',
    'package', 'package-search', 'search', 'server', 'settings', 'shopping-cart',
    'truck', 'user', 'warning', 'wrench', 'x',
  ],
  curveStyle: ['bezier', 'orthogonal', 'organic'],
  gridStyle: ['dots', 'lines', 'blueprint'],
}

const KEY_COMPLETIONS = {
  document: ['version: 1', 'title: ', 'description: ', 'theme: editorial', 'direction: TB', 'nodes:', 'edges:', 'groups:'],
  nodes: ['id: ', 'label: ', 'type: process', 'description: ', 'icon: ', 'emphasis: normal', 'status: default'],
  edges: ['id: ', 'from: ', 'to: ', 'label: ', 'description: ', 'kind: primary', 'style: solid', 'animate: false'],
  groups: ['id: ', 'label: ', 'description: ', 'icon: ', 'nodes: []', 'color: "#3a7d69"'],
  theme: ['name: editorial', 'mode: system', 'overrides:'],
  overrides: ['accent:', 'colors:', 'typography:', 'shapes:', 'connectors:', 'layout:', 'background:'],
  accent: ['primary: "#3a7d69"', 'muted: "#d4e8e2"', 'success: "#22c55e"', 'warning: "#f59e0b"', 'error: "#ef4444"'],
  colors: ['background: "#f8f8f8"', 'nodeBackground: "#ffffff"', 'nodeBorder: "#e0e0e0"', 'text: "#1a1a1a"', 'textMuted: "#6b6b6b"', 'connectorStroke: "#e0e0e0"', 'gridColor: "#e0e0e0"'],
  shapes: ['nodeCornerRadius: 12', 'nodePadding: 16', 'nodeShadow: none', 'nodeMinWidth: 120', 'nodeMaxWidth: 280', 'nodeMinHeight: 72', 'nodeBorderWidth: 1', 'nodeIconSize: 24', 'nodeIconPosition: left', 'nodeIconColor: accent', 'decisionColor: accent', 'terminalNodeStyle: card', 'fillTerminalNodes: false'],
  connectors: ['strokeWidth: 2', 'curveStyle: bezier', 'arrowSize: 10'],
  layout: ['nodeSpacingX: 60', 'nodeSpacingY: 80', 'groupPadding: 32', 'groupHeaderSize: 76', 'groupGap: 14', 'canvasPadding: 40'],
  background: ['showGrid: true', 'gridStyle: dots', 'gridSpacing: 20'],
  typography: ['fontFamily: Inter', 'fontSizeLabel: 14', 'fontSizeDescription: 12', 'fontWeightLabel: 600', 'fontWeightDescription: 500'],
} as const

export interface SchemaCompletionContext {
  from: number
  options: string[]
}

export function getTraceflowCompletions(source: string, position: number): SchemaCompletionContext | null {
  const lineStart = source.lastIndexOf('\n', Math.max(0, position - 1)) + 1
  const linePrefix = source.slice(lineStart, position)
  const valueMatch = /(?:^|\s)(direction|type|status|emphasis|kind|style|mode|theme|icon|curveStyle|gridStyle):\s*([\w-]*)$/.exec(linePrefix)
  if (valueMatch) {
    return {
      from: position - valueMatch[2].length,
      options: VALUE_COMPLETIONS[valueMatch[1]],
    }
  }

  const word = /[\w-]*$/.exec(linePrefix)?.[0] ?? ''
  const indent = linePrefix.match(/^\s*/)?.[0].length ?? 0
  let scope: keyof typeof KEY_COMPLETIONS = 'document'
  if (indent > 0) {
    const previousLines = source.slice(0, lineStart).split('\n').reverse()
    for (const previousLine of previousLines) {
      const match = /^(\s*)(?:-\s*)?([a-zA-Z][\w-]*):(?:\s*.*)?$/.exec(previousLine)
      if (!match || match[1].length >= indent) continue
      const candidate = match[2] as keyof typeof KEY_COMPLETIONS
      if (candidate in KEY_COMPLETIONS) {
        scope = candidate
        break
      }
    }
  }
  return { from: position - word.length, options: [...KEY_COMPLETIONS[scope]] }
}
