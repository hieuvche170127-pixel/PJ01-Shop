// paymentController.js
const axios = require('axios');
const { supportedPaymentMethods, onlinePaymentsEnabled, rejectOnlinePayment } = require('../config/payments');
const crypto = require('crypto'); // Thêm để tính signature
const { Payment, Order, OrderItem } = require('../models');
const { updateOrderAfterPayment } = require('../services/paymentVerificationService');

/**
 * Tạo yêu cầu thanh toán mới
 */
const createPayment = async (req, res) => {
  const lifecycle = require('../services/orderLifecycle');
  try {
    if (!supportedPaymentMethods.includes(req.body.method)) return res.status(400).json({ message: 'Bản demo chỉ hỗ trợ COD.' });
    const result = await lifecycle.createCOD(req.body.orderId, req.user.id);
    return res.status(result.status).json({ message: 'COD đã sẵn sàng', payment: result.payment });
  } catch (error) { return lifecycle.respondError(res, error); }
};

const vietQRCallback = async (req, res) => {
  if (!onlinePaymentsEnabled()) return rejectOnlinePayment(req, res);
  try {
    console.log('VietQR callback received with body:', req.body);
    console.log('VietQR callback received with params:', req.query);
    
    const { orderId, status, transactionId } = req.body;

    if (!orderId) {
      console.error('Missing orderId in VietQR callback');
      return res.status(400).json({ message: 'Missing orderId parameter' });
    }

    // Tìm payment theo orderId hoặc transactionId
    let payment;
    
    console.log('Looking for payment with orderId:', orderId);
    payment = await Payment.findOne({ orderId });
    
    // Nếu không tìm thấy bằng orderId và có transactionId, thử tìm bằng transactionId
    if (!payment && transactionId) {
      console.log('Payment not found by orderId, trying with transactionId:', transactionId);
      payment = await Payment.findOne({ transactionId: transactionId.toString() });
    }
    
    if (!payment) {
      console.error('Không tìm thấy thanh toán cho orderId:', orderId);
      // Thử tìm tất cả các thanh toán gần đây để debug
      const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
      console.log('Recent payments:', JSON.stringify(recentPayments, null, 2));
      return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
    }
    
    console.log('Payment found:', payment._id, 'Current status:', payment.status);

    // Cập nhật trạng thái thanh toán
    if (status === 'SUCCESS') {
      // Kiểm tra xem payment đã được cập nhật thành paid chưa
      if (payment.status === 'paid') {
        console.log(`Payment ${payment._id} already marked as paid, skipping payment update`);
        
        // Kiểm tra và cập nhật trạng thái đơn hàng nếu cần
        const order = await Order.findById(payment.orderId);
        if (order && order.status === 'pending') {
          console.log(`Order still pending despite paid payment, forcing update for orderId: ${payment.orderId}`);
          try {
            order.status = 'processing';
            await order.save();
            console.log(`Order status forcefully updated to: ${order.status}`);
            
            // Cập nhật order items
            const orderItems = await OrderItem.find({ 
              orderId: payment.orderId,
              status: "pending"
            });
            for (const item of orderItems) {
              item.status = "shipping";
              await item.save();
            }
            console.log(`Updated ${orderItems.length} order items to shipping`);
          } catch (orderError) {
            console.error(`Failed to update order status: ${orderError.message}`);
          }
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Payment already processed successfully',
          paymentStatus: payment.status
        });
      }
      
      payment.status = 'paid';
      payment.paidAt = new Date();
      if (transactionId) {
        payment.transactionId = transactionId;
      }
      await payment.save();
      
      // Cập nhật đơn hàng
      try {
        await updateOrderAfterPayment(payment.orderId);
        console.log('Order updated successfully for orderId:', payment.orderId);
        
        // Kiểm tra lại trạng thái đơn hàng sau khi cập nhật
        const order = await Order.findById(payment.orderId);
        if (order && order.status === 'pending') {
          console.log(`Warning: Order status still pending after update attempt. Forcing update for orderId: ${payment.orderId}`);
          order.status = 'processing';
          await order.save();
          console.log(`Order status forcefully updated to: ${order.status}`);
        }
      } catch (orderError) {
        console.error('Error updating order:', orderError);
      }
      
      console.log(`Cập nhật trạng thái thanh toán thành công cho orderId: ${orderId}, status: ${payment.status}`);
    } else {
      payment.status = 'failed';
      await payment.save();
      console.log(`Cập nhật trạng thái thanh toán thất bại cho orderId: ${orderId}, status: ${payment.status}`);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      paymentStatus: payment.status
    });
  } catch (error) {
    console.error('Lỗi xử lý callback VietQR:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi xử lý callback' 
    });
  }
};

/**
 * Nhận callback từ PayOS và cập nhật trạng thái thanh toán
 */
const payosCallback = async (req, res) => {
  if (!onlinePaymentsEnabled()) return rejectOnlinePayment(req, res);
  try {
    console.log('PayOS callback received with params:', req.query);
    console.log('PayOS callback received with body:', req.body);
    
    const { orderCode, status } = req.query;

    if (!orderCode) {
      console.error('Missing orderCode in PayOS callback');
      return res.status(400).json({ message: 'Missing orderCode parameter' });
    }

    console.log('Looking for payment with transactionId:', orderCode);
    
    // Tìm payment theo transactionId (orderCode)
    let payment = await Payment.findOne({ transactionId: orderCode.toString() });
    
    // Nếu không tìm thấy bằng transactionId, thử tìm bằng orderId
    if (!payment) {
      console.log('Payment not found by transactionId, trying with orderId');
      payment = await Payment.findOne({ orderId: orderCode });
    }
    
    if (!payment) {
      console.error('Không tìm thấy thanh toán cho orderCode:', orderCode);
      // Thử tìm tất cả các thanh toán gần đây để debug
      const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
      console.log('Recent payments:', JSON.stringify(recentPayments, null, 2));
      return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
    }

    console.log('Payment found:', payment._id, 'Current status:', payment.status);

    // Cập nhật trạng thái thanh toán - hỗ trợ nhiều kiểu status khác nhau từ PayOS
    if (status === 'PAID' || status === 'SUCCESS' || status === '00') {
      // Kiểm tra xem payment đã được cập nhật thành paid chưa
      if (payment.status === 'paid') {
        console.log(`Payment ${payment._id} already marked as paid, skipping payment update`);
        
        // Kiểm tra và cập nhật trạng thái đơn hàng nếu cần
        const order = await Order.findById(payment.orderId);
        if (order && order.status === 'pending') {
          console.log(`Order still pending despite paid payment, forcing update for orderId: ${payment.orderId}`);
          try {
            order.status = 'processing';
            await order.save();
            console.log(`Order status forcefully updated to: ${order.status}`);
            
            // Cập nhật order items
            const orderItems = await OrderItem.find({ 
              orderId: payment.orderId,
              status: "pending"
            });
            for (const item of orderItems) {
              item.status = "shipping";
              await item.save();
            }
            console.log(`Updated ${orderItems.length} order items to shipping`);
          } catch (orderError) {
            console.error(`Failed to update order status: ${orderError.message}`);
          }
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Payment already processed successfully',
          status: payment.status
        });
      }
      
      payment.status = 'paid';
      payment.paidAt = new Date();
      await payment.save();
      

      
      console.log('Payment status updated to paid');
    } else {
      payment.status = 'failed';
      await payment.save();
      console.log('Payment status updated to failed');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Payment status updated successfully',
      status: payment.status
    });
  } catch (error) {
    console.error('Error in PayOS callback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Kiểm tra trạng thái thanh toán của đơn hàng
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log(`Checking payment status for orderId: ${orderId}, userId: ${userId}`);

    // Tìm thanh toán theo orderId
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      console.error(`Payment not found for orderId: ${orderId}`);
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    // Kiểm tra quyền truy cập
    if (payment.userId.toString() !== userId) {
      console.error(`Access denied: payment.userId (${payment.userId}) doesn't match userId (${userId})`);
      return res.status(403).json({ message: 'Bạn không có quyền xem thông tin thanh toán này' });
    }

    console.log(`Payment found: ${payment._id}, method: ${payment.method}, status: ${payment.status}`);

    // Tìm đơn hàng để lấy thêm thông tin
    const order = await Order.findById(orderId);
    if (order) {
      console.log(`Order found: ${order._id}, status: ${order.status}`);
    } else {
      console.log(`Order not found for orderId: ${orderId}`);
    }

    // Tách biệt phần response từ logic xử lý
    return res.status(200).json({
      payment: {
        id: payment._id,
        method: payment.method,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        transactionId: payment.transactionId
      },
      order: order ? {
        id: order._id,
        status: order.status
      } : null
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  createPayment,
  vietQRCallback,
  payosCallback,
  checkPaymentStatus
};