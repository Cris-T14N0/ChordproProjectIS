const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const {
  createSetlist,
  getUserSetlists,
  getSetlist,
  updateSetlist,
  deleteSetlist,
  addItemToSetlist,
  getSetlistItems,
  removeItemFromSetlist,
  reorderItems
} = require("../controllers/setlists.controller");

// Setlist CRUD
router.post("/", authMiddleware, createSetlist);
router.get("/", authMiddleware, getUserSetlists);
router.get("/:id", authMiddleware, getSetlist);
router.put("/:id", authMiddleware, updateSetlist);
router.delete("/:id", authMiddleware, deleteSetlist);

// Setlist items (songs)
router.post("/:id/items", authMiddleware, addItemToSetlist);
router.get("/:id/items", authMiddleware, getSetlistItems);
router.delete("/:id/items/:itemId", authMiddleware, removeItemFromSetlist);
router.put("/:id/items/reorder", authMiddleware, reorderItems);

module.exports = router;