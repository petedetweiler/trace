import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface PreviewProps {
  svg: string | null
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

export default function Preview({ svg }: PreviewProps) {
  // Memoize sanitization to avoid re-running on every render
  const sanitizedSvg = useMemo(() => {
    if (!svg) return null
    return sanitizeSvg(svg)
  }, [svg])

  if (!sanitizedSvg) {
    return (
      <div style={{ color: '#6B6B6B', fontSize: '14px' }}>
        No diagram to display
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'auto',
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
    />
  )
}
