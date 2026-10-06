const { User } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require("bcryptjs");

/**
 * Search for users by username or fullname
 */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
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
      const userId = req.user.id;
      const { avatarURL, password, fullname } = req.body;
  
      const updateData = {};
  
      // Nếu có fullname
      if (fullname) {
        updateData.fullname = fullname;
      }
  
      // Nếu có avatarURL
      if (avatarURL) {
        updateData.avatarURL = avatarURL;
      }
  
      // Nếu có mật khẩu mới → hash trước khi lưu
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ success: false, message: "Mật khẩu phải dài ít nhất 6 ký tự" });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
  
      // Cập nhật người dùng
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");
  
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }
  
      res.json({ success: true, message: "Cập nhật thông tin thành công", user: updatedUser });
    } catch (error) {
      logger.error("Lỗi khi cập nhật profile:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  };
  

module.exports = {
  searchUsers,
  getUserById,
  getProfile,
  updateProfile,

}; 