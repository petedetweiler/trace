import { useState, useRef, useEffect } from 'react'
import { themes, type Theme, type ColorSchemeMode } from '@traceflow/core'

interface ThemeSelectorProps {
  selectedTheme: string
  selectedMode: ColorSchemeMode
  onThemeChange: (themeName: string) => void
  onModeChange: (mode: ColorSchemeMode) => void
}

export function ThemeSelector({
  selectedTheme,
  selectedMode,
  onThemeChange,
  onModeChange,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themeList = Object.values(themes)
  const currentTheme = themes[selectedTheme] ?? themes.default

  return (
    <div className="theme-selector">
      {/* Theme dropdown */}
      <div className="dropdown" ref={dropdownRef}>
        <button
          className="button button-secondary dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <ThemeSwatch theme={currentTheme} size={16} />
          <span>{currentTheme.displayName}</span>
          <ChevronIcon />
        </button>

        {isOpen && (
          <div className="dropdown-menu" role="listbox">
            {themeList.map((theme) => (
              <button
                key={theme.name}
                className={`dropdown-item ${selectedTheme === theme.name ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange(theme.name)
                  setIsOpen(false)
                }}
                role="option"
                aria-selected={selectedTheme === theme.name}
              >
                <ThemeSwatch theme={theme} size={20} />
                <span>{theme.displayName}</span>
                {selectedTheme === theme.name && <CheckIcon />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="mode-toggle" role="radiogroup" aria-label="Color scheme">
        <button
          className={`mode-button ${selectedMode === 'light' ? 'active' : ''}`}
          onClick={() => onModeChange('light')}
          aria-label="Light mode"
          aria-checked={selectedMode === 'light'}
          role="radio"
          title="Light mode"
        >
          <SunIcon />
        </button>
        <button
          className={`mode-button ${selectedMode === 'system' ? 'active' : ''}`}
          onClick={() => onModeChange('system')}
          aria-label="System preference"
          aria-checked={selectedMode === 'system'}
          role="radio"
          title="System preference"
        >
          <ComputerIcon />
        </button>
        <button
          className={`mode-button ${selectedMode === 'dark' ? 'active' : ''}`}
          onClick={() => onModeChange('dark')}
          aria-label="Dark mode"
          aria-checked={selectedMode === 'dark'}
          role="radio"
          title="Dark mode"
        >
          <MoonIcon />
        </button>
      </div>
    </div>
  )
}

// Theme color swatch preview
function ThemeSwatch({ theme, size }: { theme: Theme; size: number }) {
  return (
    <div
      className="theme-swatch"
      style={{
        width: size,
        height: size,
        background: theme.light.background,
        borderColor: theme.accent.primary,
      }}
    >
      <div
        className="swatch-accent"
        style={{
          background: theme.accent.primary,
        }}
      />
    </div>
  )
}

// Icons
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.05 3.05L4.17 4.17M11.83 11.83L12.95 12.95M12.95 3.05L11.83 4.17M4.17 11.83L3.05 12.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 9.5C12.5 10.5 11 11 9.5 11C6.5 11 4 8.5 4 5.5C4 4 4.5 2.5 5.5 1.5C2.5 2.5 1 5.5 1 8.5C1 12 4 15 7.5 15C10.5 15 13.5 13.5 14.5 10.5C14.5 10.5 14 10 13.5 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ComputerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14H11M8 11V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
