console.log("server.js iniciado");

try {
  console.log("Attempting to require app.js...");
  const app = require("./app");
  console.log("app.js loaded successfully");

  const PORT = 3000;
  app.listen(PORT, () => console.log(`Servidor a correr no http://localhost:${PORT}`));
}
catch (error) {
  console.error("Error during server startup:", error);
  process.exit(1);
}