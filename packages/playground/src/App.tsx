import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  parse,
  validate,
  computeLayout,
  render,
  resolveTheme,
  getTheme,
  getSystemColorScheme,
  onColorSchemeChange,
  resolveIconReference,
  type ColorSchemeMode,
  type Direction,
  type IconPack,
} from '@traceflow/core'
import Editor from './components/Editor'
import type { EditorHandle } from './components/Editor'
import Preview from './components/Preview'
import type {
  DiagramSelection,
  DiagramSelectionAnchor,
  NodeDiagramSelection,
} from './components/Preview'
import { ExportButton, type ExportFormat } from './components/ExportButton'
import { ExamplesDropdown } from './components/ExamplesDropdown'
import { ThemeSelector } from './components/ThemeSelector'
import { LayoutToggle } from './components/LayoutToggle'
import { ShareButton } from './components/ShareButton'
import { DetailsPanel } from './components/DetailsPanel'
import { ImportMermaidDialog } from './components/ImportMermaidDialog'
import { ThemeBuilderDialog } from './components/ThemeBuilderDialog'
import { IconPickerDialog } from './components/IconPickerDialog'
import { EXAMPLES } from './data/examples'
import {
  downloadFile,
  downloadBlob,
  svgToPng,
  getFilenameFromTitle,
  copyToClipboard,
} from './utils/export'
import {
  LOCAL_DRAFT_KEY,
  ShareLinkError,
  createShareUrl,
  decodeShareHash,
  encodeShareHash,
  type ShareMode,
} from './utils/share'
import {
  applyThemeBuilder,
  DEFAULT_THEME_BUILDER_VALUES,
  type ThemeBuilderValues,
} from './utils/themeBuilder'
import { applyIconToNode } from './utils/iconAuthoring'
import {
  applyNodeAttributeUpdates,
  type NodeAttributeUpdates,
} from './utils/nodeAuthoring'

interface InitialDocumentState {
  yaml: string
  mode: ShareMode
  source: 'default' | 'draft' | 'share'
  error: string | null
}

function loadInitialDocument(): InitialDocumentState {
  let shareError: string | null = null
  try {
    const shared = decodeShareHash(window.location.hash)
    if (shared) {
      return {
        yaml: shared.yaml,
        mode: shared.mode,
        source: 'share',
        error: null,
      }
    }
  } catch (error) {
    shareError = error instanceof ShareLinkError
      ? error.message
      : 'Could not open this share link.'
  }

  try {
    const draft = window.localStorage.getItem(LOCAL_DRAFT_KEY)
    if (draft) return { yaml: draft, mode: 'edit', source: 'draft', error: shareError }
  } catch {
    // Local storage can be blocked; the playground still works without it.
  }

  return {
    yaml: EXAMPLES[0].yaml,
    mode: 'edit',
    source: 'default',
    error: shareError,
  }
}

function upsertTopLevelScalar(source: string, key: string, value: string): string {
  const linePattern = new RegExp(`^${key}:\\s*.*$`, 'm')
  if (linePattern.test(source)) {
    return source.replace(linePattern, `${key}: ${value}`)
  }

  const nodesPattern = /^nodes:\s*$/m
  if (nodesPattern.test(source)) {
    return source.replace(nodesPattern, `${key}: ${value}\n\nnodes:`)
  }
  return `${key}: ${value}\n${source}`
}

function updateThemeName(source: string, themeName: string): string {
  const lines = source.split('\n')
  const themeIndex = lines.findIndex((line) => /^theme:\s*/.test(line))
  if (themeIndex === -1) return upsertTopLevelScalar(source, 'theme', themeName)

  const inlineValue = lines[themeIndex].replace(/^theme:\s*/, '').trim()
  if (inlineValue) {
    lines[themeIndex] = `theme: ${themeName}`
    return lines.join('\n')
  }

  let blockEnd = themeIndex + 1
  while (blockEnd < lines.length && (lines[blockEnd].trim() === '' || /^\s+/.test(lines[blockEnd]))) {
    blockEnd += 1
  }
  const nameIndex = lines.findIndex(
    (line, index) => index > themeIndex && index < blockEnd && /^\s+name:\s*/.test(line)
  )
  if (nameIndex >= 0) {
    const indent = lines[nameIndex].match(/^\s*/)?.[0] ?? '  '
    lines[nameIndex] = `${indent}name: ${themeName}`
  } else {
    lines.splice(themeIndex + 1, 0, `  name: ${themeName}`)
  }
  return lines.join('\n')
}

function updateThemeMode(
  source: string,
  themeName: string,
  mode: ColorSchemeMode
): string {
  const lines = source.split('\n')
  const themeIndex = lines.findIndex((line) => /^theme:\s*/.test(line))
  if (themeIndex === -1) {
    const themeBlock = `theme:\n  name: ${themeName}\n  mode: ${mode}`
    const nodesPattern = /^nodes:\s*$/m
    return nodesPattern.test(source)
      ? source.replace(nodesPattern, `${themeBlock}\n\nnodes:`)
      : `${themeBlock}\n${source}`
  }

  const inlineName = lines[themeIndex].replace(/^theme:\s*/, '').trim()
  if (inlineName) {
    lines.splice(themeIndex, 1, 'theme:', `  name: ${inlineName}`, `  mode: ${mode}`)
    return lines.join('\n')
  }

  let blockEnd = themeIndex + 1
  while (blockEnd < lines.length && (lines[blockEnd].trim() === '' || /^\s+/.test(lines[blockEnd]))) {
    blockEnd += 1
  }
  const nameIndex = lines.findIndex(
    (line, index) => index > themeIndex && index < blockEnd && /^\s+name:\s*/.test(line)
  )
  const modeIndex = lines.findIndex(
    (line, index) => index > themeIndex && index < blockEnd && /^\s+mode:\s*/.test(line)
  )

  let effectiveModeIndex = modeIndex
  if (nameIndex === -1) {
    lines.splice(themeIndex + 1, 0, `  name: ${themeName}`)
    blockEnd += 1
    if (effectiveModeIndex >= 0) effectiveModeIndex += 1
  }
  if (effectiveModeIndex >= 0) {
    const indent = lines[effectiveModeIndex].match(/^\s*/)?.[0] ?? '  '
    lines[effectiveModeIndex] = `${indent}mode: ${mode}`
  } else {
    lines.splice(blockEnd, 0, `  mode: ${mode}`)
  }
  return lines.join('\n')
}

function getDocumentThemeMode(source: string): ColorSchemeMode | null {
  try {
    const document = parse(source)
    if (typeof document.theme === 'object' && document.theme.mode) {
      return document.theme.mode
    }
    const name = typeof document.theme === 'string'
      ? document.theme
      : document.theme?.name ?? 'editorial'
    return getTheme(name).preferredMode ?? 'light'
  } catch {
    return null
  }
}

function App() {
  const [initialDocument] = useState(loadInitialDocument)
  const [yaml, setYaml] = useState(initialDocument.yaml)
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<ShareMode>(initialDocument.mode)
  const [shareError, setShareError] = useState(initialDocument.error)
  const [selection, setSelection] = useState<DiagramSelection | null>(null)
  const [selectionAnchor, setSelectionAnchor] = useState<DiagramSelectionAnchor | null>(null)
  const [isMermaidImportOpen, setIsMermaidImportOpen] = useState(false)
  const [isThemeBuilderOpen, setIsThemeBuilderOpen] = useState(false)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [tablerIconPack, setTablerIconPack] = useState<IconPack | null>(null)
  const [iconPackError, setIconPackError] = useState<string | null>(null)
  const [themeName, setThemeName] = useState('editorial')
  const [themeMode, setThemeMode] = useState<ColorSchemeMode>(() => (
    getDocumentThemeMode(initialDocument.yaml) ?? 'light'
  ))
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(getSystemColorScheme)
  const shouldPersistDraftRef = useRef(initialDocument.source !== 'share')
  const editorRef = useRef<EditorHandle>(null)
  const iconPackPromiseRef = useRef<Promise<IconPack> | null>(null)
  const isPresentationMode = viewMode === 'presentation'
  const isEmbedMode = viewMode === 'embed'
  const isReadOnly = viewMode !== 'edit'

  const updateYaml = (update: string | ((current: string) => string)) => {
    shouldPersistDraftRef.current = true
    setYaml(update)
  }

  const loadTablerIconPack = useCallback(async () => {
    if (tablerIconPack) return tablerIconPack
    setIconPackError(null)
    if (!iconPackPromiseRef.current) {
      iconPackPromiseRef.current = import('@traceflow/icons/tabler')
        .then((module) => module.tablerIconPack)
    }
    try {
      const pack = await iconPackPromiseRef.current
      setTablerIconPack(pack)
      return pack
    } catch {
      iconPackPromiseRef.current = null
      setIconPackError('The full Tabler catalog could not be loaded. Traceflow essentials are still available.')
      return null
    }
  }, [tablerIconPack])

  const openIconPickerForNode = useCallback((
    node: NodeDiagramSelection,
    anchor?: DiagramSelectionAnchor
  ) => {
    setSelection(node)
    if (anchor) setSelectionAnchor(anchor)
    setIsIconPickerOpen(true)
    void loadTablerIconPack()
  }, [loadTablerIconPack])

  const handleDiagramSelect = useCallback((
    nextSelection: DiagramSelection,
    anchor: DiagramSelectionAnchor
  ) => {
    setSelection(nextSelection)
    setSelectionAnchor(anchor)
  }, [])

  const handleNodeUpdate = (nodeId: string, updates: NodeAttributeUpdates) => {
    updateYaml((current) => applyNodeAttributeUpdates(current, nodeId, updates))
    setSelection((current) => {
      if (current?.kind !== 'node' || current.id !== nodeId) return current
      const next = { ...current }
      if (updates.label !== undefined) next.label = updates.label
      if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
        next.description = updates.description ?? undefined
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
        next.type = updates.type ?? undefined
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
        next.status = updates.status ?? undefined
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'emphasis')) {
        next.emphasis = updates.emphasis ?? undefined
      }
      return next
    })
  }

  // Listen for system color scheme changes
  useEffect(() => {
    return onColorSchemeChange(setSystemMode)
  }, [])

  useEffect(() => {
    if (!shouldPersistDraftRef.current) return
    try {
      window.localStorage.setItem(LOCAL_DRAFT_KEY, yaml)
    } catch {
      // Draft recovery is a convenience, not a requirement.
    }
  }, [yaml])

  // Load the optional full catalog only when a document references an icon
  // outside the bundled essentials. The rendered SVG remains self-contained.
  useEffect(() => {
    if (tablerIconPack) return
    try {
      const parsed = parse(yaml)
      const references = [
        ...parsed.nodes.map((node) => node.icon),
        ...(parsed.groups ?? []).map((group) => group.icon),
      ].filter((icon): icon is string => Boolean(icon))
      if (references.some((icon) => resolveIconReference(icon)?.kind === 'unknown')) {
        void loadTablerIconPack()
      }
    } catch {
      // Invalid documents are handled by the editor diagnostics.
    }
  }, [loadTablerIconPack, tablerIconPack, yaml])

  useEffect(() => {
    const handleHashChange = () => {
      try {
        const shared = decodeShareHash(window.location.hash)
        if (!shared) {
          setViewMode('edit')
          return
        }
        shouldPersistDraftRef.current = false
        setYaml(shared.yaml)
        setThemeMode(getDocumentThemeMode(shared.yaml) ?? 'light')
        setViewMode(shared.mode)
        setSelection(null)
        setShareError(null)
      } catch (error) {
        setViewMode('edit')
        setShareError(error instanceof Error ? error.message : 'Could not open this share link.')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
    }
  }, [])

  // Keep curated appearance in sync when the theme is edited directly in YAML.
  useEffect(() => {
    try {
      const parsed = parse(yaml)
      const parsedThemeName = typeof parsed.theme === 'string'
        ? parsed.theme
        : parsed.theme?.name
      if (parsedThemeName && parsedThemeName !== themeName) setThemeName(parsedThemeName)
      const parsedMode = getDocumentThemeMode(yaml)
      if (parsedMode && parsedMode !== themeMode) setThemeMode(parsedMode)
    } catch {
      // Preserve the last valid theme while the document is temporarily invalid.
    }
  }, [themeMode, themeName, yaml])

  // Compute effective mode for theme resolution
  const effectiveMode = themeMode === 'system' ? systemMode : themeMode

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
      const svg = render(layout, {
        theme: resolvedTheme,
        iconPacks: tablerIconPack ? [tablerIconPack] : [],
      })

      return { svg, document: doc, resolvedTheme, error: null }
    } catch (e) {
      return {
        svg: null,
        document: null,
        resolvedTheme: null,
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  }, [yaml, themeName, effectiveMode, tablerIconPack])

  const activeDirection: Direction = document?.direction ?? 'TB'
  const documentThemeName = typeof document?.theme === 'string'
    ? document.theme
    : document?.theme?.name
  const activeThemeName = getTheme(documentThemeName ?? themeName).name
  const chromeTheme = resolvedTheme ?? resolveTheme(activeThemeName, effectiveMode)

  const handleDirectionChange = (direction: Direction) => {
    updateYaml((current) => upsertTopLevelScalar(current, 'direction', direction))
  }

  const handleThemeChange = (nextThemeName: string) => {
    const nextMode = getTheme(nextThemeName).preferredMode ?? 'light'
    setThemeName(nextThemeName)
    setThemeMode(nextMode)
    updateYaml((current) => updateThemeMode(
      updateThemeName(current, nextThemeName),
      nextThemeName,
      nextMode
    ))
  }

  const handleExampleSelect = (nextYaml: string) => {
    setThemeMode(getDocumentThemeMode(nextYaml) ?? 'light')
    setSelection(null)
    updateYaml(nextYaml)
  }

  const handleMermaidImport = (nextYaml: string) => {
    setThemeMode(getDocumentThemeMode(nextYaml) ?? 'light')
    setSelection(null)
    updateYaml(nextYaml)
  }

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

  const handleCopyShareLink = async (mode: ShareMode) => {
    const url = createShareUrl(window.location.href, yaml, mode)
    return copyToClipboard(url)
  }

  const handlePresent = () => {
    const hash = encodeShareHash(yaml, 'presentation')
    window.history.pushState(null, '', hash)
    setViewMode('presentation')
  }

  const handleEdit = () => {
    const hash = encodeShareHash(yaml, 'edit')
    window.history.pushState(null, '', hash)
    setViewMode('edit')
  }

  const themeBuilderValues: ThemeBuilderValues = useMemo(() => resolvedTheme ? {
      name: activeThemeName,
      mode: themeMode,
      accent: resolvedTheme.colors.accent,
      background: resolvedTheme.colors.background,
      nodeBackground: resolvedTheme.colors.nodeBackground,
      nodeBorder: resolvedTheme.colors.nodeBorder,
      text: resolvedTheme.colors.text,
      nodeCornerRadius: resolvedTheme.shapes.nodeCornerRadius,
      strokeWidth: resolvedTheme.connectors.strokeWidth,
      curveStyle: resolvedTheme.connectors.curveStyle,
      showGrid: resolvedTheme.background.showGrid,
      gridStyle: resolvedTheme.background.gridStyle,
    } : { ...DEFAULT_THEME_BUILDER_VALUES, name: activeThemeName, mode: themeMode },
    [activeThemeName, resolvedTheme, themeMode]
  )

  const handleThemeBuilderApply = (values: ThemeBuilderValues) => {
    setThemeName(values.name)
    setThemeMode(values.mode)
    updateYaml((current) => applyThemeBuilder(current, values))
  }

  // CSS custom properties for UI theming
  const cssVars = {
    '--ui-bg': chromeTheme.colors.background,
    '--ui-bg-elevated': chromeTheme.colors.nodeBackground,
    '--ui-border': chromeTheme.colors.nodeBorder,
    '--ui-text': chromeTheme.colors.text,
    '--ui-text-muted': chromeTheme.colors.textMuted,
    '--ui-accent': chromeTheme.colors.accent,
    '--ui-accent-muted': chromeTheme.colors.accentMuted,
    '--ui-success': chromeTheme.colors.success,
    '--ui-warning': chromeTheme.colors.warning,
    '--ui-error': chromeTheme.colors.error,
    '--ui-font': chromeTheme.typography.fontFamily,
    '--ui-radius': `${chromeTheme.shapes.nodeCornerRadius}px`,
  } as React.CSSProperties

  return (
    <div
      className={`app ${isEmbedMode ? 'embed-mode' : ''}`}
      data-mode={chromeTheme.mode}
      data-theme={chromeTheme.name}
      style={cssVars}
    >
      {!isEmbedMode && <header className="header">
        <div className="logo">
          <div className="logo-icon" />
          <span>Traceflow</span>
        </div>
        <div className="header-actions">
          {isPresentationMode ? (
            <>
              <span className="presentation-badge">Presentation</span>
              <button className="button button-secondary" onClick={handleEdit}>Edit diagram</button>
            </>
          ) : (
            <>
              <ThemeSelector
                selectedTheme={activeThemeName}
                onThemeChange={handleThemeChange}
              />
              <button className="button button-secondary" onClick={() => setIsThemeBuilderOpen(true)}>
                Customize
              </button>
              <LayoutToggle direction={activeDirection} onChange={handleDirectionChange} />
              <ExamplesDropdown examples={EXAMPLES} onSelect={handleExampleSelect} />
              <button className="button button-secondary" onClick={() => setIsMermaidImportOpen(true)}>
                Import
              </button>
              <button className="button button-secondary" onClick={handleCopyYaml}>
                Copy YAML
              </button>
            </>
          )}
          <ShareButton disabled={!svg} onCopyLink={handleCopyShareLink} onPresent={handlePresent} />
          <ExportButton disabled={!svg} onExport={handleExport} />
        </div>
      </header>}

      {shareError && (
        <div className="share-error" role="alert">
          <span>{shareError}</span>
          <button onClick={() => setShareError(null)} aria-label="Dismiss share-link error">×</button>
        </div>
      )}

      <main className={`main ${isPresentationMode ? 'presentation-mode' : ''} ${isEmbedMode ? 'embed-mode' : ''}`}>
        {!isReadOnly && <div className={`editor-pane ${isEditorCollapsed ? 'collapsed' : ''}`}>
          <div className="editor-header">
            <span>YAML</span>
            <div className="editor-header-actions">
              {!isEditorCollapsed && (
                <button
                  className="editor-tool-button"
                  type="button"
                  onClick={() => {
                    setIsIconPickerOpen(true)
                    void loadTablerIconPack()
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5z" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>
                  Icons
                </button>
              )}
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
          </div>
          {!isEditorCollapsed && (
            <div className="editor-content">
              <Editor ref={editorRef} value={yaml} onChange={updateYaml} theme={chromeTheme} />
            </div>
          )}
        </div>}

        <div className="preview-pane">
          {!isEmbedMode && <div className="preview-header">
            <span>{isPresentationMode ? document?.title ?? 'Diagram' : 'Preview'}</span>
          </div>}
          <div
            className="preview-content"
            style={{ background: resolvedTheme?.colors.background ?? chromeTheme.colors.background }}
          >
            {error ? (
              <div className="error-banner">{error}</div>
            ) : (
              <Preview
                svg={svg}
                document={document}
                onSelect={handleDiagramSelect}
                onEditIcon={openIconPickerForNode}
              />
            )}
            {selection && (
              <DetailsPanel
                selection={selection}
                anchor={selectionAnchor}
                onClose={() => {
                  setSelection(null)
                  setSelectionAnchor(null)
                }}
                onEditIcon={openIconPickerForNode}
                onUpdateNode={handleNodeUpdate}
              />
            )}
          </div>
        </div>
      </main>
      <ImportMermaidDialog
        open={isMermaidImportOpen}
        onClose={() => setIsMermaidImportOpen(false)}
        onImport={handleMermaidImport}
      />
      <ThemeBuilderDialog
        open={isThemeBuilderOpen}
        initialValues={themeBuilderValues}
        onClose={() => setIsThemeBuilderOpen(false)}
        onApply={handleThemeBuilderApply}
      />
      <IconPickerDialog
        open={isIconPickerOpen}
        pack={tablerIconPack}
        error={iconPackError}
        targetLabel={selection?.kind === 'node' ? selection.label : undefined}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(reference) => {
          if (selection?.kind === 'node') {
            updateYaml((current) => applyIconToNode(current, selection.id, reference))
            setSelection({ ...selection, icon: reference })
            return true
          }
          return editorRef.current?.insertIcon(reference) ?? false
        }}
      />
    </div>
  )
}

export default App
