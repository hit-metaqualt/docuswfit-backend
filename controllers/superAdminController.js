const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdmin");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { addToBlacklist, isTokenBlacklisted } = require("../utils/tokenBlacklist");

const SECRET_KEY = process.env.JWT_SECRET || "";

// ✅ Create SuperAdmin
const createSuperAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = new SuperAdmin({
      username,
      password: hashedPassword,
    });

    await superAdmin.save();

    res.status(201).json({ message: "SuperAdmin created successfully", superAdmin });
  } catch (error) {
    console.error("Error creating SuperAdmin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Fetch All Admins Under SuperAdmin
const fetchAllAdmins = async (req, res) => {
  try {
    const { superAdminId } = req.body;

    if (!superAdminId) {
      return res.status(400).json({ error: "Super Admin ID is required" });
    }

    const admins = await Admin.find({ superAdminId }).select("id username allowedDevices");

    res.status(200).json({ message: "Admins fetched successfully", admins });
  } catch (error) {
    console.error("Fetch Admins Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Super Admin Dashboard
const getSuperAdminDashboard = async (req, res) => {
  try {
    const {superAdminId} = req.body;

    const totalAdmins = await Admin.countDocuments({ superAdminId });
    const totalUsers = await User.countDocuments();

    res.status(200).json({ message: "Dashboard data fetched", data: { totalAdmins, totalUsers } });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createSuperAdmin, fetchAllAdmins, getSuperAdminDashboard };
