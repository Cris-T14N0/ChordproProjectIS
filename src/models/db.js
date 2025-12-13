const mysql = require("mysql2/promise");

// Configuração direta, sem .env
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "chordpro_db"
});

module.exports = pool;