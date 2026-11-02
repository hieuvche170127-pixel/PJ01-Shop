const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const Store = require('../models/Store');
const { fail, requireId } = require('../utils/apiError');
async function approvedShop(sellerId) {
  if (!await Store.exists({ sellerId, status: 'approved' })) fail(403, 'Cửa hàng phải được duyệt trước khi quản lý sản phẩm bán.');
}
async function productFields(body, create = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Dữ liệu sản phẩm không hợp lệ.');
  const allowed = ['title','description','price','image','categoryId','isAuction','auctionEndTime','quantity'];
  if (Object.keys(body).some(k => !allowed.includes(k))) fail(400, 'Yêu cầu chứa trường không được phép sửa.');
  const out = {};
  for (const [key,max] of [['title',200],['description',5000]]) {
    if (create || key in body) {
      if (typeof body[key] !== 'string' || !body[key].trim() || body[key].trim().length > max) fail(400, `${key} phải có nội dung và không vượt ${max} ký tự.`);
      out[key] = body[key].trim();
    }
  }
  if (create || 'price' in body) {
    if (!Number.isSafeInteger(body.price) || body.price < 0 || body.price > 1000000000) fail(400, 'Giá phải là số nguyên VNĐ từ 0 đến 1 tỷ.');
    out.price = body.price;
  }
  if (create || 'categoryId' in body) {
    requireId(body.categoryId);
    if (!await Category.exists({ _id: body.categoryId })) fail(400, 'Danh mục không tồn tại.');
    out.categoryId = body.categoryId;
  }
  if ('isAuction' in body) {
    if (typeof body.isAuction !== 'boolean') fail(400, 'Trạng thái bán không hợp lệ.');
    out.isAuction = body.isAuction;
  }
  if ('image' in body) {
    if (typeof body.image !== 'string' || body.image.length > 2000 || (body.image && !/^https?:\/\//i.test(body.image) && !/^\/demo-assets\/[\w./-]+$/.test(body.image))) fail(400, 'Ảnh phải là URL đã upload hoặc ảnh trong catalog demo.');
    out.image = body.image;
  }
  if ('auctionEndTime' in body) {
    if (body.auctionEndTime && (typeof body.auctionEndTime !== 'string' || !Number.isFinite(Date.parse(body.auctionEndTime)))) fail(400, 'Ngày kết thúc không hợp lệ.');
    out.auctionEndTime = body.auctionEndTime || null;
  }
  if ('quantity' in body && (!Number.isSafeInteger(body.quantity) || body.quantity < 0)) fail(400, 'Tồn kho phải là số nguyên không âm.');
  return out;
}
async function create(sellerId, body) {
  await approvedShop(sellerId);
  const fields = await productFields(body, true);
  const product = new Product({ ...fields, sellerId });
  const inventory = new Inventory({ productId: product._id, quantity: body.quantity ?? 0 });
  await product.validate(); await inventory.validate();
  try { await inventory.save(); await product.save(); }
  catch (error) {
    const exists = await Product.exists({ _id: product._id });
    if (!exists) await Inventory.deleteOne({ productId: product._id });
    else return { product: await Product.findById(product._id), inventory: await Inventory.findOne({ productId: product._id }) };
    throw error;
  }
  return { product, inventory };
}
async function update(sellerId, productId, body) {
  requireId(productId);
  const owned = await Product.findOne({ _id: productId, sellerId });
  if (!owned) fail(404, 'Không tìm thấy sản phẩm của shop.');
  await approvedShop(sellerId);
  const fields = await productFields(body);
  // Stock is edited atomically at its own endpoint, never as half a product update.
  if ('quantity' in body) fail(409, 'Cập nhật số lượng tại Quản lý tồn kho; thông tin sản phẩm chưa thay đổi.');
  if (!Object.keys(fields).length) fail(400, 'Chưa có thông tin cần cập nhật.');
  const product = await Product.findOneAndUpdate({ _id: productId, sellerId }, { $set: fields }, { new: true, runValidators: true }).populate('categoryId','name');
  if (!product) fail(404, 'Sản phẩm không còn tồn tại.');
  const inventory = await Inventory.findOne({ productId });
  return { product, categoryName: product.categoryId?.name || null, quantity: inventory?.quantity ?? 0, inventoryMissing: !inventory };
}
module.exports = { approvedShop, productFields, create, update };
