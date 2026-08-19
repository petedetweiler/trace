import { useEffect, useState } from 'react'
import { themes } from '@traceflow/core'
import type { ThemeBuilderValues } from '../utils/themeBuilder'

interface ThemeBuilderDialogProps {
  open: boolean
  initialValues: ThemeBuilderValues
  onClose: () => void
  onApply: (values: ThemeBuilderValues) => void
}

const THEMES = Object.values(themes)

export function ThemeBuilderDialog({ open, initialValues, onClose, onApply }: ThemeBuilderDialogProps) {
  const [values, setValues] = useState(initialValues)

  useEffect(() => {
    if (open) setValues(initialValues)
  }, [open, initialValues])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null
  const set = <K extends keyof ThemeBuilderValues>(key: K, value: ThemeBuilderValues[K]) => (
    setValues((current) => ({ ...current, [key]: value }))
  )
  const colors = [values.accent, values.background, values.nodeBackground, values.nodeBorder, values.text]
  const isValid = colors.every((color) => /^#[0-9a-f]{6}$/i.test(color))
    && Number.isFinite(values.nodeCornerRadius)
    && values.nodeCornerRadius >= 0
    && values.nodeCornerRadius <= 48
    && Number.isFinite(values.strokeWidth)
    && values.strokeWidth >= 1
    && values.strokeWidth <= 8

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="dialog theme-builder-dialog" role="dialog" aria-modal="true" aria-labelledby="theme-builder-title">
        <div className="dialog-header">
          <div>
            <h2 id="theme-builder-title">Custom theme builder</h2>
            <p>Start from a bundled theme, then tune its most useful tokens.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close theme builder">×</button>
        </div>
        <div className="theme-builder-grid">
          <label>Base theme<select value={values.name} onChange={(event) => set('name', event.target.value)}>{THEMES.map((theme) => <option key={theme.name} value={theme.name}>{theme.displayName}</option>)}</select></label>
          <label>Mode<select value={values.mode} onChange={(event) => set('mode', event.target.value as ThemeBuilderValues['mode'])}><option>system</option><option>light</option><option>dark</option></select></label>
          <ColorField label="Accent" value={values.accent} onChange={(value) => set('accent', value)} />
          <ColorField label="Canvas" value={values.background} onChange={(value) => set('background', value)} />
          <ColorField label="Node fill" value={values.nodeBackground} onChange={(value) => set('nodeBackground', value)} />
          <ColorField label="Node border" value={values.nodeBorder} onChange={(value) => set('nodeBorder', value)} />
          <ColorField label="Text" value={values.text} onChange={(value) => set('text', value)} />
          <label>Corner radius<input type="number" min="0" max="48" value={values.nodeCornerRadius} onChange={(event) => set('nodeCornerRadius', Number(event.target.value))} /></label>
          <label>Stroke width<input type="number" min="1" max="8" step="0.5" value={values.strokeWidth} onChange={(event) => set('strokeWidth', Number(event.target.value))} /></label>
          <label>Connectors<select value={values.curveStyle} onChange={(event) => set('curveStyle', event.target.value as ThemeBuilderValues['curveStyle'])}><option>bezier</option><option>orthogonal</option><option>organic</option></select></label>
          <label>Grid style<select value={values.gridStyle} onChange={(event) => set('gridStyle', event.target.value as ThemeBuilderValues['gridStyle'])}><option>dots</option><option>lines</option><option>blueprint</option></select></label>
          <label className="checkbox-field"><input type="checkbox" checked={values.showGrid} onChange={(event) => set('showGrid', event.target.checked)} />Show grid</label>
        </div>
        <div className="theme-preview-strip" style={{ background: values.background, borderColor: values.nodeBorder }}>
          <span style={{ background: values.nodeBackground, borderColor: values.nodeBorder, color: values.text, borderRadius: values.nodeCornerRadius }}>Preview node</span>
          <i style={{ background: values.accent }} />
          <span style={{ background: values.nodeBackground, borderColor: values.accent, color: values.text, borderRadius: values.nodeCornerRadius }}>Next step</span>
        </div>
        {!isValid && <div className="dialog-error" role="alert">Use six-digit hex colors and values within the shown numeric ranges.</div>}
        <div className="dialog-actions">
          <button className="button button-secondary" onClick={onClose}>Cancel</button>
          <button className="button button-primary" disabled={!isValid} onClick={() => { onApply(values); onClose() }}>Apply to YAML</button>
        </div>
      </section>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<span className="color-field"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><input value={value} pattern="#[0-9a-fA-F]{6}" onChange={(event) => onChange(event.target.value)} /></span></label>
}
