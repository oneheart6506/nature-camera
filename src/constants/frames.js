/**
 * frames.js - Frame definitions and margin ratios.
 */
export const NATURE_FRAMES = {
  none: {
    id: 'none',
    label: 'Raw',
    cssClass: 'frame-none'
  },
  editorial: {
    id: 'editorial',
    label: 'Border',
    cssClass: 'frame-editorial',
    bg: '#f7f6f2',
    marginPercent: 0.05 // 5% border on all sides
  },
  instant: {
    id: 'instant',
    label: 'Instant',
    cssClass: 'frame-instant',
    bg: '#fbfbf9',
    marginTop: 0.05,
    marginSide: 0.05,
    marginBottom: 0.18 // 18% bottom chin for time/date note
  }
};

export const DEFAULT_FRAME_ID = 'none';
