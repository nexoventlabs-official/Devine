import axios from 'axios';
import logger from './logger.js';

// Reverse-geocode a lat/lng into a human-readable address using OpenCage.
// Returns '' on any failure so callers can fall back to raw coordinates.
export async function reverseGeocode(latitude, longitude) {
  const key = process.env.OPENCAGE_API_KEY || '';
  if (!key || latitude == null || longitude == null) return '';
  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(`${latitude}+${longitude}`)}&key=${key}&no_annotations=1&limit=1&language=en`;
    const { data } = await axios.get(url, { timeout: 8000 });
    return data?.results?.[0]?.formatted || '';
  } catch (err) {
    logger.warn('reverseGeocode failed', { error: err.response?.data?.status?.message || err.message });
    return '';
  }
}

// Resolve the best display address for a WhatsApp-shared location object.
// Prefers the address WhatsApp provides; otherwise reverse-geocodes the coords.
export async function resolveLocationAddress(location = {}) {
  if (location.address) return location.address;
  const addr = await reverseGeocode(location.latitude, location.longitude);
  if (addr) return addr;
  if (location.latitude != null && location.longitude != null) {
    return `${location.latitude}, ${location.longitude}`;
  }
  return '';
}

export default { reverseGeocode, resolveLocationAddress };
