const mongoose = require('mongoose');
module.exports = mongoose.model('UploadedAsset', new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  publicId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  state: { type: String, enum: ['active', 'deleting'], default: 'active' }
}, { timestamps: true }));
