import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import type { EdgeKind, EdgeStyle, Emphasis, NodeType, Status, TraceDocument } from '@traceflow/core'
import Tooltip from './Tooltip'

interface PreviewProps {
  svg: string | null
  document: TraceDocument | null
  onSelect?: (selection: DiagramSelection, anchor: DiagramSelectionAnchor) => void
  onEditIcon?: (selection: NodeDiagramSelection, anchor: DiagramSelectionAnchor) => void
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

export type NodeDiagramSelection = Extract<DiagramSelection, { kind: 'node' }>

export interface DiagramSelectionAnchor {
  left: number
  top: number
  right: number
  bottom: number
  centerX: number
  centerY: number
  containerWidth: number
  containerHeight: number
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
      'data-icon-reference',
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

export default function Preview({ svg, document, onSelect, onEditIcon }: PreviewProps) {
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
      const target = event.target as Element | null
      // Nodes and edges have their own click actions. Starting a pan gesture
      // from them makes ordinary trackpad clicks easy to misclassify as a
      // drag, especially on the relatively small icon targets.
      if (target?.closest('.trace-node, .trace-edge')) return
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

    const getTooltipContent = (target: Element): string | undefined => {
      const nodeElement = target.closest('.trace-node')
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id')
        const node = nodeId ? nodeMap.get(nodeId) : undefined
        if (target.closest('.trace-node-icon-target') && node) {
          return `Change icon for ${node.label}`
        }
        return node?.description
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

    const getSelectionAnchor = (target: Element): DiagramSelectionAnchor | null => {
      const selectedElement = target.closest('.trace-node, .trace-edge')
      const host = container.closest('.preview-content')
      if (!selectedElement || !host) return null
      const selectedRect = selectedElement.getBoundingClientRect()
      const hostRect = host.getBoundingClientRect()
      const left = selectedRect.left - hostRect.left
      const top = selectedRect.top - hostRect.top
      const right = selectedRect.right - hostRect.left
      const bottom = selectedRect.bottom - hostRect.top
      return {
        left,
        top,
        right,
        bottom,
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2,
        containerWidth: hostRect.width,
        containerHeight: hostRect.height,
      }
    }

    const showTooltip = (target: Element, x: number, y: number) => {
      const content = getTooltipContent(target)
      setTooltip(content ? { content, x, y } : null)
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
      const target = event.target as Element
      const selection = getSelection(target)
      const anchor = getSelectionAnchor(target)
      if (!selection || !anchor) return
      if (
        selection.kind === 'node'
        && target.closest('.trace-node-icon-target')
        && onEditIcon
      ) {
        event.preventDefault()
        onEditIcon(selection, anchor)
        return
      }
      onSelect?.(selection, anchor)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const target = event.target as Element
      const selection = getSelection(target)
      const anchor = getSelectionAnchor(target)
      if (!selection || !anchor) return
      event.preventDefault()
      onSelect?.(selection, anchor)
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
  }, [document, onEditIcon, onSelect, sanitizedSvg])

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
