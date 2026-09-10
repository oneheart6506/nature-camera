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

    const baseWidth = 1440;
    const imgAspect = img.width / img.height;
    const imgHeight = Math.round(baseWidth / imgAspect);

    const mattePadding = 48;
    const hasCaption = Boolean(metadata.caption && metadata.caption.trim().length > 0);
    const hasTelemetry = Boolean(metadata.telemetryString);
    
    // Dynamic footer sizing based on metadata density
    let footerHeight = 110;
    if (hasCaption && hasTelemetry) footerHeight = 190;
    else if (hasCaption || hasTelemetry) footerHeight = 150;

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

    // 3. Draw Photograph
    ctx.drawImage(img, mattePadding, mattePadding, baseWidth, imgHeight);

    // 4. Picture Keyline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mattePadding, mattePadding, baseWidth, imgHeight);

    // 5. Category Header & Author
    let currentY = imgHeight + mattePadding + 44;
    ctx.fillStyle = '#1a241b';
    ctx.font = '600 28px "Playfair Display", Georgia, serif';
    const categoryLabel = (metadata.category || 'Observation').toUpperCase();
    ctx.fillText(categoryLabel, mattePadding, currentY);

    if (metadata.authorName) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#6b7a6f';
      ctx.font = '500 22px -apple-system, sans-serif';
      ctx.fillText(`@${metadata.authorName}`, canvasWidth - mattePadding, currentY);
      ctx.textAlign = 'left';
    }

    // 6. Timestamp & Optical Specs
    currentY += 32;
    ctx.fillStyle = '#829185';
    ctx.font = '400 20px monospace';
    const dateStr = new Date(metadata.timestamp || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const specs = `${dateStr}  •  ${metadata.aspectRatio || '4:3'}  •  ${metadata.filter || 'natural'}`;
    ctx.fillText(specs, mattePadding, currentY);

    // 7. Ambient Field Telemetry Stamp
    if (hasTelemetry) {
      currentY += 28;
      ctx.fillStyle = '#9aa89d';
      ctx.font = '400 18px monospace';
      ctx.fillText(`📍 ${metadata.telemetryString}`, mattePadding, currentY);
    }

    // 8. Field Note Caption
    if (hasCaption) {
      currentY += 34;
      ctx.fillStyle = '#3a4a3e';
      ctx.font = 'italic 400 22px "Playfair Display", Georgia, serif';
      ctx.fillText(`“${metadata.caption.trim()}”`, mattePadding, currentY);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  }
}
