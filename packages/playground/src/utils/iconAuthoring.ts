export interface IconTextEdit {
  from: number
  to: number
  insert: string
}

interface SourceLine {
  text: string
  from: number
  to: number
}

function sourceLines(source: string): SourceLine[] {
  const values = source.split('\n')
  let offset = 0
  return values.map((text) => {
    const line = { text, from: offset, to: offset + text.length }
    offset += text.length + 1
    return line
  })
}

export function findIconEditAtPosition(
  source: string,
  position: number,
  icon: string
): IconTextEdit | null {
  const lines = sourceLines(source)
  const clampedPosition = Math.max(0, Math.min(position, source.length))
  const foundLineIndex = lines.findIndex((line, index) => (
    clampedPosition >= line.from
    && (clampedPosition <= line.to || index === lines.length - 1)
  ))
  const currentIndex = Math.max(0, foundLineIndex)

  let sectionIndex = -1
  let section = ''
  for (let index = currentIndex; index >= 0; index -= 1) {
    const match = /^([a-zA-Z][\w-]*):(?:\s|$)/.exec(lines[index].text)
    if (!match) continue
    sectionIndex = index
    section = match[1]
    break
  }
  if (section !== 'nodes' && section !== 'groups') return null

  let entryIndex = -1
  let entryIndent = ''
  for (let index = currentIndex; index > sectionIndex; index -= 1) {
    const match = /^(\s*)-\s+id:\s*/.exec(lines[index].text)
    if (!match) continue
    entryIndex = index
    entryIndent = match[1]
    break
  }
  if (entryIndex < 0) return null

  let entryEndIndex = lines.length
  for (let index = entryIndex + 1; index < lines.length; index += 1) {
    if (/^\S/.test(lines[index].text)) {
      entryEndIndex = index
      break
    }
    const match = /^(\s*)-\s+/.exec(lines[index].text)
    if (match?.[1] === entryIndent) {
      entryEndIndex = index
      break
    }
  }
  if (currentIndex >= entryEndIndex) return null

  for (let index = entryIndex; index < entryEndIndex; index += 1) {
    const match = /^(\s*icon:\s*).*$/.exec(lines[index].text)
    if (!match) continue
    return {
      from: lines[index].from + match[1].length,
      to: lines[index].to,
      insert: icon,
    }
  }

  let insertionLine = lines[entryIndex]
  for (let index = entryIndex + 1; index < entryEndIndex; index += 1) {
    if (/^\s*label:\s*/.test(lines[index].text)) insertionLine = lines[index]
  }
  return {
    from: insertionLine.to,
    to: insertionLine.to,
    insert: `\n${entryIndent}  icon: ${icon}`,
  }
}

export function applyIconToNode(source: string, nodeId: string, icon: string): string {
  const lines = source.split('\n')
  const nodesIndex = lines.findIndex((line) => line.trim() === 'nodes:')
  if (nodesIndex < 0) return source

  let entryStart = -1
  let entryEnd = lines.length
  let entryIndent = ''
  for (let index = nodesIndex + 1; index < lines.length; index += 1) {
    if (/^\S/.test(lines[index])) {
      if (entryStart >= 0) entryEnd = index
      break
    }
    const match = /^(\s*)-\s+id:\s*(.+?)\s*$/.exec(lines[index])
    if (!match) continue
    const id = match[2].replace(/^['"]|['"]$/g, '')
    if (entryStart >= 0) {
      entryEnd = index
      break
    }
    if (id === nodeId) {
      entryStart = index
      entryIndent = match[1]
    }
  }
  if (entryStart < 0) return source

  const fieldIndent = `${entryIndent}  `
  let insertionIndex = entryStart + 1
  for (let index = entryStart + 1; index < entryEnd; index += 1) {
    if (/^\s*icon:\s*/.test(lines[index])) {
      lines[index] = `${fieldIndent}icon: ${icon}`
      return lines.join('\n')
    }
    if (/^\s*label:\s*/.test(lines[index])) insertionIndex = index + 1
  }
  lines.splice(insertionIndex, 0, `${fieldIndent}icon: ${icon}`)
  return lines.join('\n')
}
