// @traceflow/themes - Theme definitions for Traceflow diagrams

export { defaultTheme } from './default'
export * from './types'

import { defaultTheme } from './default'
import type { Theme } from './types'

/**
 * All bundled themes
 */
export const themes: Record<string, Theme> = {
  default: defaultTheme,
}

/**
 * Get a theme by name, falling back to default
 */
export function getTheme(name: string): Theme {
  return themes[name] ?? defaultTheme
}
