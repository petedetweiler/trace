import { describe, expect, it } from 'vitest'
import { parse } from '@traceflow/core'
import { importMermaid, MermaidImportError } from './mermaid'

describe('Mermaid import', () => {
  it('imports direction, shapes, labels, and semantic edges', () => {
    const yaml = importMermaid(`flowchart LR
      start([Start]) --> check{Approved?}
      check -->|yes| done([Done])
      check -.->|no| retry[Try again]`)
    const document = parse(yaml)

    expect(document.direction).toBe('LR')
    expect(document.nodes.map((node) => [node.id, node.type])).toEqual([
      ['start', 'start'], ['check', 'decision'], ['done', 'end'], ['retry', 'process'],
    ])
    expect(document.edges[1]).toMatchObject({ label: 'yes', kind: 'success' })
    expect(document.edges[2]).toMatchObject({ label: 'no', kind: 'failure', style: 'dashed' })
  })

  it('reports unsupported input with a useful line number', () => {
    expect(() => importMermaid('flowchart TD\nsequenceDiagram')).toThrow(MermaidImportError)
    expect(() => importMermaid('A --> B')).toThrow('Start with')
  })
})
