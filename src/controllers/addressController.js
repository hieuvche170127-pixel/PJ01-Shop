const Address = require('../models/Address');
const { validId } = require('../services/checkoutService');
const logger = require('../utils/logger');
const fields = ['fullName', 'phone', 'street', 'city', 'state', 'country', 'isDefault'];
function pick(body) { return Object.fromEntries(fields.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]])); }
function errorResponse(res, error) {
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ success: false, message: 'Thông tin địa chỉ không hợp lệ.' });
  logger.error('Address operation failed', error);
  return res.status(500).json({ success: false, message: 'Server error' });
}
async function clearOtherDefaults(address) {
  if (address.isDefault) await Address.updateMany({ userId: address.userId, _id: { $ne: address._id }, isDefault: true }, { $set: { isDefault: false } });
}
exports.createAddress = async (req, res) => {
  try {
    const address = await Address.create({ ...pick(req.body), userId: req.user.id });
    await clearOtherDefaults(address);
    return res.status(201).json({ success: true, data: address });
  } catch (error) { return errorResponse(res, error); }
};
exports.getAddresses = async (req, res) => {
  try { return res.json({ success: true, data: await Address.find({ userId: req.user.id }) }); }
  catch (error) { return errorResponse(res, error); }
};
async function update(req, res, data) {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid address ID' });
  try {
    // Whitelist prevents changing userId/_id and injecting Mongo update operators.
    const address = await Address.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: data }, { new: true, runValidators: true });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    await clearOtherDefaults(address);
    return res.json({ success: true, data: address });
  } catch (error) { return errorResponse(res, error); }
}
exports.updateAddress = (req, res) => update(req, res, pick(req.body));
exports.setDefaultAddress = (req, res) => update(req, res, { isDefault: true });
exports.deleteAddress = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid address ID' });
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    return res.json({ success: true, message: 'Address deleted' });
  } catch (error) { return errorResponse(res, error); }
};
