const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// ---------- Photo upload config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
    cb(ok ? null : new Error("Only JPG, PNG or WEBP images are allowed."), ok);
  },
});

// ---------- POST /api/issues  (report a new issue) ----------
router.post("/", verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const { title, category, description, location, latitude, longitude } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required." });
    }

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO issues (user_id, title, category, description, photo_url, location, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        category,
        description || null,
        photo_url,
        location || null,
        latitude || null,
        longitude || null,
      ]
    );

    await pool.query(
      `INSERT INTO status_updates (issue_id, updated_by, status, remarks) VALUES (?, ?, 'Reported', 'Issue submitted by citizen')`,
      [result.insertId, req.user.name]
    );

    res.status(201).json({ message: "Issue reported successfully.", issue_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to report issue." });
  }
});

// ---------- GET /api/issues  (all issues - for browse / admin, supports filters) ----------
router.get("/", async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let sql = `SELECT i.*, u.name AS reporter_name FROM issues i JOIN users u ON i.user_id = u.user_id WHERE 1=1`;
    const params = [];

    if (status) {
      sql += " AND i.status = ?";
      params.push(status);
    }
    if (category) {
      sql += " AND i.category = ?";
      params.push(category);
    }
    if (search) {
      sql += " AND (i.title LIKE ? OR i.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY i.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch issues." });
  }
});

// ---------- GET /api/issues/mine  (current citizen's own issues) ----------
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM issues WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your issues." });
  }
});

// ---------- GET /api/issues/stats  (summary counts for dashboards) ----------
router.get("/stats", async (req, res) => {
  try {
    const [[totals]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Reported') AS reported,
        SUM(status = 'In Progress') AS inProgress,
        SUM(status = 'Resolved') AS resolved
      FROM issues
    `);
    const [byCategory] = await pool.query(
      "SELECT category, COUNT(*) AS count FROM issues GROUP BY category ORDER BY count DESC"
    );
    res.json({ totals, byCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch statistics." });
  }
});

// ---------- GET /api/issues/:id  (single issue with status history) ----------
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, u.name AS reporter_name FROM issues i JOIN users u ON i.user_id = u.user_id WHERE i.issue_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Issue not found." });

    const [history] = await pool.query(
      "SELECT * FROM status_updates WHERE issue_id = ? ORDER BY updated_at ASC",
      [req.params.id]
    );

    res.json({ ...rows[0], history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch issue." });
  }
});

// ---------- POST /api/issues/:id/upvote ----------
router.post("/:id/upvote", verifyToken, async (req, res) => {
  try {
    const issueId = req.params.id;
    const [existing] = await pool.query(
      "SELECT upvote_id FROM upvotes WHERE issue_id = ? AND user_id = ?",
      [issueId, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "You have already upvoted this issue." });
    }

    await pool.query("INSERT INTO upvotes (issue_id, user_id) VALUES (?, ?)", [issueId, req.user.id]);
    await pool.query("UPDATE issues SET upvote_count = upvote_count + 1 WHERE issue_id = ?", [issueId]);

    const [[row]] = await pool.query("SELECT upvote_count FROM issues WHERE issue_id = ?", [issueId]);
    res.json({ message: "Upvoted successfully.", upvote_count: row.upvote_count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upvote issue." });
  }
});

module.exports = router;
