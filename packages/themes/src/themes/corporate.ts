// Corporate theme - Professional, subdued business aesthetic

import type { Theme } from '../types'

export const corporateTheme: Theme = {
  name: 'corporate',
  displayName: 'Corporate',

  // Subtle blue/gray accent colors
  accent: {
    primary: '#2563EB', // Professional blue
    muted: '#DBEAFE', // Light blue tint
    success: '#059669', // Muted green
    warning: '#D97706', // Muted amber
    error: '#DC2626', // Professional red
  },

  // Light mode - Subtle filled nodes with gray-blue tint
  light: {
    background: '#FAFBFC', // Clean off-white
    nodeBackground: '#F0F4F8', // Light gray-blue fill (not pure white)
    nodeBorder: '#CBD5E1', // Slate border
    text: '#111827', // Gray-900
    textMuted: '#64748B', // Slate-500
    connectorStroke: '#94A3B8', // Slate-400
    gridColor: '#E2E8F0', // Slate-200
  },

  // Dark mode - Slate grays with filled nodes
  dark: {
    background: '#0F172A', // Slate-900
    nodeBackground: '#1E293B', // Slate-800 (filled, not just border)
    nodeBorder: '#334155', // Slate-700
    text: '#F8FAFC', // Slate-50
    textMuted: '#94A3B8', // Slate-400
    connectorStroke: '#475569', // Slate-600
    gridColor: '#1E293B', // Slate-800
  },

  typography: {
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizeLabel: 14,
    fontSizeDescription: 12,
    fontWeightLabel: 500,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 2, // Nearly squared off for professional look
    nodePadding: 16,
    nodeShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', // Very subtle shadow
    nodeMinWidth: 140,
    nodeMaxWidth: 300,
    nodeBorderWidth: 1.5, // Slightly thicker border
  },

  connectors: {
    strokeWidth: 1.5,
    curveStyle: 'bezier',
    arrowSize: 10,
  },

  layout: {
    nodeSpacingX: 60,
    nodeSpacingY: 80,
    groupPadding: 24,
    canvasPadding: 40,
  },

  background: {
    showGrid: false, // Clean, no grid for professional look
    gridStyle: 'dots',
    gridSpacing: 20,
  },
}
