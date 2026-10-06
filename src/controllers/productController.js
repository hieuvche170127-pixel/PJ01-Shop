const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const Review = require('../models/Review');
const Inventory = require('../models/Inventory');

const listAllProducts = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { categories } = req.query;
    
    // Base query - only show active products (isAuction=true)
    const query = { isAuction: true };
    
    // Add category filter if provided
    if (categories) {
      const categoryIds = categories.split(',');
      query.categoryId = { $in: categoryIds };
    }
    
    // Get all products with the base query
    const products = await Product.find(query)
      .populate('categoryId')
      .populate('sellerId');
    
    // Get all stores to filter by status
    const stores = await Store.find({});
    const storeMap = {};
    stores.forEach(store => {
      storeMap[store.sellerId.toString()] = store;
    });
    
    // Get all reviews to calculate ratings
    const reviews = await Review.find({ parentId: null });
    
    // Create a map for product ratings
    const productRatings = {};
    reviews.forEach(review => {
      const productId = review.productId.toString();
      if (!productRatings[productId]) {
        productRatings[productId] = {
          totalRating: 0,
          count: 0
        };
      }
      productRatings[productId].totalRating += review.rating || 0;
      productRatings[productId].count += 1;
    });
    
    // Filter out products from rejected stores and locked users
    const filteredProducts = products.filter(product => {
      // Skip products if seller is locked
      if (product.sellerId && product.sellerId.action === 'lock') {
        return false;
      }
      
      // Skip products if store is rejected
      const sellerIdStr = product.sellerId ? product.sellerId._id.toString() : null;
      if (sellerIdStr && storeMap[sellerIdStr] && storeMap[sellerIdStr].status === 'rejected') {
        return false;
      }
      
      return true;
    });
    
    // Add rating information to products
    const productsWithRatings = filteredProducts.map(product => {
      const productObj = product.toObject();
      const productId = productObj._id.toString();
      
      if (productRatings[productId]) {
        productObj.rating = productRatings[productId].totalRating / productRatings[productId].count;
        productObj.reviewCount = productRatings[productId].count;
      } else {
        productObj.rating = 0;
        productObj.reviewCount = 0;
      }
      
      return productObj;
    });
    
    res.status(200).json({
      success: true,
      data: productsWithRatings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get product with populated references
    const product = await Product.findById(productId)
      .populate('categoryId')
      .populate('sellerId');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get seller store information
    const store = await Store.findOne({ sellerId: product.sellerId._id });
    
    // Get product inventory
    const inventory = await Inventory.findOne({ productId });
    
    // Get product reviews
    const reviews = await Review.find({ productId, parentId: null })
      .populate('reviewerId', 'username fullname avatarURL')
      .sort({ createdAt: -1 });
      
    // Get review replies
    const reviewIds = reviews.map(review => review._id);
    const replies = await Review.find({ parentId: { $in: reviewIds } })
      .populate('reviewerId', 'username fullname avatarURL');
      
    // Create replies map for easy access
    const repliesMap = {};
    replies.forEach(reply => {
      if (!repliesMap[reply.parentId]) {
        repliesMap[reply.parentId] = [];
      }
      repliesMap[reply.parentId].push(reply);
    });
    
    // Add replies to their parent reviews
    const reviewsWithReplies = reviews.map(review => {
      const reviewObj = review.toObject();
      reviewObj.replies = repliesMap[review._id] || [];
      return reviewObj;
    });
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      averageRating = totalRating / reviews.length;
    }
    
    res.status(200).json({
      success: true,
      data: {
        product,
        store,
        inventory: inventory || { quantity: 0 },
        reviews: reviewsWithReplies,
        averageRating,
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  listAllProducts,
  getProductDetail
};