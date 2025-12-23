import { useEffect, useRef } from 'react'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { yaml } from '@codemirror/lang-yaml'
import { defaultKeymap } from '@codemirror/commands'

// Light mode highlight style - Claude-inspired warm palette
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#8B5A2B', fontWeight: '600' }, // Warm brown
  { tag: tags.atom, color: '#D4A574' }, // Warm tan
  { tag: tags.bool, color: '#C17F59', fontWeight: '600' }, // Terracotta
  { tag: tags.string, color: '#7B8F6A' }, // Sage green
  { tag: tags.number, color: '#9B7AA0' }, // Dusty purple
  { tag: tags.comment, color: '#A89F91', fontStyle: 'italic' }, // Warm gray
  { tag: tags.propertyName, color: '#DA7756' }, // Claude coral
  { tag: tags.variableName, color: '#DA7756' }, // Claude coral
  { tag: tags.punctuation, color: '#8B7355' }, // Muted brown
  { tag: tags.meta, color: '#C9956B' }, // Amber/caramel
])

// Dark mode highlight style - high contrast for readability
const darkHighlightStyle = HighlightStyle.define([
  // Keys and structure
  { tag: tags.keyword, color: '#E8B88A', fontWeight: '600' }, // Light warm brown
  { tag: tags.propertyName, color: '#F0967A' }, // Light coral for keys
  { tag: tags.definition(tags.propertyName), color: '#F0967A' }, // Coral for key definitions
  { tag: tags.meta, color: '#E8B878' }, // Light amber

  // Values - ensure high contrast
  { tag: tags.string, color: '#A8C494' }, // Light sage green
  { tag: tags.number, color: '#C9A8CE' }, // Light dusty purple
  { tag: tags.bool, color: '#E8A882', fontWeight: '600' }, // Light terracotta
  { tag: tags.null, color: '#E8A882' }, // Light terracotta
  { tag: tags.atom, color: '#D4D4D4' }, // Light gray for atoms
  { tag: tags.literal, color: '#D4D4D4' }, // Light gray for literals
  { tag: tags.content, color: '#D4D4D4' }, // Light gray for content

  // Names and variables
  { tag: tags.name, color: '#D4D4D4' }, // Light gray for names
  { tag: tags.variableName, color: '#D4D4D4' }, // Light gray
  { tag: tags.labelName, color: '#D4D4D4' }, // Light gray
  { tag: tags.definition(tags.variableName), color: '#F0967A' }, // Coral for definitions

  // Punctuation and operators
  { tag: tags.punctuation, color: '#808080' }, // Medium gray for punctuation
  { tag: tags.separator, color: '#808080' }, // Medium gray
  { tag: tags.operator, color: '#D4D4D4' }, // Light gray

  // Comments
  { tag: tags.comment, color: '#6A6A6A', fontStyle: 'italic' }, // Dim gray
  { tag: tags.lineComment, color: '#6A6A6A', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#6A6A6A', fontStyle: 'italic' },
])

// Light theme
const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '14px',
  },
  '.cm-content': {
    padding: '16px 0',
    caretColor: '#1A1A1A',
  },
  '.cm-line': {
    padding: '0 16px',
  },
  '.cm-gutters': {
    backgroundColor: '#FFFFFF',
    color: '#A0A0A0',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#F5F5F5',
  },
  '.cm-activeLine': {
    backgroundColor: '#F8F8F8',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#E8E8E8',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#D4E8E2',
  },
  '.cm-cursor': {
    borderLeftColor: '#1A1A1A',
  },
})

// Dark theme - neutral grays
const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#1E1E1E',
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '14px',
  },
  '.cm-content': {
    padding: '16px 0',
    caretColor: '#F5F5F5',
  },
  '.cm-line': {
    padding: '0 16px',
  },
  '.cm-gutters': {
    backgroundColor: '#1E1E1E',
    color: '#6A6A6A',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2A2A2A',
  },
  '.cm-activeLine': {
    backgroundColor: '#252525',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#3A3A3A',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#4A4A4A',
  },
  '.cm-cursor': {
    borderLeftColor: '#F5F5F5',
  },
}, { dark: true })

interface EditorProps {
  value: string
  onChange: (value: string) => void
  mode?: 'light' | 'dark'
}

export default function Editor({ value, onChange, mode = 'light' }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeCompartment = useRef(new Compartment())
  const highlightCompartment = useRef(new Compartment())

  // Initial setup
  useEffect(() => {
    if (!containerRef.current) return

    const isDark = mode === 'dark'

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        yaml(),
        themeCompartment.current.of(isDark ? darkTheme : lightTheme),
        highlightCompartment.current.of(
          syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle)
        ),
        keymap.of(defaultKeymap),
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

  // Update theme when mode changes
  useEffect(() => {
    if (!viewRef.current) return

    const isDark = mode === 'dark'

    viewRef.current.dispatch({
      effects: [
        themeCompartment.current.reconfigure(isDark ? darkTheme : lightTheme),
        highlightCompartment.current.reconfigure(
          syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle)
        ),
      ],
    })
  }, [mode])

  return <div ref={containerRef} style={{ height: '100%' }} />
}
