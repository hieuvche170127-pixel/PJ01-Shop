const { cloudinary } = require('../config/cloudinary');
const Asset = require('../models/UploadedAsset');
const { Product, User, Store, Message } = require('../models');
const { fail, respondError } = require('../utils/apiError');
function imageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([255,216,255]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (['GIF87a','GIF89a'].includes(buffer.toString('ascii',0,6))) return 'image/gif';
  if (buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP') return 'image/webp';
  return null;
}
async function uploadOne(file, ownerId) {
  if (imageType(file.buffer) !== file.mimetype) fail(400, 'File content is not a supported image');
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'shopii', resource_type: 'image', transformation: [{ width: 1000, height: 1000, crop: 'limit' }] }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(file.buffer);
  });
  try { await Asset.create({ ownerId, publicId: result.public_id, url: result.secure_url }); }
  catch (error) { await cloudinary.uploader.destroy(result.public_id).catch(() => {}); throw error; }
  return { public_id: result.public_id, url: result.secure_url, secure_url: result.secure_url, format: result.format, width: result.width, height: result.height };
}
exports.uploadImage = async (req, res) => {
  try { if (!req.file) fail(400, 'No file uploaded'); res.json({ success: true, data: await uploadOne(req.file, req.user.id) }); }
  catch (error) { respondError(res, error); }
};
exports.uploadMultipleImages = async (req, res) => {
  const completed = [];
  try {
    if (!req.files?.length) fail(400, 'No files uploaded');
    for (const file of req.files) if (imageType(file.buffer) !== file.mimetype) fail(400, 'File content is not a supported image');
    for (const file of req.files) completed.push(await uploadOne(file, req.user.id));
    res.json({ success: true, data: completed });
  } catch (error) {
    for (const asset of completed) {
      try { await cloudinary.uploader.destroy(asset.public_id); await Asset.deleteOne({ publicId: asset.public_id, ownerId: req.user.id }); } catch { /* Keep owned record for a later cleanup retry. */ }
    }
    respondError(res, error);
  }
};
exports.deleteImage = async (req, res) => {
  let asset;
  try {
    if (typeof req.body.public_id !== 'string' || !req.body.public_id || req.body.public_id.length > 250) fail(400, 'Invalid public ID');
    asset = await Asset.findOneAndUpdate({ publicId: req.body.public_id, ownerId: req.user.id, state: 'active' }, { $set: { state: 'deleting' } }, { new: true });
    if (!asset) fail(404, 'Owned image not found');
    const references = await Promise.all([
      Product.exists({ image: asset.url }), User.exists({ avatarURL: asset.url }),
      Store.exists({ $or: [{ logo: asset.url }, { banner: asset.url }, { logoURL: asset.url }, { bannerURL: asset.url }, { bannerImageURL: asset.url }] }),
      Message.exists({ 'image.public_id': asset.publicId })
    ]);
    if (references.some(Boolean)) fail(409, 'This image is still in use');
    const result = await cloudinary.uploader.destroy(asset.publicId);
    if (!['ok', 'not found'].includes(result.result)) fail(502, 'Image provider could not delete the file');
    await Asset.deleteOne({ _id: asset._id });
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    if (asset) await Asset.updateOne({ _id: asset._id }, { $set: { state: 'active' } }).catch(() => {});
    respondError(res, error);
  }
};
