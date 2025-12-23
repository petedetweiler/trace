import { useState, useRef, useEffect } from 'react'

export type ExportFormat = 'png' | 'svg'

interface ExportOption {
  format: ExportFormat
  label: string
}

const EXPORT_OPTIONS: ExportOption[] = [
  { format: 'png', label: 'PNG' },
  { format: 'svg', label: 'SVG' },
]

interface ExportButtonProps {
  disabled?: boolean
  onExport: (format: ExportFormat) => void
}

export function ExportButton({ disabled, onExport }: ExportButtonProps) {
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

  const handlePrimaryClick = () => {
    if (!disabled) {
      onExport('png')
    }
  }

  const handleDropdownClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionClick = (format: ExportFormat) => {
    onExport(format)
    setIsOpen(false)
  }

  return (
    <div className="export-button-container" ref={dropdownRef}>
      <div className={`export-button-split ${disabled ? 'disabled' : ''}`}>
        <button
          className="export-button-primary"
          onClick={handlePrimaryClick}
          disabled={disabled}
        >
          Export PNG
        </button>
        <button
          className="export-button-dropdown-trigger"
          onClick={handleDropdownClick}
          disabled={disabled}
          aria-label="More export options"
          aria-expanded={isOpen}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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
      </div>

      {isOpen && (
        <div className="export-dropdown">
          {EXPORT_OPTIONS.map((option) => (
            <button
              key={option.format}
              className="export-dropdown-item"
              onClick={() => handleOptionClick(option.format)}
            >
              Export {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
