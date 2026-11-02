const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const util = require('node:util');
const { once } = require('node:events');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');

// No production DB or SMTP is used. Only TEST_MONGO_URI's local host is reused;
// the database name is generated here and cannot be overridden by environment.
process.env.JWT_SECRET = 'phase1-test-' + crypto.randomBytes(24).toString('hex');
let failEmail = false;
for (const relative of ['../src/services/emailService', '../src/utils/email']) {
  const filename = require.resolve(relative);
  require.cache[filename] = { id: filename, filename, loaded: true, exports: {
    sendEmail: async () => { if (failEmail) throw new Error('Simulated SMTP failure'); },
  } };
}
const models = require('../src/models');
const { User, Product, Category, Store, Order, OrderItem, Address, Payment, Inventory } = models;
const router = require('../src/routers');
const { initSocketServer } = require('../src/services/socketService');
const requestLogger = require('../src/middleware/requestLogger');
const logger = require('../src/utils/logger');
const verify = require('../src/services/paymentVerificationService');
const { initScheduler } = require('../src/config/scheduler');

function noPassword(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    assert.notEqual(key.toLowerCase(), 'password', 'API response leaked a password field');
    noPassword(item);
  }
}

test('Phase 1 authorization and COD demo regression', { timeout: 60000 }, async t => {
  const dbName = 'shopii_phase1_test_' + crypto.randomBytes(8).toString('hex');
  const uri = new URL(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017');
  assert(['127.0.0.1', 'localhost'].includes(uri.hostname), 'Tests only allow a local MongoDB');
  assert.equal(uri.protocol, 'mongodb:');
  uri.pathname = '/' + dbName;
  const output = [];
  const originalConsole = { log: console.log, warn: console.warn, error: console.error };
  for (const level of Object.keys(originalConsole)) console[level] = (...args) => output.push(util.inspect(args, { depth: 12 }));
  let server, io;
  const sockets = [];
  try {
    await mongoose.connect(uri.toString(), { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    assert.equal(mongoose.connection.name, dbName);
    const app = express();
    app.use(express.json());
    app.use(requestLogger);
    app.use('/api', router);
    app.use((error, req, res, next) => { logger.error('Request failed', error); res.status(500).json({ message: 'Server error' }); });
    server = http.createServer(app);
    io = initSocketServer(server); app.set('io', io);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    async function call(route, { token, method = 'GET', body, headers = {} } = {}) {
      const response = await fetch(base + '/api' + route, {
        method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(5000),
      });
      return { status: response.status, body: await response.json() };
    }
    const password = 'Phase1-Test-Password!';
    const users = {};
    for (const role of ['buyer', 'seller', 'admin']) users[role] = await User.create({ username: role + '_test', email: role + '@example.com', password, role, action: 'unlock' });
    const other = await User.create({ username: 'other_buyer', email: 'other@example.com', password, role: 'buyer' });
    const category = await Category.create({ name: 'Test category' });
    const product = await Product.create({ title: 'Test product', description: 'Fixture', price: 100000, sellerId: users.seller._id, categoryId: category._id, isAuction: true });
    await Store.create({ sellerId: users.seller._id, storeName: 'Test shop', status: 'approved' });
    await Inventory.create({ productId: product._id, quantity: 10 });
    const address = await Address.create({ userId: users.buyer._id, fullName: 'Test Buyer', phone: '0000000000', street: 'Test', city: 'Test', state: 'Test', country: 'Test' });
    async function orderFor(buyer, status = 'shipping') {
      const order = await Order.create({ buyerId: buyer._id, addressId: address._id, totalPrice: 100000, status: 'pending' });
      const item = await OrderItem.create({ orderId: order._id, productId: product._id, quantity: 1, unitPrice: 100000, status });
      return { order, item };
    }
    const tokens = {};
    await t.test('all roles log in and seller login still verifies bcrypt', async () => {
      for (const [role, user] of Object.entries(users)) {
        const r = await call('/login', { method: 'POST', body: { email: user.email, password } });
        assert.equal(r.status, 200); assert.equal(r.body.user.role, role); noPassword(r.body); tokens[role] = r.body.token;
      }
      const r = await call('/seller/login', { method: 'POST', body: { username: users.seller.username, password } });
      assert.equal(r.status, 200); noPassword(r.body);
    });
    await t.test('password excluded by default and by explicit selection serialization', async () => {
      assert.equal((await User.findById(users.buyer._id)).password, undefined);
      const selected = await User.findById(users.buyer._id).select('+password');
      assert(await selected.comparePassword(password));
      noPassword(selected.toJSON()); noPassword(selected.toObject());
      for (const [route, token] of [['/products', null], ['/products/' + product._id + '/detail', tokens.buyer], ['/profile', tokens.buyer], ['/seller/store', tokens.seller], ['/admin/users', tokens.admin]]) {
        const r = await call(route, { token }); assert.equal(r.status, 200); noPassword(r.body);
      }
    });
    await t.test('missing, malformed and expired tokens are rejected', async () => {
      for (const token of [null, 'invalid', jwt.sign({ id: String(users.buyer._id) }, process.env.JWT_SECRET, { expiresIn: -1 })]) {
        assert.equal((await call('/profile', { token })).status, 401);
      }
    });
    await t.test('current database role overrides stale or forged role claims', async () => {
      const stale = jwt.sign({ id: String(users.buyer._id), role: 'admin' }, process.env.JWT_SECRET);
      assert.equal((await call('/admin/users', { token: stale })).status, 403);
      await User.updateOne({ _id: users.seller._id }, { role: 'buyer' });
      assert.equal((await call('/seller/products', { token: tokens.seller })).status, 403);
      await User.updateOne({ _id: users.seller._id }, { role: 'seller' });
      assert.equal((await call('/seller/products', { token: tokens.seller })).status, 200);
    });
    await t.test('deleted account cannot reuse its valid token', async () => {
      const u = await User.create({ username: 'deleted_user', email: 'deleted@example.com', password, role: 'buyer' });
      const token = jwt.sign({ id: String(u._id), role: 'buyer' }, process.env.JWT_SECRET);
      await User.deleteOne({ _id: u._id });
      assert.equal((await call('/profile', { token })).status, 401);
    });
    await t.test('locking a buyer persists despite SMTP failure and blocks existing tokens', async () => {
      failEmail = true;
      const r = await call('/admin/users/' + users.buyer._id, { token: tokens.admin, method: 'PUT', body: { action: 'lock' } });
      assert.equal(r.status, 200); assert.equal((await User.findById(users.buyer._id)).action, 'lock');
      assert.equal((await call('/login', { method: 'POST', body: { email: users.buyer.email, password } })).status, 403);
      assert.equal((await call('/profile', { token: tokens.buyer })).status, 403);
      assert.equal((await call('/admin/users/' + users.buyer._id, { token: tokens.admin, method: 'PUT', body: { action: 'unlock' } })).status, 200);
      failEmail = false;
      assert.equal((await call('/profile', { token: tokens.buyer })).status, 200);
    });
    await t.test('both seller login endpoints reject locked sellers', async () => {
      await User.updateOne({ _id: users.seller._id }, { action: 'lock' });
      assert.equal((await call('/login', { method: 'POST', body: { email: users.seller.email, password } })).status, 403);
      assert.equal((await call('/seller/login', { method: 'POST', body: { username: users.seller.username, password } })).status, 403);
      await User.updateOne({ _id: users.seller._id }, { action: 'unlock' });
    });
    await t.test('password change still verifies old password after select:false', async () => {
      assert.equal((await call('/profile/password', { token: tokens.buyer, method: 'PUT', body: { currentPassword: 'wrong', newPassword: 'New-Password-123!' } })).status, 400);
      const changed = await call('/profile/password', { token: tokens.buyer, method: 'PUT', body: { currentPassword: password, newPassword: 'New-Password-123!' } });
      assert.equal(changed.status, 200);
      assert.equal((await call('/profile', { token: tokens.buyer })).status, 401);
      tokens.buyer = changed.body.token;
      assert.equal((await call('/login', { method: 'POST', body: { email: users.buyer.email, password: 'New-Password-123!' } })).status, 200);
    });
    await t.test('another buyer cannot mutate an order item', async () => {
      const { item } = await orderFor(other);
      const before = JSON.stringify(await OrderItem.findById(item._id).lean());
      const r = await call('/buyers/orders/items/' + item._id + '/status', { token: tokens.buyer, method: 'PUT', body: { status: 'shipped' } });
      assert.equal(r.status, 404); assert.equal(JSON.stringify(await OrderItem.findById(item._id).lean()), before);
    });
    await t.test('unauthorized order detail GET cannot synchronize another order', async () => {
      const { order } = await orderFor(other, 'shipped');
      assert.equal((await call('/buyers/orders/' + order._id, { token: tokens.buyer })).status, 404);
      assert.equal((await Order.findById(order._id)).status, 'pending');
    });
    await t.test('buyer can confirm own shipping item, repeat safely, without marking COD paid', async () => {
      const { order, item } = await orderFor(users.buyer);
      await Payment.create({ orderId: order._id, userId: users.buyer._id, amount: 100000, method: 'COD', status: 'pending' });
      const route = '/buyers/orders/items/' + item._id + '/status';
      assert.equal((await call(route, { token: tokens.buyer, method: 'PUT', body: { status: 'shipped' } })).status, 200);
      const saved = await OrderItem.findById(item._id).lean();
      assert.equal((await call(route, { token: tokens.buyer, method: 'PUT', body: { status: 'shipped' } })).status, 200);
      assert.equal(JSON.stringify(await OrderItem.findById(item._id).lean()), JSON.stringify(saved));
      assert.equal((await Order.findById(order._id)).status, 'shipped');
      assert.equal((await Payment.findOne({ orderId: order._id })).status, 'pending');
    });
    await t.test('invalid IDs and unsupported buyer status transitions are rejected', async () => {
      const { item } = await orderFor(users.buyer, 'pending');
      const route = '/buyers/orders/items/' + item._id + '/status';
      assert.equal((await call(route, { token: tokens.buyer, method: 'PUT', body: { status: 'shipping' } })).status, 400);
      assert.equal((await call(route, { token: tokens.buyer, method: 'PUT', body: { status: 'shipped' } })).status, 409);
      assert.equal((await call('/buyers/orders/items/bad-id/status', { token: tokens.buyer, method: 'PUT', body: { status: 'shipped' } })).status, 400);
    });
    await t.test('COD creation succeeds; online methods cannot replace an existing COD payment', async () => {
      const { order } = await orderFor(users.buyer, 'pending');
      assert.equal((await call('/buyers/payments', { token: tokens.buyer, method: 'POST', body: { orderId: String(order._id), method: 'COD' } })).status, 201);
      const before = JSON.stringify(await Payment.findOne({ orderId: order._id }).lean());
      for (const method of ['PayOS', 'VietQR']) {
        assert.equal((await call('/buyers/payments', { token: tokens.buyer, method: 'POST', body: { orderId: String(order._id), method, replaceExisting: true } })).status, 400);
      }
      assert.equal(JSON.stringify(await Payment.findOne({ orderId: order._id }).lean()), before);
    });
    await t.test('all legacy callback URLs reject unauthenticated requests without changes', async () => {
      const payment = await Payment.findOne({ method: 'COD' }).lean();
      const before = JSON.stringify(payment);
      for (const action of ['callback', 'cancel']) {
        assert.equal((await call('/buyers/payments/payos/' + action + '?orderCode=' + payment.orderId + '&status=PAID')).status, 404);
      }
      assert.equal((await call('/buyers/payments/vietqr/callback', { method: 'POST', body: { orderId: String(payment.orderId), status: 'SUCCESS' } })).status, 404);
      assert.equal(JSON.stringify(await Payment.findById(payment._id).lean()), before);
    });
    await t.test('scheduler and verification services never call online providers', async () => {
      const axios = require('axios'); const previous = axios.get; let calls = 0;
      axios.get = async () => { calls++; throw new Error('Online provider must not be called'); };
      try {
        assert.equal(initScheduler(), null);
        assert.equal(await verify.verifyPayOSPayment({}), false);
        assert.equal(await verify.verifyVietQRPayment({}), false);
        await verify.verifyPendingPayments(); assert.equal(calls, 0);
      } finally { axios.get = previous; }
    });
    await t.test('request and error logs omit credentials, query values and Axios config', async () => {
      const sentinel = 'NEVER_LOG_THIS_CREDENTIAL';
      await call('/login?api_key=' + sentinel, { method: 'POST', body: { email: users.buyer.email, password: sentinel }, headers: { Cookie: 'session=' + sentinel } });
      await call('/profile?token=' + sentinel, { token: sentinel });
      const err = new Error(sentinel); err.config = { headers: { Authorization: 'Bearer ' + sentinel } };
      logger.error('Safe test', err, { password: sentinel, nested: { api_key: sentinel, token: sentinel } });
      logger.info('Bearer ' + sentinel);
      const logged = output.join('\n'); assert(!logged.includes(sentinel)); assert(!logged.includes(password));
      assert(!logged.includes(tokens.buyer)); assert(!logged.includes('New-Password-123!'));
    });
    await t.test('socket authentication rejects locked users and admin lock disconnects existing sockets', async () => {
      const frontendRequire = require('node:module').createRequire(path.join(__dirname, '../front-end/package.json'));
      const { io: connect } = frontendRequire('socket.io-client');
      const socket = connect(base, { transports: ['websocket'], auth: { token: tokens.buyer }, reconnection: false, autoConnect: false });
      sockets.push(socket);
      const connected = once(socket, 'connect'); socket.connect(); await connected;
      const disconnected = once(socket, 'disconnect');
      failEmail = true;
      assert.equal((await call('/admin/users/' + users.buyer._id, { token: tokens.admin, method: 'PUT', body: { action: 'lock' } })).status, 200);
      await disconnected;
      const denied = connect(base, { transports: ['websocket'], auth: { token: tokens.buyer }, reconnection: false, autoConnect: false });
      sockets.push(denied); const rejected = once(denied, 'connect_error'); denied.connect(); await rejected;
      assert.equal(denied.connected, false); failEmail = false;
    });
  } finally {
    for (const socket of sockets) socket.disconnect();
    if (io) await new Promise(resolve => io.close(resolve));
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.name === dbName && /^shopii_phase1_test_[a-f0-9]{16}$/.test(dbName)) await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    Object.assign(console, originalConsole);
  }
});
