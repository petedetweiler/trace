import { useEffect, useRef, useState } from 'react'
import { importMermaid } from '../utils/mermaid'

interface ImportMermaidDialogProps {
  open: boolean
  onClose: () => void
  onImport: (yaml: string) => void
}

const STARTER = `flowchart LR
  request([Request]) --> review{Approved?}
  review -->|yes| publish([Publish])
  review -.->|no| revise[Revise]`

export function ImportMermaidDialog({ open, onClose, onImport }: ImportMermaidDialogProps) {
  const [source, setSource] = useState(STARTER)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    window.setTimeout(() => textareaRef.current?.focus(), 0)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const submit = () => {
    try {
      onImport(importMermaid(source))
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not import this Mermaid flowchart.')
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="dialog import-dialog" role="dialog" aria-modal="true" aria-labelledby="mermaid-title">
        <div className="dialog-header">
          <div>
            <h2 id="mermaid-title">Import Mermaid</h2>
            <p>Flowcharts with TD, LR, BT, or RL direction are supported.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close Mermaid import">×</button>
        </div>
        <textarea
          ref={textareaRef}
          className="code-textarea"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          spellCheck={false}
          aria-label="Mermaid source"
        />
        {error && <div className="dialog-error" role="alert">{error}</div>}
        <div className="dialog-actions">
          <button className="button button-secondary" onClick={onClose}>Cancel</button>
          <button className="button button-primary" onClick={submit}>Import flowchart</button>
        </div>
      </section>
    </div>
  )
}
