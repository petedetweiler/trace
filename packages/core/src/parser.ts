// YAML parser for Trace documents

import { parse as parseYaml } from 'yaml'
import type { TraceDocument } from './types'

/**
 * Parse a YAML string into a TraceDocument
 */
export function parse(yaml: string): TraceDocument {
  const doc = parseYaml(yaml) as TraceDocument
  return doc
}
