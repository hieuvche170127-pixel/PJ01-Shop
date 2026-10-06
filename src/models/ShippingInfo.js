const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shippingInfoSchema = new Schema(
  {
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
    carrier: { type: String, required: true, default: "GHTK" },
    trackingNumber: { type: String, default: 123456789 },
    status: {
      type: String,
      enum: ["shipping", "shipped", "failed to ship"],
      default: "shipping",
    },
    estimatedArrival: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingInfo", shippingInfoSchema);
