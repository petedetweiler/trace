// Theme utility functions

/**
 * Check if a value is a plain object
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * Deep merge two objects, with source values overriding target values
 * Arrays are replaced, not merged
 */
export function deepMerge<T>(target: T, source: Partial<T> | undefined): T {
  if (!source) return target

  const result = { ...target } as T

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = (target as Record<string, unknown>)[key]

      if (isObject(sourceValue) && isObject(targetValue)) {
        // Recursively merge nested objects
        ;(result as Record<string, unknown>)[key] = deepMerge(
          targetValue,
          sourceValue
        )
      } else if (sourceValue !== undefined) {
        // Override with source value
        ;(result as Record<string, unknown>)[key] = sourceValue
      }
    }
  }

  return result
}
