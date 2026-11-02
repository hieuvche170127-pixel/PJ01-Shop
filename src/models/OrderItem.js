const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    status: {
      type: String,
      enum: ["pending", "shipping", "shipped", "failed to ship", "rejected"],
      default: "pending",
    },
    quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    payableAmount: { type: Number, min: 0, validate: Number.isSafeInteger },
    restockPending: { type: Boolean, default: false },
    stockRestored: { type: Boolean, default: false },
    codCollected: { type: Boolean, default: false },
    cancelledBy: { type: String, enum: ['buyer', 'seller'] },
    unitPrice: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderItem", orderItemSchema);
