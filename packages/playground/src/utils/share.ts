import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string'

export const SHARE_FORMAT_VERSION = '1'
export const LOCAL_DRAFT_KEY = 'traceflow:draft:v1'

export type ShareMode = 'edit' | 'presentation' | 'embed'

export interface SharedDocumentState {
  yaml: string
  mode: ShareMode
}

export class ShareLinkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShareLinkError'
  }
}

function checksum(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/** Encode a complete Traceflow document into a versioned URL hash. */
export function encodeShareHash(yaml: string, mode: ShareMode = 'edit'): string {
  const params = new URLSearchParams()
  params.set('v', SHARE_FORMAT_VERSION)
  params.set('flow', compressToEncodedURIComponent(yaml))
  params.set('sig', checksum(yaml))
  if (mode === 'presentation') params.set('view', '1')
  if (mode === 'embed') params.set('embed', '1')
  return `#${params.toString()}`
}

/** Decode a Traceflow share hash, returning null when no shared flow is present. */
export function decodeShareHash(hash: string): SharedDocumentState | null {
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(value)
  const payload = params.get('flow')
  if (payload === null) return null

  const version = params.get('v')
  if (version !== SHARE_FORMAT_VERSION) {
    throw new ShareLinkError(`Unsupported share-link version: ${version ?? 'missing'}`)
  }

  const yaml = decompressFromEncodedURIComponent(payload)
  const signature = params.get('sig')
  if (yaml === null || signature === null || signature !== checksum(yaml)) {
    throw new ShareLinkError('This share link is damaged or incomplete.')
  }

  return {
    yaml,
    mode: params.get('embed') === '1'
      ? 'embed'
      : params.get('view') === '1'
        ? 'presentation'
        : 'edit',
  }
}

/** Build a share URL without changing the current browser history. */
export function createShareUrl(baseHref: string, yaml: string, mode: ShareMode = 'edit'): string {
  const url = new URL(baseHref)
  url.hash = encodeShareHash(yaml, mode)
  return url.toString()
}
