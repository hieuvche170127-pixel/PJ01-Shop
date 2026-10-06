const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");
const { authMiddleware, isSeller } = require("../middleware/auth.middleware");

// Đăng nhập và chuyển chế độ
router.post("/login", sellerController.loginAndSwitch);

// Tạo cửa hàng (chỉ cần xác thực, không cần kiểm tra vai trò seller)
router.post("/store", authMiddleware, sellerController.createStore);

// Tất cả các route khác yêu cầu xác thực và vai trò seller
router.use(authMiddleware); // Add this line to ensure authentication happens first
router.use(isSeller);

// Quản lý hồ sơ cửa hàng và người bán
router.get("/store", sellerController.getProfileStoreAndSeller);
router.put("/store", sellerController.updateStoreProfile); 
router.put("/profile", sellerController.updateSellerProfile);

// Quản lý sản phẩm
router.post("/products", sellerController.createProduct);
router.get("/products", sellerController.getProducts);
router.put("/products/:id", sellerController.updateProduct);
router.delete("/products/:id", sellerController.deleteProduct);
router.get('/categories', sellerController.getAllCategories);
router.post('/categories', sellerController.addNewCategory);

// Quản lý tồn kho
router.put("/inventory/:productId", sellerController.updateInventory);

// Lấy chi tiết 1 sản phẩm
router.get("/products/:id", sellerController.getProductById);

// Lấy review theo productId và Review
router.get("/products/:id/reviews", sellerController.getReviewsByProductId);
router.post("/products/:productId/reviews/:reviewId/reply",sellerController.replyToReview);

// Quản lý đơn hàng
router.get("/orders/history", sellerController.getOrderHistory);
router.put("/orders/item/:orderItemId/status", sellerController.updateOrderItemStatus);
router.get("/orders/:orderId/payment", sellerController.getOrderPayment);
router.put("/payments/:paymentId/status", sellerController.updatePaymentStatus);

// Shipping management
router.get("/shipping", sellerController.getShippingInfo);
router.put("/shipping/:shippingInfoId/status", sellerController.updateShippingStatus);

// Khiếu nại
router.get("/disputes", sellerController.getDisputes);
router.put("/disputes/:id/resolve", sellerController.resolveDispute);

//Trả hàng
router.get("/return-requests", sellerController.getReturnRequests); 
router.put("/return-requests/:id", sellerController.updateReturnRequest);

// Báo cáo
router.get("/report", sellerController.getSalesReport);

// Đánh giá và phản hồi
router.get("/reviews", sellerController.getProductReviews);
router.post("/feedback", sellerController.submitFeedback);

module.exports = router;