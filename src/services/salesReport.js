const { Product, Order, OrderItem, Payment, User } = require('../models');
const { allocations } = require('./orderLifecycle');
const { fail } = require('../utils/apiError');
function dateRange(query = {}) {
  const { period, from, to } = query;
  if (period && !['all', 'week', 'month', 'year'].includes(period)) fail(400, 'Invalid reporting period');
  for (const value of [from, to]) if (value !== undefined && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value)) fail(400, 'Invalid date');
  let start = new Date(0), end = new Date();
  if (from || to) {
    if (from) start = new Date(from + 'T00:00:00+07:00');
    if (to) end = new Date(to + 'T23:59:59.999+07:00');
  } else if (['week','month','year'].includes(period)) {
    start = new Date();
    if (period === 'week') start.setDate(start.getDate() - 7);
    if (period === 'month') start.setMonth(start.getMonth() - 1);
    if (period === 'year') start.setFullYear(start.getFullYear() - 1);
  }
  if (start > end) fail(400, 'Start date must precede end date');
  return { $gte: start, $lte: end };
}
async function report(sellerId, query) {
  const products = await Product.find(sellerId ? { sellerId } : {}).populate('categoryId', 'name').lean();
  const productMap = new Map(products.map(p => [String(p._id), p]));
  const orders = await Order.find({ orderDate: dateRange(query) }).populate('addressId', 'city').lean();
  const orderIds = orders.map(o => o._id);
  // Include ALL shops while allocating the original discounted amount, then scope to this seller.
  const [items, payments] = await Promise.all([OrderItem.find({ orderId: { $in: orderIds } }).sort({ _id: 1 }).lean(), Payment.find({ orderId: { $in: orderIds } }).lean()]);
  const grouped = new Map(), paid = new Map();
  for (const item of items) { const key = String(item.orderId); if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(item); }
  for (const payment of payments) { const key = String(payment.orderId); if (!paid.has(key)) paid.set(key, []); paid.get(key).push(payment); }
  let totalRevenue = 0, totalDeliveredPayable = 0, totalOutstanding = 0, totalGrossDelivered = 0, productsShipped = 0, legacyIssueCount = 0;
  const category = new Map(), destinations = new Map(), dates = new Map(), productTotals = new Map(), sellers = new Map(), customers = new Set();
  const add = (map, key, amount) => map.set(key, (map.get(key) || 0) + amount);
  for (const order of orders) {
    const rows = grouped.get(String(order._id)) || [];
    if (!rows.some(i => productMap.has(String(i.productId)))) continue;
    const paymentRows = paid.get(String(order._id)) || [];
    let amounts;
    try {
      if (paymentRows.length > 1) throw Error('Ambiguous legacy payment');
      amounts = allocations(rows, order.originalTotalPrice ?? order.totalPrice);
    } catch { legacyIssueCount++; continue; }
    rows.forEach((item, index) => {
      const product = productMap.get(String(item.productId));
      if (!product || item.status === 'rejected') return;
      const amount = item.payableAmount ?? amounts[index];
      if (!Number.isSafeInteger(amount) || amount < 0) { legacyIssueCount++; return; }
      const collected = item.status === 'shipped' && (item.codCollected || paymentRows[0]?.status === 'paid');
      if (!collected) totalOutstanding += amount;
      if (item.status === 'shipped') {
        productsShipped += item.quantity;
        totalGrossDelivered += item.unitPrice * item.quantity;
        totalDeliveredPayable += amount;
      }
      if (!collected) return;
      totalRevenue += amount;
      customers.add(String(order.buyerId));
      add(category, product.categoryId?.name || 'Other', amount);
      add(destinations, order.addressId?.city || 'Unknown', amount);
      const localDay = new Date(new Date(order.orderDate).getTime() + 7 * 3600000).toISOString().slice(0,10);
      add(dates, localDay, amount);
      const key = String(product._id);
      const row = productTotals.get(key) || { product: product.title, quantity: 0, revenue: 0 };
      row.quantity += item.quantity; row.revenue += amount; productTotals.set(key, row);
      const seller = sellers.get(String(product.sellerId)) || { totalRevenue: 0, orders: new Set() };
      seller.totalRevenue += amount; seller.orders.add(String(order._id)); sellers.set(String(product.sellerId), seller);
    });
  }
  const names = await User.find({ _id: { $in: [...sellers.keys()] } }).select('username').lean();
  const percent = map => [...map].map(([name, amount]) => ({ name, value: totalRevenue ? Math.round(amount / totalRevenue * 100) : 0, amount }));
  return {
    totalRevenue, totalDeliveredPayable, totalOutstanding, totalGrossDelivered, productsShipped, legacyIssueCount,
    reportBasis: 'Collected payments after discounts, grouped by order date (Asia/Ho_Chi_Minh); excludes rejected items. Not a cash-flow or refund ledger.',
    uniqueCustomers: customers.size, uniqueCustomerList: [...customers],
    revenueByCategory: percent(category), topDestinations: percent(destinations).sort((a,b) => b.amount - a.amount),
    revenueOverTime: [...dates].map(([date, revenue]) => ({ date, revenue })).sort((a,b) => a.date.localeCompare(b.date)),
    topProducts: [...productTotals.values()].sort((a,b) => b.revenue - a.revenue).slice(0,5),
    topSellers: [...sellers].map(([id, row]) => ({ seller: names.find(n => String(n._id) === id)?.username || 'Unknown', totalRevenue: row.totalRevenue, orderCount: row.orders.size })).sort((a,b) => b.totalRevenue - a.totalRevenue).slice(0,5)
  };
}
module.exports = { report, dateRange };
