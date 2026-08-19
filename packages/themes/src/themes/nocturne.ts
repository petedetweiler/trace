// Nocturne - near-black field with cyan flow, gold decisions, and eclipse light

import type { Theme } from '../types'

export const nocturneTheme: Theme = {
  name: 'nocturne',
  displayName: 'Nocturne',
  preferredMode: 'dark',

  accent: {
    primary: '#12C2E9',
    muted: '#0A3340',
    success: '#39D0EE',
    warning: '#F5D020',
    error: '#FF4D2E',
  },

  light: {
    background: '#F4F7FB',
    nodeBackground: '#FFFFFF',
    nodeBorder: '#AAB5C8',
    text: '#101525',
    textMuted: '#66718A',
    connectorStroke: '#087E9B',
    gridColor: '#DCE4EF',
  },

  dark: {
    background: '#02030A',
    nodeBackground: '#070B16',
    nodeBorder: '#3D485D',
    text: '#F1F4FB',
    textMuted: '#8B93AD',
    connectorStroke: '#12C2E9',
    gridColor: '#11182A',
  },

  typography: {
    fontFamily: 'Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSizeLabel: 14,
    fontSizeDescription: 11,
    fontWeightLabel: 500,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 4,
    nodePadding: 20,
    nodeShadow: '0 8px 22px rgba(0, 0, 0, 0.32)',
    nodeMinWidth: 160,
    nodeMaxWidth: 300,
    nodeMinHeight: 96,
    nodeBorderWidth: 1,
    nodeIconSize: 30,
    nodeIconPosition: 'left',
    nodeIconColor: 'accent',
    decisionColor: 'warning',
    terminalNodeStyle: 'card',
    fillTerminalNodes: false,
  },

  connectors: {
    strokeWidth: 1.75,
    curveStyle: 'bezier',
    arrowSize: 9,
  },

  layout: {
    nodeSpacingX: 50,
    nodeSpacingY: 96,
    groupPadding: 30,
    groupHeaderSize: 84,
    groupGap: 10,
    canvasPadding: 32,
  },

  background: {
    showGrid: false,
    gridStyle: 'lines',
    gridSpacing: 24,
    decoration: 'eclipse',
  },
}
