import { useRef, useEffect, useState } from 'react'

interface TooltipProps {
  content: string
  position: { x: number; y: number }
  visible: boolean
}

export default function Tooltip({ content, position, visible }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (!tooltipRef.current || !visible) return

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const offsetX = 16
    const offsetY = 28
    let x = position.x + offsetX
    let y = position.y + offsetY

    // Flip horizontally if overflow
    if (x + rect.width > viewportWidth - 8) {
      x = position.x - rect.width - offsetX
    }

    // Flip vertically if overflow
    if (y + rect.height > viewportHeight - 8) {
      y = position.y - rect.height - offsetY
    }

    // Ensure minimum bounds
    x = Math.max(8, x)
    y = Math.max(8, y)

    setAdjustedPosition({ x, y })
  }, [position, visible])

  return (
    <div
      ref={tooltipRef}
      className={`trace-tooltip ${visible ? 'visible' : ''}`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {content}
    </div>
  )
}
