const Voucher = require('../models/Voucher');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const fields = ['code', 'discount', 'discountType', 'expirationDate', 'minOrderValue', 'usageLimit', 'maxDiscount', 'isActive'];
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
function validate(data) {
  if (typeof data.code !== 'string' || !/^[A-Z0-9_-]{3,50}$/.test(data.code)) fail(400, 'Mã voucher cần 3–50 ký tự chữ, số, dấu gạch.');
  if (!['fixed', 'percentage'].includes(data.discountType)) fail(400, 'Loại giảm giá không hợp lệ.');
  if (!Number.isSafeInteger(data.discount) || data.discount <= 0 || (data.discountType === 'percentage' && data.discount > 100)) fail(400, 'Giảm giá phải nguyên dương; phần trăm tối đa 100.');
  for (const field of ['minOrderValue', 'maxDiscount']) if (!Number.isSafeInteger(data[field]) || data[field] < 0) fail(400, 'Giá trị tối thiểu/tối đa phải là số nguyên không âm.');
  if (!Number.isSafeInteger(data.usageLimit) || data.usageLimit < 1 || data.usageLimit < (data.usedCount || 0)) fail(400, 'Giới hạn lượt dùng phải nguyên dương và không thấp hơn số đã dùng.');
  if (typeof data.isActive !== 'boolean' || !Number.isFinite(new Date(data.expirationDate).getTime())) fail(400, 'Trạng thái hoặc ngày hết hạn không hợp lệ.');
}
function input(body) {
  const value = Object.fromEntries(fields.filter(k => Object.hasOwn(body, k)).map(k => [k, body[k]]));
  if (typeof value.code === 'string') value.code = value.code.trim().toUpperCase();
  // Date picker means the end of that calendar day in Vietnam, not midnight UTC.
  if (typeof value.expirationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.expirationDate)) value.expirationDate += 'T23:59:59.999+07:00';
  return value;
}
function error(res, err) {
  if (err.code === 11000) return res.status(409).json({ message: 'Mã voucher đã tồn tại.' });
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: 'Thông tin voucher không hợp lệ.' });
  if (!err.status) logger.error('Voucher operation failed', err);
  return res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
}
async function find(id) {
  if (!mongoose.isObjectIdOrHexString(id)) fail(400, 'Mã ID không hợp lệ.');
  const voucher = await Voucher.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!voucher) fail(404, 'Không tìm thấy voucher.');
  return voucher;
}
const createVoucher = async (req, res) => {
  try {
    const data = { discountType: 'percentage', minOrderValue: 0, maxDiscount: 0, usageLimit: 1, isActive: true, ...input(req.body) };
    validate(data);
    return res.status(201).json(await Voucher.create(data));
  } catch (err) { return error(res, err); }
};
const getVouchers = async (req, res) => {
  try { return res.json(await Voucher.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 })); }
  catch (err) { return error(res, err); }
};
const getVoucherById = async (req, res) => {
  try { return res.json(await find(req.params.id)); } catch (err) { return error(res, err); }
};
async function change(req, res, toggle = false, deleting = false) {
  try {
    const voucher = await find(req.params.id);
    const changes = deleting ? { isActive: false, isDeleted: true } : toggle ? { isActive: !voucher.isActive } : input(req.body);
    validate({ ...voucher.toObject(), ...changes });
    // Checkout reserves voucher usage atomically; don't edit/delete an in-flight reservation.
    const updated = await Voucher.findOneAndUpdate({
      _id: voucher._id, isDeleted: { $ne: true }, 'checkoutReservations.0': { $exists: false },
      usedCount: voucher.usedCount, isActive: voucher.isActive, updatedAt: voucher.updatedAt,
    }, { $set: changes }, { new: true, runValidators: true });
    if (!updated) fail(409, 'Voucher vừa thay đổi hoặc đang được dùng trong checkout. Vui lòng tải lại.');
    return res.json(deleting ? { message: 'Đã xóa voucher khỏi danh sách; lịch sử được giữ lại.' } : updated);
  } catch (err) { return error(res, err); }
}
const updateVoucher = (req, res) => change(req, res);
const toggleVoucherActive = (req, res) => change(req, res, true);
const deleteVoucher = (req, res) => change(req, res, false, true);
const getVoucherByCode = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code, isDeleted: { $ne: true } });
    if (!voucher) fail(404, 'Không tìm thấy voucher.');
    if (!voucher.isActive) fail(400, 'Voucher đang tắt.');
    if (voucher.expirationDate <= new Date()) fail(400, 'Voucher đã hết hạn.');
    if (voucher.usedCount >= voucher.usageLimit) fail(400, 'Voucher đã hết lượt.');
    return res.json(voucher);
  } catch (err) { return error(res, err); }
};
module.exports = { createVoucher, getVouchers, getVoucherById, updateVoucher, deleteVoucher, toggleVoucherActive, getVoucherByCode };
