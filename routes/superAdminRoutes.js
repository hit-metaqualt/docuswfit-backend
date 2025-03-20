const express = require("express");
const { createSuperAdmin,fetchAllAdmins, getSuperAdminDashboard } = require("../controllers/superAdminController");

const router = express.Router();


router.post("/create-super-admin", createSuperAdmin);
router.get("/super-admin/admins", fetchAllAdmins);
router.get("/super-admin/dashboard", getSuperAdminDashboard);

module.exports = router;
