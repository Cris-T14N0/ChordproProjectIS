const mysql = require("mysql2/promise");

// Configuração direta, sem .env
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "cifras_app"
});

module.exports = pool;