// Terminal Signal - a restrained phosphor console with amber secondary paths

import type { Theme } from '../types'

export const terminalTheme: Theme = {
  name: 'terminal',
  displayName: 'Terminal Signal',
  preferredMode: 'dark',

  accent: {
    primary: '#72D572',
    muted: '#142A17',
    success: '#72D572',
    warning: '#E3A33A',
    error: '#F06449',
  },

  light: {
    background: '#EDF4EC',
    nodeBackground: '#F8FBF7',
    nodeBorder: '#46714A',
    text: '#102812',
    textMuted: '#506B51',
    connectorStroke: '#397640',
    gridColor: '#CFDDCF',
  },

  dark: {
    background: '#020503',
    nodeBackground: '#050A06',
    nodeBorder: '#376B3B',
    text: '#C8D9B5',
    textMuted: '#7D9872',
    connectorStroke: '#65C96C',
    gridColor: '#0C1B0E',
  },

  typography: {
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSizeLabel: 12,
    fontSizeDescription: 10,
    fontWeightLabel: 500,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 1,
    nodePadding: 18,
    nodeShadow: 'none',
    nodeMinWidth: 154,
    nodeMaxWidth: 278,
    nodeMinHeight: 90,
    nodeBorderWidth: 1,
    nodeIconSize: 26,
    nodeIconPosition: 'left',
    nodeIconColor: 'accent',
    decisionColor: 'accent',
    terminalNodeStyle: 'card',
    fillTerminalNodes: false,
  },

  connectors: {
    strokeWidth: 1.5,
    curveStyle: 'orthogonal',
    arrowSize: 8,
  },

  layout: {
    nodeSpacingX: 48,
    nodeSpacingY: 88,
    groupPadding: 26,
    groupHeaderSize: 78,
    groupGap: 10,
    canvasPadding: 30,
  },

  background: {
    showGrid: true,
    gridStyle: 'lines',
    gridSpacing: 18,
    decoration: 'scanlines',
  },
}
