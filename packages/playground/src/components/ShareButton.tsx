import { useEffect, useRef, useState } from 'react'

import type { ShareMode } from '../utils/share'

interface ShareButtonProps {
  disabled?: boolean
  onCopyLink: (mode: ShareMode) => Promise<boolean>
  onPresent: () => void
}

export function ShareButton({ disabled, onCopyLink, onPresent }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'failed'>('idle')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (feedback === 'idle') return
    const timeout = window.setTimeout(() => setFeedback('idle'), 1800)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const copyLink = async (mode: ShareMode) => {
    if (disabled) return
    const copied = await onCopyLink(mode)
    setFeedback(copied ? 'copied' : 'failed')
    setIsOpen(false)
  }

  const label = feedback === 'copied'
    ? 'Copied!'
    : feedback === 'failed'
      ? 'Copy failed'
      : 'Share'

  return (
    <div className="share-button-container" ref={dropdownRef}>
      <div className={`share-button-split ${disabled ? 'disabled' : ''}`}>
        <button
          className="share-button-primary"
          onClick={() => copyLink('edit')}
          disabled={disabled}
          aria-live="polite"
        >
          <ShareIcon />
          {label}
        </button>
        <button
          className="share-button-dropdown-trigger"
          onClick={() => !disabled && setIsOpen((current) => !current)}
          disabled={disabled}
          aria-label="More sharing options"
          aria-expanded={isOpen}
        >
          <ChevronIcon />
        </button>
      </div>

      {isOpen && (
        <div className="share-dropdown">
          <button onClick={() => copyLink('edit')}>Copy editable link</button>
          <button onClick={() => copyLink('presentation')}>Copy presentation link</button>
          <button onClick={() => copyLink('embed')}>Copy embed link</button>
          <button onClick={() => { setIsOpen(false); onPresent() }}>Present diagram</button>
        </div>
      )}
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="4" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.7 5.9L8.7 3.9M5.7 8.1L8.7 10.1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
