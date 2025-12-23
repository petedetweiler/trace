import { useState, useRef, useEffect } from 'react'
import type { Example } from '../data/examples'

interface ExamplesDropdownProps {
  examples: Example[]
  onSelect: (yaml: string) => void
}

export function ExamplesDropdown({ examples, onSelect }: ExamplesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (example: Example) => {
    onSelect(example.yaml)
    setIsOpen(false)
  }

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <button
        className="button button-secondary dropdown-trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        Examples
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginLeft: '6px' }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu" role="listbox">
          {examples.map((example) => (
            <button
              key={example.id}
              className="dropdown-item"
              onClick={() => handleSelect(example)}
              role="option"
            >
              {example.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
