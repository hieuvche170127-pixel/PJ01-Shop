const logger = require('../utils/logger');
// Deliberately log metadata only. Bodies, headers and URL query values may contain secrets.
module.exports = (req, res, next) => {
  res.on('finish', () => logger.info('HTTP request', { method: req.method, path: req.path, status: res.statusCode }));
  next();
};
