const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

// ---------- POST /api/auth/register ----------
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const [existing] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email, phone || null, password_hash]
    );

    const token = jwt.sign(
      { id: result.insertId, role: "citizen", name, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: { id: result.insertId, name, email, role: "citizen" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

// ---------- POST /api/auth/login (citizen) ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.user_id, role: "citizen", name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user.user_id, name: user.name, email: user.email, role: "citizen" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ---------- POST /api/auth/admin-login ----------
router.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 0, role: "admin", name: "Administrator", email: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return res.json({
      message: "Admin login successful.",
      token,
      user: { id: 0, name: "Administrator", role: "admin" },
    });
  }

  res.status(401).json({ message: "Invalid admin username or password." });
});

module.exports = router;
