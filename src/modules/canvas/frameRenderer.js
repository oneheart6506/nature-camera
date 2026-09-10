/**
 * frameRenderer.js - Composites frames, paper backgrounds, and metadata stamps.
 */
import { NATURE_FRAMES } from '../../constants/frames.js';

export class FrameRenderer {
  /**
   * Applies the selected frame around a source canvas.
   * Returns a new composited HTMLCanvasElement.
   */
  static applyFrame(sourceCanvas, frameId = 'none', metadata = {}) {
    const frame = NATURE_FRAMES[frameId] || NATURE_FRAMES.none;

    if (frame.id === 'none') {
      return sourceCanvas;
    }

    const { width: srcW, height: srcH } = sourceCanvas;
    const outCanvas = document.createElement('canvas');
    const ctx = outCanvas.getContext('2d');

    if (frame.id === 'editorial') {
      const margin = Math.round(srcW * frame.marginPercent);
      outCanvas.width = srcW + margin * 2;
      outCanvas.height = srcH + margin * 2;

      // Draw paper background
      ctx.fillStyle = frame.bg;
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

      // Draw photo in center
      ctx.drawImage(sourceCanvas, margin, margin);

      return outCanvas;
    }

    if (frame.id === 'instant') {
      const mSide = Math.round(srcW * frame.marginSide);
      const mTop = Math.round(srcW * frame.marginTop);
      const mBottom = Math.round(srcW * frame.marginBottom);

      outCanvas.width = srcW + mSide * 2;
      outCanvas.height = srcH + mTop + mBottom;

      // Draw warm instant paper
      ctx.fillStyle = frame.bg;
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

      // Draw photo
      ctx.drawImage(sourceCanvas, mSide, mTop);

      // Draw editorial timestamp on the bottom chin
      const dateText = metadata.timestamp || new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      const fontSize = Math.max(14, Math.round(srcW * 0.032));
      ctx.font = `300 ${fontSize}px "Editorial New", Georgia, serif`;
      ctx.fillStyle = '#3a5340';
      ctx.letterSpacing = '1px';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textY = mTop + srcH + (mBottom / 2);
      ctx.fillText(dateText, outCanvas.width / 2, textY);

      return outCanvas;
    }

    return sourceCanvas;
  }
}
