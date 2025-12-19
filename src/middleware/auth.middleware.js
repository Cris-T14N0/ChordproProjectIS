const { SECRET } = require("../utils/jwt");
const jwt = require("jsonwebtoken");

/**
 * Middleware to protect routes.
 * Expects a JWT stored in an HTTP-only cookie named "token".
 */
function authMiddleware(req, res, next) {
  // Read token from cookies
  const token = req.cookies?.token;

  // If no token, redirect to login page
  if (!token) {
    return res.redirect("/login");
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, SECRET);

    // Attach user info to request object
    req.userId = decoded.id;
    req.user = decoded;

    // Continue to next middleware / route handler
    next();
  } catch (err) {
    console.error("Invalid token:", err.message);
    // Token is invalid or expired → redirect to login
    return res.redirect("/login");
  }
}

module.exports = authMiddleware;