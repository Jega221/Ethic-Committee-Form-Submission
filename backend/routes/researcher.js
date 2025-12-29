// routes/researcher.js
const express = require("express");
const router = express.Router();
const pool = require("../db/index"); // make sure this points to your working DB file

const { verifyToken } = require("../middlewares/superAdminMiddelware");

// GET all researchers
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM researcher");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching researchers:", error.message);
    res.status(500).json({ error: "Database query failed" });
  }
});

module.exports = router;
