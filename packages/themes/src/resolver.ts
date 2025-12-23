// Theme resolution - converts ThemeSpec to ResolvedTheme

import type {
  Theme,
  ThemeSpec,
  ThemeOverrides,
  ResolvedTheme,
  ThemeModeColors,
} from './types'
import { deepMerge } from './utils'

// Import will be updated once themes are defined
// For now, we'll use a reference that gets set later
let themesRegistry: Record<string, Theme> = {}
let defaultThemeRef: Theme | null = null

/**
 * Set the themes registry (called from index.ts to avoid circular deps)
 */
export function setThemesRegistry(
  themes: Record<string, Theme>,
  defaultTheme: Theme
): void {
  themesRegistry = themes
  defaultThemeRef = defaultTheme
}

/**
 * Get effective color scheme mode based on system preference
 */
function getSystemMode(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light' // SSR/Node fallback
}

/**
 * Normalized theme spec with required name
 */
interface NormalizedThemeSpec {
  name: string
  mode?: 'light' | 'dark' | 'system'
  overrides?: ThemeOverrides
}

/**
 * Normalize a ThemeSpec to object form with guaranteed name
 */
function normalizeSpec(spec: ThemeSpec | undefined): NormalizedThemeSpec {
  if (spec === undefined) {
    return { name: 'default' }
  }
  if (typeof spec === 'string') {
    return { name: spec }
  }
  return {
    name: spec.name ?? 'default',
    mode: spec.mode,
    overrides: spec.overrides,
  }
}

/**
 * Apply overrides to a theme
 */
function applyOverrides(theme: Theme, overrides: ThemeOverrides): Theme {
  // Apply color overrides to both light and dark modes if specified
  const lightColors = overrides.colors
    ? deepMerge(theme.light, overrides.colors)
    : theme.light

  const darkColors = overrides.colors
    ? deepMerge(theme.dark, overrides.colors)
    : theme.dark

  return {
    ...theme,
    accent: deepMerge(theme.accent, overrides.accent),
    light: lightColors,
    dark: darkColors,
    typography: deepMerge(theme.typography, overrides.typography),
    shapes: deepMerge(theme.shapes, overrides.shapes),
    connectors: deepMerge(theme.connectors, overrides.connectors),
    layout: deepMerge(theme.layout, overrides.layout),
    background: deepMerge(theme.background, overrides.background),
  }
}

/**
 * Flatten a theme to a resolved theme for a specific mode
 */
function flattenTheme(theme: Theme, mode: 'light' | 'dark'): ResolvedTheme {
  const modeColors: ThemeModeColors = mode === 'dark' ? theme.dark : theme.light

  return {
    name: theme.name,
    displayName: theme.displayName,
    mode,
    colors: {
      // Mode-specific colors
      background: modeColors.background,
      nodeBackground: modeColors.nodeBackground,
      nodeBorder: modeColors.nodeBorder,
      text: modeColors.text,
      textMuted: modeColors.textMuted,
      connectorStroke: modeColors.connectorStroke,
      // Accent colors (shared across modes)
      accent: theme.accent.primary,
      accentMuted: theme.accent.muted,
      success: theme.accent.success,
      warning: theme.accent.warning,
      error: theme.accent.error,
    },
    typography: { ...theme.typography },
    shapes: { ...theme.shapes },
    connectors: { ...theme.connectors },
    layout: { ...theme.layout },
    background: {
      showGrid: theme.background.showGrid,
      gridStyle: theme.background.gridStyle,
      gridSpacing: theme.background.gridSpacing,
      gridColor: modeColors.gridColor,
    },
  }
}

/**
 * Resolve a ThemeSpec to a fully resolved theme
 *
 * @param spec - Theme specification (name string or config object)
 * @param preferredMode - Optional mode override (ignores spec.mode if provided)
 * @returns Resolved theme with flattened colors for the effective mode
 */
export function resolveTheme(
  spec: ThemeSpec | undefined,
  preferredMode?: 'light' | 'dark'
): ResolvedTheme {
  if (!defaultThemeRef) {
    throw new Error(
      'Theme registry not initialized. Import from @traceflow/themes main entry.'
    )
  }

  // Normalize spec to object form
  const normalized = normalizeSpec(spec)

  // Get base theme from registry
  const baseTheme = themesRegistry[normalized.name] ?? defaultThemeRef

  // Apply overrides if present
  const mergedTheme = normalized.overrides
    ? applyOverrides(baseTheme, normalized.overrides)
    : baseTheme

  // Determine effective mode
  let effectiveMode: 'light' | 'dark'
  if (preferredMode) {
    // Explicit mode override takes precedence
    effectiveMode = preferredMode
  } else if (normalized.mode === 'system' || normalized.mode === undefined) {
    // Auto-detect from system preference
    effectiveMode = getSystemMode()
  } else {
    // Use spec mode
    effectiveMode = normalized.mode
  }

  // Flatten to resolved theme
  return flattenTheme(mergedTheme, effectiveMode)
}

/**
 * Resolve a theme directly from a Theme object (bypasses registry)
 */
export function resolveThemeDirect(
  theme: Theme,
  mode: 'light' | 'dark' = 'light'
): ResolvedTheme {
  return flattenTheme(theme, mode)
}

/**
 * Get the current system color scheme preference
 */
export function getSystemColorScheme(): 'light' | 'dark' {
  return getSystemMode()
}

/**
 * Subscribe to system color scheme changes
 * @returns Unsubscribe function
 */
export function onColorSchemeChange(
  callback: (mode: 'light' | 'dark') => void
): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {} // No-op for SSR
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light')
  }

  mediaQuery.addEventListener('change', handler)

  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}
