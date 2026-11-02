const express = require("express");
const adminRouter = require("./admin");
const sellerRouter = require("./seller");
const router = express.Router();
const authController = require("../controllers/authController");
const productController = require('../controllers/catalogController');
const reviewController = require('../controllers/reviewController');
const categoryController = require('../controllers/categoryController');
const buyerRouter = require("./buyerRouter");
const chatRouter = require("./chatRouter");
const userController = require("../controllers/userController");
const imageRoutes = require("../routes/imageRoutes");
const { authMiddleware } = require("../middleware/auth.middleware");

router.use("/admin", adminRouter);
router.use("/seller", sellerRouter);

// Routes cho đăng ký, đăng nhập và đăng xuất
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", require("../controllers/passwordResetController").reset);

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
router.get('/products/:productId/reviews', async (req,res,next)=>{try{await productController.publicProduct(req.params.productId);next();}catch(e){require('../utils/apiError').respondError(res,e);}}, reviewController.getProductReviews);

// Protected route for product details with all related information
router.get('/products/:productId/detail', productController.getProductDetail);

module.exports = router;
