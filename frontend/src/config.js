// API + socket base URLs for local dev and production.
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const SERVER_ORIGIN =
  import.meta.env.VITE_SERVER_ORIGIN ||
  (isLocal ? 'http://localhost:5000' : 'https://devine-yebh.onrender.com');

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${SERVER_ORIGIN}/api`;

// Admin session token key in localStorage
export const ADMIN_TOKEN_KEY = 'devine_admin_token';

export function authHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
