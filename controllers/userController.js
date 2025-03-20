const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Document = require("../models/Document");
const Admin = require("../models/Admin");



const createUser = async (req, res) => {
  try {
    const { whatsappNumber, username, email, address, age, gender, adminId } = req.body;
    if (!whatsappNumber || !adminId) {
      return res.status(400).json({ error: "whatsappNumber and adminId are required." });
    }

    const existingUser = await User.findOne({ whatsappNumber });
    if (existingUser) {
      return res.status(409).json({ error: "User with this WhatsApp number already exists." });
    }

    const user = new User({
      whatsappNumber,
      username,
      email,
      address,
      age: age ? parseInt(age, 10) : null,
      gender: gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : null,
      adminId,
    });

    await user.save();
    return res.status(201).json({ message: "User created successfully.", user });
  } catch (error) {
    console.error("Error creating User:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


const fetchAllUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: "Unauthorized: User ID not found" });
    }
    
    const users = await User.find({ adminId: req.user.id });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return res.status(500).json({ success: false, error: "Server Error", details: error.message });
  }
};

const fetchUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    const documents = await Document.find({ userId, ...(type ? { type } : {}) }).populate("yearData");
    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    await User.findByIdAndDelete(userId);
    return res.status(200).json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: false, message: "Invalid user ID format" });
    }

    console.log("Updating User ID:", userId);
    console.log("Update Data:", req.body);

    const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    return res.status(200).json({ status: true, message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { username, password } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const existingAdmin = await Admin.findById(adminId);
    if (!existingAdmin) {
      return res.status(404).json({ status: false, message: "Admin not found" });
    }

    if (password) {
      req.body.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, req.body, { new: true });
    delete updatedAdmin.password;
    return res.status(200).json({ status: true, message: "Admin profile updated successfully", updatedAdmin });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

module.exports = { createUser, editUser, deleteUser, fetchUserDocuments, fetchAllUsers, updateAdminProfile };
