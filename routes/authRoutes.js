const express = require("express");
const { loginUser, logoutUser, getLoggedInUser } = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();



router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, getLoggedInUser);


module.exports = router;
