const mongoose = require("mongoose");
const User = require("../models/User"); // Ensure you have a User model
const Document = require("../models/Document"); // Ensure you have a Document model
const DocumentYearData = require("../models/DocumentYearData"); // Ensure you have a DocumentYearData model
require("dotenv").config();

// Add Document for User
exports.addDocumentForUser = async (req, res) => {
  try {
    const { userId, name, year } = req.body;
    
    if (!userId || !name || !req.file) {
      return res.status(400).json({ success: false, message: "User ID, name, and file are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const filePath = req.file.filename;
    let document = await Document.findOne({ userId, name });

    if (!document) {
      document = new Document({ userId, name, fileUrl: filePath });
      await document.save();
    }

    if (year) {
      let existingYearData = await DocumentYearData.findOne({ documentId: document._id, yearRange: year });

      if (existingYearData) {
        existingYearData.fileUrl = filePath;
        existingYearData.uploadedAt = new Date();
        await existingYearData.save();
        return res.status(200).json({ success: true, message: "Year-wise document updated successfully", document: { ...existingYearData.toObject(), name, year } });
      }

      const newYearDocument = new DocumentYearData({ documentId: document._id, yearRange: year, fileUrl: filePath, uploadedAt: new Date() });
      await newYearDocument.save();

      return res.status(201).json({ success: true, message: "New year-wise document added successfully", document: { ...newYearDocument.toObject(), name, year } });
    }

    document.fileUrl = filePath;
    document.uploadedAt = new Date();
    await document.save();

    return res.status(200).json({ success: true, message: "Document updated successfully", document: { ...document.toObject(), year: null } });
  } catch (error) {
    console.error("Document Upload Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// Delete Document for User
exports.deleteDocumentForUser = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ success: false, message: "Invalid Document ID" });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    await DocumentYearData.deleteMany({ documentId });
    await Document.findByIdAndDelete(documentId);

    return res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete Document Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
