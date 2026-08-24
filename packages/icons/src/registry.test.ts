import { describe, expect, it } from 'vitest'

import { resolveIconReference, tablerEssentialPack } from './index'
import { tablerIconPack } from './tabler'

describe('Traceflow icon registry', () => {
  it('ships a focused MIT essential pack and a complete non-brand Tabler pack', () => {
    expect(tablerEssentialPack.license).toBe('MIT')
    expect(tablerEssentialPack.version).toBe('3.46.0')
    expect(Object.keys(tablerEssentialPack.icons)).toHaveLength(148)
    expect(Object.keys(tablerIconPack.icons)).toHaveLength(4754)
    expect(Object.keys(tablerIconPack.icons).some((name) => name.startsWith('brand-'))).toBe(false)
  })

  it('resolves direct names, namespaces, semantic concepts, and legacy aliases', () => {
    expect(resolveIconReference('shield-check')?.kind).toBe('icon')
    expect(resolveIconReference('tabler:shield-check')?.kind).toBe('icon')

    const concept = resolveIconReference('concept:approval')
    expect(concept?.kind).toBe('icon')
    if (concept?.kind === 'icon') expect(concept.name).toBe('circle-check')

    const alias = resolveIconReference('wrench')
    expect(alias?.kind).toBe('icon')
    if (alias?.kind === 'icon') expect(alias.name).toBe('tool')
  })

  it('supports the optional full pack without adding brand icons', () => {
    expect(resolveIconReference('tabler:zeppelin', [tablerIconPack])?.kind).toBe('icon')
    expect(resolveIconReference('tabler:brand-github', [tablerIconPack])?.kind).toBe('unknown')
  })

  it('preserves intentional text and emoji glyphs while flagging unknown names', () => {
    expect(resolveIconReference('text:API')).toEqual({ kind: 'glyph', value: 'API' })
    expect(resolveIconReference('emoji:🚚')).toEqual({ kind: 'glyph', value: '🚚' })
    expect(resolveIconReference('<>')).toEqual({ kind: 'glyph', value: '<>' })
    expect(resolveIconReference('shield-chek')).toEqual({ kind: 'unknown', value: 'shield-chek' })
  })
})
