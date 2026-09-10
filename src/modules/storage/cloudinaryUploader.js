/**
 * cloudinaryUploader.js - Direct client-side binary uploads to Cloudinary CDN.
 */
import { CLOUDINARY_CONFIG } from '../../constants/cloudinary.js';

export class CloudinaryUploader {
  /**
   * Uploads a raw binary image Blob directly to Cloudinary.
   * Returns metadata including the CDN secure_url and public_id.
   */
  static async uploadPhoto(blob, tags = ['nature-moment']) {
    if (!blob) {
      throw new Error('No image blob provided for upload.');
    }

    if (CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME_HERE') {
      throw new Error('Please configure your Cloudinary cloudName in src/constants/cloudinary.js');
    }

    // Build standard multipart/form-data payload
    const formData = new FormData();
    formData.append('file', blob, `nature-${Date.now()}.jpg`);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('tags', tags.join(','));

    try {
      const response = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Cloudinary upload failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        cloudUrl: data.secure_url,
        publicId: data.public_id,
        bytes: data.bytes,
        format: data.format,
        width: data.width,
        height: data.height
      };
    } catch (err) {
      console.error('Cloudinary direct upload failure:', err);
      throw err;
    }
  }

  /**
   * Helper: Generates dynamic transformation URLs for responsive delivery.
   */
  static getOptimizedUrl(originalUrl, width = 600) {
    if (!originalUrl || !originalUrl.includes('res.cloudinary.com')) {
      return originalUrl;
    }
    // Injects automatic WebP/AVIF format, auto quality, and width bounds
    return originalUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
}
