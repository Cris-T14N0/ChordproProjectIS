const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const {
  uploadSong,
  uploadMultipleSongs,
  uploadMultipleWithProgress,
  getUserSongs,
  getSong,
  updateSong,
  createSong,
  deleteSong,
  searchSongs,
  uploadMultiple,
  uploadSingle
} = require("../controllers/songs.controller");

// Pesquisa
router.get("/search", authMiddleware, searchSongs);

// Upload único (mantém compatibilidade)
router.post("/upload", 
  authMiddleware, 
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }
      next();
    });
  }, 
  uploadSong
);

// Upload múltiplo (novo endpoint)
router.post("/upload-multiple", 
  authMiddleware,
  (req, res, next) => {
    uploadMultiple.array("files", 100)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }
      next();
    });
  },
  uploadMultipleSongs
);

// Upload com progresso streaming (opcional)
router.post("/upload-stream",
  authMiddleware,
  (req, res, next) => {
    uploadMultiple.array("files", 100)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }
      next();
    });
  },
  uploadMultipleWithProgress
);

// Rotas CRUD existentes
router.get("/", authMiddleware, getUserSongs);
router.post("/", authMiddleware, createSong);
router.get("/:id", authMiddleware, getSong);
router.put("/:id", authMiddleware, updateSong);
router.delete("/:id", authMiddleware, deleteSong);

module.exports = router;