const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Address = require('../models/Address');
const Product = require('../models/Product');
const User = require('../models/User');
const Store = require('../models/Store');
const Inventory = require('../models/Inventory');
const Voucher = require('../models/Voucher');
const CheckoutRequest = require('../models/CheckoutRequest');
const logger = require('../utils/logger');
const { sendEmail } = require('./emailService');

class CheckoutError extends Error {
  constructor(status, message, code = 'CHECKOUT_INVALID') { super(message); this.status = status; this.code = code; }
}
const fail = (status, message, code) => { throw new CheckoutError(status, message, code); };
const validId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const validQuantity = value => Number.isSafeInteger(value) && value > 0;

function normalize(body) {
  if (!body || !validId(body.selectedAddressId)) fail(400, 'Địa chỉ giao hàng không hợp lệ.');
  if (!Array.isArray(body.selectedItems) || !body.selectedItems.length || body.selectedItems.length > 100) fail(400, 'Đơn hàng cần từ 1 đến 100 dòng sản phẩm.');
  const quantities = new Map();
  for (const item of body.selectedItems) {
    if (!item || !validId(item.productId) || !validQuantity(item.quantity)) fail(400, 'Số lượng phải là số nguyên dương và mã sản phẩm phải hợp lệ.');
    const id = item.productId.toLowerCase();
    const quantity = (quantities.get(id) || 0) + item.quantity;
    if (!validQuantity(quantity)) fail(400, 'Tổng số lượng không hợp lệ.');
    quantities.set(id, quantity);
  }
  if (body.couponCode != null && (typeof body.couponCode !== 'string' || body.couponCode.length > 100)) fail(400, 'Mã giảm giá không hợp lệ.');
  return {
    selectedAddressId: body.selectedAddressId.toLowerCase(),
    selectedItems: [...quantities].sort(([a], [b]) => a.localeCompare(b)).map(([productId, quantity]) => ({ productId, quantity })),
    couponCode: (body.couponCode || '').trim().toUpperCase(),
  };
}

async function releaseCompletedReservations(requestId) {
  try {
    await Inventory.updateMany({ 'checkoutReservations.requestId': requestId }, { $pull: { checkoutReservations: { requestId } } });
    await Voucher.updateMany({ checkoutReservations: requestId }, { $pull: { checkoutReservations: requestId } });
  } catch (error) { logger.error('Completed checkout reservation cleanup failed', error); }
}

async function replay(request, fingerprint) {
  if (!request || request.fingerprint !== fingerprint) fail(409, 'Lần đặt hàng này đã dùng với nội dung khác.', 'IDEMPOTENCY_CONFLICT');
  if (request.state === 'completed') {
    await releaseCompletedReservations(request._id);
    return { status: 200, body: request.result };
  }
  if (request.state === 'failed') throw new CheckoutError(request.errorStatus, request.errorMessage, 'CHECKOUT_FAILED');
  fail(409, 'Đơn đang được xử lý. Vui lòng kiểm tra lịch sử đơn hoặc thử lại sau.', 'CHECKOUT_PROCESSING');
}

async function placeOrder(buyerId, key, body) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) fail(400, 'Thiếu mã chống đặt đơn trùng. Vui lòng tải lại trang.');
  const input = normalize(body);
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const requestId = crypto.createHash('sha256').update(String(buyerId) + ':' + key).digest('hex');
  const previous = await CheckoutRequest.findById(requestId).lean();
  if (previous) return replay(previous, fingerprint);
  const orderId = new mongoose.Types.ObjectId();
  try {
    await CheckoutRequest.create({ _id: requestId, buyerId, fingerprint, orderId, input, state: 'processing' });
  } catch (error) {
    if (error.code === 11000) return replay(await CheckoutRequest.findById(requestId).lean(), fingerprint);
    throw error;
  }

  let committed = false;
  let buyer;
  let result;
  try {
    const address = await Address.findOne({ _id: input.selectedAddressId, userId: buyerId }).lean();
    if (!address) fail(404, 'Không tìm thấy địa chỉ giao hàng của bạn.');
    buyer = await User.findById(buyerId).select('email').lean();
    if (!buyer) fail(401, 'Tài khoản không còn tồn tại.');
    let subtotal = 0;
    const lines = [];
    for (const item of input.selectedItems) {
      const product = await Product.findOne({ _id: item.productId, isAuction: true }).lean();
      if (!product) fail(404, 'Sản phẩm không còn được bán.');
      const [seller, store] = await Promise.all([
        User.exists({ _id: product.sellerId, role: 'seller', action: { $ne: 'lock' } }),
        Store.exists({ sellerId: product.sellerId, status: 'approved' }),
      ]);
      if (!seller || !store || String(product.sellerId) === String(buyerId)) fail(409, 'Sản phẩm hiện không thể đặt mua.');
      if (!Number.isSafeInteger(product.price) || product.price < 0 || !Number.isSafeInteger(product.price * item.quantity)) fail(400, 'Giá hoặc số lượng sản phẩm không hợp lệ.');
      subtotal += product.price * item.quantity;
      if (!Number.isSafeInteger(subtotal)) fail(400, 'Giá trị đơn hàng vượt giới hạn.');
      lines.push({ orderId, productId: item.productId, quantity: item.quantity, unitPrice: product.price, status: 'pending' });
    }

    // A single atomic update checks available stock and records the reservation.
    // Works on the demo's standalone MongoDB; no replica-set transaction required.
    for (const item of input.selectedItems) {
      const stock = await Inventory.findOneAndUpdate(
        { productId: item.productId, quantity: { $gte: item.quantity }, 'checkoutReservations.requestId': { $ne: requestId } },
        { $inc: { quantity: -item.quantity }, $push: { checkoutReservations: { requestId, quantity: item.quantity } }, $set: { lastUpdated: new Date() } },
        { new: true }
      );
      if (!stock) fail(409, 'Sản phẩm không đủ tồn kho. Vui lòng cập nhật giỏ hàng.');
    }

    let discount = 0;
    let voucherId;
    if (input.couponCode) {
      const voucher = await Voucher.findOneAndUpdate({
        code: input.couponCode, isActive: true, isDeleted: { $ne: true }, expirationDate: { $gt: new Date() },
        minOrderValue: { $lte: subtotal }, $expr: { $lt: ['$usedCount', '$usageLimit'] },
        'checkoutReservations': { $ne: requestId },
      }, { $inc: { usedCount: 1 }, $push: { checkoutReservations: requestId } }, { new: true });
      if (!voucher) fail(400, 'Voucher không hợp lệ, hết hạn, hết lượt hoặc chưa đủ giá trị đơn.');
      voucherId = voucher._id;
      if (!Number.isFinite(voucher.discount) || voucher.discount < 0) fail(400, 'Giá trị voucher không hợp lệ.');
      discount = voucher.discountType === 'fixed' ? voucher.discount : subtotal * voucher.discount / 100;
      if (voucher.discountType === 'percentage' && voucher.maxDiscount > 0) discount = Math.min(discount, voucher.maxDiscount);
    }
    const totalPrice = Math.max(0, subtotal - Math.round(discount));
    const amounts = require('./orderLifecycle').allocations(lines, totalPrice);
    lines.forEach((line, index) => { line.payableAmount = amounts[index]; });
    await OrderItem.insertMany(lines);
    await Order.create({ _id: orderId, buyerId, addressId: address._id, originalTotalPrice: totalPrice, voucherId, totalPrice, status: 'pending' });
    result = { message: 'Order placed successfully', orderId: String(orderId), totalPrice };
    await CheckoutRequest.updateOne({ _id: requestId }, { $set: { state: 'completed', result } });
    committed = true;
  } catch (error) {
    // If the completion write was acknowledged ambiguously, never undo a committed order.
    const request = await CheckoutRequest.findById(requestId).lean();
    if (request?.state === 'completed') return replay(request, fingerprint);
    try {
      await OrderItem.deleteMany({ orderId });
      await Order.deleteOne({ _id: orderId, buyerId });
      // Reservation markers make compensation safe even after a lost write acknowledgement.
      for (const item of input.selectedItems) {
        await Inventory.updateOne({ productId: item.productId, 'checkoutReservations.requestId': requestId }, {
          $inc: { quantity: item.quantity }, $pull: { checkoutReservations: { requestId } }, $set: { lastUpdated: new Date() },
        });
      }
      await Voucher.updateOne({ checkoutReservations: requestId }, { $inc: { usedCount: -1 }, $pull: { checkoutReservations: requestId } });
      await CheckoutRequest.updateOne({ _id: requestId }, { $set: {
        state: 'failed', errorStatus: error.status || 500,
        errorMessage: error instanceof CheckoutError ? error.message : 'Không thể tạo đơn hàng. Vui lòng thử lại.',
      } });
    } catch (cleanupError) {
      logger.error('Checkout compensation needs review', cleanupError);
      // Leave the persisted request processing, preventing a duplicate retry.
      fail(503, 'Đơn hàng cần kiểm tra lại. Vui lòng không tạo đơn mới và liên hệ quản trị viên.', 'CHECKOUT_PROCESSING');
    }
    if (error instanceof CheckoutError) throw new CheckoutError(error.status, error.message, 'CHECKOUT_FAILED');
    logger.error('Checkout failed', error);
    fail(500, 'Không thể tạo đơn hàng. Vui lòng thử lại.', 'CHECKOUT_FAILED');
  }
  if (committed) {
    await releaseCompletedReservations(requestId);
    try {
      await sendEmail(buyer.email, 'Shopii - Order Confirmation', `Đơn hàng ${result.orderId} đã được tạo. Tổng tiền: ${result.totalPrice} VND. Thanh toán COD khi nhận hàng.`);
    } catch (error) { logger.error('Order created; email notification failed', error); }
  }
  return { status: 201, body: result };
}

module.exports = { placeOrder, CheckoutError, validId, validQuantity };
