const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  whatsappNumber: { type: String, unique: true, required: true },
  username: { type: String },
  email: { type: String, unique: true, sparse: true },
  address: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"], default: "" }, 
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  lastInteraction: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
