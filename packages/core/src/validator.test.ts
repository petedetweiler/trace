import { describe, expect, it } from 'vitest'

import { validate } from './validator'

describe('validate', () => {
  it('accepts a versioned document with semantic edges and groups', () => {
    const result = validate({
      version: 1,
      direction: 'LR',
      nodes: [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'done', label: 'Done', type: 'end', status: 'success' },
      ],
      edges: [
        { id: 'complete', from: 'start', to: 'done', kind: 'success', animate: true },
      ],
      groups: [{
        id: 'system',
        label: 'System',
        description: 'Owns the complete request lifecycle',
        icon: 'server',
        nodes: ['start', 'done'],
      }],
    })

    expect(result).toEqual({ valid: true, errors: [] })
  })

  it('rejects duplicate ids, invalid enums, and broken group references', () => {
    const result = validate({
      version: 2,
      direction: 'SIDEWAYS',
      nodes: [
        { id: 'same', label: 'One', type: 'typo', status: 'purple' },
        { id: 'same', label: 'Two' },
      ],
      edges: [{ from: 'same', to: 'missing', kind: 'maybe' }],
      groups: [{ id: 'group', label: 'Group', nodes: ['missing'] }],
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'version' }),
      expect.objectContaining({ path: 'direction' }),
      expect.objectContaining({ path: 'nodes[0].type' }),
      expect.objectContaining({ path: 'nodes[0].status' }),
      expect.objectContaining({ path: 'nodes[1].id', message: expect.stringContaining('duplicate') }),
      expect.objectContaining({ path: 'edges[0].to', message: expect.stringContaining('not found') }),
      expect.objectContaining({ path: 'edges[0].kind' }),
      expect.objectContaining({ path: 'groups[0].nodes[0]', message: expect.stringContaining('not found') }),
    ]))
  })

  it('reports non-object and empty documents without throwing', () => {
    expect(validate(null).valid).toBe(false)
    expect(validate({ nodes: [], edges: [] })).toEqual({
      valid: false,
      errors: [{ path: 'nodes', message: 'must contain at least one node' }],
    })
  })

  it('rejects unknown properties consistently with the public schema', () => {
    const result = validate({
      nodes: [{ id: 'start', label: 'Start', typo: true }],
      edges: [],
      surprise: 'field',
    })

    expect(result.errors).toEqual(expect.arrayContaining([
      { path: 'surprise', message: 'is not a supported property' },
      { path: 'nodes[0].typo', message: 'is not a supported property' },
    ]))
  })

  it('rejects empty groups and nodes assigned to multiple swimlanes', () => {
    const result = validate({
      nodes: [{ id: 'shared', label: 'Shared' }],
      edges: [],
      groups: [
        { id: 'empty', label: 'Empty', nodes: [] },
        { id: 'first', label: 'First', nodes: ['shared'] },
        { id: 'second', label: 'Second', nodes: ['shared'] },
      ],
    })

    expect(result.errors).toEqual(expect.arrayContaining([
      { path: 'groups[0].nodes', message: 'must contain at least one node' },
      expect.objectContaining({
        path: 'groups[2].nodes[0]',
        message: expect.stringContaining('already belongs'),
      }),
    ]))
  })
})
