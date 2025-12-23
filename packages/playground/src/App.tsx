import { useState, useMemo } from 'react'
import { parse, validate, computeLayout, render } from '@traceflow/core'
import Editor from './components/Editor'
import Preview from './components/Preview'

const DEFAULT_YAML = `title: User Authentication Flow
description: JWT-based auth with error handling

nodes:
  - id: start
    type: start
    label: User visits site

  - id: auth
    type: process
    label: Authenticate
    description: Validate JWT against auth service
    emphasis: high

  - id: valid
    type: decision
    label: Valid session?

  - id: dashboard
    type: end
    label: Dashboard
    status: success

  - id: login
    type: process
    label: Login page

edges:
  - from: start
    to: auth

  - from: auth
    to: valid

  - from: valid
    to: dashboard
    label: "yes"
    description: JWT validated successfully

  - from: valid
    to: login
    label: "no"
    style: dashed

  - from: login
    to: auth
`

function App() {
  const [yaml, setYaml] = useState(DEFAULT_YAML)

  const { svg, error } = useMemo(() => {
    try {
      const doc = parse(yaml)
      const validation = validate(doc)

      if (!validation.valid) {
        return {
          svg: null,
          error: validation.errors.map((e) => `${e.path}: ${e.message}`).join('\n'),
        }
      }

      const layout = computeLayout(doc)
      const svg = render(layout)

      return { svg, error: null }
    } catch (e) {
      return {
        svg: null,
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }, [yaml])

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon" />
          <span>Traceflow</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="button button-secondary">Examples</button>
          <button className="button button-primary">Export SVG</button>
        </div>
      </header>

      <main className="main">
        <div className="editor-pane">
          <div className="editor-header">
            <span>YAML</span>
          </div>
          <div className="editor-content">
            <Editor value={yaml} onChange={setYaml} />
          </div>
        </div>

        <div className="preview-pane">
          <div className="preview-header">
            <span>Preview</span>
          </div>
          <div className="preview-content">
            {error ? (
              <div className="error-banner">{error}</div>
            ) : (
              <Preview svg={svg} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
