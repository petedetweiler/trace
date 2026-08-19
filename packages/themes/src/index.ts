// @traceflow/themes - Theme definitions for Traceflow diagrams

// Export all types
export * from './types'

// Export bundled themes
export { defaultTheme } from './default'
export { editorialTheme } from './themes/editorial'
export { werkstattTheme } from './themes/werkstatt'
export { blueprintTheme } from './themes/blueprint'
export { terminalTheme } from './themes/terminal'
export { nocturneTheme } from './themes/nocturne'

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
import { editorialTheme } from './themes/editorial'
import { werkstattTheme } from './themes/werkstatt'
import { blueprintTheme } from './themes/blueprint'
import { terminalTheme } from './themes/terminal'
import { nocturneTheme } from './themes/nocturne'
import { setThemesRegistry } from './resolver'
import type { Theme } from './types'

/**
 * All bundled themes
 */
export const themes: Record<string, Theme> = {
  editorial: editorialTheme,
  werkstatt: werkstattTheme,
  blueprint: blueprintTheme,
  terminal: terminalTheme,
  nocturne: nocturneTheme,
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
