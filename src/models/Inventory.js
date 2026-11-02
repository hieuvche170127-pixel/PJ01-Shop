const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const inventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },
    quantity: { type: Number, required: true, default: 0, min: 0, validate: Number.isSafeInteger },
    checkoutReservations: { type: [{ _id: false, requestId: String, quantity: Number }], default: [], select: false },
    returnedOrderItems: { type: [String], default: [], select: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
