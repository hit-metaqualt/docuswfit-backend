require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // ✅ Use Mongoose for MongoDB
const path = require("path");

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect MongoDB with Mongoose
async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1); // Exit process if connection fails
  }
}
connectDB();

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", superAdminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve static files

app.get("/test", (req, res) => {
  res.status(200).json({ message: "Server is working correctly with MongoDB!" });
});

const PORT = process.env.PORT || 3000;
const server=app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is already in use. Trying another port...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT + 1);
    }, 1000);
  } else {
    console.error("Server error:", err);
  }
});