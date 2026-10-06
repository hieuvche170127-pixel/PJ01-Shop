const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const voucherSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    discountType: { 
      type: String, 
      enum: ['percentage', 'fixed'], 
      default: 'percentage' 
    },
    maxDiscount: { type: Number, default: 0 }, // Chỉ có ý nghĩa khi discountType là 'percentage'
    expirationDate: { type: Date, required: true },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number, required: true, default: 1, min: 1 },
    usedCount: { type: Number, default: 0 }, // Thêm trường này
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hook tự động cập nhật isActive trước khi lưu
voucherSchema.pre("save", function (next) {
  const now = new Date();
  if (this.expirationDate < now || this.usedCount >= this.usageLimit) {
    this.isActive = false;
  } else {
    this.isActive = true;
  }
  next();
});

module.exports = mongoose.model("Voucher", voucherSchema);