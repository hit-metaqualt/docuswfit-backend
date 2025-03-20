const mongoose = require("mongoose");

const DocumentYearDataSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    yearRange: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DocumentYearData", DocumentYearDataSchema);
