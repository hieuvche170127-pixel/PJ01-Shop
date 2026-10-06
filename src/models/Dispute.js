const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const disputeSchema = new Schema(
  {
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed"],
      default: "open",
    },
    resolution: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
