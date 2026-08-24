import { describe, expect, it } from 'vitest'

import { analyzeTraceflowYaml, getTraceflowCompletions } from './editorSchema'

describe('Traceflow editor schema support', () => {
  it('offers repairs for missing version, invalid direction, and unsupported fields', () => {
    const source = `direction: sideways
surprise: true
nodes:
  - id: start
    label: Start
edges: []
`
    const diagnostics = analyzeTraceflowYaml(source)

    expect(diagnostics.some((item) => item.repair?.label === 'Add schema version')).toBe(true)
    expect(diagnostics.some((item) => item.repair?.label === 'Use top-to-bottom direction')).toBe(true)
    expect(diagnostics.some((item) => item.repair?.label === 'Remove unsupported property')).toBe(true)
  })

  it('places enum and field completions in the current YAML context', () => {
    const direction = 'direction: L'
    expect(getTraceflowCompletions(direction, direction.length)).toEqual({
      from: direction.length - 1,
      options: ['TB', 'LR', 'BT', 'RL'],
    })

    const nodeField = 'nodes:\n  - id: start\n    ty'
    expect(getTraceflowCompletions(nodeField, nodeField.length)?.options).toContain('type: process')

    const themeField = 'theme:\n  overrides:\n    connectors:\n      cur'
    expect(getTraceflowCompletions(themeField, themeField.length)?.options).toContain('curveStyle: bezier')

    const groupField = 'groups:\n  - id: platform\n    desc'
    expect(getTraceflowCompletions(groupField, groupField.length)?.options).toContain('description: ')

    const iconValue = 'nodes:\n  - icon: help-'
    expect(getTraceflowCompletions(iconValue, iconValue.length)?.options).toContain('help-circle')
    const conceptValue = 'nodes:\n  - icon: concept:app'
    expect(getTraceflowCompletions(conceptValue, conceptValue.length)?.options)
      .toContain('concept:approval')
  })

  it('recognizes the MIT Tabler catalog and repairs close icon typos', () => {
    const valid = analyzeTraceflowYaml(`version: 1
nodes:
  - id: secure
    label: Secure
    icon: tabler:shield-check
  - id: approve
    label: Approve
    icon: concept:approval
edges: []`)
    expect(valid.some((diagnostic) => diagnostic.message.includes('Unknown icon'))).toBe(false)

    const typo = analyzeTraceflowYaml(`version: 1
nodes:
  - id: secure
    label: Secure
    icon: shield-chek
edges: []`)
    expect(typo.find((diagnostic) => diagnostic.message.includes('Unknown icon'))?.repair)
      .toMatchObject({ label: 'Use shield-check', insert: 'shield-check' })
  })

  it('reports malformed YAML at a bounded source range', () => {
    const diagnostics = analyzeTraceflowYaml('nodes: [')
    expect(diagnostics[0].severity).toBe('error')
    expect(diagnostics[0].from).toBeGreaterThanOrEqual(0)
    expect(diagnostics[0].to).toBeLessThanOrEqual('nodes: ['.length)
  })
})
