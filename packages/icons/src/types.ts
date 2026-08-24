export type IconElementName = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse'

export type IconElement = readonly [
  name: IconElementName,
  attributes: Readonly<Record<string, string>>,
]

export interface IconDefinition {
  elements: readonly IconElement[]
}

export type IconRegistry = Readonly<Record<string, IconDefinition>>

export interface IconCatalogEntry {
  name: string
  tags: readonly string[]
  category?: string
}

export interface IconPack {
  prefix: string
  name: string
  version: string
  license: 'MIT'
  icons: IconRegistry
  catalog: readonly IconCatalogEntry[]
}

export type ResolvedIconReference =
  | { kind: 'icon'; name: string; pack: IconPack; definition: IconDefinition }
  | { kind: 'glyph'; value: string }
  | { kind: 'unknown'; value: string }
