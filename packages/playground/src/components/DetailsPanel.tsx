import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import type { Emphasis, NodeType, Status } from '@traceflow/core'
import { calculateInspectorPosition } from '../utils/inspectorPosition'
import type { NodeAttributeUpdates } from '../utils/nodeAuthoring'
import type {
  DiagramSelection,
  DiagramSelectionAnchor,
  NodeDiagramSelection,
} from './Preview'

interface DetailsPanelProps {
  selection: DiagramSelection
  anchor: DiagramSelectionAnchor | null
  onClose: () => void
  onEditIcon?: (selection: NodeDiagramSelection) => void
  onUpdateNode?: (nodeId: string, updates: NodeAttributeUpdates) => void
}

interface NodeDraft {
  label: string
  description: string
  type: NodeType
  status: Status
  emphasis: Emphasis
}

const NODE_TYPES: readonly NodeType[] = [
  'process',
  'decision',
  'start',
  'end',
  'database',
  'external',
  'manual',
  'delay',
]
const NODE_STATUSES: readonly Status[] = ['default', 'success', 'warning', 'error']
const NODE_EMPHASIS: readonly Emphasis[] = ['normal', 'high', 'low']

function draftFor(selection: NodeDiagramSelection): NodeDraft {
  return {
    label: selection.label,
    description: selection.description ?? '',
    type: selection.type ?? 'process',
    status: selection.status ?? 'default',
    emphasis: selection.emphasis ?? 'normal',
  }
}

export function DetailsPanel({
  selection,
  anchor,
  onClose,
  onEditIcon,
  onUpdateNode,
}: DetailsPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [position, setPosition] = useState<{
    left: number
    top: number
    width: number
  } | null>(null)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !anchor) {
      setPosition(null)
      return
    }

    const updatePosition = () => {
      const panelRect = panel.getBoundingClientRect()
      setPosition(calculateInspectorPosition(anchor, panelRect.height))
    }

    updatePosition()
    const resizeObserver = new ResizeObserver(updatePosition)
    resizeObserver.observe(panel)
    window.addEventListener('resize', updatePosition)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePosition)
    }
  }, [anchor, selection.kind])

  const positionStyle = position
    ? ({
      left: position.left,
      right: 'auto',
      top: position.top,
      width: position.width,
    } satisfies CSSProperties)
    : undefined

  return (
    <aside
      ref={panelRef}
      className="details-panel"
      aria-label={`${selection.kind} details`}
      style={positionStyle}
    >
      <div className="details-panel-header">
        <span className="details-kind">{selection.kind}</span>
        <button className="icon-button" onClick={onClose} aria-label="Close details">×</button>
      </div>
      {selection.kind === 'node' ? (
        <NodeInspector
          selection={selection}
          onEditIcon={onEditIcon}
          onUpdateNode={onUpdateNode}
        />
      ) : (
        <EdgeDetails selection={selection} />
      )}
    </aside>
  )
}

function NodeInspector({
  selection,
  onEditIcon,
  onUpdateNode,
}: {
  selection: NodeDiagramSelection
  onEditIcon?: (selection: NodeDiagramSelection) => void
  onUpdateNode?: (nodeId: string, updates: NodeAttributeUpdates) => void
}) {
  const [draft, setDraft] = useState<NodeDraft>(() => draftFor(selection))

  useEffect(() => {
    setDraft(draftFor(selection))
  }, [
    selection.id,
    selection.label,
    selection.description,
    selection.type,
    selection.status,
    selection.emphasis,
  ])

  const baseline = draftFor(selection)
  const isDirty = Object.keys(draft).some(
    (key) => draft[key as keyof NodeDraft] !== baseline[key as keyof NodeDraft]
  )
  const labelIsEmpty = draft.label.trim().length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onUpdateNode || !isDirty || labelIsEmpty) return

    const updates: NodeAttributeUpdates = {}
    const nextLabel = draft.label.trim()
    const nextDescription = draft.description.trim()
    if (nextLabel !== selection.label) updates.label = nextLabel
    if (nextDescription !== (selection.description ?? '')) {
      updates.description = nextDescription || null
    }
    if (draft.type !== (selection.type ?? 'process')) {
      updates.type = draft.type
    }
    if (draft.status !== (selection.status ?? 'default')) {
      updates.status = draft.status === 'default' ? null : draft.status
    }
    if (draft.emphasis !== (selection.emphasis ?? 'normal')) {
      updates.emphasis = draft.emphasis === 'normal' ? null : draft.emphasis
    }
    onUpdateNode(selection.id, updates)
  }

  return (
    <form className="node-inspector" onSubmit={handleSubmit}>
      <label className="inspector-field">
        <span>Label</span>
        <input
          type="text"
          value={draft.label}
          onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
          aria-invalid={labelIsEmpty}
          aria-describedby={labelIsEmpty ? 'node-label-error' : undefined}
        />
      </label>
      {labelIsEmpty && (
        <span id="node-label-error" className="inspector-field-error">A node label is required.</span>
      )}

      <label className="inspector-field">
        <span>Description</span>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          placeholder="Add helpful context for readers…"
        />
      </label>

      {onEditIcon && (
        <button
          className="details-icon-action"
          type="button"
          onClick={() => onEditIcon(selection)}
        >
          <span className="details-icon-action-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <circle cx="17" cy="17" r="3" />
            </svg>
          </span>
          <span className="details-icon-action-copy">
            <strong>{selection.icon ? 'Change icon' : 'Choose icon'}</strong>
            <small>{selection.icon ?? 'Search and preview the MIT icon library'}</small>
          </span>
          <span className="details-icon-action-arrow" aria-hidden="true">→</span>
        </button>
      )}

      <fieldset className="inspector-appearance">
        <legend>Appearance</legend>
        <label className="inspector-field">
          <span>Type</span>
          <select
            value={draft.type}
            onChange={(event) => setDraft((current) => ({
              ...current,
              type: event.target.value as NodeType,
            }))}
          >
            {NODE_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <div className="inspector-field-row">
          <label className="inspector-field">
            <span>Status</span>
            <select
              value={draft.status}
              onChange={(event) => setDraft((current) => ({
                ...current,
                status: event.target.value as Status,
              }))}
            >
              {NODE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="inspector-field">
            <span>Emphasis</span>
            <select
              value={draft.emphasis}
              onChange={(event) => setDraft((current) => ({
                ...current,
                emphasis: event.target.value as Emphasis,
              }))}
            >
              {NODE_EMPHASIS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <div className="inspector-identity">
        <span>ID</span>
        <code>{selection.id}</code>
        <small>IDs stay fixed so connected edges remain valid.</small>
      </div>

      {onUpdateNode && (
        <div className="inspector-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={!isDirty}
            onClick={() => setDraft(draftFor(selection))}
          >
            Reset
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={!isDirty || labelIsEmpty}
          >
            Save changes
          </button>
        </div>
      )}
    </form>
  )
}

function EdgeDetails({ selection }: { selection: Extract<DiagramSelection, { kind: 'edge' }> }) {
  return (
    <>
      <h2>{selection.label || `${selection.from} → ${selection.to}`}</h2>
      {selection.description
        ? <p>{selection.description}</p>
        : <p className="details-empty">No description yet. Add a <code>description</code> field in YAML.</p>}
      <dl>
        <Detail label="From" value={selection.from} />
        <Detail label="To" value={selection.to} />
        <Detail label="Kind" value={selection.edgeKind ?? 'primary'} />
        <Detail label="Style" value={selection.style ?? 'solid'} />
      </dl>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>
}
