// Minimal structured logger (ESM). Keeps console output tidy and consistent.
const ts = () => new Date().toISOString();

const fmt = (level, msg, meta) => {
  const base = `[${ts()}] ${level} ${msg}`;
  if (meta && Object.keys(meta).length) {
    try {
      return `${base} ${JSON.stringify(meta)}`;
    } catch {
      return `${base} ${meta}`;
    }
  }
  return base;
};

const logger = {
  info: (msg, meta) => console.log(fmt('INFO', msg, meta)),
  warn: (msg, meta) => console.warn(fmt('WARN', msg, meta)),
  error: (msg, meta) => console.error(fmt('ERROR', msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') console.log(fmt('DEBUG', msg, meta));
  }
};

export default logger;
