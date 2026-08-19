// Editorial Swiss - rigorous typography, warm white space, and decisive red

import type { Theme } from '../types'

export const editorialTheme: Theme = {
  name: 'editorial',
  displayName: 'Editorial Swiss',
  preferredMode: 'light',

  accent: {
    primary: '#E21A1A',
    muted: '#FCE7E5',
    success: '#171717',
    warning: '#C96C16',
    error: '#E21A1A',
  },

  light: {
    background: '#FBFBFA',
    nodeBackground: '#FFFFFF',
    nodeBorder: '#C9C6C2',
    text: '#111111',
    textMuted: '#67625E',
    connectorStroke: '#181818',
    gridColor: '#E9E7E4',
  },

  dark: {
    background: '#111111',
    nodeBackground: '#181818',
    nodeBorder: '#55514D',
    text: '#F7F5F2',
    textMuted: '#AAA39D',
    connectorStroke: '#E8E4DF',
    gridColor: '#282522',
  },

  typography: {
    fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSizeLabel: 14,
    fontSizeDescription: 11,
    fontWeightLabel: 600,
    fontWeightDescription: 500,
  },

  shapes: {
    nodeCornerRadius: 2,
    nodePadding: 20,
    nodeShadow: 'none',
    nodeMinWidth: 160,
    nodeMaxWidth: 300,
    nodeMinHeight: 96,
    nodeBorderWidth: 1,
    nodeIconSize: 30,
    nodeIconPosition: 'left',
    nodeIconColor: 'accent',
    decisionColor: 'accent',
    terminalNodeStyle: 'card',
    fillTerminalNodes: false,
  },

  connectors: {
    strokeWidth: 1.5,
    curveStyle: 'bezier',
    arrowSize: 9,
  },

  layout: {
    nodeSpacingX: 48,
    nodeSpacingY: 96,
    groupPadding: 30,
    groupHeaderSize: 82,
    groupGap: 10,
    canvasPadding: 30,
  },

  background: {
    showGrid: false,
    gridStyle: 'lines',
    gridSpacing: 24,
    decoration: 'none',
  },
}
