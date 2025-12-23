import { useMemo, useState, useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import type { TraceDocument } from '@traceflow/core'
import Tooltip from './Tooltip'

interface PreviewProps {
  svg: string | null
  document: TraceDocument | null
}

/**
 * Configure DOMPurify for SVG sanitization
 * Allow SVG elements and attributes, but block scripts and event handlers
 */
function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Allow data attributes for our node/edge metadata
    ADD_ATTR: ['data-id', 'data-type', 'data-from', 'data-to'],
  })
}

export default function Preview({ svg, document }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    content: string
    x: number
    y: number
  } | null>(null)

  // Memoize sanitization to avoid re-running on every render
  const sanitizedSvg = useMemo(() => {
    if (!svg) return null
    return sanitizeSvg(svg)
  }, [svg])

  // Set up event delegation for hover tooltips
  useEffect(() => {
    const container = containerRef.current
    if (!container || !document) return

    // Build lookup maps for quick access
    const nodeMap = new Map(document.nodes.map((n) => [n.id, n]))
    const edgeMap = new Map(document.edges.map((e) => [`${e.from}-${e.to}`, e]))

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element

      // Walk up to find .trace-node or .trace-edge
      const nodeEl = target.closest('.trace-node')
      const edgeEl = target.closest('.trace-edge')

      let description: string | undefined

      if (nodeEl) {
        const nodeId = nodeEl.getAttribute('data-id')
        if (nodeId) {
          const node = nodeMap.get(nodeId)
          description = node?.description
        }
      } else if (edgeEl) {
        const from = edgeEl.getAttribute('data-from')
        const to = edgeEl.getAttribute('data-to')
        if (from && to) {
          const edge = edgeMap.get(`${from}-${to}`)
          description = edge?.description
        }
      }

      if (description) {
        setTooltip({
          content: description,
          x: e.clientX,
          y: e.clientY,
        })
      } else {
        setTooltip(null)
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as Element | null
      // Only hide if we're leaving to something outside a node/edge
      if (
        !relatedTarget?.closest('.trace-node') &&
        !relatedTarget?.closest('.trace-edge')
      ) {
        setTooltip(null)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Update position as mouse moves within element
      setTooltip((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
      )
    }

    container.addEventListener('mouseover', handleMouseOver)
    container.addEventListener('mouseout', handleMouseOut)
    container.addEventListener('mousemove', handleMouseMove)

    return () => {
      container.removeEventListener('mouseover', handleMouseOver)
      container.removeEventListener('mouseout', handleMouseOut)
      container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [document])

  if (!sanitizedSvg) {
    return (
      <div style={{ color: '#6B6B6B', fontSize: '14px' }}>
        No diagram to display
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          overflow: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
      {tooltip && (
        <Tooltip
          content={tooltip.content}
          position={{ x: tooltip.x, y: tooltip.y }}
          visible={true}
        />
      )}
    </>
  )
}
