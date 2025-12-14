const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ficheiros estáticos e públicos
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Page routes (EJS templates)
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Add editor route
app.get("/editor", (req, res) => {
  res.render("editor");
});

app.get("/editor/:id", (req, res) => {
  res.render("editor");
});

// Viewer route (simples como o editor)
app.get("/viewer/:id", (req, res) => {
  res.render("viewer");
});

// Authentication
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Authenticated Views
app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/library", (req, res) => {
  res.render("library");
});

app.get("/setlists", (req, res) => {
  res.render("setlists");
});

// User Management
app.get("/profile", (req, res) => {
  res.render("profile");
});

// API Routes
console.log("Loading auth routes...");
try {
  app.use("/api/auth", require("./routes/auth.routes"));
  console.log("Auth routes loaded successfully");
} catch (error) {
  console.error("Error loading auth routes:", error);
}

console.log("Loading cifras routes...");
try {
  app.use("/api/cifras", require("./routes/songs.routes"));
  console.log("Cifras routes loaded successfully");
} catch (error) {
  console.error("Error loading cifras routes:", error);
}

console.log("Loading setlists routes...");
try {
  app.use("/api/setlists", require("./routes/setlists.routes"));
  console.log("Setlists routes loaded successfully");
} catch (error) {
  console.error("Error loading setlists routes:", error);
}

console.log("Loading users routes...");
try {
  app.use("/api/users", require("./routes/users.routes"));
  console.log("Users routes loaded successfully");
} catch (error) {
  console.error("Error loading users routes:", error);
}

console.log("Loading songs routes...");
try {
  app.use("/api/songs", require("./routes/songs.routes"));
  console.log("Songs routes loaded successfully");
} catch (error) {
  console.error("Error loading songs routes:", error);
}

module.exports = app;