const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  superAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin", required: true },
  allowedDevices: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("Admin", AdminSchema);
