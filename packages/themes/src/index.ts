// @traceflow/themes - Theme definitions for Traceflow diagrams

// Export all types
export * from './types'

// Export bundled themes
export { defaultTheme } from './default'
export { blueprintTheme } from './themes/blueprint'
export { corporateTheme } from './themes/corporate'
export { vibrantTheme } from './themes/vibrant'

// Export resolver functions
export {
  resolveTheme,
  resolveThemeDirect,
  getSystemColorScheme,
  onColorSchemeChange,
} from './resolver'

// Export utilities
export { deepMerge } from './utils'

import { defaultTheme } from './default'
import { blueprintTheme } from './themes/blueprint'
import { corporateTheme } from './themes/corporate'
import { vibrantTheme } from './themes/vibrant'
import { setThemesRegistry } from './resolver'
import type { Theme } from './types'

/**
 * All bundled themes
 */
export const themes: Record<string, Theme> = {
  default: defaultTheme,
  blueprint: blueprintTheme,
  corporate: corporateTheme,
  vibrant: vibrantTheme,
}

// Initialize the resolver with the themes registry
setThemesRegistry(themes, defaultTheme)

/**
 * Get a theme by name, falling back to default
 */
export function getTheme(name: string): Theme {
  return themes[name] ?? defaultTheme
}

/**
 * List all available theme names
 */
export function getThemeNames(): string[] {
  return Object.keys(themes)
}
