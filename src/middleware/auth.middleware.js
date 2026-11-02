const { authenticateToken, AuthenticationError } = require('../services/authService');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    req.user = await authenticateToken(match[1]);
    return next();
  } catch (error) {
    if (error instanceof AuthenticationError) return res.status(error.status).json({ success: false, message: error.message });
    logger.error('Authentication check failed', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied for this role' });
  }
  return next();
};

module.exports = {
  authMiddleware, authorizeRoles,
  isSeller: authorizeRoles('seller'),
  isAdmin: authorizeRoles('admin'),
  isBuyer: authorizeRoles('buyer'),
  isSellerOrBuyer: authorizeRoles('seller', 'buyer'),
};
