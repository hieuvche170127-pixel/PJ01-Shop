const Review = require('../models/Review');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

// Create a new review for a product
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, parentId } = req.body;
    const reviewerId = req.user.id;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // If it's not a reply, validate rating
    if (!parentId) {
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If it's a new review (not a reply), check if the user has purchased the product
    if (!parentId) {
      // Find orders by this buyer that contain this product and are shipped
      const orders = await Order.find({ buyerId: reviewerId });
      if (orders.length === 0) {
        return res.status(403).json({ error: 'You can only review products you have purchased' });
      }

      const orderIds = orders.map(order => order._id);
      const orderItems = await OrderItem.find({ 
        orderId: { $in: orderIds }, 
        productId: productId,
        status: 'shipped' // Only allow reviews for shipped items
      });

      if (orderItems.length === 0) {
        return res.status(403).json({ 
          error: 'You can only review products you have received (status: shipped)'
        });
      }
      
      // Check if the user has already reviewed this product
      const existingReview = await Review.findOne({
        productId,
        reviewerId,
        parentId: null // Only check primary reviews, not replies
      });
      
      if (existingReview) {
        return res.status(403).json({
          error: 'You have already reviewed this product'
        });
      }
    } 
    // If it's a reply, check if the parent review exists
    else {
      const parentReview = await Review.findById(parentId);
      if (!parentReview) {
        return res.status(404).json({ error: 'Parent review not found' });
      }
    }

    // Create the review
    const review = new Review({
      productId,
      reviewerId,
      rating: parentId ? undefined : rating, // Only include rating if it's not a reply
      comment,
      parentId: parentId || null
    });

    await review.save();

    return res.status(201).json({
      message: parentId ? 'Reply added successfully' : 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find primary reviews (not replies)
    const reviews = await Review.find({ 
      productId, 
      parentId: null 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviewerId', 'name avatar')
      .lean();

    // Get total count for pagination
    const total = await Review.countDocuments({ productId, parentId: null });

    // For each review, fetch its replies
    const reviewsWithReplies = await Promise.all(
      reviews.map(async (review) => {
        const replies = await Review.find({ parentId: review._id })
          .sort({ createdAt: 1 })
          .populate('reviewerId', 'name avatar role')
          .lean();
        return { ...review, replies };
      })
    );

    // Calculate average rating
    const allRatings = await Review.find({ productId, parentId: null }, 'rating');
    const ratingSum = allRatings.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = allRatings.length > 0 ? ratingSum / allRatings.length : 0;

    return res.status(200).json({
      reviews: reviewsWithReplies,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: total,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Get reviews by a specific buyer (for my reviews page)
const getBuyerReviews = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find reviews created by this buyer
    const reviews = await Review.find({ reviewerId: buyerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'productId',
        select: 'title image price'
      })
      .populate({
        path: 'parentId',
        select: 'comment'
      })
      .lean();

    // Get total count for pagination
    const total = await Review.countDocuments({ reviewerId: buyerId });

    return res.status(200).json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching buyer reviews:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const reviewerId = req.user.id;

    // Find the review and verify ownership
    const review = await Review.findOne({ _id: id, reviewerId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    // Update fields
    if (comment) review.comment = comment;
    if (rating && !review.parentId) review.rating = rating; // Only update rating if it's a primary review

    await review.save();

    return res.status(200).json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;

    // Find the review and verify ownership
    const review = await Review.findOne({ _id: id, reviewerId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    // If it's a primary review, delete all replies as well
    if (!review.parentId) {
      await Review.deleteMany({ parentId: review._id });
    }

    // Delete the review
    await Review.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getBuyerReviews,
  updateReview,
  deleteReview
}; 