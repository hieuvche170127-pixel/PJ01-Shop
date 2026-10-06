const express = require('express');
const { authMiddleware, isBuyer, isSellerOrBuyer } = require('../middleware/auth.middleware');
const orderController = require('../controllers/orderController');
const cartController = require('../controllers/cartController'); // Thêm dòng này
const addressController = require('../controllers/addressController');
const { getVoucherByCode } = require('../controllers/voucherController');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const disputeController = require('../controllers/disputeController');
const userController = require('../controllers/userController');
const returnRequestController = require('../controllers/returnRequestController');
const buyerRouter = express.Router();
// Public routes for payment callbacks (không yêu cầu xác thực)
buyerRouter.post('/payments/vietqr/callback', paymentController.vietQRCallback);
buyerRouter.get('/payments/payos/callback', paymentController.payosCallback);
buyerRouter.get('/payments/payos/cancel', paymentController.payosCallback); // Using the same handler for cancel, as it handles failure cases
// Protected routes (yêu cầu xác thực là buyer)
buyerRouter.use(authMiddleware); // Add this line to ensure authentication happens first
// Remove the isSellerOrBuyer middleware from the global level and apply it specifically where needed

// User role management
buyerRouter.put('/change-role', authController.changeRole);

// Quản lý giỏ hàng - requires buyer or seller role
const cartRoutes = express.Router();
cartRoutes.use(isSellerOrBuyer);
cartRoutes.post('/add', cartController.addToCart);
cartRoutes.get('/', cartController.viewCart);
cartRoutes.put('/update/:productId', cartController.updateCartItem);
cartRoutes.delete('/remove/:productId', cartController.deleteCartItem);
cartRoutes.post('/remove-multiple', cartController.removeMultipleItems);
buyerRouter.use('/cart', cartRoutes);

// Address routes - doesn't need role check, authMiddleware already ensures authenticated user
buyerRouter.post('/addresses', addressController.createAddress);
buyerRouter.get('/addresses', addressController.getAddresses);
buyerRouter.put('/addresses/:id', addressController.updateAddress);
buyerRouter.delete('/addresses/:id', addressController.deleteAddress);
buyerRouter.put('/addresses/:id/default', addressController.setDefaultAddress);

buyerRouter.get('/vouchers/code/:code', getVoucherByCode);

// Quản lý đơn hàng - requires buyer role specifically
const orderRoutes = express.Router();
orderRoutes.use(isBuyer);
orderRoutes.post('/', orderController.createOrder);
orderRoutes.get('/', orderController.getBuyerOrders);
orderRoutes.get('/:id', orderController.getOrderDetails);
orderRoutes.put('/items/:id/status', orderController.updateOrderItemStatus);
buyerRouter.use('/orders', orderRoutes);

// Quản lý thanh toán - requires buyer role
const paymentRoutes = express.Router();
paymentRoutes.use(isBuyer);
paymentRoutes.post('/', paymentController.createPayment);
paymentRoutes.get('/status/:orderId', paymentController.checkPaymentStatus);
buyerRouter.use('/payments', paymentRoutes);

// Review routes - requires buyer role
const reviewRoutes = express.Router();
reviewRoutes.use(isBuyer);
reviewRoutes.post('/', reviewController.createReview);
reviewRoutes.get('/', reviewController.getBuyerReviews);
reviewRoutes.put('/:id', reviewController.updateReview);
reviewRoutes.delete('/:id', reviewController.deleteReview);
buyerRouter.use('/reviews', reviewRoutes);

// Dispute routes - requires buyer role
const disputeRoutes = express.Router();
disputeRoutes.use(isBuyer);
disputeRoutes.get('/eligibility/:orderItemId', disputeController.checkDisputeEligibility);
disputeRoutes.post('/', disputeController.createDispute);
disputeRoutes.get('/', disputeController.getBuyerDisputes);
disputeRoutes.get('/:id', disputeController.getDisputeDetails);
disputeRoutes.put('/:id', disputeController.updateDispute);
disputeRoutes.delete('/:id', disputeController.cancelDispute);
buyerRouter.use('/disputes', disputeRoutes);

// Quản lý yêu cầu đổi/trả hàng
buyerRouter.post('/return-requests', returnRequestController.createReturnRequest);
buyerRouter.get('/return-requests', returnRequestController.getUserReturnRequests);
buyerRouter.get('/return-requests/:id', returnRequestController.getReturnRequestDetail);
buyerRouter.delete('/return-requests/:id', returnRequestController.cancelReturnRequest);

// Quản lý Profile cá nhân
buyerRouter.get("/profile", userController.getProfile);
buyerRouter.put("/profile", userController.updateProfile);

module.exports = buyerRouter;