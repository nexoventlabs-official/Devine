// Replace [Token] placeholders in a template body with context values.
export function renderTemplate(body = '', ctx = {}) {
  return body.replace(/\[([^\]]+)\]/g, (match, key) => {
    const k = key.trim();
    const val = ctx[k] ?? ctx[k.toLowerCase()] ?? ctx[k.replace(/\s+/g, '')];
    return val !== undefined && val !== null && val !== '' ? String(val) : match;
  });
}

export default { renderTemplate };
