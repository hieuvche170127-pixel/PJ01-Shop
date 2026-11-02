const { User } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require("bcryptjs");

/**
 * Search for users by username or fullname
 */
const searchUsers = async (req, res) => {
  try {
    let { query } = req.query;
    
    if (typeof query !== 'string' || query.length < 2 || query.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    query = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Search for users by username or fullname
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullname: { $regex: query, $options: 'i' } }
      ],
      action: 'unlock' // Only return unlocked users
    })
    .select('username fullname avatarURL role')
    .limit(10);
    
    logger.info(`User search performed with query: ${query}, found ${users.length} results`);
    
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('username fullname avatarURL role');
    
    if (!user) {
      logger.info(`User not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.info(`User fetched by ID: ${id}`);
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// Lấy thông tin người dùng từ token
const getProfile = async (req, res) => {
    try {
      const userId = req.user.id; // req.user được gán từ middleware xác thực token
  
      const user = await User.findById(userId).select("-password"); // loại bỏ trường password
      if (!user) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }
  
      res.json({ success: true, user });
    } catch (error) {
      logger.error("Lỗi khi lấy thông tin profile:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  };
  
const updateProfile = async (req, res) => {
  try {
    const { fail, respondError } = require('../utils/apiError');
    const fields = {};
    for (const key of ['fullname','avatarURL']) if (key in req.body) {
      if (typeof req.body[key] !== 'string' || req.body[key].length > (key === 'fullname' ? 200 : 2000)) fail(400, 'Thông tin hồ sơ không hợp lệ');
      if (key === 'avatarURL' && req.body[key] && !/^https?:\/\//i.test(req.body[key])) fail(400, 'Ảnh đại diện phải là URL HTTP(S)');
      fields[key] = req.body[key].trim();
    }
    let result;
    if (req.body.password) result = await require('../services/passwordChange').change(req.user.id, req.body.currentPassword, req.body.password, fields);
    else result = { user: await User.findByIdAndUpdate(req.user.id, { $set: fields }, { new: true, runValidators: true }) };
    if (result.token) require('../services/authService').disconnectUserSockets(req.app.get('io'), req.user.id);
    res.json({ success: true, message: 'Cập nhật thông tin thành công', ...result });
  } catch (error) { require('../utils/apiError').respondError(res, error); }
};

module.exports = {
  searchUsers,
  getUserById,
  getProfile,
  updateProfile,

}; 
