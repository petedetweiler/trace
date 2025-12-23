// Default theme - Clean, minimal design

import type { Theme } from './types'

export const defaultTheme: Theme = {
  name: 'default',
  displayName: 'Default',

  // Accent colors shared across light/dark modes
  accent: {
    primary: '#3a7d69', // Teal - used for end nodes, hover states
    muted: '#d4e8e2', // Light teal
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },

  // Light mode colors
  light: {
    background: '#F8F8F8',
    nodeBackground: '#FFFFFF',
    nodeBorder: '#E0E0E0',
    text: '#1A1A1A',
    textMuted: '#6B6B6B',
    connectorStroke: '#E0E0E0',
    gridColor: '#E0E0E0',
  },

  // Dark mode colors - neutral grays (matching CodeMirror)
  dark: {
    background: '#1A1A1A',
    nodeBackground: '#1E1E1E',
    nodeBorder: '#3A3A3A',
    text: '#F5F5F5',
    textMuted: '#A0A0A0',
    connectorStroke: '#4A4A4A',
    gridColor: '#252525',
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
    gridSpacing: 20,
  },
}
