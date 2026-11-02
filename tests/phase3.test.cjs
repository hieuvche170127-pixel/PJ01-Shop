const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
process.env.JWT_SECRET = 'phase3-' + crypto.randomBytes(24).toString('hex');
for (const relative of ['../src/services/emailService', '../src/utils/email']) {
  const file = require.resolve(relative);
  require.cache[file] = { id: file, filename: file, loaded: true, exports: { sendEmail: async () => {} } };
}
const User = require('../src/models/User'), Product = require('../src/models/Product'), Category = require('../src/models/Category');
const Store = require('../src/models/Store'), Address = require('../src/models/Address'), Inventory = require('../src/models/Inventory');
const Order = require('../src/models/Order'), OrderItem = require('../src/models/OrderItem'), Payment = require('../src/models/Payment');
const ShippingInfo = require('../src/models/ShippingInfo'), Voucher = require('../src/models/Voucher'), OrderLock = require('../src/models/OrderLock');
const router = require('../src/routers');

test('Phase 3 voucher and order lifecycle regression', { timeout: 60000 }, async t => {
  const dbName = 'shopii_phase3_test_' + crypto.randomBytes(8).toString('hex');
  const uri = new URL(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017');
  assert(['localhost', '127.0.0.1'].includes(uri.hostname)); assert.equal(uri.protocol, 'mongodb:'); uri.pathname = '/' + dbName;
  let server;
  try {
    await mongoose.connect(uri.toString(), { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    await Voucher.collection.createIndex({ code: 1 }, { unique: true });
    const app = express(); app.use(express.json()); app.use('/api', router);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = 'http://127.0.0.1:' + server.address().port;
    const users = {};
    for (const [name, role] of [['buyer','buyer'],['other','buyer'],['seller','seller'],['seller2','seller'],['admin','admin']]) users[name] = await User.create({ username: 'p3' + name, email: name + '@example.com', password: 'phase3-test-password', role });
    async function call(route, { user = users.buyer, method = 'GET', body, key } = {}) {
      const r = await fetch(base + '/api' + route, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET), ...(key ? { 'Idempotency-Key': key } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000) });
      return { status: r.status, body: await r.json() };
    }
    const category = await Category.create({ name: 'Demo' });
    for (const seller of [users.seller, users.seller2]) await Store.create({ sellerId: seller._id, storeName: seller.username, status: 'approved' });
    const address = await Address.create({ userId: users.buyer._id, fullName: 'Demo', phone: '0000000000', street: 'Demo', city: 'Demo', state: 'Demo', country: 'Demo' });
    async function product(seller = users.seller, price = 100000) {
      const p = await Product.create({ sellerId: seller._id, categoryId: category._id, title: 'Demo', description: 'Demo', price, isAuction: true });
      await Inventory.create({ productId: p._id, quantity: 5 }); return p;
    }
    async function place(products, couponCode = '') {
      const r = await call('/buyers/orders', { method: 'POST', key: crypto.randomBytes(16).toString('hex'), body: { selectedAddressId: String(address._id), selectedItems: products.map(p => ({ productId: String(p._id), quantity: 1 })), couponCode } });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      const payment = await call('/buyers/payments', { method: 'POST', body: { orderId: r.body.orderId, method: 'COD' } });
      assert.equal(payment.status, 201, JSON.stringify(payment.body));
      return { orderId: r.body.orderId, items: await OrderItem.find({ orderId: r.body.orderId }).sort({ _id: 1 }), payment: payment.body.payment };
    }
    const sellerChange = (item, status, user = users.seller, extra = {}) => call('/seller/orders/item/' + item._id + '/status', { method: 'PUT', user, body: { status, ...extra } });
    const buyerChange = (item, status, user = users.buyer) => call('/buyers/orders/items/' + item._id + '/status', { method: 'PUT', user, body: { status } });
    const collect = (payment, user = users.seller, status = 'paid') => call('/seller/payments/' + payment._id + '/status', { method: 'PUT', user, body: { status } });
    const stock = async p => (await Inventory.findOne({ productId: p._id })).quantity;
    const voucherData = code => ({ code, discount: 10, discountType: 'percentage', expirationDate: '2099-12-31', minOrderValue: 0, maxDiscount: 0, usageLimit: 10, isActive: true });
    const adminCall = (route, method, body) => call('/admin/vouchers' + route, { user: users.admin, method, body });

    await t.test('voucher CRUD supports fixed amounts, zero limits and explicit off switch', async () => {
      assert.equal((await call('/admin/vouchers', { method: 'POST', body: voucherData('DENIED') })).status, 403);
      const r = await adminCall('', 'POST', { ...voucherData(' fixed50 '), discountType: 'fixed', discount: 50000, minOrderValue: 500000, maxDiscount: 100000, isActive: false });
      assert.equal(r.status, 201); assert.equal(r.body.code, 'FIXED50'); assert.equal(r.body.discountType, 'fixed'); assert.equal(r.body.isActive, false);
      const doc = await Voucher.findById(r.body._id); doc.maxDiscount = 0; await doc.save(); assert.equal(doc.isActive, false);
      const updated = await adminCall('/' + doc._id, 'PUT', { minOrderValue: 0, maxDiscount: 0 });
      assert.equal(updated.status, 200); assert.equal(updated.body.minOrderValue, 0); assert.equal(updated.body.maxDiscount, 0); assert.equal(updated.body.isActive, false);
      assert.equal((await call('/buyers/vouchers/code/FIXED50')).status, 400);
      assert.equal((await adminCall('/' + doc._id + '/toggle-active', 'PUT')).body.isActive, true);
      assert.equal((await call('/buyers/vouchers/code/fixed50')).status, 200);
      assert.equal((await adminCall('/' + doc._id + '/toggle-active', 'PUT')).body.isActive, false);
    });
    await t.test('voucher validation catches bad values, duplicate codes and attempts to overwrite usedCount', async () => {
      for (const changes of [{ discount: 101 }, { discount: -1 }, { discount: '10' }, { discountType: 'unknown' }, { minOrderValue: -1 }, { usageLimit: 0 }, { usageLimit: 1.5 }, { expirationDate: 'bad' }, { isActive: 'false' }]) assert.equal((await adminCall('', 'POST', { ...voucherData('INVALID'), ...changes })).status, 400);
      const r = await adminCall('', 'POST', voucherData('UNIQUE')); assert.equal(r.status, 201);
      assert.equal((await adminCall('', 'POST', voucherData('unique'))).status, 409);
      await Voucher.updateOne({ _id: r.body._id }, { usedCount: 3 });
      assert.equal((await adminCall('/' + r.body._id, 'PUT', { usageLimit: 2 })).status, 400);
      assert.equal((await adminCall('/' + r.body._id, 'PUT', { usedCount: 0 })).body.usedCount, 3);
      assert.equal((await adminCall('/bad-id', 'DELETE')).status, 400);
    });
    await t.test('delete preserves voucher history and cannot race an in-flight checkout reservation', async () => {
      const r = await adminCall('', 'POST', voucherData('REMOVE'));
      await Voucher.updateOne({ _id: r.body._id }, { $push: { checkoutReservations: 'active-checkout' } });
      assert.equal((await adminCall('/' + r.body._id, 'DELETE')).status, 409);
      assert.equal((await adminCall('/' + r.body._id, 'PUT', { discount: 20 })).status, 409);
      await Voucher.updateOne({ _id: r.body._id }, { $set: { checkoutReservations: [] } });
      assert.equal((await adminCall('/' + r.body._id, 'DELETE')).status, 200);
      assert.equal((await Voucher.findById(r.body._id)).isDeleted, true);
      assert.equal((await adminCall('/' + r.body._id, 'GET')).status, 404);
      assert.equal((await call('/buyers/vouchers/code/REMOVE')).status, 404);
      assert(!(await adminCall('', 'GET')).body.some(v => v._id === r.body._id));
    });
    await t.test('buyer cancellation restores stock/voucher once and cancels COD', async () => {
      const p = await product(); await adminCall('', 'POST', voucherData('CANCEL'));
      const o = await place([p], 'cancel'); assert.equal(await stock(p), 4);
      assert.equal((await buyerChange(o.items[0], 'rejected')).status, 200);
      assert.equal(await stock(p), 5); assert.equal((await Voucher.findOne({ code: 'CANCEL' })).usedCount, 0);
      assert.equal((await Order.findById(o.orderId)).status, 'rejected'); assert.equal((await Order.findById(o.orderId)).totalPrice, 0);
      assert.equal((await Payment.findById(o.payment._id)).status, 'failed'); assert.equal((await Payment.findById(o.payment._id)).amount, 0);
      assert.equal((await buyerChange(o.items[0], 'rejected')).status, 200); assert.equal(await stock(p), 5); assert.equal((await Voucher.findOne({ code: 'CANCEL' })).usedCount, 0);
      assert.equal((await sellerChange(o.items[0], 'shipping')).status, 409);
      assert.equal((await call('/buyers/payments', { method: 'POST', body: { orderId: o.orderId, method: 'COD', replaceExisting: true } })).status, 409);
    });
    await t.test('ownership checks happen before order synchronization or restock', async () => {
      const p = await product(), o = await place([p]), before = JSON.stringify(await Order.findById(o.orderId).lean());
      assert.equal((await sellerChange(o.items[0], 'rejected', users.seller2)).status, 403);
      assert.equal((await buyerChange(o.items[0], 'rejected', users.other)).status, 404);
      assert.equal((await collect(o.payment, users.seller2)).status, 404);
      assert.equal(await stock(p), 4); assert.equal(JSON.stringify(await Order.findById(o.orderId).lean()), before);
    });
    await t.test('state machine rejects jumps/backtracking; receipt and COD collection remain separate', async () => {
      const p = await product(), o = await place([p]);
      assert.equal((await sellerChange(o.items[0], 'shipped')).status, 409);
      assert.equal((await collect(o.payment)).status, 409);
      assert.equal((await sellerChange(o.items[0], 'shipping')).status, 200);
      assert.equal((await sellerChange(o.items[0], 'shipping')).status, 200);
      assert.equal(await ShippingInfo.countDocuments({ orderItemId: o.items[0]._id }), 1);
      assert.equal((await buyerChange(o.items[0], 'rejected')).status, 409);
      assert.equal((await sellerChange(o.items[0], 'rejected')).status, 409);
      assert.equal((await buyerChange(o.items[0], 'shipped')).status, 200);
      assert.equal((await ShippingInfo.findOne({ orderItemId: o.items[0]._id })).status, 'shipped');
      assert.equal((await Order.findById(o.orderId)).status, 'shipped'); assert.equal((await Payment.findById(o.payment._id)).status, 'pending');
      assert.equal((await collect(o.payment)).status, 200); const paidAt = (await Payment.findById(o.payment._id)).paidAt.toISOString();
      assert.equal((await collect(o.payment)).status, 200); assert.equal((await Payment.findById(o.payment._id)).paidAt.toISOString(), paidAt);
      assert.equal((await collect(o.payment, users.seller, 'failed')).status, 400);
      assert.equal((await sellerChange(o.items[0], 'shipping')).status, 409); assert.equal(await stock(p), 4);
    });
    await t.test('shipping API follows the same rules and failed delivery waits for physical return', async () => {
      const p = await product(), o = await place([p]); await sellerChange(o.items[0], 'shipping');
      const s = await ShippingInfo.findOne({ orderItemId: o.items[0]._id });
      const route = '/seller/shipping/' + s._id + '/status';
      assert.equal((await call(route, { method: 'PUT', user: users.seller2, body: { status: 'shipped' } })).status, 403);
      assert.equal((await call(route, { method: 'PUT', user: users.seller, body: { status: 'failed to ship' } })).status, 200);
      assert.equal(await stock(p), 4); assert.equal((await Order.findById(o.orderId)).status, 'failed to ship');
      assert.equal((await sellerChange(o.items[0], 'rejected')).status, 409);
      assert.equal((await call(route, { method: 'PUT', user: users.seller, body: { status: 'rejected', returnedToStock: true } })).status, 200);
      assert.equal(await stock(p), 5); assert.equal((await Payment.findById(o.payment._id)).status, 'failed');
      assert.equal((await sellerChange(o.items[0], 'shipping')).status, 409);
    });
    await t.test('multiple shops confirm only their share; first collection cannot mark the whole order paid', async () => {
      const a = await product(), b = await product(users.seller2, 300000), o = await place([a,b]);
      const ai = o.items.find(i => String(i.productId) === String(a._id)), bi = o.items.find(i => String(i.productId) === String(b._id));
      await sellerChange(ai, 'shipping'); await sellerChange(ai, 'shipped');
      assert.equal((await collect(o.payment)).status, 200); assert.equal((await Payment.findById(o.payment._id)).status, 'pending');
      assert.equal((await OrderItem.findById(bi._id)).status, 'pending'); assert.equal((await OrderItem.findById(bi._id)).codCollected, false);
      const summary = await call('/seller/orders/' + o.orderId + '/payment', { user: users.seller });
      assert.equal(summary.body.data.sellerAmount, 100000); assert.equal(summary.body.data.sellerCollected, true); assert.equal(summary.body.data.canCollectCOD, false);
      await sellerChange(bi, 'shipping', users.seller2); await sellerChange(bi, 'shipped', users.seller2);
      assert.equal((await collect(o.payment, users.seller2)).status, 200); assert.equal((await Payment.findById(o.payment._id)).status, 'paid');
    });
    await t.test('partial rejection preserves allocated discounts and reduces the amount due', async () => {
      await adminCall('', 'POST', { ...voucherData('PARTIAL'), discountType: 'fixed', discount: 50000 });
      const a = await product(), b = await product(users.seller2, 300000), o = await place([a,b], 'PARTIAL');
      const ai = o.items.find(i => String(i.productId) === String(a._id)), bi = o.items.find(i => String(i.productId) === String(b._id));
      assert.equal(ai.payableAmount, 87500); assert.equal(bi.payableAmount, 262500);
      await sellerChange(ai, 'shipping'); await sellerChange(ai, 'shipped'); await collect(o.payment);
      assert.equal((await sellerChange(bi, 'rejected', users.seller2)).status, 200);
      const order = await Order.findById(o.orderId), payment = await Payment.findById(o.payment._id);
      assert.equal(order.totalPrice, 87500); assert.equal(order.originalTotalPrice, 350000); assert.equal(order.status, 'shipped');
      assert.equal(payment.amount, 87500); assert.equal(payment.status, 'paid'); assert.equal((await Voucher.findOne({ code: 'PARTIAL' })).usedCount, 1);
      assert.equal(await stock(b), 5); assert.equal(await stock(a), 4);
    });
    await t.test('restock survives lost write acknowledgement without double increment', async () => {
      const p = await product(), o = await place([p]), original = Inventory.updateOne;
      Inventory.updateOne = async (...args) => { const r = await original.apply(Inventory, args); if (args[1].$addToSet?.returnedOrderItems) throw new Error('Lost restock acknowledgement'); return r; };
      try { assert.equal((await sellerChange(o.items[0], 'rejected')).status, 503); } finally { Inventory.updateOne = original; }
      assert.equal(await stock(p), 5); assert.equal((await OrderItem.findById(o.items[0]._id)).restockPending, true);
      assert.equal((await sellerChange(o.items[0], 'rejected')).status, 200); assert.equal(await stock(p), 5); assert.equal((await OrderItem.findById(o.items[0]._id)).stockRestored, true);
    });
    await t.test('concurrent cancel/ship operations cannot both win or double-restock', async () => {
      const p = await product(), o = await place([p]);
      const results = await Promise.all([buyerChange(o.items[0], 'rejected'), sellerChange(o.items[0], 'shipping')]);
      assert.equal(results.filter(r => r.status === 200).length, 1); assert(results.some(r => r.status === 409));
      const item = await OrderItem.findById(o.items[0]._id); assert.equal(await stock(p), item.status === 'rejected' ? 5 : 4);
      assert.equal(await OrderLock.countDocuments(), 0);
    });
    await t.test('COD creation is idempotent and cannot reset a paid record', async () => {
      const p = await product(), o = await place([p]); await sellerChange(o.items[0], 'shipping'); await sellerChange(o.items[0], 'shipped'); await collect(o.payment);
      const result = await call('/buyers/payments', { method: 'POST', body: { orderId: o.orderId, method: 'COD', replaceExisting: true } });
      assert.equal(result.status, 200); assert.equal(result.body.payment._id, o.payment._id); assert.equal(result.body.payment.status, 'paid');
      assert.equal(await Payment.countDocuments({ orderId: o.orderId }), 1);
    });
    await t.test('history GET stays read-only; old rejected records are never restocked implicitly', async () => {
      const p = await product(), o = await place([p]);
      await OrderItem.updateOne({ _id: o.items[0]._id }, { status: 'shipped' });
      const before = JSON.stringify(await Order.findById(o.orderId).lean());
      assert.equal((await call('/buyers/orders')).status, 200); assert.equal((await call('/buyers/orders/' + o.orderId)).status, 200);
      assert.equal(JSON.stringify(await Order.findById(o.orderId).lean()), before);
      const q = await product(), old = await place([q]); await OrderItem.updateOne({ _id: old.items[0]._id }, { status: 'rejected' });
      assert.equal((await sellerChange(old.items[0], 'rejected')).status, 200); assert.equal(await stock(q), 4);
    });
    await t.test('products referenced by orders cannot be deleted and lose their inventory', async () => {
      const p = await product(); await place([p]);
      assert.equal((await call('/seller/products/' + p._id, { user: users.seller, method: 'DELETE' })).status, 409);
      assert.equal((await call('/admin/products/' + p._id, { user: users.admin, method: 'DELETE' })).status, 409);
      assert(await Product.exists({ _id: p._id })); assert.equal(await stock(p), 4);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.name === dbName && /^shopii_phase3_test_[a-f0-9]{16}$/.test(dbName)) await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});
