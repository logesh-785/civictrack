const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyAdmin } = require("../middleware/auth");

// ---------- PUT /api/admin/issues/:id/status ----------
router.put("/issues/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const valid = ["Reported", "In Progress", "Resolved"];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const [result] = await pool.query("UPDATE issues SET status = ? WHERE issue_id = ?", [
      status,
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Issue not found." });
    }

    await pool.query(
      "INSERT INTO status_updates (issue_id, updated_by, status, remarks) VALUES (?, 'Administrator', ?, ?)",
      [req.params.id, status, remarks || null]
    );

    res.json({ message: "Status updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status." });
  }
});

// ---------- GET /api/admin/users ----------
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.created_at,
              COUNT(i.issue_id) AS issues_reported
       FROM users u LEFT JOIN issues i ON u.user_id = i.user_id
       GROUP BY u.user_id ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// ---------- DELETE /api/admin/issues/:id ----------
// ----------- DELETE /api/admin/issues/:id -----------
router.delete("/issues/:id", verifyAdmin, async (req, res) => {
  try {
    // 1. Muthaula antha issue-ku related aana status updates-ah delete panrathu
    await pool.query("DELETE FROM status_updates WHERE issue_id = ?", [req.params.id]);

    // 2. Aparam issues table-la irunthu main issue-ah delete panrathu
    const [result] = await pool.query("DELETE FROM issues WHERE issue_id = ?", [req.params.id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ message: "Issue not found." });
    res.json({ message: "Issue deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete issue." });
  }
});

module.exports = router;
