const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    resetTokenHash: { type: String, select: false, index: true },
    resetExpiresAt: { type: Date, select: false },
    resetRequestedAt: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0 },
    username: { type: String, required: true, unique: true },
    fullname: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    avatarURL: { type: String },
    action: {
      type: String,
      enum: ["lock", "unlock"],
      default: "unlock",
    },
  },
  { timestamps: true }
);

// Defense in depth: explicitly selected credentials still never serialize into API JSON.
const hideCredentials = (doc, value) => { delete value.password; delete value.resetTokenHash; delete value.resetExpiresAt; delete value.resetRequestedAt; return value; };
userSchema.set('toJSON', { transform: hideCredentials });
userSchema.set('toObject', { transform: hideCredentials });

// Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);