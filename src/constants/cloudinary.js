/**
 * cloudinary.js - Public Cloudinary client configuration.
 * Safe to expose on client-side because it uses an unsigned preset.
 */
export const CLOUDINARY_CONFIG = {
  cloudName: 'ye2exweg', // e.g. 'dn9x4k1lo'
  uploadPreset: 'nature_preset',     // The unsigned preset created in dashboard
  uploadUrl: 'https://api.cloudinary.com/v1_1/ye2exweg/image/upload'
};
