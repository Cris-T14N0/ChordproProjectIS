const express = require("express");
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  updateUsername, 
  updatePassword 
} = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.put("/update-username", authMiddleware, updateUsername);
router.put("/update-password", authMiddleware, updatePassword);

module.exports = router;