// Dynamic API base URL configuration for local dev and Render/Vercel production deployment
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://devine-yebh.onrender.com/api');
