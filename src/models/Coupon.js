const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    discountPercent: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    maxUsage: { type: Number, default: null },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
