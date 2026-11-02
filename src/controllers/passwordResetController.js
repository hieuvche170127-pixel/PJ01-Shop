const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { fail, respondError } = require('../utils/apiError');
const logger = require('../utils/logger');
const attempts = new Map();
const generic = { success: true, message: 'Nếu email hợp lệ, bạn sẽ nhận được liên kết đặt lại mật khẩu. Vui lòng kiểm tra cả thư rác.' };
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
function rateLimit(req) {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (++entry.count > 20 || (!attempts.has(key) && attempts.size >= 10000)) fail(429, 'Thử lại sau 15 phút');
  attempts.set(key, entry);
}
exports.request = async (req, res) => {
  try {
    rateLimit(req);
    if (typeof req.body.email !== 'string' || req.body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) fail(400, 'Email không hợp lệ');
    const token = crypto.randomBytes(32).toString('hex'), tokenHash = hash(token), now = new Date();
    const user = await User.findOneAndUpdate({ email: req.body.email.trim(), action: { $ne: 'lock' }, $or: [{ resetRequestedAt: { $lt: new Date(Date.now() - 60000) } }, { resetRequestedAt: { $exists: false } }] }, {
      $set: { resetTokenHash: tokenHash, resetExpiresAt: new Date(Date.now() + 15 * 60000), resetRequestedAt: now }
    }, { new: true });
    if (user) {
      try {
        const client = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
        await sendEmail(user.email, 'Đặt lại mật khẩu Shopii', `Mở liên kết sau trong 15 phút để đặt lại mật khẩu:\n${client}/reset-password#token=${token}\nNếu không yêu cầu, bạn có thể bỏ qua email này. Mật khẩu hiện tại vẫn giữ nguyên.`);
      } catch (error) {
        await User.updateOne({ _id: user._id, resetTokenHash: tokenHash }, { $unset: { resetTokenHash: 1, resetExpiresAt: 1 } });
        logger.error('Password reset delivery failed', error);
      }
    }
    res.json(generic);
  } catch (error) { respondError(res, error); }
};
exports.reset = async (req, res) => {
  try {
    rateLimit(req);
    const { token, newPassword } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail(400, 'Liên kết không hợp lệ hoặc đã hết hạn');
    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) fail(400, 'Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte');
    const tokenHash = hash(token);
    if (!await User.exists({ resetTokenHash: tokenHash, resetExpiresAt: { $gt: new Date() }, action: { $ne: 'lock' } })) fail(400, 'Liên kết không hợp lệ hoặc đã hết hạn');
    const password = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate({ resetTokenHash: tokenHash, resetExpiresAt: { $gt: new Date() }, action: { $ne: 'lock' } }, {
      $set: { password }, $inc: { tokenVersion: 1 }, $unset: { resetTokenHash: 1, resetExpiresAt: 1 }
    });
    if (!user) fail(400, 'Liên kết không hợp lệ hoặc đã được sử dụng');
    require('../services/authService').disconnectUserSockets(req.app.get('io'), user._id);
    res.json({ success: true, message: 'Đã đổi mật khẩu. Hãy đăng nhập lại.' });
  } catch (error) { respondError(res, error); }
};
