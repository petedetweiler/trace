import { parse, stringify } from 'yaml'
import type { ColorSchemeMode } from '@traceflow/core'

export interface ThemeBuilderValues {
  name: string
  mode: ColorSchemeMode
  accent: string
  background: string
  nodeBackground: string
  nodeBorder: string
  text: string
  nodeCornerRadius: number
  strokeWidth: number
  curveStyle: 'bezier' | 'orthogonal' | 'organic'
  showGrid: boolean
  gridStyle: 'dots' | 'lines' | 'blueprint'
}

export const DEFAULT_THEME_BUILDER_VALUES: ThemeBuilderValues = {
  name: 'editorial',
  mode: 'light',
  accent: '#e21a1a',
  background: '#fbfbfa',
  nodeBackground: '#ffffff',
  nodeBorder: '#c9c6c2',
  text: '#111111',
  nodeCornerRadius: 2,
  strokeWidth: 1.5,
  curveStyle: 'bezier',
  showGrid: false,
  gridStyle: 'lines',
}

type UnknownRecord = Record<string, unknown>

function object(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {}
}

/** Merge builder values into YAML while preserving diagram content and unknown theme overrides. */
export function applyThemeBuilder(source: string, values: ThemeBuilderValues): string {
  const document = object(parse(source))
  const existingTheme = typeof document.theme === 'string'
    ? { name: document.theme }
    : object(document.theme)
  const existingOverrides = object(existingTheme.overrides)
  document.theme = {
    ...existingTheme,
    name: values.name,
    mode: values.mode,
    overrides: {
      ...existingOverrides,
      accent: { ...object(existingOverrides.accent), primary: values.accent },
      colors: {
        ...object(existingOverrides.colors),
        background: values.background,
        nodeBackground: values.nodeBackground,
        nodeBorder: values.nodeBorder,
        text: values.text,
      },
      shapes: { ...object(existingOverrides.shapes), nodeCornerRadius: values.nodeCornerRadius },
      connectors: {
        ...object(existingOverrides.connectors),
        strokeWidth: values.strokeWidth,
        curveStyle: values.curveStyle,
      },
      background: {
        ...object(existingOverrides.background),
        showGrid: values.showGrid,
        gridStyle: values.gridStyle,
      },
    },
  }
  return stringify(document, { lineWidth: 0 })
}
