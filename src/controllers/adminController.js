const {
  User,
  Store,
  Category,
  Product,
  Order,
  OrderItem,
  Dispute,
  Coupon,
  Feedback,
  Review,
  Address,
  Bid,
  Inventory,
  Message,
  Payment,
  ReturnRequest,
  ShippingInfo,
} = require("../models");
const { sendEmail } = require("../utils/email");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// --- Hàm Hỗ Trợ Xử Lý Lỗi (Helper Function for Error Responses) ---
// Hàm này giúp chuẩn hóa việc xử lý và phản hồi lỗi.
const handleError = (res, error, message = "Lỗi Máy Chủ", statusCode = 500) => {
  logger.error(`${message}: `, error); // Ghi log lỗi chi tiết
  // Trả về phản hồi JSON với mã trạng thái và thông báo lỗi.
  res
    .status(statusCode)
    .json({ success: false, message, error: error.message });
};

// --- Quản Lý Người Dùng (User Management) ---

/**
 * @desc Lấy tất cả người dùng với phân trang và lọc
 * @route GET /api/admin/users?page=<page>&limit=<limit>
 * @access Riêng tư (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};

    // Filter by search
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by action
    if (req.query.action) {
      query.action = req.query.action;
    }

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit);
    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách người dùng");
  }
};

/**
 * @desc Lấy chi tiết một người dùng bằng ID
 * @route GET /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết người dùng");
  }
};
/**
 * @desc Xóa một người dùng bởi Admin
 * @route DELETE /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.deleteUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    await User.findByIdAndDelete(userId);
    res
      .status(200)
      .json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa người dùng");
  }
};
/**
 * @desc Cập nhật chi tiết người dùng (vai trò, trạng thái khóa/mở khóa) bởi Admin
 * @route PUT /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.updateUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const { role, action, username, email } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    const previousAction = user.action; // Lưu trạng thái trước để kiểm tra thay đổi

    if (username) user.username = username;
    if (email) user.email = email;
    if (role && ["buyer", "seller", "admin"].includes(role)) {
      user.role = role;
    }
    if (action && ["lock", "unlock"].includes(action)) {
      user.action = action;
      // Nếu lock seller, reject store nếu tồn tại
      if (action === "lock" && user.role === "seller") {
        const store = await Store.findOne({ sellerId: user._id });
        if (store) {
          store.status = "rejected";
          await store.save();
          // Gửi email thông báo store bị rejected
          await sendEmail(
            user.email,
            "Cửa hàng của bạn đã bị từ chối",
            `Kính gửi ${user.username},\n\nCửa hàng của bạn (${store.storeName}) đã bị từ chối do tài khoản của bạn bị khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.\n\nTrân trọng,\nShopii Team`
          );
        }
      }
    }

    // Gửi email nếu action thay đổi
    if (action && action !== previousAction) {
      const emailSubject =
        action === "lock"
          ? "Tài khoản của bạn đã bị khóa"
          : "Tài khoản của bạn đã được mở khóa";
      const emailText =
        action === "lock"
          ? `Kính gửi ${user.username},\n\nTài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.\n\nTrân trọng,\nShopii Team`
          : `Kính gửi ${user.username},\n\nTài khoản của bạn đã được mở khóa. Bạn có thể tiếp tục sử dụng dịch vụ của chúng tôi.\n\nTrân trọng,\nShopii Team`;
      await sendEmail(user.email, emailSubject, emailText);
    }

    await user.save();
    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: userToReturn,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return handleError(res, error, "Email đã được sử dụng.", 400);
    }
    handleError(res, error, "Lỗi khi cập nhật người dùng");
  }
};
// --- Quản Lý Cửa Hàng (Store Management) ---

/**
 * @desc Lấy tất cả cửa hàng (có thể lọc theo trạng thái, hỗ trợ pagination và tùy chọn tính rating từ Feedback)
 * @route GET /api/admin/stores
 * @query withRatings=true để bao gồm rating
 * @access Riêng tư (Admin)
 */
exports.getAllStoresAdmin = async (req, res) => {
  const { status, page = 1, limit = 10, withRatings = false } = req.query;
  try {
    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    let stores = await Store.find(query)
      .populate("sellerId", "username email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Store.countDocuments(query);

    if (withRatings === "true") {
      // Thêm rating từ Feedback cho từng store
      stores = await Promise.all(
        stores.map(async (store) => {
          const storeObj = store.toObject(); // Chuyển sang object để thêm field

          // Lấy feedback của seller
          const feedback = await Feedback.findOne({ sellerId: store.sellerId });

          storeObj.averageRating = feedback ? feedback.averageRating : 0;
          storeObj.totalReviews = feedback ? feedback.totalReviews : 0;

          return storeObj;
        })
      );
    }

    res.status(200).json({
      success: true,
      count: stores.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: stores,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách cửa hàng");
  }
};

/**
 * @desc Lấy chi tiết một cửa hàng bằng ID
 * @route GET /api/admin/stores/:storeId
 * @access Riêng tư (Admin)
 */
exports.getStoreDetails = async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId).populate(
      "sellerId",
      "username email"
    );
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết cửa hàng");
  }
};

/**
 * @desc Cập nhật trạng thái cửa hàng (duyệt, từ chối)
 * @route PUT /api/admin/stores/:storeId/status
 * @access Riêng tư (Admin)
 */
exports.updateStoreStatusByAdmin = async (req, res) => {
  const { storeId } = req.params;
  const { status } = req.body;

  if (!status || !["approved", "pending", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message:
        'Trạng thái không hợp lệ. Phải là "approved", "pending" hoặc "rejected".',
    });
  }

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }

    const previousStatus = store.status; // Lưu trạng thái trước để kiểm tra thay đổi

    if (status === "approved" && store.sellerId) {
      const seller = await User.findById(store.sellerId);
      if (!seller) {
        return res
          .status(404)
          .json({ success: false, message: "Người dùng không tồn tại" });
      }
      if (seller.action === "lock") {
        return res.status(400).json({
          success: false,
          message: "Không thể duyệt cửa hàng khi người dùng bị khóa",
        });
      }
      if (seller.role === "buyer") {
        seller.role = "seller";
        await seller.save();
      }
    }

    store.status = status;
    await store.save();

    // Gửi email nếu status thay đổi
    if (status !== previousStatus) {
      const seller = await User.findById(store.sellerId);
      if (seller) {
        let emailSubject, emailText;
        switch (status) {
          case "approved":
            emailSubject = "Cửa hàng của bạn đã được duyệt";
            emailText = `Kính gửi ${seller.username},\n\nCửa hàng của bạn (${store.storeName}) đã được duyệt thành công. Bạn có thể bắt đầu bán hàng ngay bây giờ!\n\nTrân trọng,\nShopii Team`;
            break;
          case "rejected":
            emailSubject = "Cửa hàng của bạn đã bị từ chối";
            emailText = `Kính gửi ${seller.username},\n\nCửa hàng của bạn (${store.storeName}) đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.\n\nTrân trọng,\nShopii Team`;
            break;
          case "pending":
            emailSubject = "Cửa hàng của bạn đang chờ duyệt";
            emailText = `Kính gửi ${seller.username},\n\nCửa hàng của bạn (${store.storeName}) hiện đang trong trạng thái chờ duyệt. Chúng tôi sẽ thông báo khi có cập nhật mới.\n\nTrân trọng,\nShopii Team`;
            break;
        }
        await sendEmail(seller.email, emailSubject, emailText);
      }
    }

    res.status(200).json({
      success: true,
      message: `Cửa hàng đã được ${
        status === "approved"
          ? "duyệt"
          : status === "rejected"
          ? "từ chối"
          : "chuyển sang chờ duyệt"
      } thành công`,
      data: store,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật trạng thái cửa hàng");
  }
};
/**
 * @desc Cập nhật toàn bộ thông tin cửa hàng
 * @route PUT /api/admin/stores/:storeId
 * @access Riêng tư (Admin)
 */
exports.updateStoreByAdmin = async (req, res) => {
  const { storeId } = req.params;
  const {
    storeName,
    description,
    bannerImageURL,
    status,
    address,
    contactInfo,
  } = req.body;

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }

    if (storeName) store.storeName = storeName;
    if (description) store.description = description;
    if (bannerImageURL) store.bannerImageURL = bannerImageURL;
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      if (status === "approved" && store.sellerId) {
        const seller = await User.findById(store.sellerId);
        if (seller && seller.role === "user") {
          seller.role = "seller";
          await seller.save();
        }
      }
      store.status = status;
    }
    if (address) store.address = address;
    if (contactInfo) store.contactInfo = contactInfo;

    await store.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật cửa hàng thành công",
      data: store,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật cửa hàng");
  }
};
// --- Quản Lý Sản Phẩm (Product Management) ---

/**
 * @desc Lấy tất cả sản phẩm (có thể lọc theo sellerId, categoryId, status, hỗ trợ phân trang)
 * @route GET /api/admin/products
 * @access Riêng tư (Admin)
 */
exports.getAllProductsAdmin = async (req, res) => {
  const { sellerId, categoryId, status, page = 1, limit = 10 } = req.query;
  try {
    const query = {};
    if (sellerId) query.sellerId = sellerId;
    if (categoryId) query.categoryId = categoryId;
    if (status && ["available", "out_of_stock", "pending"].includes(status)) {
      // Điều chỉnh enum dựa trên DB mới
      query.status = status;
    }
    const products = await Product.find(query)
      .populate("sellerId", "username email")
      .populate("categoryId", "name")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Product.countDocuments(query);
    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách sản phẩm");
  }
};

/**
 * @desc Lấy chi tiết một sản phẩm bằng ID
 * @route GET /api/admin/products/:id
 * @access Riêng tư (Admin)
 */
exports.getProductDetailsAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("sellerId", "username email")
      .populate("categoryId", "name");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết sản phẩm");
  }
};

/**
 * @desc Cập nhật trạng thái sản phẩm
 * @route PUT /api/admin/products/:id/status
 * @access Riêng tư (Admin)
 */
exports.updateProductStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, isAuction, status } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    // Update product fields if provided
    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (isAuction !== undefined) product.isAuction = isAuction;
    
    // Only update status if it's provided and valid
    if (status && ["available", "out_of_stock", "pending"].includes(status)) {
      product.status = status;
    }

    await product.save();
    
    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được cập nhật thành công",
      data: product,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật sản phẩm");
  }
};

/**
 * @desc Xóa sản phẩm vi phạm
 * @route DELETE /api/admin/products/:id
 * @access Riêng tư (Admin)
 */
exports.deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    // Có thể thêm logic xóa liên quan như reviews, inventory, etc. nếu cần
    res.status(200).json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa sản phẩm");
  }
};

/**
 * @desc Đếm và phân tích số lượng sản phẩm theo store (sellerId) hoặc trạng thái
 * @route GET /api/admin/products/stats
 * @access Riêng tư (Admin)
 */
exports.getProductStatsAdmin = async (req, res) => {
  try {
    const statsByStore = await Product.aggregate([
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "sellerId",
          as: "store",
        },
      },
      { $unwind: "$store" },
      { $project: { storeName: "$store.storeName", count: 1 } },
    ]);

    const statsByStatus = await Product.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      statsByStore,
      statsByStatus,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy thống kê sản phẩm");
  }
};

/**
 * @desc Lấy tất cả đánh giá (lọc theo productId, reviewerId, hoặc storeId, hỗ trợ phân trang)
 * @route GET /api/admin/reviews
 * @access Riêng tư (Admin)
 */
exports.getAllReviewsAdmin = async (req, res) => {
  const { productId, reviewerId, storeId, page = 1, limit = 10 } = req.query;
  try {
    let match = {};
    if (productId) match.productId = new mongoose.Types.ObjectId(productId);
    if (reviewerId) match.reviewerId = new mongoose.Types.ObjectId(reviewerId);
    if (storeId) {
      // Lọc theo storeId: review -> product -> sellerId (store.sellerId == storeId)
      const seller = await Store.findById(storeId).select("sellerId");
      if (!seller)
        return res
          .status(404)
          .json({ success: false, message: "Cửa hàng không tồn tại" });
      const products = await Product.find({ sellerId: seller.sellerId }).select(
        "_id"
      );
      match.productId = { $in: products.map((p) => p._id) };
    }

    const reviews = await Review.aggregate([
      { $match: match },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "users",
          localField: "reviewerId",
          foreignField: "_id",
          as: "reviewer",
        },
      },
      { $unwind: "$reviewer" },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          "product.title": 1,
          "reviewer.username": 1,
        },
      },
    ]);

    const total = await Review.countDocuments(match);

    res.status(200).json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách đánh giá");
  }
};
/**
 * @desc Xóa đánh giá không hợp lệ
 * @route DELETE /api/admin/reviews/:id
 * @access Riêng tư (Admin)
 */
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Đánh giá không tồn tại" });
    }
    // Có thể cập nhật lại feedback của seller nếu cần
    res.status(200).json({ success: true, message: "Xóa đánh giá thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa đánh giá");
  }
};

/**
 * @desc Lấy tất cả đánh giá của một sản phẩm và tính trung bình rating, tổng lượt review
 * @route GET /api/admin/products/:id/reviews
 * @access Công khai hoặc Riêng tư tùy theo yêu cầu (ở đây giả sử Admin hoặc công khai)
 */
exports.getProductReviewsAndStats = async (req, res) => {
  const { id } = req.params;
  console.info(`Starting getProductReviewsAndStats for product ID: ${id}`);

  try {
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      console.warn(`Product not found for ID: ${id}`);
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    console.info(`Product found for ID: ${id}`);

    // Lấy tất cả reviews của sản phẩm
    const reviews = await Review.find({ productId: id })
      .populate("reviewerId", "username fullname")
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

    // Tính toán trung bình rating và tổng lượt review sử dụng aggregation
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    res.status(200).json({
      success: true,
      averageRating: averageRating.toFixed(1), // Làm tròn 1 chữ số thập phân
      totalReviews,
      data: reviews,
    });
  } catch (error) {
    console.error(
      `Error in getProductReviewsAndStats for product ID: ${id}: ${error.message}`
    );
    handleError(res, error, "Lỗi khi lấy đánh giá sản phẩm");
  }
};

// // --- Quản Lý Danh Mục (Category Management) ---

// /**
//  * @desc Tạo một danh mục mới
//  * @route POST /api/admin/categories
//  * @access Riêng tư (Admin)
//  */
// exports.createCategoryAdmin = async (req, res) => {
//   const { name } = req.body; // Lấy tên danh mục từ request body
//   if (!name) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Tên danh mục là bắt buộc" });
//   }
//   try {
//     // Kiểm tra xem danh mục đã tồn tại chưa (dựa trên trường 'name' là unique)
//     const existingCategory = await Category.findOne({ name });
//     if (existingCategory) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Danh mục với tên này đã tồn tại" });
//     }
//     const category = await Category.create({ name }); // Tạo danh mục mới
//     res.status(201).json({
//       success: true,
//       message: "Tạo danh mục thành công",
//       data: category,
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi tạo danh mục");
//   }
// };

// /**
//  * @desc Lấy tất cả danh mục
//  * @route GET /api/admin/categories
//  * @access Riêng tư (Admin) hoặc Công khai (tùy theo yêu cầu)
//  */
// exports.getCategoriesAdmin = async (req, res) => {
//   try {
//     const categories = await Category.find(); // Lấy tất cả danh mục
//     res
//       .status(200)
//       .json({ success: true, count: categories.length, data: categories });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy danh sách danh mục");
//   }
// };

// /**
//  * @desc Cập nhật một danh mục
//  * @route PUT /api/admin/categories/:categoryId
//  * @access Riêng tư (Admin)
//  */
// exports.updateCategoryAdmin = async (req, res) => {
//   const { categoryId } = req.params; // Lấy ID danh mục
//   const { name } = req.body; // Lấy tên mới
//   if (!name) {
//     return res.status(400).json({
//       success: false,
//       message: "Tên danh mục là bắt buộc để cập nhật",
//     });
//   }
//   try {
//     // Tìm và cập nhật danh mục, trả về bản ghi mới (new: true), chạy validators (runValidators: true)
//     const category = await Category.findByIdAndUpdate(
//       categoryId,
//       { name },
//       { new: true, runValidators: true }
//     );
//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Danh mục không tồn tại" });
//     }
//     res.status(200).json({
//       success: true,
//       message: "Cập nhật danh mục thành công",
//       data: category,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       // Xử lý lỗi trùng tên
//       return handleError(res, error, "Danh mục với tên này đã tồn tại.", 400);
//     }
//     handleError(res, error, "Lỗi khi cập nhật danh mục");
//   }
// };

// /**
//  * @desc Xóa một danh mục
//  * @route DELETE /api/admin/categories/:categoryId
//  * @access Riêng tư (Admin)
//  */
// exports.deleteCategoryAdmin = async (req, res) => {
//   const { categoryId } = req.params;
//   try {
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Danh mục không tồn tại" });
//     }
//     // TODO: Cân nhắc điều gì xảy ra với các sản phẩm thuộc danh mục này.
//     // Option 1: Không cho phép xóa nếu có sản phẩm tồn tại. (Đã triển khai)
//     // Option 2: Đặt category của sản phẩm thành null hoặc một danh mục mặc định.
//     // Option 3: Xóa luôn các sản phẩm đó (nguy hiểm).
//     const productsInCategory = await Product.countDocuments({
//       categoryId: categoryId,
//     });
//     if (productsInCategory > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Không thể xóa danh mục. Có ${productsInCategory} sản phẩm đang liên kết với danh mục này.`,
//       });
//     }

//     await Category.findByIdAndDelete(categoryId); // Xóa danh mục
//     res.status(200).json({ success: true, message: "Xóa danh mục thành công" });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi xóa danh mục");
//   }
// };

exports.getAdminReport = async (req, res) => {
  const { period } = req.query;
  try {
    // Date filter setup
    let dateFilter = {};
    const now = new Date();
    let startDate = null;

    if (period === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    if (startDate) {
      dateFilter = { createdAt: { $gte: startDate } };
    }

    // Get active seller/buyer IDs from orders
    const activeBuyerIds = await Order.distinct("buyerId", dateFilter);
    const activeSellerIdsAgg = await OrderItem.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.sellerId",
        },
      },
    ]);

    const activeSellerIds = activeSellerIdsAgg.map((s) => s._id);

    const [
      orderStats,
      totalUsers,
      topSellers,
      totalProducts,
      newProducts,
      totalRevenueStats,
      uniqueCustomersStats,
      productsShippedStats,
      ratingStats,
      topRatedProducts,
      lowStockProducts,
      outOfStockProducts,
      returnRequestsCount,
      disputesCount,
      revenueOverTime,
      orderOverTime,
      revenueByCategory,
      topProducts,
      recentActivity,
      activeSellers,
      activeBuyers,
    ] = await Promise.all([
      // Order status stats
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]),
      User.countDocuments({}),
      // Top sellers by revenue
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.sellerId",
            totalRevenue: { $sum: "$totalPrice" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $unwind: "$seller" },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            seller: "$seller.username",
            totalRevenue: 1,
            orderCount: 1,
            _id: 0,
          },
        },
      ]),
      Product.countDocuments({}),
      Product.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Order.aggregate([
        { $match: { ...dateFilter, status: { $in: ["shipped"] } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$buyerId" } },
        { $count: "uniqueCustomers" },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "orderitems",
            localField: "_id",
            foreignField: "orderId",
            as: "items",
          },
        },
        { $unwind: "$items" },
        { $group: { _id: null, productsShipped: { $sum: "$items.quantity" } } },
      ]),
      Review.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      Review.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$productId", avgRating: { $avg: "$rating" } } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $sort: { avgRating: -1 } },
        { $limit: 5 },
        {
          $project: {
            product: "$product.title",
            avgRating: { $toDouble: { $round: ["$avgRating", 1] } },
            _id: 0,
          },
        },
      ]),
      Inventory.aggregate([
        { $match: { quantity: { $lt: 20, $gt: 0 } } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $project: { product: "$product.title", quantity: 1, _id: 0 } },
      ]),
      Inventory.aggregate([
        { $match: { quantity: 0 } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $project: { product: "$product.title", quantity: 1, _id: 0 } },
      ]),
      ReturnRequest.countDocuments(dateFilter),
      Dispute.countDocuments({ ...dateFilter, status: "open" }),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", revenue: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", orders: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "orderitems",
            localField: "_id",
            foreignField: "orderId",
            as: "items",
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.categoryId",
            value: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        { $project: { name: "$category.name", value: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "orderitems",
            localField: "_id",
            foreignField: "orderId",
            as: "items",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            product: "$product.title",
            quantity: 1,
            revenue: 1,
            _id: 0,
          },
        },
      ]),
      Promise.all([
        User.find(dateFilter)
          .select("username createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .then((docs) =>
            docs.map((d) => ({
              type: "New User",
              details: d.username,
              createdAt: d.createdAt,
            }))
          ),
        Order.find(dateFilter)
          .select("totalPrice createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .then((docs) =>
            docs.map((d) => ({
              type: "New Order",
              details: `Total: ${d.totalPrice}`,
              createdAt: d.createdAt,
            }))
          ),
        Product.find(dateFilter)
          .select("title createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .then((docs) =>
            docs.map((d) => ({
              type: "New Product",
              details: d.title,
              createdAt: d.createdAt,
            }))
          ),
      ]).then((results) =>
        results
          .flat()
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10)
      ),
      // Đếm active seller và buyer từ danh sách ID
      User.countDocuments({ role: "seller", _id: { $in: activeSellerIds } }),
      User.countDocuments({ role: "user", _id: { $in: activeBuyerIds } }),
    ]);

    const orderStatus = {
      pending: 0,
      shipping: 0,
      shipped: 0,
      failedToShip: 0,
      rejected: 0,
    };
    orderStats.forEach((stat) => {
      orderStatus[stat.status] = stat.count;
    });

    const conversionRate = totalUsers
      ? ((activeBuyers / totalUsers) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue: totalRevenueStats[0]?.totalRevenue || 0,
        totalOrders: orderStats.reduce((sum, stat) => sum + stat.count, 0),
        orderStatus,
        uniqueCustomers: uniqueCustomersStats[0]?.uniqueCustomers || 0,
        productsShipped: productsShippedStats[0]?.productsShipped || 0,
        totalUsers,
        activeSellers,
        activeBuyers,
        conversionRate,
        totalProducts,
        newProducts,
      },

      topSellers,
      ratings: {
        averageRating: ratingStats[0]?.averageRating?.toFixed(1) || 0,
        totalReviews: ratingStats[0]?.totalReviews || 0,
        topRatedProducts,
      },
      stock: {
        lowStockProducts,
        outOfStockProducts,
      },
      returns: {
        returnRequestsCount,
        disputesCount,
      },
      trends: {
        revenueOverTime,
        orderOverTime,
      },
      insights: {
        revenueByCategory,
        topProducts,
      },
      activities: {
        recentActivity,
      },
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy báo cáo dashboard");
  }
};