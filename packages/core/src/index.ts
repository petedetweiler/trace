// @traceflow/core - AI-first diagram rendering engine

export { parse, MAX_INPUT_SIZE, InputSizeError } from './parser'
export type { ParseOptions } from './parser'

export { validate, DEFAULT_LIMITS } from './validator'
export type { ValidationError, ValidationResult, ValidationOptions } from './validator'

export { computeLayout } from './layout'
export type { LayoutOptions } from './layout'
export { render } from './renderer'
export type { RenderOptions } from './renderer'
export { escapeXml, escapeXmlAttr, sanitizeId } from './escape'
export * from './types'

// Re-export commonly used theme functions from @traceflow/themes
export {
  resolveTheme,
  resolveThemeDirect,
  getSystemColorScheme,
  onColorSchemeChange,
  themes,
  getTheme,
  getThemeNames,
  defaultTheme,
  blueprintTheme,
  corporateTheme,
  vibrantTheme,
} from '@traceflow/themes'
