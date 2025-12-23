// Theme type definitions for Traceflow

// =============================================================================
// Color Scheme Types
// =============================================================================

/**
 * Color scheme mode
 */
export type ColorSchemeMode = 'light' | 'dark' | 'system'

/**
 * Color tokens that vary by light/dark mode
 */
export interface ThemeModeColors {
  /** Canvas background color */
  background: string
  /** Node background color */
  nodeBackground: string
  /** Node border color */
  nodeBorder: string
  /** Primary text color */
  text: string
  /** Muted text color */
  textMuted: string
  /** Edge/connector stroke color */
  connectorStroke: string
  /** Grid color for background pattern */
  gridColor: string
}

/**
 * Accent colors shared across light/dark modes
 */
export interface ThemeAccent {
  /** Primary accent color (used for end nodes, hover states) */
  primary: string
  /** Muted accent for less prominent elements */
  muted: string
  /** Success status color */
  success: string
  /** Warning status color */
  warning: string
  /** Error status color */
  error: string
}

// =============================================================================
// Design Token Types
// =============================================================================

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
  /** Node shadow definition (CSS box-shadow or 'none') */
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
  /** Curve style for edges */
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
 * Background configuration (mode-invariant settings)
 */
export interface ThemeBackgroundConfig {
  /** Whether to show a grid */
  showGrid: boolean
  /** Grid style: dots, lines, or blueprint */
  gridStyle: 'dots' | 'lines' | 'blueprint'
  /** Grid spacing in pixels */
  gridSpacing: number
}

// =============================================================================
// Theme Definition (with light/dark variants)
// =============================================================================

/**
 * Complete theme definition with light/dark mode variants
 */
export interface Theme {
  /** Theme identifier (e.g., 'default', 'blueprint') */
  name: string
  /** Human-readable theme name */
  displayName: string
  /** Accent colors (shared across modes) */
  accent: ThemeAccent
  /** Light mode color palette */
  light: ThemeModeColors
  /** Dark mode color palette */
  dark: ThemeModeColors
  /** Typography tokens (mode-invariant) */
  typography: ThemeTypography
  /** Shape tokens (mode-invariant) */
  shapes: ThemeShapes
  /** Connector tokens (mode-invariant) */
  connectors: ThemeConnectors
  /** Layout tokens (mode-invariant) */
  layout: ThemeLayout
  /** Background settings (mode-invariant, except gridColor) */
  background: ThemeBackgroundConfig
}

// =============================================================================
// Resolved Theme (flattened for renderer)
// =============================================================================

/**
 * Flattened color tokens for a resolved theme
 * Combines mode-specific colors with accent colors
 */
export interface ThemeColors {
  /** Canvas background color */
  background: string
  /** Node background color */
  nodeBackground: string
  /** Node border color */
  nodeBorder: string
  /** Primary text color */
  text: string
  /** Muted text color */
  textMuted: string
  /** Edge/connector stroke color */
  connectorStroke: string
  /** Primary accent color */
  accent: string
  /** Muted accent color */
  accentMuted: string
  /** Success status color */
  success: string
  /** Warning status color */
  warning: string
  /** Error status color */
  error: string
}

/**
 * Background tokens with resolved grid color
 */
export interface ThemeBackground {
  /** Whether to show a grid */
  showGrid: boolean
  /** Grid style */
  gridStyle: 'dots' | 'lines' | 'blueprint'
  /** Grid color (resolved from mode) */
  gridColor: string
  /** Grid spacing in pixels */
  gridSpacing: number
}

/**
 * Resolved theme with flattened colors for a specific mode
 * This is what the renderer actually uses
 */
export interface ResolvedTheme {
  /** Theme identifier */
  name: string
  /** Human-readable theme name */
  displayName: string
  /** Resolved color scheme mode */
  mode: 'light' | 'dark'
  /** Flattened color tokens (mode colors + accent) */
  colors: ThemeColors
  /** Typography tokens */
  typography: ThemeTypography
  /** Shape tokens */
  shapes: ThemeShapes
  /** Connector tokens */
  connectors: ThemeConnectors
  /** Layout tokens */
  layout: ThemeLayout
  /** Background tokens with resolved grid color */
  background: ThemeBackground
}

// =============================================================================
// Theme Spec (for YAML/API)
// =============================================================================

/**
 * Theme specification - can be a theme name or detailed config
 */
export type ThemeSpec = string | ThemeSpecObject

/**
 * Detailed theme specification object
 */
export interface ThemeSpecObject {
  /** Base theme name (default: 'default') */
  name?: string
  /** Color scheme mode */
  mode?: ColorSchemeMode
  /** Partial overrides to apply on top of base theme */
  overrides?: ThemeOverrides
}

/**
 * Overridable theme tokens
 */
export interface ThemeOverrides {
  /** Override accent colors */
  accent?: Partial<ThemeAccent>
  /** Override typography */
  typography?: Partial<ThemeTypography>
  /** Override shapes */
  shapes?: Partial<ThemeShapes>
  /** Override connectors */
  connectors?: Partial<ThemeConnectors>
  /** Override layout */
  layout?: Partial<ThemeLayout>
  /** Override background config */
  background?: Partial<ThemeBackgroundConfig>
  /** Override mode-specific colors (applied to current mode) */
  colors?: Partial<ThemeModeColors>
}
