// Default theme - Firecrawl-inspired

import type { Theme } from './types'

export const defaultTheme: Theme = {
  name: 'default',
  displayName: 'Default',

  colors: {
    background: '#F8F8F8',
    nodeBackground: '#FFFFFF',
    nodeBorder: '#E0E0E0',
    accent: '#3a7d69',
    accentMuted: '#d4e8e2',
    text: '#1A1A1A',
    textMuted: '#6B6B6B',
    connectorStroke: '#E0E0E0',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSizeLabel: 14,
    fontSizeDescription: 12,
    fontWeightLabel: 600,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 12,
    nodePadding: 16,
    nodeShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    nodeMinWidth: 120,
    nodeMaxWidth: 280,
  },

  connectors: {
    strokeWidth: 2,
    curveStyle: 'bezier',
    arrowSize: 10,
  },

  layout: {
    nodeSpacingX: 50,
    nodeSpacingY: 80,
    groupPadding: 24,
    canvasPadding: 40,
  },

  background: {
    showGrid: true,
    gridStyle: 'dots',
    gridColor: '#E0E0E0',
    gridSpacing: 20,
  },
}
