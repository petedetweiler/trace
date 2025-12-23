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

  // Light mode - Clean white and gray
  light: {
    background: '#F9FAFB', // Very light gray
    nodeBackground: '#FFFFFF',
    nodeBorder: '#D1D5DB', // Gray-300
    text: '#111827', // Gray-900
    textMuted: '#6B7280', // Gray-500
    connectorStroke: '#9CA3AF', // Gray-400
    gridColor: '#E5E7EB', // Gray-200
  },

  // Dark mode - Slate grays
  dark: {
    background: '#111827', // Gray-900
    nodeBackground: '#1F2937', // Gray-800
    nodeBorder: '#374151', // Gray-700
    text: '#F9FAFB', // Gray-50
    textMuted: '#9CA3AF', // Gray-400
    connectorStroke: '#4B5563', // Gray-600
    gridColor: '#1F2937', // Gray-800
  },

  typography: {
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizeLabel: 14,
    fontSizeDescription: 12,
    fontWeightLabel: 500,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 8, // Moderate rounding
    nodePadding: 16,
    nodeShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Subtle shadow
    nodeMinWidth: 140,
    nodeMaxWidth: 300,
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
