// Vibrant theme - Colorful, modern, playful aesthetic

import type { Theme } from '../types'

export const vibrantTheme: Theme = {
  name: 'vibrant',
  displayName: 'Vibrant',

  // Bold, colorful accents
  accent: {
    primary: '#8B5CF6', // Vivid purple
    muted: '#DDD6FE', // Light purple
    success: '#10B981', // Emerald
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
  },

  // Light mode - Warm white with colorful accents
  light: {
    background: '#FFFBF5', // Warm off-white
    nodeBackground: '#FFFFFF',
    nodeBorder: '#E9D5FF', // Light purple tint
    text: '#1F2937',
    textMuted: '#6B7280',
    connectorStroke: '#C4B5FD', // Purple-300
    gridColor: '#F3E8FF', // Purple-100
  },

  // Dark mode - Deep purple dark
  dark: {
    background: '#1E1B2E', // Deep purple-black
    nodeBackground: '#2D2A3E', // Dark purple-gray
    nodeBorder: '#6D28D9', // Violet-700
    text: '#F5F3FF', // Purple-50
    textMuted: '#A78BFA', // Violet-400
    connectorStroke: '#7C3AED', // Violet-600
    gridColor: '#2D2A3E',
  },

  typography: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", system-ui, sans-serif',
    fontSizeLabel: 14,
    fontSizeDescription: 12,
    fontWeightLabel: 600,
    fontWeightDescription: 400,
  },

  shapes: {
    nodeCornerRadius: 16, // More rounded for playful feel
    nodePadding: 18,
    nodeShadow: '0 4px 14px rgba(139, 92, 246, 0.15)', // Purple-tinted shadow
    nodeMinWidth: 130,
    nodeMaxWidth: 280,
  },

  connectors: {
    strokeWidth: 2.5,
    curveStyle: 'bezier',
    arrowSize: 12,
  },

  layout: {
    nodeSpacingX: 55,
    nodeSpacingY: 85,
    groupPadding: 28,
    canvasPadding: 45,
  },

  background: {
    showGrid: true,
    gridStyle: 'dots',
    gridSpacing: 24,
  },
}
