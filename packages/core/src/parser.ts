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
 * Keys that could lead to prototype pollution if allowed in parsed objects
 */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Recursively ensure parsed YAML structures do not contain unsafe keys
 */
function assertNoPrototypePoison(value: unknown, path = 'root', seen = new WeakSet()): void {
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) return
  seen.add(value)

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrototypePoison(item, `${path}[${index}]`, seen))
    return
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (UNSAFE_KEYS.has(key)) {
      throw new Error(`Unsafe key "${key}" found at ${path}`)
    }
    assertNoPrototypePoison((value as Record<string, unknown>)[key], `${path}.${key}`, seen)
  }
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

  // Limit alias expansion to avoid YAML entity expansion DoS attacks
  const doc = parseYaml(yaml, {
    maxAliasCount: 50,
  }) as TraceDocument

  // Prevent prototype pollution by rejecting unsafe keys
  assertNoPrototypePoison(doc)
  return doc
}
