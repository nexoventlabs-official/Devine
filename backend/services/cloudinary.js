// Cloudinary service (ESM) - upload & optimize images/PDFs for WhatsApp + admin.
import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

// Configure lazily on first use. ES module imports are hoisted and run before
// server.js calls dotenv.config(), so reading env at import time yields undefined
// ("Must supply api_key"). Configuring on first call guarantees env is loaded.
let _configured = false;
function ensureConfig() {
  if (_configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  if (process.env.CLOUDINARY_API_KEY) _configured = true; // retry until env is present
}

const cloudinaryService = {
  /**
   * Upload a buffer to Cloudinary.
   * @param {Buffer} buffer
   * @param {object} opts { folder, publicId, resourceType, preserveAspect }
   * @returns {Promise<string>} secure_url
   */
  uploadBuffer(buffer, { folder = 'devine', publicId = null, resourceType = 'image', preserveAspect = false, aspectRatio = '1:1' } = {}) {
    ensureConfig();
    return new Promise((resolve, reject) => {
      const options = { folder, resource_type: resourceType };
      if (publicId) options.public_id = publicId;
      if (resourceType === 'image') {
        if (aspectRatio === 'original') {
          // Keep the uploaded image's exact aspect ratio (no crop); just cap width + optimize.
          options.transformation = [
            { width: 1600, crop: 'limit' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ];
        } else if (aspectRatio === '8:1') {
          options.transformation = [
            { width: 1000, height: 125, crop: 'fill', gravity: 'center' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ];
        } else if (aspectRatio === '3:2') {
          options.transformation = [
            { width: 1200, height: 800, crop: 'fill', gravity: 'center' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ];
        } else if (aspectRatio === '2:1') {
          options.transformation = [
            { width: 1200, height: 600, crop: 'fill', gravity: 'center' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ];
        } else if (preserveAspect) {
          options.transformation = [
            { width: 1000, crop: 'scale' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ];
        } else {
          options.transformation = [
            { width: 800, height: 800, crop: 'fill', gravity: 'center' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ];
        }
      }
      const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err) {
          logger.error('Cloudinary upload error', { error: err.message });
          return reject(err);
        }
        logger.info('Cloudinary upload success', { url: result.secure_url });
        resolve(result.secure_url);
      });
      stream.end(buffer);
    });
  },

  async uploadFromUrl(url, { folder = 'devine', publicId = null } = {}) {
    ensureConfig();
    const options = {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'fill', gravity: 'center' },
        { quality: 'auto:best', fetch_format: 'auto' }
      ]
    };
    if (publicId) options.public_id = publicId;
    const result = await cloudinary.uploader.upload(url, options);
    return result.secure_url;
  },

  /** Optimize an image URL to a fixed aspect ratio for WhatsApp display. */
  getOptimizedUrl(imageUrl, aspectRatio = '1:1') {
    if (!imageUrl || imageUrl.startsWith('data:')) return imageUrl;
    // Preserve the original aspect ratio (no crop) — cap width + optimize only.
    if (aspectRatio === 'original') {
      if (imageUrl.includes('cloudinary.com')) {
        const parts = imageUrl.split('/upload/');
        if (parts.length === 2) return `${parts[0]}/upload/w_1600,c_limit,q_auto:best,f_auto/${parts[1]}`;
      }
      return imageUrl;
    }
    let dims = { w: 800, h: 800 };
    if (aspectRatio === '8:1') dims = { w: 1000, h: 125 };
    else if (aspectRatio === '3:2') dims = { w: 1200, h: 800 };
    else if (aspectRatio === '2:1') dims = { w: 1200, h: 600 };
    if (imageUrl.includes('cloudinary.com')) {
      const parts = imageUrl.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${dims.w},h_${dims.h},c_fill,g_center,q_auto:best,f_auto/${parts[1]}`;
      }
      return imageUrl;
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return imageUrl;
    return `https://res.cloudinary.com/${cloudName}/image/fetch/w_${dims.w},h_${dims.h},c_fill,g_center,q_auto:best,f_auto/${encodeURIComponent(imageUrl)}`;
  },

  async deleteByPublicId(publicId, resourceType = 'image') {
    ensureConfig();
    try {
      // invalidate: true also purges the asset from Cloudinary's CDN edge cache.
      return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    } catch (err) {
      logger.error('Cloudinary delete error', { error: err.message });
      throw err;
    }
  },

  /**
   * Delete an asset given its stored (secure) URL. Resource type is inferred
   * from the extension (PDFs are stored as `raw`). No-op for non-Cloudinary URLs.
   * For `raw` assets the extension is part of the public_id and is preserved.
   */
  async deleteByUrl(url, resourceType) {
    if (!url || !url.includes('cloudinary.com')) return null;
    const rt = resourceType || (
      /\/video\/upload\//i.test(url) || /\.(mp4|mov|webm|m4v|3gp|mkv)(\?|$)/i.test(url) ? 'video'
        : /\.pdf(\?|$)/i.test(url) ? 'raw'
          : 'image'
    );
    const parts = url.split('/upload/');
    if (parts.length !== 2) return null;
    const path = parts[1].split('?')[0];
    // Drop version (v123456) and transformation (w_800, c_fill, ...) segments.
    const segments = path.split('/').filter((s) => !/^v\d+$/.test(s) && !/^[a-z]+_/.test(s));
    let publicId = segments.join('/');
    if (rt !== 'raw') publicId = publicId.replace(/\.[^/.]+$/, ''); // images: drop extension
    if (!publicId) return null;
    return this.deleteByPublicId(publicId, rt);
  },

  extractPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    const parts = url.split('/upload/');
    if (parts.length !== 2) return null;
    const segments = parts[1].split('/').filter(
      (s) => !/^[a-z]+_/.test(s) && !/^v\d+$/.test(s)
    );
    return segments.join('/').replace(/\.[^/.]+$/, '');
  }
};

export default cloudinaryService;
