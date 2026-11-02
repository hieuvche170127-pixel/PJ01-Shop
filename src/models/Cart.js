const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Cart Schema
const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger }
      }
    ]
  },
  { timestamps: true, optimisticConcurrency: true }
);

module.exports = mongoose.model("Cart", cartSchema);