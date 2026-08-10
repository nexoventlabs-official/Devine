import { API_BASE_URL, authHeaders } from './config';

async function req(method, path, body, isForm = false) {
  const opts = { method, headers: { ...authHeaders() } };
  if (body) {
    if (isForm) opts.body = body;
    else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${API_BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  postForm: (p, form) => req('POST', p, form, true),
  put: (p, b) => req('PUT', p, b),
  putForm: (p, form) => req('PUT', p, form, true),
  patch: (p, b) => req('PATCH', p, b),
  del: (p) => req('DELETE', p)
};

export default api;
