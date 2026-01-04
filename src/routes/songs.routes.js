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
  deleteSong,
  searchSongs
} = require("../controllers/songs.controller");

router.get("/search", authMiddleware, searchSongs);
router.post("/upload", authMiddleware, upload.single("file"), uploadSong);
router.get("/", authMiddleware, getUserSongs);
router.post("/", authMiddleware, createSong);
router.get("/:id", authMiddleware, getSong);
router.put("/:id", authMiddleware, updateSong);
router.delete("/:id", authMiddleware, deleteSong);

module.exports = router;