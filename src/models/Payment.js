const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: { type: String }, // ID giao dịch từ cổng thanh toán
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// Tạo index để tăng tốc độ tìm kiếm
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ userId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
