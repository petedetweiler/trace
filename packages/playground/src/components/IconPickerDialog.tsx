import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import {
  conceptIconMap,
  tablerEssentialPack,
  type IconCatalogEntry,
  type IconDefinition,
  type IconPack,
} from '@traceflow/icons'

interface IconPickerDialogProps {
  open: boolean
  pack: IconPack | null
  error: string | null
  targetLabel?: string
  onClose: () => void
  onSelect: (reference: string) => boolean
}

const concepts = Object.entries(conceptIconMap)
const MAX_RESULTS = 120

function searchScore(entry: IconCatalogEntry, query: string): number | null {
  const name = entry.name.toLowerCase()
  if (name === query) return 0
  if (name.startsWith(query)) return 1
  if (name.includes(query)) return 2
  if (entry.tags.some((tag) => tag.toLowerCase().startsWith(query))) return 3
  if (entry.tags.some((tag) => tag.toLowerCase().includes(query))) return 4
  if (entry.category?.toLowerCase().includes(query)) return 5
  return null
}

function IconPreview({ definition }: { definition: IconDefinition }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {definition.elements.map(([name, attributes], index) => createElement(name, {
        ...attributes,
        key: `${name}-${index}`,
      }))}
    </svg>
  )
}

function IconOption({
  definition,
  label,
  reference,
  onSelect,
}: {
  definition: IconDefinition
  label: string
  reference: string
  onSelect: (reference: string) => void
}) {
  return (
    <button className="icon-option" type="button" onClick={() => onSelect(reference)} title={reference}>
      <span className="icon-option-preview"><IconPreview definition={definition} /></span>
      <span>{label}</span>
    </button>
  )
}

export function IconPickerDialog({
  open,
  pack,
  error,
  targetLabel,
  onClose,
  onSelect,
}: IconPickerDialogProps) {
  const [query, setQuery] = useState('')
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectionError(null)
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  const normalizedQuery = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!pack || !normalizedQuery) return []
    return pack.catalog
      .flatMap((entry) => {
        const score = searchScore(entry, normalizedQuery)
        return score === null ? [] : [{ entry, score }]
      })
      .sort((left, right) => left.score - right.score || left.entry.name.localeCompare(right.entry.name))
      .slice(0, MAX_RESULTS)
      .map(({ entry }) => entry)
  }, [normalizedQuery, pack])

  const matchingConcepts = normalizedQuery
    ? concepts.filter(([concept, target]) => (
      concept.includes(normalizedQuery) || target.includes(normalizedQuery)
    ))
    : concepts

  if (!open) return null

  const choose = (reference: string) => {
    if (onSelect(reference)) {
      onClose()
    } else {
      setSelectionError('Select a node in the diagram or place the editor cursor inside a node or group, then choose again.')
    }
  }
  const activePack = pack ?? tablerEssentialPack
  const popular = tablerEssentialPack.catalog.slice(0, 96)

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="dialog icon-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="icon-picker-title">
        <div className="dialog-header icon-picker-header">
          <div>
            <h2 id="icon-picker-title">Choose an icon</h2>
            <p>{targetLabel
              ? `Apply an icon to ${targetLabel}.`
              : 'Search the MIT Tabler catalog or use a stable workflow concept.'}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close icon picker">×</button>
        </div>
        <label className="icon-search">
          <span className="sr-only">Search icons</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 4,754 icons — shield, invoice, warehouse…"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear icon search">×</button>}
        </label>

        {(error || selectionError) && <div className="dialog-error" role="alert">{error ?? selectionError}</div>}
        {!pack && !error && <div className="icon-picker-loading">Loading the Tabler catalog…</div>}

        <div className="icon-picker-content">
          {matchingConcepts.length > 0 && (
            <section className="icon-picker-section">
              <div className="icon-picker-section-heading">
                <h3>Workflow concepts</h3>
                <span>Stable semantic shortcuts</span>
              </div>
              <div className="icon-grid icon-grid-concepts">
                {matchingConcepts.map(([concept, target]) => {
                  const definition = activePack.icons[target] ?? tablerEssentialPack.icons[target]
                  return definition ? (
                    <IconOption
                      key={concept}
                      definition={definition}
                      label={concept}
                      reference={`concept:${concept}`}
                      onSelect={choose}
                    />
                  ) : null
                })}
              </div>
            </section>
          )}

          <section className="icon-picker-section">
            <div className="icon-picker-section-heading">
              <h3>{normalizedQuery ? 'Tabler results' : 'Workflow essentials'}</h3>
              <span>{normalizedQuery ? `${results.length}${results.length === MAX_RESULTS ? '+' : ''} matches` : 'Curated for process diagrams'}</span>
            </div>
            <div className="icon-grid">
              {(normalizedQuery ? results : popular).map((entry) => {
                const definition = activePack.icons[entry.name] ?? tablerEssentialPack.icons[entry.name]
                return definition ? (
                  <IconOption
                    key={entry.name}
                    definition={definition}
                    label={entry.name}
                    reference={entry.name}
                    onSelect={choose}
                  />
                ) : null
              })}
            </div>
            {normalizedQuery && pack && results.length === 0 && (
              <div className="icon-empty">No icons found. Try a broader workflow term.</div>
            )}
          </section>
        </div>
        <footer className="icon-picker-footer">
          <span>Tabler {activePack.version}</span>
          <span>MIT licensed</span>
          <span>Brand icons excluded</span>
        </footer>
      </section>
    </div>
  )
}
