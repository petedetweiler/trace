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

  // Light mode - Cool blue drafting paper aesthetic
  light: {
    background: '#E8F0F8', // Light blue-gray paper
    nodeBackground: '#F5F9FC', // Very light blue node fill
    nodeBorder: '#1E3A5F', // Dark navy borders
    text: '#1E3A5F', // Dark navy text
    textMuted: '#4A6D8C', // Medium navy
    connectorStroke: '#2E5A8F', // Navy connectors
    gridColor: '#C5D8E8', // Light blue grid
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
