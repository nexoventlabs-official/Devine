import axios from 'axios';

/**
 * Download an image URL and return raw base64 string (no data: prefix).
 * Meta WhatsApp Flow `Image` components and data-source `image` fields require raw base64 PNG/JPG strings.
 */
export async function urlToBase64(url, opts = {}) {
  if (!url) return '';
  if (url.startsWith('data:image/')) {
    return url.replace(/^data:image\/[^;]+;base64,/, '');
  }
  try {
    const fetchUrl = withCloudinaryTransform(url, opts);
    const resp = await axios.get(fetchUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024
    });
    const base64 = Buffer.from(resp.data).toString('base64');
    return base64.replace(/^data:image\/[^;]+;base64,/, '');
  } catch (err) {
    console.warn('[imageBase64] failed for', url, err.message);
    return '';
  }
}

function withCloudinaryTransform(url, opts = {}) {
  if (!url || !url.includes('/upload/')) return url;
  const parts = [];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  parts.push(`c_${opts.crop || 'fill'}`);
  parts.push(`q_${opts.quality || 75}`);
  parts.push(`f_${opts.format || 'jpg'}`);
  return url.replace('/upload/', `/upload/${parts.join(',')}/`);
}

export default { urlToBase64, withCloudinaryTransform };
