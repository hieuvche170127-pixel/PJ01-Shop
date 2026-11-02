const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    originalTotalPrice: { type: Number, min: 0 },
    voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    voucherReleased: { type: Boolean, default: false },
    orderDate: { type: Date, default: Date.now },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipping", "shipped", "failed to ship", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
