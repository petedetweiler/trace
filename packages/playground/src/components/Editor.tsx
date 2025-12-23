import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { yaml } from '@codemirror/lang-yaml'
import { defaultKeymap } from '@codemirror/commands'

// Claude-inspired warm palette
const traceflowHighlightStyle = HighlightStyle.define([
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

interface EditorProps {
  value: string
  onChange: (value: string) => void
}

export default function Editor({ value, onChange }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        yaml(),
        syntaxHighlighting(traceflowHighlightStyle),
        keymap.of(defaultKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
          },
          '.cm-scroller': {
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '14px',
          },
          '.cm-content': {
            padding: '16px 0',
          },
          '.cm-line': {
            padding: '0 16px',
          },
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

  return <div ref={containerRef} style={{ height: '100%' }} />
}
