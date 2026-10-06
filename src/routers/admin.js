const express = require("express");
const router = express.Router();

// Import middleware xác thực và phân quyền
const {
  authMiddleware,
  authorizeRoles,
  isAdmin,
} = require("../middleware/auth.middleware");

// Import các controller functions từ adminController
const {
  // User Management
  getAllUsers,
  getUserDetails,
  updateUserByAdmin,
  deleteUserByAdmin,

  // Store Management
  getAllStoresAdmin,
  getStoreDetails,
  updateStoreStatusByAdmin,
  updateStoreByAdmin,
  deleteStoreByAdmin,

  // Category Management
  createCategoryAdmin,
  getCategoriesAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,

  // Dispute Management
  getAllDisputesAdmin,
  updateDisputeByAdmin,

  // Coupon Management
  createCouponAdmin,
  getAllCouponsAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,

  // Product Management by Admin
  getAllProductsAdmin,
  getProductDetailsAdmin,
  deleteProductAdmin,
  deleteReviewAdmin,
  getProductStatsAdmin,
  updateProductStatusAdmin,

  getProductReviewsAndStats,

  // Order Management by Admin
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,

  // Review and Feedback Moderation
  getAllReviewsAdmin,
  deleteReviewByAdmin,
  getAllSellerFeedbackAdmin,

  // Admin Dashboard
  getAdminReport,
} = require("../controllers/adminController");

const {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  toggleVoucherActive,
} = require('../controllers/voucherController');

// Áp dụng middleware xác thực và phân quyền admin cho tất cả các route trong file này
router.use(authMiddleware);
router.use(authorizeRoles("admin"));

// --- User Management Routes ---
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId", updateUserByAdmin);
router.delete("/users/:userId", deleteUserByAdmin); // Corrected path to /admin/users/:userId
// --- Store Management Routes ---
router.get("/stores", getAllStoresAdmin);
router.get("/stores/:storeId", getStoreDetails);
router.put("/stores/:storeId", updateStoreByAdmin);
router.put("/stores/:storeId/status", updateStoreStatusByAdmin);

// // --- Category Management Routes ---
// router.post("/categories", createCategoryAdmin);
// router.get("/categories", getCategoriesAdmin);
// router.put("/categories/:categoryId", updateCategoryAdmin);
// router.delete("/categories/:categoryId", deleteCategoryAdmin);

// // --- Dispute Management Routes ---
// router.get("/disputes", getAllDisputesAdmin);
// router.put("/disputes/:disputeId", updateDisputeByAdmin);

// --- Product Management by Admin Routes ---
router.get("/products", getAllProductsAdmin); // danh sách
router.get("/products/:id", getProductDetailsAdmin); // chi tiết sản phẩm
router.put("/products/:id/status", updateProductStatusAdmin); // cập nhật trạng thái
router.delete("/products/:id", deleteProductAdmin); // xoá sản phẩm
router.get("/products/stats", getProductStatsAdmin); // thống kê sản phẩm
router.get("/products/:id/reviews", getProductReviewsAndStats);

// // --- Order Management by Admin Routes ---
// router.get("/orders", getAllOrdersAdmin);
// router.get("/orders/:orderId", getOrderDetailsAdmin);
// router.put("/orders/:orderId/status", updateOrderStatusAdmin);

// --- Review and Feedback Moderation Routes ---
router.get("/reviews", getAllReviewsAdmin); // danh sách đánh giá
router.delete("/reviews/:id", deleteReviewAdmin); // xoá đánh giá theo ID

// --- Admin Dashboard Routes ---
router.get("/report", getAdminReport);

// Voucher Management Routes
router.post('/vouchers', createVoucher);
router.get('/vouchers', getVouchers);
router.get('/vouchers/:id', getVoucherById);
router.put('/vouchers/:id', updateVoucher);
router.delete('/vouchers/:id', deleteVoucher);
router.put('/vouchers/:id/toggle-active', toggleVoucherActive);

module.exports = router;