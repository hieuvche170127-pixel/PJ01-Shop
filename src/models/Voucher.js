const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const voucherSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    isDeleted: { type: Boolean, default: false },
    releasedOrderIds: { type: [String], default: [], select: false },
    checkoutReservations: { type: [String], default: [], select: false },
    discount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    discountType: { 
      type: String, 
      enum: ['percentage', 'fixed'], 
      default: 'percentage' 
    },
    maxDiscount: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger }, // Chỉ có ý nghĩa khi discountType là 'percentage'
    expirationDate: { type: Date, required: true },
    minOrderValue: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
    usageLimit: { type: Number, required: true, default: 1, min: 1, validate: Number.isSafeInteger },
    usedCount: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger }, // Thêm trường này
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// isActive is an explicit admin switch. Expiration and usage are checked when redeeming.

module.exports = mongoose.model("Voucher", voucherSchema);