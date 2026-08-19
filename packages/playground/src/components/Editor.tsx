import { useEffect, useRef } from 'react'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { yaml } from '@codemirror/lang-yaml'
import { defaultKeymap } from '@codemirror/commands'
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete'
import { linter, lintGutter, lintKeymap, type Diagnostic } from '@codemirror/lint'
import type { ResolvedTheme } from '@traceflow/core'
import { analyzeTraceflowYaml, getTraceflowCompletions } from '../utils/editorSchema'

function traceflowCompletions(context: CompletionContext) {
  const result = getTraceflowCompletions(context.state.doc.toString(), context.pos)
  if (!result) return null
  return {
    from: result.from,
    options: result.options.map((label) => ({ label, type: label.includes(':') ? 'property' : 'enum' })),
    validFor: /^[\w-]*$/,
  }
}

function traceflowDiagnostics(source: string): Diagnostic[] {
  return analyzeTraceflowYaml(source).map((diagnostic) => ({
    from: diagnostic.from,
    to: diagnostic.to,
    severity: diagnostic.severity,
    message: diagnostic.message,
    actions: diagnostic.repair ? [{
      name: diagnostic.repair.label,
      apply(view) {
        view.dispatch({
          changes: {
            from: diagnostic.repair!.from,
            to: diagnostic.repair!.to,
            insert: diagnostic.repair!.insert,
          },
        })
      },
    }] : undefined,
  }))
}

function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color)
  if (!match) return color
  const value = match[1]
  return `rgba(${Number.parseInt(value.slice(0, 2), 16)}, ${Number.parseInt(value.slice(2, 4), 16)}, ${Number.parseInt(value.slice(4, 6), 16)}, ${alpha})`
}

function createHighlightStyle(theme: ResolvedTheme) {
  const { colors } = theme
  return HighlightStyle.define([
    { tag: tags.keyword, color: colors.warning, fontWeight: '600' },
    { tag: tags.propertyName, color: colors.accent },
    { tag: tags.definition(tags.propertyName), color: colors.accent, fontWeight: '600' },
    { tag: tags.meta, color: colors.warning },
    { tag: tags.string, color: colors.success },
    { tag: tags.number, color: colors.warning },
    { tag: tags.bool, color: colors.warning, fontWeight: '600' },
    { tag: tags.null, color: colors.error },
    { tag: tags.atom, color: colors.text },
    { tag: tags.literal, color: colors.text },
    { tag: tags.content, color: colors.text },
    { tag: tags.name, color: colors.text },
    { tag: tags.variableName, color: colors.text },
    { tag: tags.labelName, color: colors.text },
    { tag: tags.punctuation, color: colors.textMuted },
    { tag: tags.separator, color: colors.textMuted },
    { tag: tags.operator, color: colors.text },
    { tag: [tags.comment, tags.lineComment, tags.blockComment], color: colors.textMuted, fontStyle: 'italic' },
  ])
}

function createEditorTheme(theme: ResolvedTheme) {
  const { colors } = theme
  return EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: colors.nodeBackground,
      color: colors.text,
    },
    '.cm-scroller': {
      fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
      fontSize: theme.name === 'terminal' ? '13px' : '14px',
    },
    '.cm-content': {
      padding: '16px 0',
      caretColor: colors.accent,
    },
    '.cm-line': { padding: '0 16px' },
    '.cm-gutters': {
      backgroundColor: colors.nodeBackground,
      color: colors.textMuted,
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: withAlpha(colors.accent, theme.mode === 'dark' ? 0.12 : 0.08),
      color: colors.accent,
    },
    '.cm-activeLine': {
      backgroundColor: withAlpha(colors.accent, theme.mode === 'dark' ? 0.07 : 0.045),
    },
    '.cm-selectionBackground': {
      backgroundColor: withAlpha(colors.accent, theme.mode === 'dark' ? 0.2 : 0.14),
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: withAlpha(colors.accent, theme.mode === 'dark' ? 0.28 : 0.2),
    },
    '.cm-cursor': { borderLeftColor: colors.accent },
    '.cm-lintRange-error': { backgroundImage: `linear-gradient(135deg, transparent 45%, ${colors.error} 45%, ${colors.error} 55%, transparent 55%)` },
    '.cm-tooltip': {
      backgroundColor: colors.nodeBackground,
      color: colors.text,
      borderColor: colors.nodeBorder,
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: withAlpha(colors.accent, theme.mode === 'dark' ? 0.22 : 0.12),
      color: colors.text,
    },
  }, { dark: theme.mode === 'dark' })
}

interface EditorProps {
  value: string
  onChange: (value: string) => void
  theme: ResolvedTheme
}

export default function Editor({ value, onChange, theme }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeCompartment = useRef(new Compartment())
  const highlightCompartment = useRef(new Compartment())

  // Initial setup
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        yaml(),
        lintGutter(),
        linter((view) => traceflowDiagnostics(view.state.doc.toString()), { delay: 250 }),
        autocompletion({ override: [traceflowCompletions], activateOnTyping: true }),
        themeCompartment.current.of(createEditorTheme(theme)),
        highlightCompartment.current.of(syntaxHighlighting(createHighlightStyle(theme))),
        keymap.of([...defaultKeymap, ...lintKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, []) // Only run once on mount

  // Keep CodeMirror in sync when examples or preview controls update the YAML.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentValue = view.state.doc.toString()
    if (currentValue === value) return

    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    })
  }, [value])

  // Reconfigure CodeMirror when the curated theme changes.
  useEffect(() => {
    if (!viewRef.current) return
    viewRef.current.dispatch({
      effects: [
        themeCompartment.current.reconfigure(createEditorTheme(theme)),
        highlightCompartment.current.reconfigure(syntaxHighlighting(createHighlightStyle(theme))),
      ],
    })
  }, [theme])

  return <div ref={containerRef} style={{ height: '100%' }} />
}
