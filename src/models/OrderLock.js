const mongoose = require('mongoose');
module.exports = mongoose.model('OrderLock', new mongoose.Schema({
  _id: String, owner: { type: String, required: true },
}, { timestamps: true }));
