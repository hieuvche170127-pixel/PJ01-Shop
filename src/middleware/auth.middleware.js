const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');


const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const token = authHeader.split(' ')[1];
    console.log('Token received:', token ? `${token.substring(0, 15)}...` : 'none');

    try {
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }
      
      // Add extra error handling for JWT verification
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        // Add user from payload
        req.user = decoded;
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
          return res.status(401).json({
            success: false,
            message: 'Token has expired'
          });
        }
        
        next();
      } catch (jwtError) {
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token format'
          });
        } else if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired'
          });
        } else {
          throw jwtError; // Let it be caught by the outer catch block
        }
      }
    } catch (error) {
      console.error('Token verification error:', error.message);
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'unknown'}) is not allowed to access this resource`
      });
    }
    next();
  };
};

// Middleware to check seller role
const isSeller = (req, res, next) => {
  console.log('Checking seller role for user:', req.user);
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Seller role required.',
    });
  }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
};

// Middleware to check buyer role
const isBuyer = (req, res, next) => {
  if (req.user && req.user.role === 'buyer') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Buyer role required.',
    });
  }
};

// Middleware to check if user is a seller or buyer (allows both roles)
const isSellerOrBuyer = (req, res, next) => {
  if (req.user && (req.user.role === 'buyer' || req.user.role === 'seller')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Buyer or Seller role required.',
    });
  }
};

module.exports = {
  authMiddleware,
  authorizeRoles,
  isSeller,
  isAdmin,
  isBuyer,
  isSellerOrBuyer
};
