// scheduler.js
const cron = require('node-cron');
const { verifyPendingPayments } = require('../services/paymentVerificationService');

/**
 * Khởi tạo tất cả các công việc định kỳ
 */
const initScheduler = () => {
  // Kiểm tra các thanh toán đang chờ mỗi 5 phút
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled payment verification task...');
    await verifyPendingPayments();
  });
  
  console.log('Payment verification scheduler initialized');
};

module.exports = {
  initScheduler
}; 