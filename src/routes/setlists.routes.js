const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware"); // Remove curly braces
const { createSetlist, getUserSetlists, addItemToSetlist, getSetlistItems } = require("../controllers/setlists.controller");

router.post("/", authMiddleware, createSetlist);
router.get("/", authMiddleware, getUserSetlists);
router.post("/:id/items", authMiddleware, addItemToSetlist);
router.get("/:id/items", authMiddleware, getSetlistItems);

module.exports = router;