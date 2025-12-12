const pool = require("../models/db");

// Criar setlist
async function createSetlist(req, res) {
  const { name, is_public } = req.body;
  await pool.query(
    "INSERT INTO setlists (user_id, name, is_public) VALUES (?, ?, ?)",
    [req.user.id, name, is_public || 0]
  );
  res.json({ message: "Setlist criada" });
}

// Listar setlists do utilizador
async function getUserSetlists(req, res) {
  const [rows] = await pool.query("SELECT * FROM setlists WHERE user_id = ?", [req.user.id]);
  res.json(rows);
}

// Adicionar cifra à setlist
async function addItemToSetlist(req, res) {
  const { cifra_id, position } = req.body;
  await pool.query(
    "INSERT INTO setlist_items (setlist_id, cifra_id, position) VALUES (?, ?, ?)",
    [req.params.id, cifra_id, position || 0]
  );
  res.json({ message: "Cifra adicionada à setlist" });
}

// Listar itens da setlist
async function getSetlistItems(req, res) {
  const [rows] = await pool.query(
    `SELECT si.id, c.title, c.artist, c.file_path, si.position
     FROM setlist_items si
     JOIN cifras c ON si.cifra_id = c.id
     WHERE si.setlist_id = ? ORDER BY si.position`,
    [req.params.id]
  );
  res.json(rows);
}

module.exports = { createSetlist, getUserSetlists, addItemToSetlist, getSetlistItems };
