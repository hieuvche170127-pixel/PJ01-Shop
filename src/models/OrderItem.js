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
    quantity: { type: Number, required: true },
    unitPrice: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderItem", orderItemSchema);
