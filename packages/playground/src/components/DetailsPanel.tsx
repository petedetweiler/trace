import type { DiagramSelection } from './Preview'

interface DetailsPanelProps {
  selection: DiagramSelection
  onClose: () => void
}

export function DetailsPanel({ selection, onClose }: DetailsPanelProps) {
  return (
    <aside className="details-panel" aria-label={`${selection.kind} details`}>
      <div className="details-panel-header">
        <span className="details-kind">{selection.kind}</span>
        <button className="icon-button" onClick={onClose} aria-label="Close details">×</button>
      </div>
      <h2>{selection.label || (selection.kind === 'edge' ? `${selection.from} → ${selection.to}` : selection.id)}</h2>
      {selection.description
        ? <p>{selection.description}</p>
        : <p className="details-empty">No description yet. Add a <code>description</code> field in YAML.</p>}
      <dl>
        {selection.kind === 'node' ? (
          <>
            <Detail label="ID" value={selection.id} />
            <Detail label="Type" value={selection.type ?? 'process'} />
            {selection.icon && <Detail label="Icon" value={selection.icon} />}
            {selection.status && <Detail label="Status" value={selection.status} />}
            {selection.emphasis && <Detail label="Emphasis" value={selection.emphasis} />}
          </>
        ) : (
          <>
            <Detail label="From" value={selection.from} />
            <Detail label="To" value={selection.to} />
            <Detail label="Kind" value={selection.edgeKind ?? 'primary'} />
            <Detail label="Style" value={selection.style ?? 'solid'} />
          </>
        )}
      </dl>
    </aside>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>
}
