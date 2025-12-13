const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.userId;
    const uploadDir = path.join(__dirname, "../../uploads/songs/user_" + userId);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename with UTF-8 encoding
    const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, originalName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".chopro", ".chordpro", ".cho", ".crd", ".pro"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas ficheiros ChordPro são permitidos (.chopro, .chordpro, .cho, .crd, .pro)"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

module.exports = upload;