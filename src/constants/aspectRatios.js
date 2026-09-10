/**
 * aspectRatios.js - Supported photographic aspect ratios.
 * To add a new ratio later, append an entry here without touching engine code.
 */
export const ASPECT_RATIOS = {
  '4:3': {
    id: '4:3',
    label: '4:3',
    widthRatio: 3,
    heightRatio: 4, // Portrait orientation: width < height
    cssClass: 'aspect-4-3'
  },
  '1:1': {
    id: '1:1',
    label: '1:1',
    widthRatio: 1,
    heightRatio: 1,
    cssClass: 'aspect-1-1'
  },
  '16:9': {
    id: '16:9',
    label: '16:9',
    widthRatio: 9,
    heightRatio: 16,
    cssClass: 'aspect-16-9'
  }
};

export const DEFAULT_ASPECT_RATIO = '4:3';
