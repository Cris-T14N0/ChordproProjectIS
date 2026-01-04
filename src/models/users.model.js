const pool = require("./db");

const UserModel = {
  // ============================
  // Buscar Utilizadores
  // ============================

  // Busca um utilizador pelo ID
  async findById(userId) {
    const [users] = await pool.query(
      "SELECT id, username, email FROM users WHERE id = ?",
      [userId]
    );
    return users[0];
  },

  // Busca um utilizador pelo username
  async findByUsername(username) {
    const [users] = await pool.query(
      "SELECT id, username FROM users WHERE username = ?",
      [username]
    );
    return users[0];
  },

  // Busca um utilizador pelo email (para login)
  async findByEmail(email) {
    const [users] = await pool.query(
      "SELECT id, username, email, password FROM users WHERE email = ?",
      [email]
    );
    return users[0];
  },

  // ============================
  // Criar Utilizador
  // ============================

  // Cria um utilizador novo
  async create(username, email, hashedPassword) {
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    return result.insertId;
  },

  // ============================
  // Atualizar Perfil
  // ============================

  // Atualiza o username
  async updateUsername(userId, newUsername) {
    await pool.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [newUsername, userId]
    );
  },

  // Atualiza o email
  async updateEmail(userId, newEmail) {
    await pool.query(
      "UPDATE users SET email = ? WHERE id = ?",
      [newEmail, userId]
    );
  },

  // Atualiza a password
  async updatePassword(userId, hashedPassword) {
    await pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );
  },

  // ============================
  // Verificações
  // ============================

  // Verifica se um username já existe
  async usernameExists(username) {
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    return rows.length > 0;
  },

  // Verifica se um email já existe
  async emailExists(email) {
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0;
  }
};

module.exports = UserModel;