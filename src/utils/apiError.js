const mongoose = require('mongoose');
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ApiError(status, message); };
const validId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
function requireId(value) { if (!validId(String(value || ''))) fail(400, 'Mã dữ liệu không hợp lệ.'); }
function respondError(res, error) {
  const status = error.status || (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError ? 400 : error.code === 11000 ? 409 : 500);
  if (status === 500) require('./logger').error('Request failed', error);
  return res.status(status).json({ success: false, message: status === 500 ? 'Không thể xử lý yêu cầu. Vui lòng thử lại.' : error.code === 11000 ? 'Dữ liệu đã tồn tại.' : error.message });
}
module.exports = { ApiError, fail, validId, requireId, respondError };
