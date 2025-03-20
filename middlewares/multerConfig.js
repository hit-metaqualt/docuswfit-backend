// const { PrismaClient } = require("@prisma/client");
// const cloudinary = require("cloudinary").v2;
// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const dotenv = require("dotenv");
// dotenv.config();

// const prisma = new PrismaClient();

// // ✅ Cloudinary Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // ✅ Allowed Document Types that Require a Year
// const documentsRequiringYear = new Set(["ITR"]);

// // ✅ Configure Multer Storage for Cloudinary
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     const fileExtension = file.originalname.split(".").pop();
//     const fileName = `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`;

//     return {
//       folder: "user_documents",
//       format: fileExtension,
//       public_id: fileName,
//       resource_type: "raw", // Supports PDFs
//     };
//   },
// });

// // ✅ File Filter - Only Allow Images & PDFs
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Invalid file type. Only PDF, JPG, and PNG allowed"), false);
//   }
// };

// // ✅ Multer Upload Middleware
// const upload = multer({ storage, fileFilter });
// module.exports = { upload };







const multer = require("multer");
const path = require("path");
const fs = require("fs");

const projectPath=path.join(__dirname,"..");

// Ensure the uploads directory exists
const uploadDir = path.join(projectPath, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Configure Multer Storage for Local Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}${fileExt}`;
    cb(null, fileName);
  },
});

// ✅ File Filter - Only Allow Images & PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, JPG, and PNG allowed"), false);
  }
};

// ✅ Multer Upload Middleware
const upload = multer({ storage, fileFilter });

module.exports = { upload, uploadDir };









