const Category = require('../models/Category');

/**
 * List all categories
 * @route GET /api/categories
 * @access Public
 */
const listAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
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
  listAllCategories
}; 