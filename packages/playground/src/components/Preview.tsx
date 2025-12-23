interface PreviewProps {
  svg: string | null
}

export default function Preview({ svg }: PreviewProps) {
  if (!svg) {
    return (
      <div style={{ color: '#6B6B6B', fontSize: '14px' }}>
        No diagram to display
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'auto',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
