const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true
    },
    content: {
      type: String,
      default: ""
    },
    image: {
      public_id: String,
      url: String,
      secure_url: String
    },
    read: {
      type: Boolean,
      default: false
    },
    conversationId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Validate that either content or image is provided
messageSchema.pre('save', function(next) {
  if (!this.content && !this.image) {
    return next(new Error('Message must have either text content or an image'));
  }
  next();
});

// Helper method to generate a unique conversation ID between two users
messageSchema.statics.generateConversationId = function(userId1, userId2) {
  // Sort the IDs to ensure consistent conversation IDs regardless of sender/recipient order
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

module.exports = mongoose.model("Message", messageSchema); 