const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isSuperAdmin } = require('../middlewares/superAdminMiddelware');

router.put('/setFaculty', verifyToken, isSuperAdmin, async (req, res) => {
  const { id, faculty_id } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0)
      return res.status(400).json({ message: 'Users does not exists' });


    const result = await pool.query(
      `UPDATE users SET faculty_id = $1 WHERE id = $2`, [faculty_id, id]
    );

    res.status(201).json({
      message: 'faculty assignment successful',
      admin: result.rows[0],
    });
  } catch (err) {
    console.error('faculty assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;