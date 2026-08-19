import type { Direction } from '@traceflow/core'

interface LayoutToggleProps {
  direction: Direction
  onChange: (direction: Direction) => void
}

export function LayoutToggle({ direction, onChange }: LayoutToggleProps) {
  const isVertical = direction === 'TB' || direction === 'BT'
  const isReversed = direction === 'BT' || direction === 'RL'
  const toggleReverse = () => {
    const reversed: Record<Direction, Direction> = {
      TB: 'BT',
      BT: 'TB',
      LR: 'RL',
      RL: 'LR',
    }
    onChange(reversed[direction])
  }

  return (
    <div className="layout-toggle" role="group" aria-label="Layout controls">
      <div className="layout-orientation" role="radiogroup" aria-label="Layout orientation">
        <button
          className={`mode-button ${isVertical ? 'active' : ''}`}
          onClick={() => onChange(isReversed ? 'BT' : 'TB')}
          aria-label="Vertical layout"
          aria-checked={isVertical}
          role="radio"
          title="Vertical layout"
        >
          <VerticalIcon />
        </button>
        <button
          className={`mode-button ${!isVertical ? 'active' : ''}`}
          onClick={() => onChange(isReversed ? 'RL' : 'LR')}
          aria-label="Horizontal layout"
          aria-checked={!isVertical}
          role="radio"
          title="Horizontal layout"
        >
          <HorizontalIcon />
        </button>
      </div>
      <span className="layout-divider" aria-hidden="true" />
      <button
        className={`mode-button ${isReversed ? 'active' : ''}`}
        onClick={toggleReverse}
        aria-label="Reverse flow"
        aria-pressed={isReversed}
        title={`Reverse flow (${direction})`}
      >
        <ReverseIcon />
      </button>
    </div>
  )
}

function VerticalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 3V13M8 13L4.5 9.5M8 13L11.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HorizontalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 8H13M13 8L9.5 4.5M13 8L9.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReverseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5H12M12 5L9.5 2.5M12 5L9.5 7.5M13 11H4M4 11L6.5 8.5M4 11L6.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
