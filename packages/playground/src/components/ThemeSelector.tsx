import { useState, useRef, useEffect } from 'react'
import { themes, type Theme } from '@traceflow/core'

interface ThemeSelectorProps {
  selectedTheme: string
  onThemeChange: (themeName: string) => void
}

export function ThemeSelector({
  selectedTheme,
  onThemeChange,
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
  const lightThemes = themeList.filter((theme) => (theme.preferredMode ?? 'light') === 'light')
  const darkThemes = themeList.filter((theme) => theme.preferredMode === 'dark')
  const currentTheme = themes[selectedTheme] ?? themes.editorial ?? themeList[0]

  return (
    <div className="theme-selector">
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
            <ThemeGroup
              label="Light"
              themes={lightThemes}
              selectedTheme={selectedTheme}
              onSelect={(name) => { onThemeChange(name); setIsOpen(false) }}
            />
            <ThemeGroup
              label="Dark"
              themes={darkThemes}
              selectedTheme={selectedTheme}
              onSelect={(name) => { onThemeChange(name); setIsOpen(false) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ThemeGroup({
  label,
  themes: groupThemes,
  selectedTheme,
  onSelect,
}: {
  label: string
  themes: Theme[]
  selectedTheme: string
  onSelect: (themeName: string) => void
}) {
  if (groupThemes.length === 0) return null
  return (
    <div className="theme-group" aria-label={`${label} themes`}>
      <div className="theme-group-label">{label}</div>
      {groupThemes.map((theme) => (
        <button
          key={theme.name}
          className={`dropdown-item ${selectedTheme === theme.name ? 'active' : ''}`}
          onClick={() => onSelect(theme.name)}
          role="option"
          aria-selected={selectedTheme === theme.name}
        >
          <ThemeSwatch theme={theme} size={22} />
          <span>{theme.displayName}</span>
          {selectedTheme === theme.name && <CheckIcon />}
        </button>
      ))}
    </div>
  )
}

// Theme color swatch preview
function ThemeSwatch({ theme, size }: { theme: Theme; size: number }) {
  const palette = theme[theme.preferredMode ?? 'light']
  return (
    <div
      className="theme-swatch"
      style={{
        width: size,
        height: size,
        background: palette.background,
        borderColor: palette.nodeBorder,
      }}
    >
      <div
        className="swatch-accent"
        style={{
          background: theme.accent.primary,
        }}
      />
      <div className="swatch-warning" style={{ background: theme.accent.warning }} />
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
