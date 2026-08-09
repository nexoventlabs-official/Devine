// Simple admin auth guard. The login route issues a static session token;
// protected routes require it in the Authorization header.
const TOKEN = () => process.env.ADMIN_TOKEN || 'devine_admin_session_token_2026';

export default function auth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (token && token === TOKEN()) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}
