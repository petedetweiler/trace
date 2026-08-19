// Blueprint theme - Technical, engineering aesthetic

import type { Theme } from '../types'

export const blueprintTheme: Theme = {
  name: 'blueprint',
  displayName: 'Engineering Blueprint',
  preferredMode: 'dark',

  // Blue-focused accent colors
  accent: {
    primary: '#69B7FF',
    muted: '#0B3561',
    success: '#8BE5A8',
    warning: '#FFB91F',
    error: '#FF646B',
  },

  // Light mode - Cool blue drafting paper aesthetic
  light: {
    background: '#EAF3FA',
    nodeBackground: '#F7FBFE',
    nodeBorder: '#1F5D91',
    text: '#123B61',
    textMuted: '#4A7092',
    connectorStroke: '#276B9F',
    gridColor: '#C4DAEA',
  },

  // Dark mode - Deeper, more contrast
  dark: {
    background: '#05284D',
    nodeBackground: '#0A315B',
    nodeBorder: '#78BEFF',
    text: '#F0F8FF',
    textMuted: '#91B5D5',
    connectorStroke: '#B7DAF7',
    gridColor: '#174B78',
  },

  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSizeLabel: 12,
    fontSizeDescription: 10,
    fontWeightLabel: 500,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 0,
    nodePadding: 18,
    nodeShadow: 'none',
    nodeMinWidth: 158,
    nodeMaxWidth: 280,
    nodeMinHeight: 92,
    nodeBorderWidth: 1.25,
    nodeChamfer: 8,
    nodeIconSize: 28,
    nodeIconPosition: 'left',
    nodeIconColor: 'accent',
    decisionColor: 'accent',
    terminalNodeStyle: 'card',
    fillTerminalNodes: false,
  },

  connectors: {
    strokeWidth: 1.25,
    curveStyle: 'orthogonal',
    arrowSize: 8,
  },

  layout: {
    nodeSpacingX: 48,
    nodeSpacingY: 90,
    groupPadding: 26,
    groupHeaderSize: 82,
    groupGap: 10,
    canvasPadding: 30,
  },

  background: {
    showGrid: true,
    gridStyle: 'blueprint',
    gridSpacing: 20,
    decoration: 'none',
  },
}
