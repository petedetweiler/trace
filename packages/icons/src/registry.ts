import { iconAliasMap } from './generated/aliases'
import { conceptIconMap } from './generated/concepts'
import { TABLER_VERSION, essentialCatalog, essentialIcons } from './generated/essential'
import type { IconPack, ResolvedIconReference } from './types'

export const tablerEssentialPack: IconPack = {
  prefix: 'tabler',
  name: 'Tabler Essentials',
  version: TABLER_VERSION,
  license: 'MIT',
  icons: essentialIcons,
  catalog: essentialCatalog,
}

function uniquePacks(packs: readonly IconPack[]): IconPack[] {
  const seen = new Set<string>()
  return [...packs, tablerEssentialPack].filter((pack) => {
    const key = `${pack.prefix}:${pack.version}:${Object.keys(pack.icons).length}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function glyphValue(value: string, limit = 3): string {
  return Array.from(value.trim()).slice(0, limit).join('')
}

export function resolveIconReference(
  reference: string | undefined,
  packs: readonly IconPack[] = []
): ResolvedIconReference | null {
  if (!reference?.trim()) return null
  const raw = reference.trim()
  const lower = raw.toLowerCase()

  if (lower.startsWith('emoji:')) {
    const value = glyphValue(raw.slice(raw.indexOf(':') + 1), 2)
    return value ? { kind: 'glyph', value } : { kind: 'unknown', value: raw }
  }
  if (lower.startsWith('text:')) {
    const value = glyphValue(raw.slice(raw.indexOf(':') + 1), 3)
    return value ? { kind: 'glyph', value } : { kind: 'unknown', value: raw }
  }

  const availablePacks = uniquePacks(packs)
  const conceptMatch = /^concept:([a-z0-9-]+)$/i.exec(lower)
  const target = conceptMatch
    ? conceptIconMap[conceptMatch[1] as keyof typeof conceptIconMap]
    : null
  const iconReference = target
    ?? iconAliasMap[lower as keyof typeof iconAliasMap]
    ?? lower
  const namespaceMatch = /^([a-z0-9-]+):([a-z0-9-]+)$/i.exec(iconReference)

  if (namespaceMatch) {
    const [, prefix, name] = namespaceMatch
    const pack = availablePacks.find((candidate) => candidate.prefix === prefix)
    const definition = pack?.icons[name]
    return pack && definition
      ? { kind: 'icon', name, pack, definition }
      : { kind: 'unknown', value: raw }
  }

  for (const pack of availablePacks) {
    const definition = pack.icons[iconReference]
    if (definition) return { kind: 'icon', name: iconReference, pack, definition }
  }

  const graphemes = Array.from(raw)
  if (graphemes.length <= 3 || /[^a-z0-9-]/i.test(raw)) {
    return { kind: 'glyph', value: glyphValue(raw) }
  }
  return { kind: 'unknown', value: raw }
}

export { conceptIconMap, iconAliasMap }
export type { IconConcept } from './generated/concepts'
