import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { parse } from './parser'
import { validate } from './validator'

const examplesPath = resolve(
  process.cwd(),
  '../../skills/author-traceflow/references/examples.md'
)
const examplesMarkdown = readFileSync(examplesPath, 'utf8')
const yamlExamples = Array.from(examplesMarkdown.matchAll(/```yaml\n([\s\S]*?)```/g))
  .map((match) => match[1])

describe('author-traceflow skill examples', () => {
  it('contains example documents', () => {
    expect(yamlExamples.length).toBeGreaterThanOrEqual(2)
  })

  it.each(yamlExamples.map((yaml, index) => [index + 1, yaml] as const))(
    'example %i parses and validates',
    (_index, yaml) => {
      expect(validate(parse(yaml))).toEqual({ valid: true, errors: [] })
    }
  )
})
