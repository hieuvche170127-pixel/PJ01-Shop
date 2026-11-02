const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { fail } = require('../utils/apiError');
async function change(userId, currentPassword, newPassword, profile = {}) {
  if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) fail(400, 'Nhập mật khẩu hiện tại và mật khẩu mới từ 8 ký tự, tối đa 72 byte');
  const user = await User.findById(userId).select('+password');
  if (!user) fail(404, 'Không tìm thấy tài khoản');
  if (!await user.comparePassword(currentPassword)) fail(400, 'Mật khẩu hiện tại không đúng');
  const password = await bcrypt.hash(newPassword, 10);
  const version = user.tokenVersion ? { tokenVersion: user.tokenVersion } : { $or: [{ tokenVersion: 0 }, { tokenVersion: { $exists: false } }] };
  const updated = await User.findOneAndUpdate({ _id: userId, password: user.password, ...version }, {
    $set: { ...profile, password }, $inc: { tokenVersion: 1 }, $unset: { resetTokenHash: 1, resetExpiresAt: 1 }
  }, { new: true, runValidators: true });
  if (!updated) fail(409, 'Tài khoản vừa thay đổi. Vui lòng đăng nhập lại');
  return { user: updated, token: jwt.sign({ id: updated._id, username: updated.username, role: updated.role, ver: updated.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '1d' }) };
}
module.exports = { change };
