const express = require("express");
const adminRouter = require("./admin");
const sellerRouter = require("./seller");
const router = express.Router();
const authController = require("../controllers/authController");
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const categoryController = require('../controllers/categoryController');
const buyerRouter = require("./buyerRouter");
const chatRouter = require("./chatRouter");
const userController = require("../controllers/userController");
const imageRoutes = require("../routes/imageRoutes");
const { authMiddleware } = require("../middleware/auth.middleware");

router.use("/admin", adminRouter);
router.use("/seller", sellerRouter);

// Routes cho đăng ký và đăng nhập
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);

// User profile routes
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/profile/password", authMiddleware, authController.updatePassword);

// User search routes
router.get("/users/search", authMiddleware, userController.searchUsers);
router.get("/users/:id", authMiddleware, userController.getUserById);

router.use("/buyers", buyerRouter);
router.use("/chat", chatRouter);
router.use("/images", authMiddleware, imageRoutes);
router.get('/products', productController.listAllProducts);
router.get('/categories', categoryController.listAllCategories);
// Public route for product reviews
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// Protected route for product details with all related information
router.get('/products/:productId/detail', authMiddleware, productController.getProductDetail);

module.exports = router;