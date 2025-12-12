const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware"); // Remove the curly braces
const upload = require("../middleware/upload.middleware");
const { createCifra, getUserCifras, getPublicCifras, getCifraById } = require("../controllers/cifras.controller");

router.post("/", authMiddleware, upload.single("file"), createCifra);
router.get("/", authMiddleware, getUserCifras);
router.get("/public", getPublicCifras);
router.get("/:id", getCifraById);

module.exports = router;