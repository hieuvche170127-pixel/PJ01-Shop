const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { sendEmail } = require("../services/emailService");

// Hàm kiểm tra định dạng email
const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, fullname, email, password, role } = req.body;

    // Kiểm tra đầu vào
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email và password là bắt buộc" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Định dạng email không hợp lệ" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải dài ít nhất 6 ký tự" });
    }
    if (role && !["buyer", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
    }

    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username hoặc email đã tồn tại" });
    }

    // Tạo người dùng mới
    const user = new User({
      username,
      fullname,
      email,
      password, // Sẽ được mã hóa bởi hook pre-save
      role: role || "buyer",
    });

    await user.save();

    // Gửi email chào mừng
    try {
      await sendEmail(user.email, "Welcome to Shopii", "Thank you for registering with us!");
    } catch (emailError) {
      logger.error("Failed to send welcome email:", emailError);
    }

    if (user.action === 'lock') return res.status(403).json({ success: false, message: 'Account is locked' });

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, ver: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      }
    });
  } catch (error) {
    logger.error("Lỗi đăng ký:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email và password là bắt buộc" });
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ success: false, message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Thông tin đăng nhập không hợp lệ" });
    }

    if (user.action === 'lock') return res.status(403).json({ success: false, message: 'Account is locked' });

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, ver: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Lỗi đăng nhập:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  return require('./passwordResetController').request(req, res);
};

// Thay đổi vai trò người dùng
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id; // Lấy ID người dùng từ middleware xác thực

    // Kiểm tra đầu vào
    if (!role) {
      return res.status(400).json({ success: false, message: "Vai trò mới là bắt buộc" });
    }
    if (!["buyer", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
    }

    // Tìm và cập nhật người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Cập nhật vai trò
    user.role = role;
    await user.save();

    // Tạo JWT token mới với vai trò đã cập nhật
    const token = jwt.sign(
      { id: user._id, role: user.role, ver: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: `Vai trò đã được cập nhật thành ${role}`,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Lỗi thay đổi vai trò:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware

    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error("Error getting user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware
    const { fullname, email, avatarURL } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate email if provided
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      // Check if email is already in use
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      user.email = email;
    }

    // Update fields if provided
    if (fullname) user.fullname = fullname;
    if (avatarURL) user.avatarURL = avatarURL;

    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    logger.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  try {
    const result = await require('../services/passwordChange').change(req.user.id, req.body.currentPassword, req.body.newPassword);
    require('../services/authService').disconnectUserSockets(req.app.get('io'), req.user.id);
    res.json({ success: true, message: 'Đã đổi mật khẩu; các phiên đăng nhập cũ đã hết hiệu lực', ...result });
  } catch (error) { require('../utils/apiError').respondError(res, error); }
};
// Đăng xuất
exports.logout = async (req, res) => {
  try {
    res.json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    logger.error("Lỗi đăng xuất:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
