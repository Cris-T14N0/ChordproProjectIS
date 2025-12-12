const pool = require("../models/db");

// Perfil do utilizador autenticado (NOVO)
async function getMyProfile(req, res) {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email FROM users WHERE id = ?", 
      [req.userId] // vem do middleware de autenticação
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: "Erro ao buscar perfil" });
  }
}

// Ver perfil público e cifras públicas (JÁ EXISTENTE)
async function getUserProfile(req, res) {
  const [users] = await pool.query(
    "SELECT id, username FROM users WHERE username = ?", 
    [req.params.username]
  );
  const user = users[0];
  if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });
  
  const [cifras] = await pool.query(
    "SELECT * FROM cifras WHERE user_id = ? AND is_public = 1",
    [user.id]
  );
  res.json({ user, cifras });
}

module.exports = { 
  getMyProfile,    // NOVO
  getUserProfile 
};