const bcrypt = require("bcryptjs");
const pool = require("../models/db");
const { generateToken } = require("../utils/jwt");

// Registo
async function registerUser(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Campos faltando" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", 
      [username, email, hashed]
    );
    res.json({ message: "Utilizador registado com sucesso" });
  } catch (error) {
    console.error('Erro ao registar utilizador:', error);
    res.status(500).json({ message: "Erro no servidor" });
  }
}

// Login - Sets HTTP-only cookie
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email e password são obrigatórios" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    
    if (!user) {
      return res.status(400).json({ message: "Email ou password inválidos" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(400).json({ message: "Email ou password inválidos" });
    }

    // Generate token
    const token = generateToken(user);
    
    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Return success
    res.json({ 
      message: "Login bem-sucedido",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: "Erro no servidor" });
  }
}

// Get current user info
async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [req.userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    res.status(500).json({ message: "Erro no servidor" });
  }
}

// Update username
async function updateUsername(req, res) {
  try {
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: "Username não pode estar vazio" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username deve ter pelo menos 3 caracteres" });
    }

    if (username.length > 50) {
      return res.status(400).json({ message: "Username deve ter no máximo 50 caracteres" });
    }

    // Check if username already exists (for another user)
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, req.userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Este username já está em uso" });
    }

    // Update username
    await pool.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [username.trim(), req.userId]
    );

    res.json({ message: "Username atualizado com sucesso" });
  } catch (error) {
    console.error('Erro ao atualizar username:', error);
    res.status(500).json({ message: "Erro no servidor" });
  }
}

// Update password
async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "A nova password deve ter pelo menos 6 caracteres" });
    }

    // Get current user with password
    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [req.userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      return res.status(400).json({ message: "Password atual incorreta" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hashedPassword, req.userId]
    );

    res.json({ message: "Password atualizada com sucesso" });
  } catch (error) {
    console.error('Erro ao atualizar password:', error);
    res.status(500).json({ message: "Erro no servidor" });
  }
}

// Logout
async function logoutUser(req, res) {
  res.clearCookie("token");
  res.json({ message: "Logout bem-sucedido" });
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUsername,
  updatePassword,
  logoutUser
};