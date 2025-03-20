const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");

const SECRET_KEY = process.env.JWT_SECRET || "";


// 🔹 Common Login API (For both Super Admin & Admin)
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    let user = await SuperAdmin.findOne({ username });
    let role = user ? "superAdmin" : null;

    if (!user) {
      user = await Admin.findOne({ username });
      role = user ? "admin" : null;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 🔹 Logout API (For both Super Admin & Admin)
exports.logoutUser = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    jwt.verify(token, SECRET_KEY, (err) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
      }
      res.status(200).json({ success: true, message: "Logout successful" });
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 🔹 Get Logged-in User
exports.getLoggedInUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    const { id } = req.user;
    let userData = await SuperAdmin.findById(id, "_id username maxDevices");

    if (!userData) {
      // Use "superAdminId" instead of "superAdmin"
      userData = await Admin.findById(id).populate("superAdminId", "_id username");
      if (userData) {
        userData.role = "admin";
      }
    } else {
      userData.role = "superAdmin";
    }

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "User fetched successfully", user: userData });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

