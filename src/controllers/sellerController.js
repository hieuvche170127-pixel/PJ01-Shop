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

const lifecycle = require('../services/orderLifecycle');

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
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.action === 'lock') return res.status(403).json({ success: false, message: 'Account is locked' });

    // Kiểm tra role
    if (user.role !== "seller") {
      return res.status(403).json({ success: false, message: "User is not a seller" });
    }

    // Generate JWT token
    const payload = {
      id: user._id,
      username: user.username,
      ver: user.tokenVersion || 0,
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
  try { const data = await require('../services/productManagement').create(req.user.id, req.body); res.status(201).json({success:true,data}); } catch(e) { require('../utils/apiError').respondError(res,e); }
};

// Quản lý danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({sellerId:req.user.id}).populate('categoryId','name');
    const stock = await Inventory.find({productId:{$in:products.map(p=>p._id)}}).lean();
    const byId = new Map(stock.map(i=>[String(i.productId),i]));
    res.json({success:true,data:products.map(product=>({...byId.get(String(product._id)),productId:product,quantity:byId.get(String(product._id))?.quantity??0,inventoryMissing:!byId.has(String(product._id))}))});
  } catch(e) { require('../utils/apiError').respondError(res,e); }
};
// Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
  try {
    require('../utils/apiError').requireId(req.params.id);
    const product=await Product.findOne({_id:req.params.id,sellerId:req.user.id}).populate('categoryId','name');
    if(!product) return res.status(404).json({success:false,message:'Không tìm thấy sản phẩm của shop.'});
    const inventory=await Inventory.findOne({productId:product._id});
    res.json({success:true,data:{product,inventory:inventory||{quantity:0},inventoryMissing:!inventory,categoryName:product.categoryId?.name||null}});
  }catch(e){require('../utils/apiError').respondError(res,e);}
};
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { id } = req.params; // id là productId
    require('../utils/apiError').requireId(id);
    if(!await Product.exists({_id:id,sellerId:req.user.id})) return res.status(404).json({success:false,message:'Không tìm thấy sản phẩm của shop.'});

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
  try { const data = await require('../services/productManagement').update(req.user.id, req.params.id, req.body); res.json({success:true,data}); } catch(e) { require('../utils/apiError').respondError(res,e); }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (await OrderItem.exists({ productId: req.params.id })) return res.status(409).json({ success: false, message: 'Sản phẩm có lịch sử đơn. Hãy tắt bán thay vì xóa.' });
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
    require('../utils/apiError').requireId(req.params.productId);
    await require('../services/productManagement').approvedShop(req.user.id);
    const { quantity } = req.body;
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Tồn kho phải là số nguyên không âm.' });
    }

    // Kiểm tra sản phẩm thuộc về seller
    const product = await Product.findOne({
      _id: req.params.productId,
      sellerId: req.user.id
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { productId: req.params.productId, 'checkoutReservations.0': { $exists: false } },
      { $set: { quantity, lastUpdated: new Date() } },
      { new: true, runValidators: true }
    );
    if (!inventory) return res.status(409).json({ success: false, message: 'Kho đang xử lý đơn hoặc chưa tồn tại. Vui lòng thử lại.' });

    res.json({ success: true, data: inventory });
  } catch (error) {
    require('../utils/apiError').respondError(res, error);
  }
};

// Xác nhận đơn hàng và in phiếu vận chuyển
exports.confirmOrder = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).select('_id');
    const items = await OrderItem.find({ orderId: req.params.orderId, productId: { $in: products.map(p => p._id) } });
    if (!items.length) return res.status(404).json({ success: false, message: 'No items found' });
    const data = [];
    for (const item of items) data.push(await lifecycle.transition(String(item._id), req.user, 'shipping'));
    return res.json({ success: true, data });
  } catch (error) { return lifecycle.respondError(res, error); }
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
exports.getSalesReport = async (req, res) => {
  try { res.json({ success: true, data: await require('../services/salesReport').report(req.user.id, req.query) }); }
  catch (error) { require('../utils/apiError').respondError(res, error); }
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
  try { return res.json({ success: true, data: await lifecycle.transition(req.params.orderItemId, req.user, req.body.status, req.body.returnedToStock) }); }
  catch (error) { return lifecycle.respondError(res, error); }
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
    if (!require('mongoose').isObjectIdOrHexString(req.params.shippingInfoId)) return res.status(400).json({ message: 'Invalid shipping ID' });
    const shipping = await ShippingInfo.findById(req.params.shippingInfoId);
    if (!shipping) return res.status(404).json({ message: 'Shipping info not found' });
    return res.json({ success: true, data: await lifecycle.transition(String(shipping.orderItemId), req.user, req.body.status, req.body.returnedToStock) });
  } catch (error) { return lifecycle.respondError(res, error); }
};

// Lấy thông tin thanh toán của đơn hàng
exports.getOrderPayment = async (req, res) => {
  try {
    const value = await lifecycle.sellerSummary(req.params.orderId, req.user.id);
    const p = value.payment, o = value.order;
    return res.json({ success: true, data: {
      payment: { id: p._id, amount: p.amount, method: p.method, status: p.status, paidAt: p.paidAt, transactionId: p.transactionId },
      order: { id: o._id, totalPrice: o.totalPrice, status: o.status },
      sellerAmount: value.sellerAmount, sellerCollected: value.sellerCollected, canCollectCOD: value.canCollectCOD,
    } });
  } catch (error) { return lifecycle.respondError(res, error); }
};

// Cập nhật trạng thái thanh toán
exports.updatePaymentStatus = async (req, res) => {
  try { return res.json({ success: true, data: await lifecycle.collectCOD(req.params.paymentId, req.user.id, req.body.status) }); }
  catch (error) { return lifecycle.respondError(res, error); }
};
