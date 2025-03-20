const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: false },
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    yearData: [{ type: mongoose.Schema.Types.ObjectId, ref: "DocumentYearData" }], // Reference to year-wise documents
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);
