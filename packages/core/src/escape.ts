// XML/HTML escape utilities for security

/**
 * Characters that must be escaped in XML/SVG content
 */
const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

/**
 * Escape a string for safe inclusion in XML/SVG text content
 */
export function escapeXml(str: string): string {
  if (!str) return ''
  return str.replace(/[&<>"']/g, (char) => XML_ESCAPE_MAP[char] || char)
}

/**
 * Escape a string for safe inclusion in XML/SVG attribute values
 * Includes additional characters that could break out of attributes
 */
export function escapeXmlAttr(str: string): string {
  if (!str) return ''
  return str
    .replace(/[&<>"']/g, (char) => XML_ESCAPE_MAP[char] || char)
    .replace(/\r/g, '&#xD;')
    .replace(/\n/g, '&#xA;')
    .replace(/\t/g, '&#x9;')
}

/**
 * Sanitize an ID for use in SVG id/class attributes
 * Only allows alphanumeric, hyphens, and underscores
 */
export function sanitizeId(str: string): string {
  if (!str) return ''
  // Replace any non-safe characters with underscores
  return str.replace(/[^a-zA-Z0-9_-]/g, '_')
}
