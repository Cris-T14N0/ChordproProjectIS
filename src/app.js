const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Redirect root to login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Ficheiros estáticos e públicos.
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes - comentar temporariamente para testar
console.log("Loading auth routes...");
try {
  app.use("/api/auth", require("./routes/auth.routes"));
  console.log("Auth routes loaded successfully");
} catch (error) {
  console.error("Error loading auth routes:", error);
}

console.log("Loading cifras routes...");
try {
  app.use("/api/cifras", require("./routes/cifras.routes"));
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

module.exports = app;