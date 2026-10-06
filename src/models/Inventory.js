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
    quantity: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
