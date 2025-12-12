const jwt = require("jsonwebtoken");

const SECRET = "minha_chave_super_secreta"; // sem .env

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "1d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { generateToken, verifyToken, SECRET };