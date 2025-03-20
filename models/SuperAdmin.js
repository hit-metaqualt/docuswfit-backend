const mongoose = require("mongoose");

const SuperAdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  maxDevices: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("SuperAdmin", SuperAdminSchema);
