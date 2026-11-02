const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  _id: String,
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fingerprint: { type: String, required: true },
  input: mongoose.Schema.Types.Mixed,
  state: { type: String, enum: ['processing', 'completed', 'failed'], required: true },
  result: mongoose.Schema.Types.Mixed,
  errorStatus: Number,
  errorMessage: String,
}, { timestamps: true });
// _id is the buyer-scoped idempotency key hash. MongoDB always enforces its uniqueness.
module.exports = mongoose.model('CheckoutRequest', schema);
