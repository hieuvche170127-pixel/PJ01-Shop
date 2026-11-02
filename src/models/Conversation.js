const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema(
  {
    pairKey: { type: String, unique: true, sparse: true },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message"
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema); 