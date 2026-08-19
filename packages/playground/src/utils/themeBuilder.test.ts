import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { applyThemeBuilder, DEFAULT_THEME_BUILDER_VALUES } from './themeBuilder'

describe('theme builder', () => {
  it('preserves diagram data and merges custom overrides', () => {
    const result = parse(applyThemeBuilder(`version: 1
theme:
  name: blueprint
  overrides:
    layout:
      nodeSpacingX: 90
nodes:
  - id: a
    label: A
edges: []
`, { ...DEFAULT_THEME_BUILDER_VALUES, name: 'nocturne', accent: '#ff0066', curveStyle: 'organic' }))

    expect(result.nodes[0]).toEqual({ id: 'a', label: 'A' })
    expect(result.theme.name).toBe('nocturne')
    expect(result.theme.overrides.layout.nodeSpacingX).toBe(90)
    expect(result.theme.overrides.accent.primary).toBe('#ff0066')
    expect(result.theme.overrides.connectors.curveStyle).toBe('organic')
  })
})
