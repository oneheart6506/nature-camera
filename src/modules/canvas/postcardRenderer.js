/**
 * postcardRenderer.js - Generates high-resolution editorial field plates for export.
 */
export class PostcardRenderer {
  static async createFieldPlate(imageSource, metadata = {}) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
    });

    // Base resolution anchored to high-res width
    const baseWidth = 1440;
    const imgAspect = img.width / img.height;
    const imgHeight = Math.round(baseWidth / imgAspect);

    // Padding & Typography metrics
    const mattePadding = 48;
    const footerHeight = metadata.caption ? 160 : 110;
    const canvasWidth = baseWidth + mattePadding * 2;
    const canvasHeight = imgHeight + mattePadding + footerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // 1. Archival Paper Matte Background
    ctx.fillStyle = '#fbf9f4';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Subtle Outer Inset Border
    ctx.strokeStyle = 'rgba(26, 36, 27, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, canvasWidth - 32, canvasHeight - 32);

    // 3. Draw Captured Photograph
    ctx.drawImage(img, mattePadding, mattePadding, baseWidth, imgHeight);

    // 4. Subtle Picture Keyline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mattePadding, mattePadding, baseWidth, imgHeight);

    // 5. Typography — Category & Observer Header
    const textStartY = imgHeight + mattePadding + 44;
    ctx.fillStyle = '#1a241b';
    ctx.font = '600 28px "Playfair Display", Georgia, serif';
    const categoryLabel = (metadata.category || 'Observation').toUpperCase();
    ctx.fillText(`${categoryLabel}`, mattePadding, textStartY);

    // Right-aligned Author Watermark
    if (metadata.authorName) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#6b7a6f';
      ctx.font = '500 22px -apple-system, sans-serif';
      ctx.fillText(`@${metadata.authorName}`, canvasWidth - mattePadding, textStartY);
      ctx.textAlign = 'left';
    }

    // 6. Typography — Timestamp & Optical Specs
    ctx.fillStyle = '#829185';
    ctx.font = '400 20px monospace';
    const dateStr = new Date(metadata.timestamp || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const specs = `${dateStr}  •  ${metadata.aspectRatio || '4:3'}  •  ${metadata.filter || 'natural'}`;
    ctx.fillText(specs, mattePadding, textStartY + 32);

    // 7. Typography — Optional Caption Note
    if (metadata.caption && metadata.caption.trim().length > 0) {
      ctx.fillStyle = '#3a4a3e';
      ctx.font = 'italic 400 24px "Playfair Display", Georgia, serif';
      ctx.fillText(`“${metadata.caption.trim()}”`, mattePadding, textStartY + 74);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  }
}
