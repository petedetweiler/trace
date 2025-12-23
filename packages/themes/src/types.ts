// Theme type definitions

/**
 * Color tokens for a theme
 */
export interface ThemeColors {
  /** Canvas background color */
  background: string
  /** Node background color */
  nodeBackground: string
  /** Node border color */
  nodeBorder: string
  /** Primary accent color */
  accent: string
  /** Muted accent for less prominent elements */
  accentMuted: string
  /** Primary text color */
  text: string
  /** Muted text color */
  textMuted: string
  /** Edge/connector stroke color */
  connectorStroke: string
  /** Success status color */
  success: string
  /** Warning status color */
  warning: string
  /** Error status color */
  error: string
}

/**
 * Typography tokens for a theme
 */
export interface ThemeTypography {
  /** Font family stack */
  fontFamily: string
  /** Label font size in pixels */
  fontSizeLabel: number
  /** Description font size in pixels */
  fontSizeDescription: number
  /** Label font weight */
  fontWeightLabel: number
  /** Description font weight */
  fontWeightDescription: number
}

/**
 * Shape tokens for a theme
 */
export interface ThemeShapes {
  /** Node corner radius in pixels */
  nodeCornerRadius: number
  /** Node padding in pixels */
  nodePadding: number
  /** Node shadow definition */
  nodeShadow: string
  /** Minimum node width in pixels */
  nodeMinWidth: number
  /** Maximum node width in pixels */
  nodeMaxWidth: number
}

/**
 * Connector/edge tokens for a theme
 */
export interface ThemeConnectors {
  /** Stroke width in pixels */
  strokeWidth: number
  /** Curve style: bezier, orthogonal, or organic */
  curveStyle: 'bezier' | 'orthogonal' | 'organic'
  /** Arrow size in pixels */
  arrowSize: number
}

/**
 * Layout tokens for a theme
 */
export interface ThemeLayout {
  /** Horizontal spacing between nodes */
  nodeSpacingX: number
  /** Vertical spacing between nodes */
  nodeSpacingY: number
  /** Padding inside groups */
  groupPadding: number
  /** Padding around the entire canvas */
  canvasPadding: number
}

/**
 * Background tokens for a theme
 */
export interface ThemeBackground {
  /** Whether to show a grid */
  showGrid: boolean
  /** Grid style: dots, lines, or blueprint */
  gridStyle: 'dots' | 'lines' | 'blueprint'
  /** Grid color */
  gridColor: string
  /** Grid spacing in pixels */
  gridSpacing: number
}

/**
 * Complete theme definition
 */
export interface Theme {
  /** Theme identifier */
  name: string
  /** Human-readable theme name */
  displayName: string
  /** Color tokens */
  colors: ThemeColors
  /** Typography tokens */
  typography: ThemeTypography
  /** Shape tokens */
  shapes: ThemeShapes
  /** Connector tokens */
  connectors: ThemeConnectors
  /** Layout tokens */
  layout: ThemeLayout
  /** Background tokens */
  background: ThemeBackground
}
