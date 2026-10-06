const logger = {
  log: (...args) => console.log('[LOG]', ...args),
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

module.exports = logger;
  