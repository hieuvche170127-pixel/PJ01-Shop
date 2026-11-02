const secretKey = /password|passwd|pass$|token|authorization|cookie|secret|api[-_]?key|checksum|signature/i;
function redact(value, seen = new WeakSet()) {
  if (value instanceof Error) return { name: value.name, code: value.code };
  if (typeof value === 'string') {
    let safe = value.replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]');
    for (const [key, secret] of Object.entries(process.env)) {
      if (secretKey.test(key) && secret && secret.length >= 4) safe = safe.split(secret).join('[REDACTED]');
    }
    return safe;
  }
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => redact(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, secretKey.test(key) ? '[REDACTED]' : redact(item, seen)]));
}
const logger = {
  log: (...args) => console.log('[LOG]', ...args.map(arg => redact(arg))),
  info: (...args) => console.log('[INFO]', ...args.map(arg => redact(arg))),
  warn: (...args) => console.warn('[WARN]', ...args.map(arg => redact(arg))),
  error: (...args) => console.error('[ERROR]', ...args.map(arg => redact(arg))),
};
module.exports = logger;
