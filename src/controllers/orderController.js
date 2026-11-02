// orderController.js

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const mongoose = require('mongoose');

const lifecycle = require('../services/orderLifecycle');

const { placeOrder, CheckoutError } = require('../services/checkoutService');
const logger = require('../utils/logger');
const createOrder = async (req, res) => {
  try {
    const result = await placeOrder(req.user.id, req.get('Idempotency-Key'), req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    if (error instanceof CheckoutError) return res.status(error.status).json({ error: error.message, code: error.code });
    logger.error('Checkout unavailable', error);
    return res.status(503).json({ error: 'Đơn hàng chưa xác định kết quả. Vui lòng thử lại cùng thao tác hoặc kiểm tra lịch sử đơn.', code: 'CHECKOUT_PROCESSING' });
  }
};

// Get order history for current buyer
const getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { buyerId };
    if (status && ['pending', 'shipping', 'shipped', 'failed to ship', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find orders with populated address
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('addressId')
      .lean();

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // GET endpoints are read-only. Status is synchronized by write operations.
    const ordersWithItems = await Promise.all(orders.map(async order => ({
      ...order,
      items: await OrderItem.find({ orderId: order._id }).populate('productId', 'title image price description').lean(),
    })));

    return res.status(200).json({
      orders: ordersWithItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const buyerId = req.user.id;

    if (!mongoose.isObjectIdOrHexString(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

    // Find order and verify it belongs to the current buyer
    const order = await Order.findOne({ _id: orderId, buyerId })
      .populate('addressId')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    // Get order items with product details
    const items = await OrderItem.find({ orderId })
      .populate({
        path: 'productId',
        select: 'title image price description'
      })
      .lean();

    return res.status(200).json({
      order: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Buyers can confirm receipt or cancel a pending line; shared service enforces ownership.
const updateOrderItemStatus = async (req, res) => {
  try { return res.json({ message: 'Order item updated', ...await lifecycle.transition(req.params.id, req.user, req.body.status) }); }
  catch (error) { return lifecycle.respondError(res, error); }
};

module.exports = { createOrder, getBuyerOrders, getOrderDetails, updateOrderItemStatus };