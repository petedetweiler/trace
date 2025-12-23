// YAML parser for Trace documents

import { parse as parseYaml } from 'yaml'
import type { TraceDocument } from './types'

/**
 * Maximum input size in bytes (100KB)
 */
export const MAX_INPUT_SIZE = 100 * 1024

/**
 * Error thrown when input exceeds size limits
 */
export class InputSizeError extends Error {
  constructor(size: number, maxSize: number) {
    super(`Input size (${size} bytes) exceeds maximum allowed (${maxSize} bytes)`)
    this.name = 'InputSizeError'
  }
}

/**
 * Parse options
 */
export interface ParseOptions {
  /** Maximum input size in bytes (default: 100KB) */
  maxInputSize?: number
}

/**
 * Parse a YAML string into a TraceDocument
 * @throws {InputSizeError} If input exceeds size limits
 */
export function parse(yaml: string, options: ParseOptions = {}): TraceDocument {
  const maxSize = options.maxInputSize ?? MAX_INPUT_SIZE

  // Check input size (UTF-8 byte length)
  const inputSize = new TextEncoder().encode(yaml).length
  if (inputSize > maxSize) {
    throw new InputSizeError(inputSize, maxSize)
  }

  const doc = parseYaml(yaml) as TraceDocument
  return doc
}
