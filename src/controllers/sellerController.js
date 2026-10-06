const User = require("../models/User");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const ShippingInfo = require("../models/ShippingInfo");
const Review = require("../models/Review");
const Feedback = require("../models/Feedback");
const Dispute = require("../models/Dispute");
const Category = require("../models/Category");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const ReturnRequest = require('../models/ReturnRequest');
const Address = require('../models/Address');
const Payment = require('../models/Payment');

// Tạo cửa hàng mới
exports.createStore = async (req, res) => {
  try {
    const { storeName, description, bannerImageURL } = req.body;
    const sellerId = req.user.id;

    // Kiểm tra xem người dùng có vai trò seller không
    const user = await User.findById(sellerId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role !== "seller") {
      return res.status(403).json({ success: false, message: "User is not a seller" });
    }

    // Kiểm tra xem người dùng đã có store chưa
    const existingStore = await Store.findOne({ sellerId });
    if (existingStore) {
      return res.status(400).json({ success: false, message: "User already has a store" });
    }

    // Validate input
    if (!storeName) {
      return res.status(400).json({ success: false, message: "Store name is required" });
    }

    // Tạo mới store
    const newStore = new Store({
      sellerId,
      storeName,
      description,
      bannerImageURL,
      status: "pending" // Mặc định là pending, chờ admin duyệt
    });

    await newStore.save();

    res.status(201).json({
      success: true,
      message: "Store created successfully and is pending approval",
      data: newStore
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đăng nhập và chuyển sang chế độ bán hàng
exports.loginAndSwitch = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Kiểm tra role
    if (user.role !== "seller") {
      return res.status(403).json({ success: false, message: "User is not a seller" });
    }

    // Generate JWT token
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Logged in as seller",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfileStoreAndSeller = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const store = await Store.findOne({ sellerId }).populate('sellerId');
    if (!store) {
      return res.status(404).json({ success: false, message: "Store profile not found" });
    }

    // Lấy tất cả product của store này
    const products = await Product.find({ sellerId }, '_id');
    const productIds = products.map(p => p._id);

    // Lấy review gốc (parentId == null) của tất cả product
    const reviews = await Review.find(
      { productId: { $in: productIds }, parentId: null },
      'rating'
    );
    const totalReviews = reviews.length;
    const avgRating = totalReviews
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1)
      : 0;

    // Lấy địa chỉ mặc định của user
    const address = await Address.findOne({ userId: store.sellerId._id, isDefault: true });

    // Trả về response gồm địa chỉ
    res.json({
      success: true,
      data: {
        ...store.toObject(),
        avgRating: Number(avgRating),
        totalReviews,
        address // có thể null nếu user chưa khai báo
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật hồ sơ cửa hàng
exports.updateStoreProfile = async (req, res) => {
  try {
    const { storeName, description, bannerImageURL } = req.body;
    const sellerId = req.user.id;

    const store = await Store.findOneAndUpdate(
      { sellerId },
      { storeName, description, bannerImageURL },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    // Lấy các trường user và address từ body
    const { username, fullname, email, avatar, phone, street, city, state, country } = req.body;

    // 1. Cập nhật User
    const updatedUser = await User.findByIdAndUpdate(
      sellerId,
      { username, fullname, email, avatarURL: avatar }, // Lưu ý: avatar hay avatarURL
      { new: true }
    ).select("-password"); // Không trả về password

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // 2. Cập nhật địa chỉ mặc định
    let updatedAddress = null;
    if (phone || street || city || state || country) {
      // Upsert địa chỉ mặc định (isDefault: true)
      updatedAddress = await Address.findOneAndUpdate(
        { userId: sellerId, isDefault: true },
        {
          phone, street, city, state, country, fullName: fullname || updatedUser.fullname, isDefault: true
        },
        { new: true, upsert: true }
      );
    }

    res.json({
      success: true,
      data: {
        ...updatedUser.toObject(),
        address: updatedAddress
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    if (!categories || categories.length === 0) {
      return res.status(404).json({ success: false, message: "No categories found" });
    }
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.addNewCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Kiểm tra xem category đã tồn tại chưa
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    // Tạo mới category
    const newCategory = new Category({
      name,
      description
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category added successfully!",
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đăng bán sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, image, categoryId, isAuction, auctionEndTime, quantity } = req.body;

    const product = new Product({
      title,
      description,
      price,
      image,
      categoryId,
      sellerId: req.user.id,
      isAuction,
      auctionEndTime
    });

    await product.save();

    // Tạo bản ghi tồn kho
    const inventory = new Inventory({
      productId: product._id,
      quantity: quantity || 0
    });
    await inventory.save();

    res.status(201).json({ success: true, data: { product, inventory } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quản lý danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    console.log("Getting products for seller:", req.user.id);
    
    // Tìm sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    
    if (!products || products.length === 0) {
      console.log("No products found for seller:", req.user.id);
      return res.json({ success: true, data: [], message: "No products found" });
    }
    
    console.log(`Found ${products.length} products for seller`);
    const productIds = products.map(p => p._id);

    // Lấy tất cả inventory records hiện có
    const existingInventories = await Inventory.find({ productId: { $in: productIds } });
    
    // Tạo map để kiểm tra nhanh sản phẩm nào đã có inventory
    const inventoryMap = {};
    existingInventories.forEach(inv => {
      inventoryMap[inv.productId.toString()] = inv;
    });
    
    // Kiểm tra và tạo inventory records cho các sản phẩm chưa có
    const inventoryPromises = [];
    for (const product of products) {
      if (!inventoryMap[product._id.toString()]) {
        console.log(`Creating inventory for product ${product._id}`);
        inventoryPromises.push(
          new Inventory({
            productId: product._id,
            quantity: 0
          }).save()
        );
      }
    }
    
    // Nếu có inventory mới cần tạo
    if (inventoryPromises.length > 0) {
      await Promise.all(inventoryPromises);
    }
    
    // Lấy lại tất cả inventory sau khi đã tạo đủ
    const allInventories = await Inventory.find({ productId: { $in: productIds } })
      .populate({ 
        path: "productId", 
        populate: { path: "categoryId" } 
      });
    
    // Log products with missing categoryId
    for (const inventory of allInventories) {
      if (inventory.productId && !inventory.productId.categoryId) {
        console.warn(`Warning: Product ${inventory.productId._id} has null categoryId`);
      }
    }
    
    // Đảm bảo thứ tự trả về khớp với thứ tự của products
    const sortedInventories = [];
    for (const product of products) {
      const inventory = allInventories.find(inv => 
        inv.productId && inv.productId._id.toString() === product._id.toString()
      );
      if (inventory) {
        sortedInventories.push(inventory);
      }
    }
    
    res.json({ success: true, data: sortedInventories });
  } catch (error) {
    console.error("Error in getProducts:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('categoryId');
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    // Kiểm tra sản phẩm thuộc về seller hiện tại
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    
    // Tìm hoặc tạo inventory
    let inventory = await Inventory.findOne({ productId: id });
    
    // Nếu không có inventory, tạo mới
    if (!inventory) {
      inventory = new Inventory({
        productId: id,
        quantity: 0
      });
      await inventory.save();
    }
    
    // Tạo đối tượng kết quả
    const result = {
      product,
      inventory,
      categoryName: product.categoryId ? product.categoryId.name : null
    };

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { id } = req.params; // id là productId

    // Lấy tất cả review & populate user
    const reviews = await Review.find({ productId: id })
      .populate('reviewerId', 'username role')
      .sort({ createdAt: -1 });

    // Lấy userIds là seller để tìm cửa hàng
    const sellerUserIds = reviews
      .filter(r => r.reviewerId && r.reviewerId.role === "seller")
      .map(r => r.reviewerId._id);

    // Map: userId -> { storeName, bannerImageURL }
    let storeMap = {};
    if (sellerUserIds.length) {
      const stores = await Store.find(
        { sellerId: { $in: sellerUserIds } },
        "sellerId storeName bannerImageURL"
      );
      storeMap = stores.reduce((acc, s) => {
        acc[s.sellerId.toString()] = {
          storeName: s.storeName,
          bannerImageURL: s.bannerImageURL,
        };
        return acc;
      }, {});
    }

    // Gắn thêm storeName và bannerImageURL vào review nếu reviewer là seller
    const reviewsWithStore = reviews.map(r => {
      let reviewObj = r.toObject();
      if (r.reviewerId && r.reviewerId.role === "seller") {
        const storeInfo = storeMap[r.reviewerId._id.toString()] || {};
        reviewObj.storeName = storeInfo.storeName || "";
        reviewObj.storeBanner = storeInfo.bannerImageURL || "";
      }
      return reviewObj;
    });

    res.json({ success: true, data: reviewsWithStore });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // 1. Cập nhật product
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user.id },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2. Nếu request có quantity thì cập nhật Inventory
    if (typeof req.body.quantity !== 'undefined') {
      await Inventory.findOneAndUpdate(
        { productId: product._id },
        { quantity: req.body.quantity },
        { new: true }
      );
    }

    // 3. Lấy lại product và populate categoryId
    const populatedProduct = await Product.findById(product._id)
      .populate('categoryId', 'name');

    // 4. Lấy quantity trong Inventory
    const inventory = await Inventory.findOne({ productId: product._id });

    res.json({
      success: true,
      data: {
        product: populatedProduct,
        categoryName: populatedProduct.categoryId?.name || null,
        quantity: inventory ? inventory.quantity : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      sellerId: req.user.id
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Xóa inventory liên quan
    await Inventory.findOneAndDelete({ productId: req.params.id });

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quản lý tồn kho
exports.getInventory = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p._id);

    // Lấy inventory của các sản phẩm đó
    const inventory = await Inventory.find({ productId: { $in: productIds } })
      .populate("productId", "title");

    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { quantity } = req.body;

    // Kiểm tra sản phẩm thuộc về seller
    const product = await Product.findOne({
      _id: req.params.productId,
      sellerId: req.user.id
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { productId: req.params.productId },
      { quantity },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xác nhận đơn hàng và in phiếu vận chuyển
exports.confirmOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Kiểm tra đơn hàng có sản phẩm của seller
    const orderItems = await OrderItem.find({ orderId })
      .populate({
        path: 'productId',
        select: 'sellerId'
      });

    const sellerItems = orderItems.filter(item =>
      item.productId.sellerId.toString() === req.user.id
    );

    if (sellerItems.length === 0) {
      return res.status(404).json({ success: false, message: "No items found for this seller" });
    }

    // Cập nhật trạng thái đơn hàng
    await OrderItem.updateMany(
      { _id: { $in: sellerItems.map(i => i._id) } },
      { status: "shipping" }
    );

    // Tạo thông tin vận chuyển
    const shippingInfos = await Promise.all(sellerItems.map(async (item) => {
      const shippingInfo = new ShippingInfo({
        orderItemId: item._id,
        trackingNumber: `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: "shipping"
      });
      await shippingInfo.save();
      return shippingInfo;
    }));

    res.json({
      success: true,
      message: "Order confirmed",
      data: shippingInfos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xem đánh giá sản phẩm
exports.getProductReviews = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p._id);

    // Lấy đánh giá của các sản phẩm đó
    const reviews = await Review.find({ productId: { $in: productIds } })
      .populate("reviewerId", "username")
      .populate("productId", "title");

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Gửi phản hồi hệ thống (Feedback)
exports.submitFeedback = async (req, res) => {
  try {
    const { content } = req.body;

    // Tạo feedback
    const feedback = new Feedback({
      sellerId: req.user.id,
      content
    });

    await feedback.save();

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Báo cáo doanh số nâng cấp cho dashboard
// exports.getSalesReport = async (req, res) => {
//   try {
//     const { period } = req.query; // week, month, year
//     const sellerId = req.user.id;

//     // 1. Lấy tất cả sản phẩm của seller
//     const products = await Product.find({ sellerId }).populate("categoryId", "name");
//     const productIds = products.map(p => p._id);

//     // 2. Lấy tất cả order items liên quan (đã giao - shipped)
//     const orderItems = await OrderItem.find({
//       productId: { $in: productIds },
//       status: "shipped"
//     }).populate({
//       path: "orderId",
//       select: "orderDate buyerId addressId",
//       populate: {
//         path: "addressId",
//         select: "city country",
//       }
//     });


//     // 3. Lọc theo khoảng thời gian
//     const now = new Date();
//     let startDate;
//     switch (period) {
//       case "week":
//         startDate = new Date(now);
//         startDate.setDate(startDate.getDate() - 7);
//         break;
//       case "month":
//         startDate = new Date(now);
//         startDate.setMonth(startDate.getMonth() - 1);
//         break;
//       case "year":
//         startDate = new Date(now);
//         startDate.setFullYear(startDate.getFullYear() - 1);
//         break;
//       default:
//         startDate = new Date(0); // all time
//     }

//     const filteredItems = orderItems.filter(item =>
//       item.orderId && new Date(item.orderId.orderDate) >= startDate
//     );

//     // --- Tổng quan ---
//     const totalRevenue = filteredItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
//     // Lấy tất cả các buyerId duy nhất từ filteredItems
//     const uniqueCustomerSet = new Set(
//       filteredItems.map(i => i.orderId?.buyerId?.toString())
//     );

//     // Chuyển thành mảng
//     const uniqueCustomerList = Array.from(uniqueCustomerSet);

//     // Đếm số lượng
//     const uniqueCustomers = uniqueCustomerList.length;


//     const productsShipped = [...new Set(filteredItems.map(i => i.productId.toString()))].length;

//     // --- Revenue by Category ---
//     const categoryRevenueMap = {};
//     filteredItems.forEach(item => {
//       const product = products.find(p => p._id.equals(item.productId));
//       const catName = product?.categoryId?.name || "Other";
//       categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + (item.unitPrice * item.quantity);
//     });
//     // Format for PieChart
//     const revenueByCategory = Object.entries(categoryRevenueMap).map(([name, value]) => ({
//       name,
//       value: Number(((value / totalRevenue) * 100).toFixed(0)) // % phần trăm
//     }));

//     // --- Top Shipping Destinations ---
//     const destinationMap = {};
//     filteredItems.forEach(item => {
//       const city = item.orderId?.addressId?.city || "Unknown";
//       destinationMap[city] = (destinationMap[city] || 0) + (item.unitPrice * item.quantity);
//     });
//     const revenueByDestination = Object.entries(destinationMap)
//       .map(([name, value]) => ({
//         name,
//         value: Number(((value / totalRevenue) * 100).toFixed(0)),
//         raw: value
//       }))
//       .sort((a, b) => b.raw - a.raw)
//       .map(({ raw, ...rest }) => rest);


//     // --- Revenue Over Time ---
//     const revenueByDate = {};
//     filteredItems.forEach(item => {
//       const dateStr = new Date(item.orderId.orderDate).toISOString().split('T')[0];
//       revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + (item.unitPrice * item.quantity);
//     });
//     const revenueOverTime = Object.entries(revenueByDate).map(([date, revenue]) => ({
//       date,
//       revenue
//     })).sort((a, b) => new Date(a.date) - new Date(b.date));;

//     // --- Top Products ---
//     const productSalesMap = {};
//     filteredItems.forEach(item => {
//       const product = products.find(p => p._id.equals(item.productId));
//       const name = product?.title || "Unknown";
//       if (!productSalesMap[name]) productSalesMap[name] = { quantity: 0, revenue: 0 };
//       productSalesMap[name].quantity += item.quantity;
//       productSalesMap[name].revenue += item.unitPrice * item.quantity;
//     });
//     const topProducts = Object.entries(productSalesMap)
//       .map(([product, val]) => ({
//         product,
//         quantity: val.quantity,
//         revenue: val.revenue
//       }))
//       .sort((a, b) => b.revenue - a.revenue)
//       .slice(0, 5); // Top 5

//     // --- Trả kết quả ---
//     res.json({
//       success: true,
//       data: {
//         totalRevenue,
//         uniqueCustomers,      // số lượng unique
//         uniqueCustomerList,   // mảng các ID customer
//         productsShipped,
//         revenueByCategory,
//         topDestinations: revenueByDestination,
//         revenueOverTime,
//         topProducts
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// Báo cáo doanh số nâng cấp cho dashboard
exports.getSalesReport = async (req, res) => {
  try {
    const { period, from, to } = req.query; // week, month, year, from, to
    const sellerId = req.user.id;

    // 1. Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId }).populate("categoryId", "name");
    const productIds = products.map(p => p._id);

    // 2. Lấy tất cả order items liên quan (đã giao - shipped)
    const orderItems = await OrderItem.find({
      productId: { $in: productIds },
      status: "shipped"
    }).populate({
      path: "orderId",
      select: "orderDate buyerId addressId",
      populate: {
        path: "addressId",
        select: "city country",
      }
    });

    // 3. Lọc theo khoảng thời gian: ưu tiên from/to nếu có
    let filteredItems = orderItems;
    if (from || to) {
      // Nếu có from/to thì lọc theo khoảng ngày
      const fromDate = from ? new Date(from) : new Date(0);
      // Đặt toDate là cuối ngày nếu có to
      let toDate = to ? new Date(to) : new Date();
      if (to) {
        toDate.setHours(23, 59, 59, 999);
      }
      filteredItems = orderItems.filter(item => {
        if (!item.orderId) return false;
        const orderDate = new Date(item.orderId.orderDate);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    } else {
      // Nếu không có from/to thì lọc theo period như cũ
      const now = new Date();
      let startDate;
      switch (period) {
        case "week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // all time
      }
      filteredItems = orderItems.filter(item =>
        item.orderId && new Date(item.orderId.orderDate) >= startDate
      );
    }

    // --- Tổng quan ---
    const totalRevenue = filteredItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    // Lấy tất cả các buyerId duy nhất từ filteredItems
    const uniqueCustomerSet = new Set(
      filteredItems.map(i => i.orderId?.buyerId?.toString())
    );

    // Chuyển thành mảng
    const uniqueCustomerList = Array.from(uniqueCustomerSet);

    // Đếm số lượng
    const uniqueCustomers = uniqueCustomerList.length;


    const productsShipped = [...new Set(filteredItems.map(i => i.productId.toString()))].length;

    // --- Revenue by Category ---
    const categoryRevenueMap = {};
    filteredItems.forEach(item => {
      const product = products.find(p => p._id.equals(item.productId));
      const catName = product?.categoryId?.name || "Other";
categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + (item.unitPrice * item.quantity);
    });
    // Format for PieChart
    const revenueByCategory = Object.entries(categoryRevenueMap).map(([name, value]) => ({
      name,
      value: Number(((value / totalRevenue) * 100).toFixed(0)) // % phần trăm
    }));

    // --- Top Shipping Destinations ---
    const destinationMap = {};
    filteredItems.forEach(item => {
      const city = item.orderId?.addressId?.city || "Unknown";
      destinationMap[city] = (destinationMap[city] || 0) + (item.unitPrice * item.quantity);
    });
    const revenueByDestination = Object.entries(destinationMap)
      .map(([name, value]) => ({
        name,
        value: Number(((value / totalRevenue) * 100).toFixed(0)),
        raw: value
      }))
      .sort((a, b) => b.raw - a.raw)
      .map(({ raw, ...rest }) => rest);


    // --- Revenue Over Time ---
    const revenueByDate = {};
    filteredItems.forEach(item => {
      const dateStr = new Date(item.orderId.orderDate).toISOString().split('T')[0];
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + (item.unitPrice * item.quantity);
    });
    const revenueOverTime = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => new Date(a.date) - new Date(b.date));;

    // --- Top Products ---
    const productSalesMap = {};
    filteredItems.forEach(item => {
      const product = products.find(p => p._id.equals(item.productId));
      const name = product?.title || "Unknown";
      if (!productSalesMap[name]) productSalesMap[name] = { quantity: 0, revenue: 0 };
      productSalesMap[name].quantity += item.quantity;
      productSalesMap[name].revenue += item.unitPrice * item.quantity;
    });
    const topProducts = Object.entries(productSalesMap)
      .map(([product, val]) => ({
        product,
        quantity: val.quantity,
        revenue: val.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5

    // --- Trả kết quả ---
    res.json({
      success: true,
      data: {
        totalRevenue,
        uniqueCustomers,      // số lượng unique
        uniqueCustomerList,   // mảng các ID customer
        productsShipped,
        revenueByCategory,
        topDestinations: revenueByDestination,
        revenueOverTime,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy tất cả yêu cầu trả hàng liên quan tới seller hiện tại
exports.getReturnRequests = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id }, '_id');
    const productIds = products.map(p => p._id);

    // Lấy orderItems của các sản phẩm này
    const orderItems = await OrderItem.find({ productId: { $in: productIds } }, '_id');
    const orderItemIds = orderItems.map(oi => oi._id);

    // Lấy returnRequest liên quan
    const returnRequests = await ReturnRequest.find({ orderItemId: { $in: orderItemIds } })
      .populate({
        path: 'orderItemId',
        populate: [
          { path: 'productId', select: 'title image' },
          { path: 'orderId' }
        ]
      })
      .populate({ path: 'userId', select: 'username fullname' })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returnRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái yêu cầu trả hàng (approved/rejected/completed)
exports.updateReturnRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const returnRequest = await ReturnRequest.findById(req.params.id)
      .populate({
        path: 'orderItemId',
        populate: { path: 'productId' }
      });

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    // Check quyền: chỉ seller của product mới được cập nhật
    const product = returnRequest.orderItemId.productId;
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    returnRequest.status = status;
    await returnRequest.save();

    res.json({ success: true, data: returnRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getDisputes = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm của seller
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p._id);

    // Tìm tất cả orderItems thuộc về các sản phẩm này
    const orderItems = await OrderItem.find({ productId: { $in: productIds } }, '_id');
    const orderItemIds = orderItems.map(item => item._id);

    // Lấy các Dispute liên quan đến các orderItem của seller
    const disputes = await Dispute.find({ orderItemId: { $in: orderItemIds } })
      .populate('raisedBy', 'username fullname')
      .populate({
        path: 'orderItemId',
        populate: [
          {
            path: 'productId',
            select: 'title image',
          },
          {
            path: 'orderId',
            // Để lấy thông tin order nếu cần
          },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, status } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    // Lấy orderItem qua dispute.orderItemId
    const orderItem = await OrderItem.findById(dispute.orderItemId);
    if (!orderItem) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    // Lấy product để kiểm tra seller có quyền xử lý
    const product = await Product.findById(orderItem.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    dispute.resolution = resolution;
    dispute.status = status;
    await dispute.save();

    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    // 1. Lấy tất cả sản phẩm của seller này
    const products = await Product.find({ sellerId: req.user.id }, "_id");
    const productIds = products.map(p => p._id);

    // 2. Lấy các đơn hàng theo thứ tự mới nhất trước
    const orders = await Order.find()
      .sort({ createdAt: -1, orderDate: -1 }) // Sắp xếp theo thứ tự mới nhất
      .lean();
      
    const orderIds = orders.map(order => order._id);

    // 3. Lấy các OrderItem thuộc về seller và các đơn hàng đã sắp xếp
    const orderItems = await OrderItem.find({
      productId: { $in: productIds },
      orderId: { $in: orderIds }
      // status: { $in: ["shipped"] }
    })
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "username email fullname" },
          { path: "addressId" }
        ]
      })
      .populate({
        path: "productId",
        select: "title image categoryId",
        populate: { path: "categoryId", select: "name" }
      })
      .lean();

    // 4. Lấy ShippingInfo theo orderItemId
    const orderItemIds = orderItems.map(x => x._id);
    const shippingInfos = await ShippingInfo.find({ orderItemId: { $in: orderItemIds } }).lean();

    // 5. Gán ShippingInfo vào từng OrderItem
    const shippingMap = {};
    shippingInfos.forEach(info => {
      shippingMap[info.orderItemId.toString()] = info;
    });

    const result = orderItems.map(item => ({
      ...item,
      shippingInfo: shippingMap[item._id.toString()] || null
    }));

    // 6. Sắp xếp kết quả theo thứ tự các đơn hàng
    const orderIdToIndex = {};
    orderIds.forEach((id, index) => {
      orderIdToIndex[id.toString()] = index;
    });
    
    result.sort((a, b) => {
      const indexA = orderIdToIndex[a.orderId._id.toString()] || 0;
      const indexB = orderIdToIndex[b.orderId._id.toString()] || 0;
      return indexA - indexB;
    });

    // 7. Trả về kết quả
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Thêm vào sellerController.js
exports.replyToReview = async (req, res) => {
  try {
    const { comment } = req.body;
    const { productId, reviewId } = req.params;

    // Kiểm tra seller sở hữu sản phẩm này không
    const product = await Product.findById(productId);
    if (!product || product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Kiểm tra review gốc tồn tại
    const parentReview = await Review.findById(reviewId);
    if (!parentReview || parentReview.productId.toString() !== productId) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Chỉ cho phép seller trả lời 1 lần (nếu muốn)
    const existedReply = await Review.findOne({ parentId: reviewId, reviewerId: req.user.id });
    if (existedReply) {
      return res.status(400).json({ success: false, message: "Already replied" });
    }

    // Tạo reply
    const reply = new Review({
      productId,
      reviewerId: req.user.id,
      comment,
      parentId: reviewId
      // Không cần rating
    });

    await reply.save();

    res.status(201).json({ success: true, data: reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái của orderItem (shipping/rejected)
exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const { status } = req.body;
    
    // Kiểm tra status hợp lệ
    const validStatuses = ["shipping", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Status must be 'shipping' or 'rejected'"
      });
    }
    
    // Tìm orderItem
    const orderItem = await OrderItem.findById(orderItemId);
    if (!orderItem) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }
    
    // Kiểm tra xem order item đã ở trạng thái shipped chưa
    if (orderItem.status === "shipped") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot update status. Order item has already been shipped." 
      });
    }
    
    // Kiểm tra sản phẩm thuộc seller hiện tại
    const product = await Product.findById(orderItem.productId);
    if (!product || product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    
    // Cập nhật trạng thái orderItem
    orderItem.status = status;
    await orderItem.save();
    
    // Nếu status là shipping, tạo ShippingInfo mới
    let shippingInfo = null;
    if (status === "shipping") {
      // Kiểm tra xem đã có shipping info chưa
      const existingShippingInfo = await ShippingInfo.findOne({ orderItemId });
      
      if (existingShippingInfo) {
        // Cập nhật shipping info hiện có
        existingShippingInfo.status = "shipping";
        await existingShippingInfo.save();
        shippingInfo = existingShippingInfo;
      } else {
        // Tạo shipping info mới với tracking number ngẫu nhiên
        shippingInfo = new ShippingInfo({
          orderItemId,
          trackingNumber: `TRK-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          status: "shipping"
        });
        await shippingInfo.save();
      }
    }
    
    // Trả về kết quả với orderItem đã cập nhật và shipping info (nếu có)
    res.json({ 
      success: true, 
      data: { 
        orderItem,
        shippingInfo 
      },
      message: `Order item status updated to ${status}`
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getShippingInfo = async (req, res) => {
  try {
    // 1. Get all products from the seller
    const products = await Product.find({ sellerId: req.user.id }, "_id");
    const productIds = products.map(p => p._id);

    // 2. Get all OrderItems for these products
    const orderItems = await OrderItem.find({ productId: { $in: productIds } })
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "username email fullname" },
          { path: "addressId" }
        ]
      })
      .populate({
        path: "productId",
        select: "title image categoryId",
        populate: { path: "categoryId", select: "name" }
      });
    
    const orderItemIds = orderItems.map(item => item._id);

    // 3. Get all shipping info for these OrderItems
    const shippingInfos = await ShippingInfo.find({ orderItemId: { $in: orderItemIds } });
    
    // 4. Create a map for easy access
    const shippingInfoMap = {};
    shippingInfos.forEach(info => {
      shippingInfoMap[info.orderItemId.toString()] = info;
    });

    // 5. Create the result combining OrderItems and ShippingInfo
    const result = orderItems.map(item => ({
      orderItem: item,
      shippingInfo: shippingInfoMap[item._id.toString()] || null
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateShippingStatus = async (req, res) => {
  try {
    const { shippingInfoId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validShippingStatuses = ["shipping", "shipped", "failed to ship"];
    if (!validShippingStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid shipping status. Status must be 'shipping', 'shipped', or 'failed to ship'"
      });
    }
    
    // Find shipping info
    const shippingInfo = await ShippingInfo.findById(shippingInfoId);
    if (!shippingInfo) {
      return res.status(404).json({ success: false, message: "Shipping info not found" });
    }
    
    // Find the related order item
    const orderItem = await OrderItem.findById(shippingInfo.orderItemId);
    if (!orderItem) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }
    
    // Kiểm tra xem order item đã ở trạng thái shipped chưa
    if (orderItem.status === "shipped") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot update status. Order item has already been shipped." 
      });
    }
    
    // Verify seller owns the product
    const product = await Product.findById(orderItem.productId);
    if (!product || product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    
    // Update shipping info status
    shippingInfo.status = status;
    await shippingInfo.save();
    
    // Update corresponding OrderItem status
    let orderItemStatus;
    switch(status) {
      case "shipped":
        orderItemStatus = "shipped";
        break;
      case "shipping":
        orderItemStatus = "shipping";
        break;
      case "failed to ship":
        orderItemStatus = "failed to ship";
        break;
      default:
        orderItemStatus = orderItem.status; // Keep current status if no mapping
    }
    
    orderItem.status = orderItemStatus;
    await orderItem.save();
    
    res.json({
      success: true,
      data: {
        shippingInfo,
        orderItem
      },
      message: `Shipping status updated to ${status} and order item status updated to ${orderItemStatus}`
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin thanh toán của đơn hàng
exports.getOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Kiểm tra đơn hàng có sản phẩm của seller
    const orderItems = await OrderItem.find({ orderId })
      .populate({
        path: 'productId',
        select: 'sellerId'
      });

    const sellerItems = orderItems.filter(item =>
      item.productId.sellerId.toString() === req.user.id
    );

    if (sellerItems.length === 0) {
      return res.status(404).json({ success: false, message: "No items found for this seller" });
    }

    // Lấy thông tin thanh toán
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment information not found" });
    }

    // Lấy thông tin đơn hàng
    const order = await Order.findById(orderId);

    res.json({
      success: true,
      data: {
        payment: {
          id: payment._id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt,
          transactionId: payment.transactionId
        },
        order: {
          id: order._id,
          totalPrice: order.totalPrice,
          status: order.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái thanh toán
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    
    // Kiểm tra status hợp lệ
    const validStatuses = ["paid", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Status must be 'paid' or 'failed'"
      });
    }
    
    // Tìm payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    
    // Nếu thanh toán đã là paid thì không thể thay đổi trạng thái
    if (payment.status === "paid") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot change status of a paid payment" 
      });
    }

    // Kiểm tra đơn hàng có sản phẩm của seller
    const orderItems = await OrderItem.find({ orderId: payment.orderId })
      .populate({
        path: 'productId',
        select: 'sellerId'
      });

    const sellerItems = orderItems.filter(item =>
      item.productId.sellerId.toString() === req.user.id
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({ success: false, message: "Not authorized to update this payment" });
    }
    
    // Cập nhật trạng thái thanh toán
    payment.status = status;
    
    // Nếu status là paid, thêm thời gian thanh toán
    if (status === "paid") {
      payment.paidAt = new Date();
    }
    
    await payment.save();
    
    // Nếu payment status là paid, KHÔNG cập nhật order status
    // vì "paid" không phải là giá trị hợp lệ trong enum của Order.status
    // Trong model Order, status chỉ có thể là: ["pending", "shipping", "shipped", "failed to ship", "rejected"]
    // Thay vào đó, chỉ cập nhật các OrderItems có thể chuyển sang "shipping" nếu đang ở trạng thái "pending"
    if (status === "paid") {
      // Cập nhật trạng thái các OrderItem sang shipping nếu đang ở trạng thái pending
      await Promise.all(sellerItems.map(async (item) => {
        if (item.status === "pending") {
          item.status = "shipping";
          await item.save();
        }
      }));
    }
    
    res.json({ 
      success: true, 
      data: payment,
      message: `Payment status updated to ${status}`
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};