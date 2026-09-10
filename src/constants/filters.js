/**
 * filters.js - Nature-tailored color profiles.
 * Preserves organic highlights and botanical fidelity.
 */
export const NATURE_FILTERS = [
  {
    id: 'natural',
    label: 'Natural',
    filter: 'none'
  },
  {
    id: 'forest',
    label: 'Forest',
    filter: 'contrast(1.12) saturate(1.28) hue-rotate(-8deg)'
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    filter: 'sepia(0.24) saturate(1.35) brightness(1.02) contrast(1.06)'
  },
  {
    id: 'mist',
    label: 'Film Mist',
    filter: 'contrast(0.92) brightness(1.08) saturate(0.85)'
  },
  {
    id: 'monochrome',
    label: 'Mono Tone',
    filter: 'grayscale(1) contrast(1.25)'
  }
];

export const DEFAULT_FILTER_ID = 'natural';
