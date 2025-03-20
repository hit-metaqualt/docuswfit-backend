const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Middleware to authenticate admin and superAdmin
exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;

    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
    }

    // Validate role
    if (!decoded.role || !["admin", "superAdmin"].includes(decoded.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    let user = null;
    if (decoded.role === "admin") {
      user = await Admin.findOne({ _id: decoded.id });
    } else if (decoded.role === "superAdmin") {
      user = await SuperAdmin.findOne({ _id: decoded.id });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `${decoded.role} not found` });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: decoded.role,
      createdAt: user.createdAt,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};