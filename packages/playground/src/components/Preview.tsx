import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import type { EdgeKind, EdgeStyle, Emphasis, NodeType, Status, TraceDocument } from '@traceflow/core'
import Tooltip from './Tooltip'

interface PreviewProps {
  svg: string | null
  document: TraceDocument | null
  onSelect?: (selection: DiagramSelection) => void
}

export type DiagramSelection = {
  kind: 'node'
  id: string
  label: string
  description?: string
  type?: NodeType
  icon?: string
  emphasis?: Emphasis
  status?: Status
} | {
  kind: 'edge'
  label?: string
  description?: string
  from: string
  to: string
  edgeKind?: EdgeKind
  style?: EdgeStyle
}

interface ViewBoxState {
  x: number
  y: number
  width: number
  height: number
}

interface ViewportApi {
  fit: () => void
  zoomBy: (factor: number) => void
}

const WHEEL_ZOOM_SENSITIVITY = 0.0022

/**
 * Configure DOMPurify for SVG sanitization.
 * Exported SVG stays script-free; playground interaction is attached by React.
 */
function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_ATTR: [
      'aria-label',
      'data-id',
      'data-index',
      'data-type',
      'data-from',
      'data-to',
      'role',
      'tabindex',
    ],
  })
}

function readViewBox(svg: SVGSVGElement): ViewBoxState {
  const value = svg.viewBox.baseVal
  return { x: value.x, y: value.y, width: value.width, height: value.height }
}

function writeViewBox(svg: SVGSVGElement, viewBox: ViewBoxState): void {
  svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`)
}

export default function Preview({ svg, document, onSelect }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportApiRef = useRef<ViewportApi | null>(null)
  const [tooltip, setTooltip] = useState<{
    content: string
    x: number
    y: number
  } | null>(null)

  const sanitizedSvg = useMemo(() => {
    if (!svg) return null
    return sanitizeSvg(svg)
  }, [svg])

  // Attach a host-controlled SVG viewport. These mutations affect only the
  // playground DOM; downloaded SVG remains portable and script-free.
  useEffect(() => {
    const container = containerRef.current
    const svgElement = container?.querySelector<SVGSVGElement>('.trace-diagram')
    if (!container || !svgElement) {
      viewportApiRef.current = null
      return
    }

    const baseViewBox = readViewBox(svgElement)
    let currentViewBox = { ...baseViewBox }
    let activePointerId: number | null = null
    let lastPointer = { x: 0, y: 0 }

    svgElement.setAttribute('width', '100%')
    svgElement.setAttribute('height', '100%')
    svgElement.style.touchAction = 'none'
    svgElement.style.cursor = 'grab'

    const apply = (nextViewBox: ViewBoxState) => {
      currentViewBox = nextViewBox
      writeViewBox(svgElement, nextViewBox)
    }

    const fit = () => apply({ ...baseViewBox })

    const zoomAt = (factor: number, clientX: number, clientY: number) => {
      const currentScale = baseViewBox.width / currentViewBox.width
      const nextScale = Math.min(8, Math.max(0.25, currentScale * factor))
      const effectiveFactor = nextScale / currentScale
      if (effectiveFactor === 1) return

      const matrix = svgElement.getScreenCTM()
      if (!matrix) return
      const point = svgElement.createSVGPoint()
      point.x = clientX
      point.y = clientY
      const svgPoint = point.matrixTransform(matrix.inverse())
      const nextWidth = currentViewBox.width / effectiveFactor
      const nextHeight = currentViewBox.height / effectiveFactor
      const relativeX = (svgPoint.x - currentViewBox.x) / currentViewBox.width
      const relativeY = (svgPoint.y - currentViewBox.y) / currentViewBox.height

      apply({
        x: svgPoint.x - relativeX * nextWidth,
        y: svgPoint.y - relativeY * nextHeight,
        width: nextWidth,
        height: nextHeight,
      })
    }

    const zoomBy = (factor: number) => {
      const rect = svgElement.getBoundingClientRect()
      zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      // Trackpads emit many small pixel deltas per gesture, while mouse wheels
      // usually emit fewer line-sized deltas. Converting both to pixels and
      // using an exponential curve makes zoom proportional to the gesture's
      // total travel instead of applying a large fixed step to every event.
      const deltaMultiplier = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? svgElement.clientHeight
          : 1
      const normalizedDelta = Math.max(-100, Math.min(100, event.deltaY * deltaMultiplier))
      zoomAt(
        Math.exp(-normalizedDelta * WHEEL_ZOOM_SENSITIVITY),
        event.clientX,
        event.clientY
      )
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      activePointerId = event.pointerId
      lastPointer = { x: event.clientX, y: event.clientY }
      svgElement.setPointerCapture(event.pointerId)
      svgElement.style.cursor = 'grabbing'
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return
      const rect = svgElement.getBoundingClientRect()
      const deltaX = event.clientX - lastPointer.x
      const deltaY = event.clientY - lastPointer.y
      lastPointer = { x: event.clientX, y: event.clientY }
      apply({
        ...currentViewBox,
        x: currentViewBox.x - deltaX * (currentViewBox.width / rect.width),
        y: currentViewBox.y - deltaY * (currentViewBox.height / rect.height),
      })
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return
      activePointerId = null
      if (svgElement.hasPointerCapture(event.pointerId)) {
        svgElement.releasePointerCapture(event.pointerId)
      }
      svgElement.style.cursor = 'grab'
    }

    viewportApiRef.current = { fit, zoomBy }
    svgElement.addEventListener('wheel', handleWheel, { passive: false })
    svgElement.addEventListener('pointerdown', handlePointerDown)
    svgElement.addEventListener('pointermove', handlePointerMove)
    svgElement.addEventListener('pointerup', handlePointerUp)
    svgElement.addEventListener('pointercancel', handlePointerUp)
    svgElement.addEventListener('dblclick', fit)

    return () => {
      viewportApiRef.current = null
      svgElement.removeEventListener('wheel', handleWheel)
      svgElement.removeEventListener('pointerdown', handlePointerDown)
      svgElement.removeEventListener('pointermove', handlePointerMove)
      svgElement.removeEventListener('pointerup', handlePointerUp)
      svgElement.removeEventListener('pointercancel', handlePointerUp)
      svgElement.removeEventListener('dblclick', fit)
    }
  }, [sanitizedSvg])

  // Event delegation keeps the exported SVG inert while the playground adds
  // tooltips and a persistent details panel around it.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !document) return

    const nodeMap = new Map(document.nodes.map((node) => [node.id, node]))

    const getDescription = (target: Element): string | undefined => {
      const nodeElement = target.closest('.trace-node')
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id')
        return nodeId ? nodeMap.get(nodeId)?.description : undefined
      }

      const edgeElement = target.closest('.trace-edge')
      const edgeIndex = Number(edgeElement?.getAttribute('data-index'))
      return Number.isInteger(edgeIndex) ? document.edges[edgeIndex]?.description : undefined
    }

    const getSelection = (target: Element): DiagramSelection | null => {
      const nodeElement = target.closest('.trace-node')
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id')
        const node = nodeId ? nodeMap.get(nodeId) : undefined
        return node ? { kind: 'node', ...node } : null
      }
      const edgeElement = target.closest('.trace-edge')
      const edgeIndex = Number(edgeElement?.getAttribute('data-index'))
      const edge = Number.isInteger(edgeIndex) ? document.edges[edgeIndex] : undefined
      return edge ? {
        kind: 'edge',
        label: edge.label,
        description: edge.description,
        from: edge.from,
        to: edge.to,
        edgeKind: edge.kind,
        style: edge.style,
      } : null
    }

    const showTooltip = (target: Element, x: number, y: number) => {
      const description = getDescription(target)
      setTooltip(description ? { content: description, x, y } : null)
    }

    const handleMouseOver = (event: MouseEvent) => {
      showTooltip(event.target as Element, event.clientX, event.clientY)
    }
    const handleMouseOut = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget as Element | null
      if (!relatedTarget?.closest('.trace-node, .trace-edge')) setTooltip(null)
    }
    const handleMouseMove = (event: MouseEvent) => {
      setTooltip((previous) => previous
        ? { ...previous, x: event.clientX, y: event.clientY }
        : null)
    }
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Element
      const rect = target.getBoundingClientRect()
      showTooltip(target, rect.right, rect.top)
    }
    const handleFocusOut = () => setTooltip(null)
    const handleClick = (event: MouseEvent) => {
      const selection = getSelection(event.target as Element)
      if (selection) onSelect?.(selection)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const selection = getSelection(event.target as Element)
      if (!selection) return
      event.preventDefault()
      onSelect?.(selection)
    }

    container.addEventListener('mouseover', handleMouseOver)
    container.addEventListener('mouseout', handleMouseOut)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focusout', handleFocusOut)
    container.addEventListener('click', handleClick)
    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('mouseover', handleMouseOver)
      container.removeEventListener('mouseout', handleMouseOut)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('focusin', handleFocusIn)
      container.removeEventListener('focusout', handleFocusOut)
      container.removeEventListener('click', handleClick)
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [document, onSelect, sanitizedSvg])

  const zoomIn = useCallback(() => viewportApiRef.current?.zoomBy(1.25), [])
  const zoomOut = useCallback(() => viewportApiRef.current?.zoomBy(1 / 1.25), [])
  const fit = useCallback(() => viewportApiRef.current?.fit(), [])

  if (!sanitizedSvg) {
    return <div className="preview-empty">No diagram to display</div>
  }

  return (
    <div className="preview-stage">
      <div
        ref={containerRef}
        className="preview-canvas"
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
      <div className="viewport-controls" role="group" aria-label="Diagram viewport">
        <button onClick={zoomOut} aria-label="Zoom out" title="Zoom out">−</button>
        <button onClick={zoomIn} aria-label="Zoom in" title="Zoom in">+</button>
        <button onClick={fit} aria-label="Fit diagram" title="Fit diagram to preview">
          <FitIcon />
        </button>
      </div>
      {tooltip && (
        <Tooltip
          content={tooltip.content}
          position={{ x: tooltip.x, y: tooltip.y }}
          visible={true}
        />
      )}
    </div>
  )
}

function FitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 2H2V5M9 2H12V5M12 9V12H9M5 12H2V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
