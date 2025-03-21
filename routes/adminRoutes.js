const express = require("express");
const { createAdminUser, adminLogin, adminLogout, getActiveSessions} = require("../controllers/adminController");
const { sendMessage, receiveMessage } = require("../controllers/sendMessageController");
const { upload } = require("../middlewares/multerConfig");
const { createUser, fetchAllUsers, fetchUserDocuments, editUser, deleteUser, updateAdminProfile } = require("../controllers/userController");
const { addDocumentForUser, deleteDocumentForUser } = require("../controllers/documentController");
const { authMiddleware } = require("../middlewares/authMiddleware");



const router = express.Router();


router.post("/create-admin", createAdminUser);
router.post("/create-user", authMiddleware,createUser);
router.put("/update/profile/:adminId", authMiddleware,updateAdminProfile);
router.get("/fetch-all-user", authMiddleware, fetchAllUsers);
router.get("/user/all-documents/:userId", authMiddleware, fetchUserDocuments);
router.put("/user/edit/:userId", authMiddleware, editUser);


router.delete("/user/delete/:userId",authMiddleware, deleteUser);


router.post("/add-document",authMiddleware,upload.single("file"),addDocumentForUser);
router.delete("/delete-document/:documentId", authMiddleware, deleteDocumentForUser);



router.post("/whatsapp-webhook", sendMessage); 
router.post("/receive-message", receiveMessage);

module.exports = router;
