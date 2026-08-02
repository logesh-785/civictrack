const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verifies a valid JWT for any logged-in user (citizen or admin)
function verifyToken(req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Session expired or invalid. Please log in again." });
    }
    req.user = decoded; // { id, role, name, email }
    next();
  });
}

// Only allows requests where the decoded token has role = admin
function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only." });
    }
    next();
  });
}

module.exports = { verifyToken, verifyAdmin };
