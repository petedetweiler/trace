export interface InspectorAnchor {
  left: number
  right: number
  centerX: number
  centerY: number
  containerWidth: number
  containerHeight: number
}

export interface InspectorPosition {
  left: number
  top: number
  width: number
}

export function calculateInspectorPosition(
  anchor: InspectorAnchor,
  panelHeight: number
): InspectorPosition {
  const preferredWidth = Math.min(344, anchor.containerWidth - 32)
  const minimumWidth = 280
  const gap = 18
  const inset = 16
  const spaceLeft = anchor.left
  const spaceRight = anchor.containerWidth - anchor.right
  const fitsLeft = spaceLeft >= preferredWidth + gap + inset
  const fitsRight = spaceRight >= preferredWidth + gap + inset

  let left: number
  let width = preferredWidth
  if (fitsRight) {
    left = anchor.right + gap
  } else if (fitsLeft) {
    left = anchor.left - gap - preferredWidth
  } else if (Math.max(spaceLeft, spaceRight) - gap - inset >= minimumWidth) {
    const useRight = spaceRight > spaceLeft
    width = Math.min(
      preferredWidth,
      (useRight ? spaceRight : spaceLeft) - gap - inset
    )
    left = useRight
      ? anchor.right + gap
      : anchor.left - gap - width
  } else if (anchor.centerX > anchor.containerWidth / 2) {
    left = inset
  } else {
    left = Math.max(inset, anchor.containerWidth - preferredWidth - inset)
  }

  const maximumTop = Math.max(inset, anchor.containerHeight - panelHeight - inset)
  const top = Math.min(maximumTop, Math.max(inset, anchor.centerY - panelHeight / 2))
  return { left, top, width }
}
