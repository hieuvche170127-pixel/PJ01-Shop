const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực
    const { productId, quantity } = req.body;

    // Xác thực đầu vào
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid productId or quantity' });
    }

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is a seller trying to add their own product
    if (req.user.role === 'seller' && product.sellerId.toString() === userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Sellers cannot add their own products to cart' 
      });
    }

    // Tìm giỏ hàng của người dùng
    let cart = await Cart.findOne({ userId });
    if (cart) {
      // Nếu giỏ hàng đã tồn tại, kiểm tra xem sản phẩm đã có trong giỏ chưa
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        // Nếu sản phẩm đã có, tăng số lượng
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Nếu sản phẩm chưa có, thêm mới vào danh sách
        cart.items.push({ productId, quantity });
      }
    } else {
      // Nếu chưa có giỏ hàng, tạo mới
      cart = new Cart({
        userId,
        items: [{ productId, quantity }]
      });
    }

    // Lưu giỏ hàng
    await cart.save();
    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xem giỏ hàng
const viewCart = async (req, res) => {
  try {
    const userId = req.user.id;
    // Tìm giỏ hàng và populate thông tin sản phẩm
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cập nhật sản phẩm trong giỏ hàng
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId; // Lấy productId từ URL
    const { quantity } = req.body;

    // Xác thực số lượng
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Tìm giỏ hàng
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Tìm sản phẩm trong giỏ hàng
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      // Cập nhật số lượng
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      res.status(200).json({ message: 'Cart item updated', cart });
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId; // Lấy productId từ URL

    // Use findOneAndUpdate with $pull to remove the item atomically
    // This avoids version conflicts when multiple requests happen concurrently
    const result = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json({ message: 'Item removed from cart', cart: result });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xóa nhiều sản phẩm cùng lúc
const removeMultipleItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productIds } = req.body; // Array of product IDs to remove

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty product IDs array' });
    }

    console.log(`Removing ${productIds.length} items from cart for user ${userId}`);

    // Use updateOne with $pull to remove all specified items atomically
    const result = await Cart.updateOne(
      { userId },
      { $pull: { items: { productId: { $in: productIds } } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Return the updated cart
    const updatedCart = await Cart.findOne({ userId }).populate('items.productId');
    res.status(200).json({ 
      message: `${result.modifiedCount > 0 ? 'Items removed from cart' : 'No items were removed'}`, 
      cart: updatedCart 
    });
  } catch (error) {
    console.error('Error removing multiple items from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xuất các hàm
module.exports = {
  addToCart,
  viewCart,
  updateCartItem,
  deleteCartItem,
  removeMultipleItems
};