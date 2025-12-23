import { useState, useMemo } from 'react'
import { parse, validate, computeLayout, render } from '@traceflow/core'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { ExportButton, type ExportFormat } from './components/ExportButton'
import { ExamplesDropdown } from './components/ExamplesDropdown'
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

  const { svg, document, error } = useMemo(() => {
    try {
      const doc = parse(yaml)
      const validation = validate(doc)

      if (!validation.valid) {
        return {
          svg: null,
          document: null,
          error: validation.errors.map((e) => `${e.path}: ${e.message}`).join('\n'),
        }
      }

      const layout = computeLayout(doc)
      const svg = render(layout)

      return { svg, document: doc, error: null }
    } catch (e) {
      return {
        svg: null,
        document: null,
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }, [yaml])

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

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon" />
          <span>Traceflow</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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
              <Editor value={yaml} onChange={setYaml} />
            </div>
          )}
        </div>

        <div className="preview-pane">
          <div className="preview-header">
            <span>Preview</span>
          </div>
          <div className="preview-content">
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
