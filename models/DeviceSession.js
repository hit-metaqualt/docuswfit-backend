const mongoose = require("mongoose");

const DeviceSessionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  deviceInfo: { type: String, required: true },
  ipAddress: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
  logoutTime: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("DeviceSession", DeviceSessionSchema);
