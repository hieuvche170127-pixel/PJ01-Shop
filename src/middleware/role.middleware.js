// Middleware to check user role
exports.isSeller = (req, res, next) => {
  if (req.user && req.user.role === "seller") {
    next(); // User is a seller, proceed
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Seller role required.",
    });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }
};

