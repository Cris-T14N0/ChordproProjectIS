const express = require("express");
const router = express.Router();
const { getMyProfile, getUserProfile } = require("../controllers/users.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Rota protegida - perfil do utilizador autenticado
router.get("/me", authMiddleware, getMyProfile);

// Rota pública - perfil de qualquer utilizador
router.get("/:username", getUserProfile);

module.exports = router;