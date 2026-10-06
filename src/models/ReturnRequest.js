const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const returnRequestSchema = new Schema(
  {
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
