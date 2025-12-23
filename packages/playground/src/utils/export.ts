/**
 * Export utilities for Traceflow playground
 */

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert SVG string to PNG blob via canvas
 * @param svgString - The SVG markup string
 * @param scale - Scale factor for resolution (default 2x for retina)
 */
export function svgToPng(svgString: string, scale: number = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Parse SVG to get dimensions
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = svgDoc.documentElement

    // Get dimensions from SVG
    const width = parseFloat(svgElement.getAttribute('width') || '800')
    const height = parseFloat(svgElement.getAttribute('height') || '600')

    // Create canvas with scaled dimensions
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    // Scale context for higher resolution
    ctx.scale(scale, scale)

    // Create image from SVG
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      // Draw white background
      ctx.fillStyle = '#F8F8F8'
      ctx.fillRect(0, 0, width, height)

      // Draw SVG
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)

      // Export as PNG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create PNG blob'))
          }
        },
        'image/png',
        1.0
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}

/**
 * Extract a safe filename from YAML title
 */
export function getFilenameFromTitle(yaml: string, extension: string): string {
  // Try to extract title from YAML
  const titleMatch = yaml.match(/^title:\s*(.+)$/m)
  let filename = 'traceflow-diagram'

  if (titleMatch && titleMatch[1]) {
    // Sanitize title for filename
    filename = titleMatch[1]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) // Limit length
  }

  return `${filename}.${extension}`
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
