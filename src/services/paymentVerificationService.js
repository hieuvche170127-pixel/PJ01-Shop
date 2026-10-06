// paymentVerificationService.js
const axios = require('axios');
const crypto = require('crypto');
const { Payment, Order, OrderItem } = require('../models');

/**
 * Kiểm tra trạng thái thanh toán qua VietQR API
 * @param {Object} payment - Payment document
 * @returns {Promise<boolean>} - true nếu thanh toán thành công
 */
const verifyVietQRPayment = async (payment) => {
  try {
    // Check required environment variables
    if (!process.env.VIETQR_CLIENT_ID || !process.env.VIETQR_API_KEY) {
      console.error('Thiếu cấu hình VietQR. Vui lòng kiểm tra các biến môi trường VIETQR_*');
      return false;
    }

    const vietQR_STATUS_API_URL = 'https://api.vietqr.io/v2/transactions';
    
    // Gọi API kiểm tra trạng thái
    const response = await axios.get(`${vietQR_STATUS_API_URL}/${payment.orderId}`, {
      headers: {
        'x-client-id': process.env.VIETQR_CLIENT_ID,
        'x-api-key': process.env.VIETQR_API_KEY,
      }
    });

    const responseData = response.data;
    console.log('VietQR verification response:', JSON.stringify(responseData, null, 2));

    // Kiểm tra trạng thái thanh toán
    if (responseData.code === '00' && responseData.data && responseData.data.status === 'SUCCESS') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.transactionId = responseData.data.transactionId || payment.transactionId;
      await payment.save();
      await updateOrderAfterPayment(payment.orderId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Lỗi khi kiểm tra thanh toán VietQR:', error.message);
    return false;
  }
};

/**
 * Kiểm tra trạng thái thanh toán qua PayOS API
 * @param {Object} payment - Payment document
 * @returns {Promise<boolean>} - true nếu thanh toán thành công
 */
const verifyPayOSPayment = async (payment) => {
  try {
    // Check required environment variables
    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY) {
      console.error('Thiếu cấu hình PayOS. Vui lòng kiểm tra các biến môi trường PAYOS_*');
      return false;
    }

    const PAYOS_STATUS_API_URL = 'https://api-merchant.payos.vn/v2/payment-requests';
    
    // Gọi API kiểm tra trạng thái
    const response = await axios.get(`${PAYOS_STATUS_API_URL}/${payment.transactionId}`, {
      headers: {
        'x-client-id': process.env.PAYOS_CLIENT_ID,
        'x-api-key': process.env.PAYOS_API_KEY,
      }
    });

    const responseData = response.data;
    console.log('PayOS verification response:', JSON.stringify(responseData, null, 2));

    // Kiểm tra trạng thái thanh toán
    if (responseData.code === '00' && responseData.data && responseData.data.status === 'PAID') {
      payment.status = 'paid';
      payment.paidAt = new Date();
      await payment.save();
      await updateOrderAfterPayment(payment.orderId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Lỗi khi kiểm tra thanh toán PayOS:', error.message);
    return false;
  }
};

/**
 * Cập nhật trạng thái đơn hàng sau khi thanh toán thành công
 * @param {string} orderId - ID của đơn hàng
 */
const updateOrderAfterPayment = async (orderId) => {
  try {
    console.log(`Updating order status after payment for orderId: ${orderId}`);
    
    // Cập nhật trạng thái đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      console.error(`Order not found with ID: ${orderId}`);
      return false;
    }
    
    console.log(`Current order status: ${order.status}`);
    
    // Chỉ cập nhật nếu đơn hàng đang ở trạng thái pending
    if (order.status === 'pending') {
      order.status = 'processing';
      await order.save();
      console.log(`Order status updated from 'pending' to 'processing' for orderId: ${orderId}`);
      
      // Kiểm tra xem cập nhật có thành công không
      const updatedOrder = await Order.findById(orderId);
      console.log(`Verified updated order status: ${updatedOrder.status}`);
      
      if (updatedOrder.status !== 'processing') {
        console.error(`Order status update verification failed! Expected 'processing', got '${updatedOrder.status}'`);
        // Thử cập nhật lại một lần nữa
        updatedOrder.status = 'processing';
        await updatedOrder.save();
        console.log(`Attempted second update of order status, new status: ${updatedOrder.status}`);
      }
    } else {
      console.log(`Order status unchanged (${order.status}) as it's not in 'pending' state`);
    }

    // Cập nhật các OrderItems
    const orderItems = await OrderItem.find({ 
      orderId: orderId,
      status: "pending"
    });
    
    if (orderItems.length === 0) {
      console.log(`No pending order items found for orderId: ${orderId}`);
    }
    
    // Cập nhật các OrderItems sang trạng thái shipping
    let updatedCount = 0;
    for (const item of orderItems) {
      item.status = "shipping";
      await item.save();
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} order items to shipping status for orderId: ${orderId}`);
    return true;
  } catch (error) {
    console.error(`Error updating order after payment for orderId: ${orderId}:`, error);
    return false;
  }
};

/**
 * Kiểm tra tất cả các thanh toán đang chờ xử lý
 * Hàm này sẽ được gọi định kỳ bởi scheduler
 */
const verifyPendingPayments = async () => {
  try {
    console.log('Bắt đầu kiểm tra các thanh toán đang chờ...');
    
    // Tìm tất cả các thanh toán đang ở trạng thái pending
    const pendingPayments = await Payment.find({ 
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Chỉ kiểm tra thanh toán trong 24h gần đây
    });
    
    console.log(`Tìm thấy ${pendingPayments.length} thanh toán đang chờ xử lý`);
    
    // Kiểm tra từng thanh toán
    for (const payment of pendingPayments) {
      console.log(`Kiểm tra thanh toán ID: ${payment._id}, phương thức: ${payment.method}`);
      
      let verified = false;
      if (payment.method === 'VietQR') {
        verified = await verifyVietQRPayment(payment);
      } else if (payment.method === 'PayOS') {
        verified = await verifyPayOSPayment(payment);
      }
      
      if (verified) {
        console.log(`Đã xác nhận thanh toán thành công cho payment ID: ${payment._id}`);
      }
    }
    
    console.log('Hoàn thành kiểm tra thanh toán đang chờ');
  } catch (error) {
    console.error('Lỗi khi kiểm tra thanh toán đang chờ:', error);
  }
};

module.exports = {
  verifyVietQRPayment,
  verifyPayOSPayment,
  verifyPendingPayments,
  updateOrderAfterPayment
}; 