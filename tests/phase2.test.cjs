const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
process.env.JWT_SECRET = 'phase2-' + crypto.randomBytes(24).toString('hex');
let emails = 0, emailFailure = false;
for (const relative of ['../src/services/emailService', '../src/utils/email']) {
  const filename = require.resolve(relative);
  require.cache[filename] = { id: filename, filename, loaded: true, exports: {
    sendEmail: async () => { emails++; if (emailFailure) throw new Error('Simulated email failure'); },
  } };
}
const { User, Product, Category, Store, Order, OrderItem, Address, Inventory } = require('../src/models');
const Voucher = require('../src/models/Voucher');
const Cart = require('../src/models/Cart');
const CheckoutRequest = require('../src/models/CheckoutRequest');
const router = require('../src/routers');
const key = () => crypto.randomBytes(16).toString('hex');

test('Phase 2 checkout, inventory, cart and addresses', { timeout: 60000 }, async t => {
  const dbName = 'shopii_phase2_test_' + crypto.randomBytes(8).toString('hex');
  const uri = new URL(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017');
  assert(['localhost', '127.0.0.1'].includes(uri.hostname)); assert.equal(uri.protocol, 'mongodb:'); uri.pathname = '/' + dbName;
  let server;
  try {
    await mongoose.connect(uri.toString(), { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    const app = express(); app.use(express.json()); app.use('/api', router);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = 'http://127.0.0.1:' + server.address().port;
    const buyer = await User.create({ username: 'phase2buyer', email: 'buyer@example.com', password: 'test-password', role: 'buyer' });
    const other = await User.create({ username: 'phase2other', email: 'other@example.com', password: 'test-password', role: 'buyer' });
    const seller = await User.create({ username: 'phase2seller', email: 'seller@example.com', password: 'test-password', role: 'seller' });
    const token = user => jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET);
    async function call(route, { method = 'GET', body, user = buyer, idempotencyKey } = {}) {
      const r = await fetch(base + '/api' + route, { method, headers: { Authorization: 'Bearer ' + token(user), 'Content-Type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000) });
      return { status: r.status, body: await r.json() };
    }
    const addressData = { fullName: 'Demo', phone: '0000000000', street: 'Demo', city: 'Demo', state: 'Demo', country: 'Demo' };
    const address = await Address.create({ ...addressData, userId: buyer._id, isDefault: true });
    const otherAddress = await Address.create({ ...addressData, userId: other._id });
    const category = await Category.create({ name: 'Demo' });
    const store = await Store.create({ sellerId: seller._id, storeName: 'Demo', status: 'approved' });
    async function product(quantity = 5) {
      const p = await Product.create({ title: 'Demo', description: 'Demo', price: 100000, sellerId: seller._id, categoryId: category._id, isAuction: true });
      await Inventory.create({ productId: p._id, quantity }); return p;
    }
    const payload = (p, quantity = 1, extras = {}) => ({ selectedAddressId: String(address._id), selectedItems: [{ productId: String(p._id), quantity }], ...extras });
    const checkout = (body, idempotencyKey = key(), user = buyer) => call('/buyers/orders', { method: 'POST', body, idempotencyKey, user });
    const stock = async p => (await Inventory.findOne({ productId: p._id })).quantity;
    const snapshot = async () => ({ orders: await Order.countDocuments(), items: await OrderItem.countDocuments() });

    await t.test('invalid quantities and IDs have no stock/order side effects', async () => {
      const p = await product(); const before = await snapshot();
      for (const quantity of [-1, 0, 0.5, '2', null, true, Number.MAX_SAFE_INTEGER + 1]) assert.equal((await checkout(payload(p, quantity))).status, 400);
      for (const selectedItems of [[], {}, [null], [{ productId: 'bad', quantity: 1 }]]) assert.equal((await checkout(payload(p, 1, { selectedItems }))).status, 400);
      assert.equal((await checkout(payload(p, 1, { selectedAddressId: 'bad' }))).status, 400);
      assert.equal((await call('/buyers/orders', { method: 'POST', body: payload(p) })).status, 400);
      assert.equal(await stock(p), 5); assert.deepEqual(await snapshot(), before);
    });
    await t.test('foreign and deleted addresses cannot be used', async () => {
      const p = await product(); const before = await snapshot();
      for (const id of [otherAddress._id, new mongoose.Types.ObjectId()]) assert.equal((await checkout(payload(p, 1, { selectedAddressId: String(id) }))).status, 404);
      assert.equal(await stock(p), 5); assert.deepEqual(await snapshot(), before);
    });
    await t.test('duplicate product lines aggregate before stock check and order creation', async () => {
      const p = await product();
      const selectedItems = [{ productId: String(p._id), quantity: 3 }, { productId: String(p._id).toUpperCase(), quantity: 3 }];
      assert.equal((await checkout(payload(p, 1, { selectedItems }))).status, 409); assert.equal(await stock(p), 5);
      selectedItems.forEach(i => i.quantity = 2);
      const r = await checkout(payload(p, 1, { selectedItems, totalPrice: 1 })); assert.equal(r.status, 201); assert.equal(r.body.totalPrice, 400000);
      const lines = await OrderItem.find({ orderId: r.body.orderId }); assert.equal(lines.length, 1); assert.equal(lines[0].quantity, 4); assert.equal(await stock(p), 1);
    });
    await t.test('only one concurrent buyer obtains the last unit', async () => {
      const p = await product(1);
      const outcomes = await Promise.all([checkout(payload(p)), checkout(payload(p, 1, { selectedAddressId: String(otherAddress._id) }), key(), other)]);
      assert.deepEqual(outcomes.map(r => r.status).sort(), [201, 409]); assert.equal(await stock(p), 0);
      assert.equal(await OrderItem.countDocuments({ productId: p._id }), 1);
    });
    await t.test('parallel/replayed requests use one order, one stock deduction and one email', async () => {
      const p = await product(10), k = key(), body = payload(p, 2), before = emails;
      const outcomes = await Promise.all(Array.from({ length: 5 }, () => checkout(body, k)));
      assert.equal(outcomes.filter(r => r.status === 201).length, 1);
      assert(outcomes.every(r => [200, 201, 409].includes(r.status)));
      const first = outcomes.find(r => r.status === 201);
      const retry = await checkout(body, k); assert.equal(retry.status, 200); assert.equal(retry.body.orderId, first.body.orderId);
      assert.equal(await stock(p), 8); assert.equal(emails, before + 1);
      assert.equal(await OrderItem.countDocuments({ productId: p._id }), 1);
      assert.equal((await checkout(payload(p, 3), k)).status, 409); assert.equal(await stock(p), 8);
      // Reloading service simulates losing all in-process checkout state.
      delete require.cache[require.resolve('../src/services/checkoutService')];
      const replay = await require('../src/services/checkoutService').placeOrder(String(buyer._id), k, body);
      assert.equal(replay.body.orderId, first.body.orderId);
    });
    await t.test('same idempotency key is independent for different buyers', async () => {
      const p = await product(), k = key();
      assert.equal((await checkout(payload(p), k)).status, 201);
      assert.equal((await checkout(payload(p, 1, { selectedAddressId: String(otherAddress._id) }), k, other)).status, 201);
      assert.equal(await stock(p), 3);
    });
    await t.test('a later out-of-stock line releases earlier reservations', async () => {
      const a = await product(5), b = await product(0), before = await snapshot();
      const r = await checkout(payload(a, 1, { selectedItems: [{ productId: String(a._id), quantity: 2 }, { productId: String(b._id), quantity: 1 }] }));
      assert.equal(r.status, 409); assert.equal(await stock(a), 5); assert.equal(await stock(b), 0); assert.deepEqual(await snapshot(), before);
    });
    await t.test('partial item insertion failure rolls back items, stock and voucher; retry does not repeat writes', async () => {
      const p = await product(), v = await Voucher.create({ code: 'ROLLBACK', discount: 10, expirationDate: new Date(Date.now() + 86400000), usageLimit: 10 });
      const before = await snapshot(), original = OrderItem.insertMany;
      const k = key(), body = payload(p, 2, { couponCode: v.code });
      OrderItem.insertMany = async lines => { await original.call(OrderItem, lines); throw new Error('Injected failure after insertion'); };
      try { assert.equal((await checkout(body, k)).status, 500); } finally { OrderItem.insertMany = original; }
      assert.equal(await stock(p), 5); assert.equal((await Voucher.findById(v._id)).usedCount, 0); assert.deepEqual(await snapshot(), before);
      assert.equal((await checkout(body, k)).status, 500); assert.equal(await stock(p), 5);
      assert.equal((await checkout(body)).status, 201);
    });
    await t.test('lost inventory write acknowledgement is compensated once', async () => {
      const p = await product(), original = Inventory.findOneAndUpdate;
      Inventory.findOneAndUpdate = async (...args) => { await original.apply(Inventory, args); throw new Error('Lost acknowledgement'); };
      try { assert.equal((await checkout(payload(p, 2))).status, 500); } finally { Inventory.findOneAndUpdate = original; }
      assert.equal(await stock(p), 5);
      assert.equal(await Inventory.countDocuments({ 'checkoutReservations.0': { $exists: true } }), 0);
    });
    await t.test('lost completion acknowledgement preserves committed order', async () => {
      const p = await product(), original = CheckoutRequest.updateOne, k = key();
      CheckoutRequest.updateOne = async (...args) => { const result = await original.apply(CheckoutRequest, args); if (args[1].$set?.state === 'completed') throw new Error('Lost completion acknowledgement'); return result; };
      let response;
      try { response = await checkout(payload(p, 2), k); } finally { CheckoutRequest.updateOne = original; }
      assert.equal(response.status, 200); assert(await Order.exists({ _id: response.body.orderId })); assert.equal(await stock(p), 3);
      assert.equal((await checkout(payload(p, 2), k)).body.orderId, response.body.orderId);
      assert.equal(await Inventory.countDocuments({ productId: p._id, 'checkoutReservations.0': { $exists: true } }), 0);
    });
    await t.test('missing inventory and unavailable products do not create stock records', async () => {
      const p = await product(); await Inventory.deleteOne({ productId: p._id });
      assert.equal((await checkout(payload(p))).status, 409); assert.equal(await Inventory.countDocuments({ productId: p._id }), 0);
      await Product.updateOne({ _id: p._id }, { isAuction: false }); assert.equal((await checkout(payload(p))).status, 404);
      const q = await product(); await Store.updateOne({ _id: store._id }, { status: 'pending' });
      assert.equal((await checkout(payload(q))).status, 409); await Store.updateOne({ _id: store._id }, { status: 'approved' });
      await User.updateOne({ _id: seller._id }, { action: 'lock' }); assert.equal((await checkout(payload(q))).status, 409); await User.updateOne({ _id: seller._id }, { action: 'unlock' });
    });
    await t.test('voucher expiry/last-use validation participates in reservation rollback', async () => {
      const p = await product();
      const v = await Voucher.create({ code: 'ONE', discount: 10, expirationDate: new Date(Date.now() + 86400000), usageLimit: 1 });
      const results = await Promise.all([checkout(payload(p, 1, { couponCode: v.code })), checkout(payload(p, 1, { couponCode: v.code }))]);
      assert.deepEqual(results.map(r => r.status).sort(), [201, 400]); assert.equal((await Voucher.findById(v._id)).usedCount, 1); assert.equal(await stock(p), 4);
      await Voucher.updateOne({ _id: v._id }, { usedCount: 0, isActive: true, expirationDate: new Date(0) });
      assert.equal((await checkout(payload(p, 1, { couponCode: v.code }))).status, 400); assert.equal(await stock(p), 4);
    });
    await t.test('SMTP failure cannot turn an existing order into a failed checkout', async () => {
      const p = await product(), k = key(); emailFailure = true;
      try { const r = await checkout(payload(p), k); assert.equal(r.status, 201); assert.equal((await checkout(payload(p), k)).body.orderId, r.body.orderId); }
      finally { emailFailure = false; }
      assert.equal(await stock(p), 4);
    });
    await t.test('cart enforces integer totals and concurrent additions do not lose updates', async () => {
      const p = await product(4), route = '/buyers/cart/add';
      for (const quantity of [-1, 0, 0.5, '2', true]) assert.equal((await call(route, { method: 'POST', body: { productId: String(p._id), quantity } })).status, 400);
      const results = await Promise.all(Array.from({ length: 4 }, () => call(route, { method: 'POST', body: { productId: String(p._id), quantity: 1 } })));
      assert(results.every(r => r.status === 200)); assert.equal(await Cart.countDocuments({ userId: buyer._id }), 1);
      const cart = await Cart.findOne({ userId: buyer._id }); assert.equal(cart.items.find(i => String(i.productId) === String(p._id)).quantity, 4);
      assert.equal((await call(route, { method: 'POST', body: { productId: String(p._id), quantity: 1 } })).status, 409);
      for (const quantity of [0.5, -1, '2']) assert.equal((await call('/buyers/cart/update/' + p._id, { method: 'PUT', body: { quantity } })).status, 400);
      assert.equal((await call('/buyers/cart/update/' + p._id, { method: 'PUT', body: { quantity: 5 } })).status, 409);
      assert.equal((await call('/buyers/cart/update/' + p._id, { method: 'PUT', body: { quantity: 2 } })).status, 200);
    });
    await t.test('address updates cannot transfer ownership or clear defaults through foreign IDs', async () => {
      const base = '/buyers/addresses/';
      assert.equal((await call(base + address._id, { method: 'PUT', body: { userId: String(other._id), fullName: 'New demo' } })).status, 200);
      assert.equal(String((await Address.findById(address._id)).userId), String(buyer._id));
      assert.equal((await call(base + otherAddress._id, { method: 'PUT', body: { isDefault: true } })).status, 404);
      assert.equal((await call(base + otherAddress._id + '/default', { method: 'PUT' })).status, 404);
      assert.equal((await Address.findById(address._id)).isDefault, true);
      assert.equal((await call(base + 'bad', { method: 'PUT', body: { fullName: 'x' } })).status, 400);
      assert.equal((await call(base + address._id, { method: 'PUT', body: { fullName: '' } })).status, 400);
    });
    await t.test('seller stock endpoints reject invalid numbers and pending reservations', async () => {
      const p = await product();
      for (const quantity of [-1, 0.5, '2']) {
        assert.equal((await call('/seller/inventory/' + p._id, { method: 'PUT', user: seller, body: { quantity } })).status, 400);
        assert.equal((await call('/seller/products/' + p._id, { method: 'PUT', user: seller, body: { quantity } })).status, 400);
      }
      assert.equal(await stock(p), 5);
      await Inventory.updateOne({ productId: p._id }, { $push: { checkoutReservations: { requestId: 'pending-test', quantity: 1 } } });
      assert.equal((await call('/seller/inventory/' + p._id, { method: 'PUT', user: seller, body: { quantity: 9 } })).status, 409); assert.equal(await stock(p), 5);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.name === dbName && /^shopii_phase2_test_[a-f0-9]{16}$/.test(dbName)) await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});

test('checkout browser key survives retry/refresh and changes for new checkout', () => {
  const storage = new Map();
  global.sessionStorage = { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
  const file = require.resolve('../front-end/src/utils/checkoutAttempt');
  let helper = require(file);
  const first = helper.getCheckoutAttempt('buyer', 'page1', { a: 1 });
  assert.equal(helper.getCheckoutAttempt('buyer', 'page1', { a: 1 }).key, first.key);
  delete require.cache[file]; helper = require(file);
  assert.equal(helper.getCheckoutAttempt('buyer', 'page1', { a: 1 }).key, first.key);
  assert.notEqual(helper.getCheckoutAttempt('buyer', 'page2', { a: 1 }).key, first.key);
  assert.notEqual(helper.getCheckoutAttempt('other', 'page1', { a: 1 }).key, first.key);
  helper.discardCheckoutAttempt(first);
  assert.notEqual(helper.getCheckoutAttempt('buyer', 'page1', { a: 1 }).key, first.key);
  delete global.sessionStorage;
});
