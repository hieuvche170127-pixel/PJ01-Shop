const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const ShippingInfo = require('../models/ShippingInfo');
const Payment = require('../models/Payment');
const Voucher = require('../models/Voucher');
const CheckoutRequest = require('../models/CheckoutRequest');
const OrderLock = require('../models/OrderLock');
const logger = require('../utils/logger');

class OrderError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new OrderError(status, message); };
function id(value) { if (!mongoose.isObjectIdOrHexString(value)) fail(400, 'Mã dữ liệu không hợp lệ.'); }

async function locked(orderId, work) {
  id(orderId);
  const owner = crypto.randomUUID();
  try { await OrderLock.create({ _id: String(orderId), owner }); }
  catch (error) { if (error.code === 11000) fail(409, 'Đơn đang được cập nhật. Vui lòng thử lại.'); throw error; }
  try {
    const checkout = await CheckoutRequest.findOne({ orderId }).lean();
    if (checkout && checkout.state !== 'completed') fail(409, 'Checkout chưa hoàn tất. Vui lòng thử lại sau.');
    if (await Payment.countDocuments({ orderId }) > 1) fail(409, 'Đơn có nhiều bản ghi thanh toán cũ; cần kiểm tra trước khi cập nhật.');
    return await work();
  } finally { await OrderLock.deleteOne({ _id: String(orderId), owner }); }
}

// Allocate the original payable amount proportionally, with exact integer VND totals.
function allocations(items, total) {
  if (!Number.isSafeInteger(total) || total < 0) fail(409, 'Số tiền lịch sử cần được kiểm tra.');
  const weights = items.map(item => item.quantity * item.unitPrice);
  if (weights.some(n => !Number.isSafeInteger(n) || n < 0)) fail(409, 'Giá chi tiết đơn cần được kiểm tra.');
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!Number.isSafeInteger(sum) || (sum === 0 && total !== 0)) fail(409, 'Số tiền lịch sử không hợp lệ.');
  let running = 0n, previous = 0n;
  return weights.map(weight => {
    running += BigInt(weight);
    const share = sum ? BigInt(total) * running / BigInt(sum) : 0n;
    const value = Number(share - previous); previous = share; return value;
  });
}
async function load(orderId, persist = false) {
  const order = await Order.findById(orderId);
  if (!order) fail(404, 'Không tìm thấy đơn hàng.');
  const items = await OrderItem.find({ orderId }).sort({ _id: 1 });
  if (!items.length) fail(409, 'Đơn hàng không có chi tiết.');
  const total = order.originalTotalPrice ?? order.totalPrice;
  const amounts = allocations(items, total);
  for (let i = 0; i < items.length; i++) {
    if (items[i].payableAmount == null) {
      items[i].payableAmount = amounts[i];
      if (persist) await OrderItem.updateOne({ _id: items[i]._id, payableAmount: { $exists: false } }, { $set: { payableAmount: amounts[i] } });
    }
  }
  if (persist && order.originalTotalPrice == null) {
    await Order.updateOne({ _id: orderId }, { $set: { originalTotalPrice: total } });
    order.originalTotalPrice = total;
  }
  return { order, items };
}
async function ensureRestock(item) {
  if (!item.restockPending) return;
  if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) fail(409, 'Số lượng lịch sử không hợp lệ để hoàn kho.');
  const marker = String(item._id);
  const changed = await Inventory.updateOne({ productId: item.productId, returnedOrderItems: { $ne: marker } }, {
    $inc: { quantity: item.quantity }, $addToSet: { returnedOrderItems: marker }, $set: { lastUpdated: new Date() },
  });
  if (!changed.matchedCount && !await Inventory.exists({ productId: item.productId, returnedOrderItems: marker })) fail(409, 'Kho của sản phẩm không còn tồn tại; cần quản trị kiểm tra trước khi hoàn.');
  await OrderItem.updateOne({ _id: item._id }, { $set: { restockPending: false, stockRestored: true } });
  item.restockPending = false; item.stockRestored = true;
}
async function sync(orderId) {
  const { order, items } = await load(orderId, true);
  for (const item of items) {
    await ensureRestock(item);
    if (['shipping', 'shipped', 'failed to ship'].includes(item.status)) {
      await ShippingInfo.findOneAndUpdate({ orderItemId: item._id }, { $set: { status: item.status }, $setOnInsert: { trackingNumber: 'DEMO-' + item._id } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
    } else if (item.status === 'rejected') {
      await ShippingInfo.updateMany({ orderItemId: item._id }, { $set: { status: 'failed to ship' } });
    }
  }
  const active = items.filter(item => item.status !== 'rejected');
  let status = 'pending';
  if (!active.length) status = 'rejected';
  else if (active.every(item => item.status === 'shipped')) status = 'shipped';
  else if (active.every(item => ['shipped', 'failed to ship'].includes(item.status))) status = 'failed to ship';
  else if (active.some(item => item.status !== 'pending')) status = 'shipping';
  const totalPrice = active.reduce((sum, item) => sum + item.payableAmount, 0);
  await Order.updateOne({ _id: orderId }, { $set: { status, totalPrice } });
  order.status = status; order.totalPrice = totalPrice;
  if (!active.length && order.voucherId && !order.voucherReleased) {
    // Keep the release marker: retries and lost acknowledgements cannot decrement twice.
    await Voucher.updateOne({ _id: order.voucherId, releasedOrderIds: { $ne: String(orderId) }, usedCount: { $gt: 0 } }, {
      $inc: { usedCount: -1 }, $addToSet: { releasedOrderIds: String(orderId) },
    });
    await Order.updateOne({ _id: orderId }, { $set: { voucherReleased: true } });
  }
  const payments = await Payment.find({ orderId });
  if (payments.length > 1) fail(409, 'Đơn có nhiều bản ghi thanh toán cũ; cần kiểm tra trước khi cập nhật.');
  const payment = payments[0];
  if (payment?.method === 'COD' && payment.status !== 'paid') {
    payment.amount = totalPrice;
    payment.status = !active.length ? 'failed' : active.every(item => item.status === 'shipped' && item.codCollected) ? 'paid' : 'pending';
    if (payment.status === 'paid') payment.paidAt = new Date();
    await payment.save();
  }
  return { order, items, payment };
}

async function transition(itemId, user, target, returnedToStock = false) {
  id(itemId);
  const initial = await OrderItem.findById(itemId);
  if (!initial) fail(404, 'Không tìm thấy chi tiết đơn.');
  // Authorization before acquiring a lock or repairing any other records.
  if (user.role === 'buyer') {
    if (!await Order.exists({ _id: initial.orderId, buyerId: user.id })) fail(404, 'Không tìm thấy chi tiết đơn.');
    if (!['shipped', 'rejected'].includes(target)) fail(400, 'Buyer chỉ được nhận hàng hoặc hủy hàng chưa giao.');
  } else if (user.role === 'seller') {
    if (!await Product.exists({ _id: initial.productId, sellerId: user.id })) fail(403, 'Sản phẩm không thuộc shop của bạn.');
    if (!['shipping', 'shipped', 'failed to ship', 'rejected'].includes(target)) fail(400, 'Trạng thái không hợp lệ.');
  } else fail(403, 'Không có quyền cập nhật.');
  return locked(initial.orderId, async () => {
    const { items } = await load(initial.orderId, true);
    const item = items.find(line => String(line._id) === String(itemId));
    if (item.status !== target) {
      const allowed = user.role === 'buyer'
        ? (item.status === 'shipping' && target === 'shipped') || (item.status === 'pending' && target === 'rejected')
        : (item.status === 'pending' && ['shipping', 'rejected'].includes(target)) ||
          (item.status === 'shipping' && ['shipped', 'failed to ship'].includes(target)) ||
          (item.status === 'failed to ship' && (target === 'shipping' || (target === 'rejected' && returnedToStock === true)));
      if (!allowed) fail(409, 'Không thể chuyển trạng thái này. Hàng giao lỗi phải xác nhận đã về kho trước khi hoàn.');
      const payment = await Payment.findOne({ orderId: item.orderId });
      if (target === 'rejected' && (item.codCollected || payment?.status === 'paid')) fail(409, 'Đã thu tiền; cần quy trình trả hàng/hoàn tiền riêng.');
      await OrderItem.updateOne({ _id: item._id, status: item.status }, { $set: {
        status: target, ...(target === 'rejected' ? { restockPending: true, cancelledBy: user.role } : {}),
      } });
    }
    const result = await sync(initial.orderId);
    return { orderItem: result.items.find(line => String(line._id) === String(itemId)), shippingInfo: await ShippingInfo.findOne({ orderItemId: itemId }), order: result.order };
  });
}

async function sellerSummary(orderId, sellerId) {
  id(orderId);
  const { order, items } = await load(orderId);
  const ownedProducts = await Product.find({ _id: { $in: items.map(i => i.productId) }, sellerId }).select('_id').lean();
  const ownedIds = new Set(ownedProducts.map(p => String(p._id)));
  const owned = items.filter(item => ownedIds.has(String(item.productId)));
  if (!owned.length) fail(404, 'Không tìm thấy sản phẩm của shop trong đơn.');
  const payments = await Payment.find({ orderId });
  if (payments.length > 1) fail(409, 'Đơn có nhiều bản ghi thanh toán; cần quản trị kiểm tra.');
  const payment = payments[0];
  if (!payment) fail(404, 'Chưa có bản ghi thanh toán.');
  const active = owned.filter(i => i.status !== 'rejected');
  return { order, payment, owned, sellerAmount: active.reduce((s, i) => s + i.payableAmount, 0),
    sellerCollected: payment.status === 'paid' || (active.length > 0 && active.every(i => i.codCollected)),
    canCollectCOD: payment.method === 'COD' && payment.status === 'pending' && active.length > 0 && active.every(i => i.status === 'shipped') && active.some(i => !i.codCollected),
  };
}
async function collectCOD(paymentId, sellerId, target) {
  id(paymentId);
  if (target !== 'paid') fail(400, 'Chỉ xác nhận đã thu COD; không tự đặt thanh toán thành thất bại.');
  const payment = await Payment.findById(paymentId);
  if (!payment) fail(404, 'Không tìm thấy thanh toán.');
  await sellerSummary(payment.orderId, sellerId);
  return locked(payment.orderId, async () => {
    const summary = await sellerSummary(payment.orderId, sellerId);
    if (summary.payment.method !== 'COD') fail(409, 'Bản demo chỉ xử lý COD.');
    if (!summary.sellerCollected && !summary.canCollectCOD) fail(409, 'Chỉ được xác nhận COD khi toàn bộ hàng còn hiệu lực của shop đã giao.');
    if (!summary.sellerCollected) await OrderItem.updateMany({ _id: { $in: summary.owned.filter(i => i.status === 'shipped').map(i => i._id) } }, { $set: { codCollected: true } });
    return (await sync(payment.orderId)).payment;
  });
}
async function createCOD(orderId, buyerId) {
  id(orderId);
  if (!await Order.exists({ _id: orderId, buyerId })) fail(404, 'Không tìm thấy đơn hàng.');
  return locked(orderId, async () => {
    const state = await sync(orderId);
    if (state.order.status === 'rejected') fail(409, 'Đơn đã hủy/từ chối, không thể tạo COD.');
    if (state.payment) {
      if (state.payment.method !== 'COD') fail(409, 'Thanh toán cũ cần kiểm tra.');
      return { status: 200, payment: state.payment };
    }
    const payment = await Payment.create({ orderId, userId: buyerId, amount: state.order.totalPrice, method: 'COD', status: 'pending' });
    return { status: 201, payment };
  });
}
function respondError(res, error) {
  if (error instanceof OrderError) return res.status(error.status).json({ success: false, message: error.message, error: error.message });
  logger.error('Order operation needs retry/review', error);
  return res.status(503).json({ success: false, message: 'Chưa hoàn tất cập nhật. Vui lòng thử lại cùng thao tác để đồng bộ.', error: 'Chưa hoàn tất cập nhật. Vui lòng thử lại cùng thao tác.' });
}
module.exports = { transition, sellerSummary, collectCOD, createCOD, respondError, allocations, locked, sync };
