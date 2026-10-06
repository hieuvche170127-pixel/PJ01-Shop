const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bidAmount: { type: Number, required: true },
    bidDate: { type: Date, default: Date.now },
    isWinningBid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bid", bidSchema);
