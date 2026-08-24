export const APPROXIMATE_GLYPH_WIDTH_RATIO = 0.58

export const DECISION_LABEL_MAX_WIDTH = 156
export const DECISION_LABEL_PADDING_X = 14
export const DECISION_LABEL_PADDING_Y = 9
export const DECISION_ICON_SURFACE_SCALE = 1.32
export const DECISION_ICON_RENDER_SCALE = 0.72
export const DECISION_ICON_GAP = 7
export const INLINE_LABEL_OPTICAL_OFFSET_RATIO = 0.1

/**
 * Estimate label width without relying on browser font metrics.
 * The slightly conservative ratio accommodates both proportional and mono themes.
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * APPROXIMATE_GLYPH_WIDTH_RATIO
}
