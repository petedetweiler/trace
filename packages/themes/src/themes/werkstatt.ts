// Werkstatt - Rams-inspired functionalism on warm technical paper

import type { Theme } from '../types'

export const werkstattTheme: Theme = {
  name: 'werkstatt',
  displayName: 'Werkstatt',
  preferredMode: 'light',

  accent: {
    primary: '#C8231A',
    muted: '#F2DAD5',
    success: '#587341',
    warning: '#C98418',
    error: '#C8231A',
  },

  light: {
    background: '#F3F1EC',
    nodeBackground: '#FAF9F5',
    nodeBorder: '#292825',
    text: '#171715',
    textMuted: '#66635C',
    connectorStroke: '#587341',
    gridColor: '#D8D4CC',
  },

  dark: {
    background: '#191A17',
    nodeBackground: '#23241F',
    nodeBorder: '#A7A299',
    text: '#F0EEE8',
    textMuted: '#AAA69D',
    connectorStroke: '#9DB884',
    gridColor: '#34352F',
  },

  typography: {
    fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSizeLabel: 13,
    fontSizeDescription: 11,
    fontWeightLabel: 500,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 2,
    nodePadding: 20,
    nodeShadow: '0 1px 2px rgba(35, 32, 27, 0.08)',
    nodeMinWidth: 158,
    nodeMaxWidth: 286,
    nodeMinHeight: 98,
    nodeBorderWidth: 1.5,
    nodeIconSize: 30,
    nodeIconPosition: 'left',
    nodeIconColor: 'text',
    decisionColor: 'text',
    terminalNodeStyle: 'card',
    fillTerminalNodes: false,
  },

  connectors: {
    strokeWidth: 1.75,
    curveStyle: 'orthogonal',
    arrowSize: 9,
  },

  layout: {
    nodeSpacingX: 50,
    nodeSpacingY: 96,
    groupPadding: 30,
    groupHeaderSize: 82,
    groupGap: 10,
    canvasPadding: 30,
  },

  background: {
    showGrid: true,
    gridStyle: 'dots',
    gridSpacing: 18,
    decoration: 'none',
  },
}
