console.log("server.js iniciado");

try {
  console.log("Attempting to require app.js...");
  const app = require("./app");
  console.log("app.js loaded successfully");

  const PORT = process.env.PORT || 3000;
  
  const server = app.listen(PORT, () => {
    console.log(`Servidor a correr no http://localhost:${PORT}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

} catch (error) {
  console.error("Error during server startup:", error);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}