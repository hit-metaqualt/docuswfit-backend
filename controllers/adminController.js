const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin"); // Assuming you have an Admin model
const SuperAdmin = require("../models/SuperAdmin"); // Ass

const prisma = new PrismaClient(); // This line must come after importing PrismaClient

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});




exports.getActiveSessions = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Fetch active session
    const activeSession = await prisma.devicesession.findFirst({
      where: { adminId, isActive: true },
      select: { id: true }
    });

    if (!activeSession) {
      return res.status(404).json({ message: "No active session found" });
    }

    return res.status(200).json({ sessionId: activeSession.id });
  } catch (error) {
    console.error("Fetch Sessions Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};




// -----------------ADD NEW USER-----------------
exports.addUser = async (req, res) => {
  try {
    const { whatsappNumber, username, email, address, age, gender } = req.body;
    if (!whatsappNumber) return res.status(400).json({ error: "WhatsApp number is required" });

    const existingUser = await prisma.User.findUnique({ where: { whatsappNumber } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const user = await prisma.user.create({
      data: { whatsappNumber, username: username || "", email, address, age, gender },
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: err.message });
  }
};





// -----------------CREATE ADMIN USER-----------------
exports.createAdminUser = async (req, res) => {
  try {
    const { username, password, superAdminId } = req.body;

    if (!username || !password || !superAdminId) {
      return res.status(400).json({
        success: false,
        message: "Username, password, and superAdminId are required.",
      });
    }

    // Check if SuperAdmin exists
    const superAdmin = await SuperAdmin.findById(superAdminId);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "SuperAdmin not found.",
      });
    }

    // Check if admin username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin username already exists. Choose a different username.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new Admin
    const admin = new Admin({
      username,
      password: hashedPassword,
      superAdminId,
    });

    await admin.save();

    return res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      admin: {
        id: admin._id,
        username: admin.username,
        superAdminId: admin.superAdminId,
      },
    });
  } catch (err) {
    console.error("Error creating Admin:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: err.message,
    });
  }
};
