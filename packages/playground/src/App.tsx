import { useState, useMemo, useEffect } from 'react'
import {
  parse,
  validate,
  computeLayout,
  render,
  resolveTheme,
  getSystemColorScheme,
  onColorSchemeChange,
  type ColorSchemeMode,
} from '@traceflow/core'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { ExportButton, type ExportFormat } from './components/ExportButton'
import { ExamplesDropdown } from './components/ExamplesDropdown'
import { ThemeSelector } from './components/ThemeSelector'
import { EXAMPLES } from './data/examples'
import {
  downloadFile,
  downloadBlob,
  svgToPng,
  getFilenameFromTitle,
  copyToClipboard,
} from './utils/export'

function App() {
  const [yaml, setYaml] = useState(EXAMPLES[0].yaml)
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false)
  const [themeName, setThemeName] = useState('default')
  const [themeMode, setThemeMode] = useState<ColorSchemeMode>('system')
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(getSystemColorScheme)

  // Listen for system color scheme changes
  useEffect(() => {
    return onColorSchemeChange(setSystemMode)
  }, [])

  // Compute effective mode for theme resolution
  const effectiveMode = themeMode === 'system' ? systemMode : themeMode

  // Get UI theme - always use default neutral theme, only responds to light/dark mode
  // Theme selection only affects the flow diagram, not the UI chrome
  const uiTheme = useMemo(() => {
    return resolveTheme('default', effectiveMode)
  }, [effectiveMode])

  // Get preview theme - uses selected diagram theme for the preview pane background
  const previewTheme = useMemo(() => {
    return resolveTheme(themeName, effectiveMode)
  }, [themeName, effectiveMode])

  const { svg, document, resolvedTheme, error } = useMemo(() => {
    try {
      const doc = parse(yaml)
      const validation = validate(doc)

      if (!validation.valid) {
        return {
          svg: null,
          document: null,
          resolvedTheme: null,
          error: validation.errors.map((e) => `${e.path}: ${e.message}`).join('\n'),
        }
      }

      // Resolve theme: YAML theme takes precedence, then UI selection
      const themeSpec = doc.theme ?? themeName
      const resolvedTheme = resolveTheme(themeSpec, effectiveMode)

      const layout = computeLayout(doc, { theme: resolvedTheme })
      const svg = render(layout, { theme: resolvedTheme })

      return { svg, document: doc, resolvedTheme, error: null }
    } catch (e) {
      return {
        svg: null,
        document: null,
        resolvedTheme: null,
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }, [yaml, themeName, effectiveMode])

  const handleExport = async (format: ExportFormat) => {
    if (!svg) return

    if (format === 'svg') {
      const filename = getFilenameFromTitle(yaml, 'svg')
      downloadFile(svg, filename, 'image/svg+xml')
    } else if (format === 'png') {
      const filename = getFilenameFromTitle(yaml, 'png')
      const blob = await svgToPng(svg, 2)
      downloadBlob(blob, filename)
    }
  }

  const handleCopyYaml = async () => {
    await copyToClipboard(yaml)
  }

  // CSS custom properties for UI theming
  const cssVars = {
    '--ui-bg': uiTheme.colors.background,
    '--ui-bg-elevated': uiTheme.colors.nodeBackground,
    '--ui-border': uiTheme.colors.nodeBorder,
    '--ui-text': uiTheme.colors.text,
    '--ui-text-muted': uiTheme.colors.textMuted,
    '--ui-accent': uiTheme.colors.accent,
    '--ui-accent-muted': uiTheme.colors.accentMuted,
  } as React.CSSProperties

  return (
    <div className="app" data-mode={effectiveMode} style={cssVars}>
      <header className="header">
        <div className="logo">
          <div className="logo-icon" />
          <span>Traceflow</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeSelector
            selectedTheme={themeName}
            selectedMode={themeMode}
            onThemeChange={setThemeName}
            onModeChange={setThemeMode}
          />
          <ExamplesDropdown examples={EXAMPLES} onSelect={setYaml} />
          <button className="button button-secondary" onClick={handleCopyYaml}>
            Copy YAML
          </button>
          <ExportButton disabled={!svg} onExport={handleExport} />
        </div>
      </header>

      <main className="main">
        <div className={`editor-pane ${isEditorCollapsed ? 'collapsed' : ''}`}>
          <div className="editor-header">
            <span>YAML</span>
            <button
              className="collapse-button"
              onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
              aria-label={isEditorCollapsed ? 'Expand editor' : 'Collapse editor'}
              title={isEditorCollapsed ? 'Expand editor' : 'Collapse editor'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: isEditorCollapsed ? 'rotate(180deg)' : 'none' }}
              >
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {!isEditorCollapsed && (
            <div className="editor-content">
              <Editor value={yaml} onChange={setYaml} mode={effectiveMode} />
            </div>
          )}
        </div>

        <div className="preview-pane">
          <div className="preview-header">
            <span>Preview</span>
          </div>
          <div
            className="preview-content"
            style={{ background: previewTheme.colors.background }}
          >
            {error ? (
              <div className="error-banner">{error}</div>
            ) : (
              <Preview svg={svg} document={document} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
