const { SECRET } = require("../utils/jwt");
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token não fornecido" });

  try {
    const decoded = jwt.verify(token, SECRET);

    // salva id corretamente
    req.userId = decoded.id;
    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido" });
  }
}

module.exports = authMiddleware;
