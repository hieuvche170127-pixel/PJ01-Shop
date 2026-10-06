const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    positiveRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
