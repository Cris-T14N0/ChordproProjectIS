// test-db.js
console.log("Testing database connection...");

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "cifras_app"
});

console.log("Pool created");

pool.getConnection()
  .then(connection => {
    console.log("Database connected successfully!");
    connection.release();
  })
  .catch(err => {
    console.error("Database connection error:", err);
  });