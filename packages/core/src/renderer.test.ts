import { describe, expect, it } from 'vitest'

import { resolveTheme } from '@traceflow/themes'
import { computeLayout } from './layout'
import { render } from './renderer'
import type { TraceDocument } from './types'

const visualGrammarDocument: TraceDocument = {
  version: 1,
  title: 'Visual grammar',
  description: 'Exercises labels, status, shapes, and semantic edges.',
  direction: 'TB',
  nodes: [
    { id: 'start', type: 'start', label: 'Start' },
    {
      id: 'long',
      type: 'process',
      label: 'A deliberately long process label that must wrap inside its node',
      emphasis: 'high',
    },
    { id: 'decision', type: 'decision', label: 'Choose?' },
    { id: 'external', type: 'external', label: 'External', status: 'warning' },
    { id: 'manual', type: 'manual', label: 'Manual', status: 'error' },
    { id: 'delay', type: 'delay', label: 'Wait', emphasis: 'low' },
    { id: 'database', type: 'database', label: 'Database', status: 'success' },
  ],
  edges: [
    { from: 'start', to: 'long' },
    { from: 'long', to: 'decision' },
    { from: 'decision', to: 'external', label: 'warning path', kind: 'warning' },
    { from: 'decision', to: 'manual', label: 'failure path', kind: 'failure' },
    { from: 'decision', to: 'delay', label: 'retry later', kind: 'retry', animate: true },
    { from: 'decision', to: 'database', label: 'successful result', kind: 'success' },
  ],
}

describe('render', () => {
  it('renders a complete visual grammar with wrapped and accessible content', () => {
    const theme = resolveTheme('default', 'light')
    const layout = computeLayout(visualGrammarDocument, { theme })
    const svg = render(layout, { theme })

    expect(layout.nodes.find((node) => node.id === 'long')?.labelLines?.length).toBeGreaterThan(1)
    expect(svg).toContain('<title>Visual grammar</title>')
    expect(svg).toContain('<desc>Exercises labels, status, shapes, and semantic edges.</desc>')
    expect(svg).toContain('class="trace-node trace-node-external"')
    expect(svg).toContain('stroke-dasharray="6 4"')
    expect(svg).toContain('stroke="#E21A1A"')
    expect(svg).toContain('stroke="#C96C16"')
    expect(svg).toContain('stroke="#171717"')
    expect(svg).toContain('class="trace-edge-path trace-edge-animated"')
    expect(svg).toContain('<tspan')
    expect(svg).not.toContain('<script')
  })

  it('honors connector curve and arrow tokens', () => {
    const theme = resolveTheme('blueprint', 'dark')
    const layout = computeLayout(visualGrammarDocument, { theme })
    const svg = render(layout, { theme })
    const firstEdgePath = svg.match(/<path\s+id="edge-[^"]+"\s+d="([^"]+)"/)

    expect(theme.connectors.curveStyle).toBe('orthogonal')
    expect(svg).toContain('markerWidth="8"')
    expect(firstEdgePath?.[1]).not.toContain(' Q ')
    expect(svg).toContain('L')
  })

  it('uses curated native appearances and theme-specific background treatments', () => {
    const editorial = resolveTheme('editorial')
    const nocturne = resolveTheme('nocturne')
    const terminal = resolveTheme('terminal')

    expect(editorial.mode).toBe('light')
    expect(nocturne.mode).toBe('dark')
    expect(nocturne.colors.background).toBe('#02030A')
    expect(nocturne.shapes.decisionColor).toBe('warning')
    expect(terminal.background.decoration).toBe('scanlines')

    const nocturneSvg = render(computeLayout(visualGrammarDocument, { theme: nocturne }), { theme: nocturne })
    const terminalSvg = render(computeLayout(visualGrammarDocument, { theme: terminal }), { theme: terminal })
    expect(nocturneSvg).toContain('class="trace-decoration trace-eclipse"')
    expect(nocturneSvg).toContain('stroke="#F5D020"')
    expect(terminalSvg).toContain('id="scanlinePattern"')
  })

  it('sizes label backgrounds from their text instead of using a fixed width', () => {
    const theme = resolveTheme('default', 'light')
    const layout = computeLayout(visualGrammarDocument, { theme })
    const svg = render(layout, { theme })
    const labelBackgroundWidths = Array.from(
      svg.matchAll(/<rect\s+x="[^"]+"\s+y="[^"]+"\s+width="([^"]+)"\s+height="20"/g),
      (match) => Number(match[1])
    )

    expect(labelBackgroundWidths.length).toBeGreaterThan(0)
    expect(labelBackgroundWidths.every((width) => width > 32)).toBe(true)
  })

  it('renders swimlanes, built-in icons, and escaped custom glyph icons', () => {
    const theme = resolveTheme('default', 'light')
    const layout = computeLayout({
      title: 'Grouped icons',
      nodes: [
        { id: 'secure', label: 'Authenticate', icon: 'lock' },
        { id: 'notify', label: 'Notify', icon: '<>' },
      ],
      edges: [{ from: 'secure', to: 'notify' }],
      groups: [{
        id: 'platform',
        label: 'Platform',
        description: 'Shared identity and messaging services',
        icon: 'server',
        nodes: ['secure', 'notify'],
        color: '#3a7d69',
      }],
    }, { theme })
    const svg = render(layout, { theme })

    expect(svg).toContain('class="trace-group"')
    expect(svg).toContain('class="trace-group-surface"')
    expect(svg).toContain('class="trace-group-rail"')
    expect(svg).toContain('class="trace-group-icon"')
    expect(svg).toContain('Platform swimlane')
    expect(svg).toContain('Shared identity and messaging services')
    expect(svg).toContain('class="trace-node-icon"')
    expect(svg).toContain('&lt;&gt;')
    expect(svg).not.toContain('><></text>')
  })

  it('uses the curated card silhouette and prominent inline icons', () => {
    const theme = resolveTheme('editorial')
    const layout = computeLayout({
      direction: 'LR',
      nodes: [
        { id: 'alert', type: 'start', label: 'Alert Received', icon: 'bell' },
        { id: 'done', type: 'end', label: 'Review', icon: 'file-text' },
      ],
      edges: [{ from: 'alert', to: 'done' }],
    }, { theme })
    const svg = render(layout, { theme })

    expect(theme.shapes.nodeIconSize).toBe(30)
    expect(theme.shapes.nodeIconPosition).toBe('left')
    expect(theme.shapes.terminalNodeStyle).toBe('card')
    expect(layout.nodes.every((node) => node.height >= 96)).toBe(true)
    expect(svg).toContain('class="trace-node-icon"')
    expect(svg).not.toContain(`fill="${theme.colors.accent}"`)
  })
})
