import { describe, expect, it } from 'vitest'

import { applyIconToNode, findIconEditAtPosition } from './iconAuthoring'

function applyEdit(sourceValue: string, edit: ReturnType<typeof findIconEditAtPosition>): string {
  if (!edit) return sourceValue
  return `${sourceValue.slice(0, edit.from)}${edit.insert}${sourceValue.slice(edit.to)}`
}

const source = `version: 1
nodes:
  - id: first
    label: First
    icon: search
  - id: second
    label: Second
edges:
  - from: first
    to: second
    label: continue`

describe('icon authoring', () => {
  it('replaces an existing node icon without reformatting the document', () => {
    expect(applyIconToNode(source, 'first', 'concept:review')).toContain(
      '    icon: concept:review'
    )
    expect(applyIconToNode(source, 'first', 'concept:review')).not.toContain('icon: search')
  })

  it('adds an icon to the selected node without drifting into the edges section', () => {
    const updated = applyIconToNode(source, 'second', 'shield-check')
    expect(updated).toContain('  - id: second\n    label: Second\n    icon: shield-check\nedges:')
    expect(updated).toContain('    label: continue')
  })

  it('leaves the source unchanged when the node does not exist', () => {
    expect(applyIconToNode(source, 'missing', 'shield-check')).toBe(source)
  })
})

describe('cursor icon authoring', () => {
  const cursorSource = `version: 1
groups:
  - id: operations
    label: Operations
nodes:
  - id: review
    label: Review request
  - id: ship
    label: Ship order
    icon: truck
edges:
  - id: review-to-ship
    from: review
    to: ship`

  it('adds an icon to the node under the cursor', () => {
    const edit = findIconEditAtPosition(
      cursorSource,
      cursorSource.indexOf('Review request'),
      'concept:review'
    )
    expect(applyEdit(cursorSource, edit)).toContain(
      'label: Review request\n    icon: concept:review'
    )
  })

  it('replaces an existing icon anywhere within its node', () => {
    const edit = findIconEditAtPosition(
      cursorSource,
      cursorSource.indexOf('Ship order'),
      'package-export'
    )
    const updated = applyEdit(cursorSource, edit)
    expect(updated).toContain('icon: package-export')
    expect(updated).not.toContain('icon: truck')
  })

  it('supports group entries', () => {
    const edit = findIconEditAtPosition(
      cursorSource,
      cursorSource.indexOf('Operations'),
      'building-factory'
    )
    expect(applyEdit(cursorSource, edit)).toContain(
      'label: Operations\n    icon: building-factory'
    )
  })

  it('refuses to edit edges or top-level document fields', () => {
    expect(findIconEditAtPosition(
      cursorSource,
      cursorSource.indexOf('review-to-ship'),
      'link'
    )).toBeNull()
    expect(findIconEditAtPosition(
      cursorSource,
      cursorSource.indexOf('version'),
      'file'
    )).toBeNull()
  })
})
