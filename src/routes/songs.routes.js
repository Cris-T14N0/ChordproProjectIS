const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const {
  uploadSong,
  getUserSongs,
  getSong,
  updateSong,
  createSong,
  deleteSong
} = require("../controllers/songs.controller");

// All routes require authentication
router.use(authMiddleware);

// Upload file
router.post("/upload", upload.single("file"), uploadSong);

// Get all user songs
router.get("/", getUserSongs);

// Create new song from editor
router.post("/", createSong);

// Get single song
router.get("/:id", getSong);

// Update song
router.put("/:id", updateSong);

// Delete song
router.delete("/:id", deleteSong);

module.exports = router;