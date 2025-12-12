const bcrypt = require("bcryptjs");
const pool = require("../models/db");
const { generateToken } = require("../utils/jwt");

// Registo
async function registerUser(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: "Campos faltando" });

  const hashed = await bcrypt.hash(password, 10);
  await pool.query("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", [username, email, hashed]);
  res.json({ message: "Utilizador registado com sucesso" });
}

// Login
async function loginUser(req, res) {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];
  if (!user) return res.status(400).json({ message: "Email ou password inválidos" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(400).json({ message: "Email ou password inválidos" });

  const token = generateToken(user);
  res.json({ token });
}

module.exports = { registerUser, loginUser };