const pool = require("../models/db");

// Criar cifra
async function createCifra(req, res) {
  try {
    const { title, artist, is_public } = req.body;
    const file_path = req.file.path;
    await pool.query(
      "INSERT INTO cifras (user_id, title, artist, file_path, is_public) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, title, artist, file_path, is_public || 1]
    );
    res.json({ message: "Cifra criada" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Listar cifras do utilizador
async function getUserCifras(req, res) {
  const [rows] = await pool.query("SELECT * FROM cifras WHERE user_id = ?", [req.user.id]);
  res.json(rows);
}

// Listar cifras públicas
async function getPublicCifras(req, res) {
  const [rows] = await pool.query("SELECT * FROM cifras WHERE is_public = 1");
  res.json(rows);
}

// Ver cifra específica
async function getCifraById(req, res) {
  const [rows] = await pool.query("SELECT * FROM cifras WHERE id = ?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Cifra não encontrada" });
  res.json(rows[0]);
}

module.exports = { createCifra, getUserCifras, getPublicCifras, getCifraById };
