// Blueprint theme - Technical, engineering aesthetic

import type { Theme } from '../types'

export const blueprintTheme: Theme = {
  name: 'blueprint',
  displayName: 'Blueprint',

  // Blue-focused accent colors
  accent: {
    primary: '#60A5FA', // Bright blue
    muted: '#1E3A5F', // Dark navy muted
    success: '#34D399', // Teal green
    warning: '#FBBF24', // Amber
    error: '#F87171', // Coral red
  },

  // Light mode - Classic blueprint on navy
  light: {
    background: '#1E3A5F', // Navy blue
    nodeBackground: '#254E78', // Slightly lighter navy
    nodeBorder: '#60A5FA', // Bright blue borders
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    connectorStroke: '#60A5FA',
    gridColor: '#2D5A8A',
  },

  // Dark mode - Deeper, more contrast
  dark: {
    background: '#0F172A', // Very dark navy
    nodeBackground: '#1E293B', // Dark slate
    nodeBorder: '#3B82F6', // Blue
    text: '#F8FAFC',
    textMuted: '#64748B',
    connectorStroke: '#3B82F6',
    gridColor: '#1E3A5F',
  },

  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSizeLabel: 13,
    fontSizeDescription: 11,
    fontWeightLabel: 500,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 4, // Sharp corners for technical feel
    nodePadding: 12,
    nodeShadow: 'none', // No shadows for flat blueprint look
    nodeMinWidth: 140,
    nodeMaxWidth: 260,
  },

  connectors: {
    strokeWidth: 1.5,
    curveStyle: 'orthogonal',
    arrowSize: 8,
  },

  layout: {
    nodeSpacingX: 60,
    nodeSpacingY: 70,
    groupPadding: 20,
    canvasPadding: 30,
  },

  background: {
    showGrid: true,
    gridStyle: 'lines', // Grid lines for blueprint feel
    gridSpacing: 24,
  },
}
