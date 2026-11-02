const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { validId, validQuantity } = require('../services/checkoutService');
const logger = require('../utils/logger');

let cartIndex;
async function ensureCartIndex() {
  if (!cartIndex) cartIndex = Cart.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' }).catch(error => { cartIndex = null; throw error; });
  return cartIndex;
}
const problem = (status, message) => Object.assign(new Error(message), { status });
async function changeItem(req, res, add) {
  try {
    const productId = add ? req.body.productId : req.params.productId;
    const { quantity } = req.body;
    if (!validId(productId) || !validQuantity(quantity)) throw problem(400, 'Số lượng phải là số nguyên dương và mã sản phẩm phải hợp lệ.');
    const id = productId.toLowerCase();
    const product = await Product.findOne({ _id: id, isAuction: true }).lean();
    if (!product) throw problem(404, 'Sản phẩm không còn được bán.');
    if (String(product.sellerId) === String(req.user.id)) throw problem(403, 'Không thể mua sản phẩm của chính mình.');
    await ensureCartIndex();
    for (let attempt = 0; attempt < 5; attempt++) {
      const cart = await Cart.findOne({ userId: req.user.id }) || new Cart({ userId: req.user.id, items: [] });
      const item = cart.items.find(line => String(line.productId) === id);
      if (!add && !item) throw problem(404, 'Sản phẩm không có trong giỏ.');
      const nextQuantity = add ? (item?.quantity || 0) + quantity : quantity;
      if (!validQuantity(nextQuantity)) throw problem(400, 'Tổng số lượng không hợp lệ.');
      const inventory = await Inventory.findOne({ productId: id }).lean();
      if (!inventory || nextQuantity > inventory.quantity) throw problem(409, 'Số lượng trong giỏ vượt tồn kho hiện tại.');
      if (item) item.quantity = nextQuantity;
      else cart.items.push({ productId: id, quantity: nextQuantity });
      try {
        await cart.save();
        return res.json({ message: add ? 'Item added to cart' : 'Cart item updated', cart });
      } catch (error) {
        if (error.name !== 'VersionError' && error.code !== 11000) throw error;
      }
    }
    throw problem(409, 'Giỏ hàng vừa thay đổi. Vui lòng thử lại.');
  } catch (error) {
    if (!error.status) logger.error('Cart update failed', error);
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Server error' });
  }
}
const addToCart = (req, res) => changeItem(req, res, true);
const updateCartItem = (req, res) => changeItem(req, res, false);
async function viewCart(req, res) {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    return res.json(cart);
  } catch (error) { logger.error('Cart read failed', error); return res.status(500).json({ message: 'Server error' }); }
}
async function remove(req, res, ids) {
  if (!Array.isArray(ids) || !ids.length || !ids.every(validId)) return res.status(400).json({ message: 'Invalid product IDs' });
  try {
    const cart = await Cart.findOneAndUpdate({ userId: req.user.id }, {
      $pull: { items: { productId: { $in: ids } } }, $inc: { __v: 1 },
    }, { new: true }).populate('items.productId');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    return res.json({ message: 'Items removed from cart', cart });
  } catch (error) { logger.error('Cart removal failed', error); return res.status(500).json({ message: 'Server error' }); }
}
module.exports = { addToCart, updateCartItem, viewCart,
  deleteCartItem: (req, res) => remove(req, res, [req.params.productId]),
  removeMultipleItems: (req, res) => remove(req, res, req.body.productIds),
};
