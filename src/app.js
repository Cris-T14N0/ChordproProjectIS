const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authMiddleware = require("./middleware/auth.middleware");

const app = express();

// ============================
// ===== Core middleware =====
// ============================
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================
// ===== View engine =========
// ============================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// ============================
// ===== Static files ========
// ============================
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ============================
// ===== Public Pages ========
// ============================
app.get("/", (req, res) => res.redirect("/login"));

app.get("/login", (req, res) => {
  res.render("auth/login");
});

app.get("/register", (req, res) => {
  res.render("auth/register");
});

// ============================
// ===== Protected Pages =====
// ============================
app.get("/dashboard", authMiddleware, (req, res) =>
  res.render("dashboard/dashboard", { user: req.user })
);

app.get("/library", authMiddleware, (req, res) =>
  res.render("dashboard/library", { user: req.user })
);

app.get("/setlists", authMiddleware, (req, res) =>
  res.render("dashboard/setlists", { user: req.user })
);

app.get("/setlist-management", authMiddleware, (req, res) =>
  res.render("dashboard/setlists/setlist-management", { user: req.user })
);

app.get("/profile", authMiddleware, (req, res) =>
  res.render("auth/profile", { user: req.user })
);

app.get("/editor", authMiddleware, (req, res) =>
  res.render("dashboard/songs/editor", { user: req.user })
);

app.get("/editor/:id", authMiddleware, (req, res) =>
  res.render("dashboard/songs/editor", { user: req.user })
);

app.get("/viewer/:id", authMiddleware, (req, res) =>
  res.render("dashboard/songs/viewer", { user: req.user })
);

// ============================
// ===== API Routes ==========
// ============================
try {
  app.use("/api/auth", require("./routes/auth.routes"));
  console.log("Auth routes loaded successfully");
}
catch (error)
{
  console.error("Error loading auth routes:", error);
}

try {
  app.use("/api/songs", require("./routes/songs.routes"));
  console.log("Songs routes loaded successfully");
}
catch (error) {
  console.error("Error loading songs routes:", error);
}

try {
  app.use("/api/setlists", require("./routes/setlists.routes"));
  console.log("Setlists routes loaded successfully");
}
catch (error){
  console.error("Error loading setlists routes:", error);
}

try {
  app.use("/api/users", require("./routes/users.routes"));
  console.log("Users routes loaded successfully");
}
catch (error) {
  console.error("Error loading users routes:", error);
}

// ======================
// ===== 404 ============
// ======================
app.use((req, res) => {
  res.status(404).render("404");
});

module.exports = app;