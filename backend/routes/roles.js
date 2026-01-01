const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isSuperAdmin } = require('../middlewares/superAdminMiddelware');

router.put('/setRole', verifyToken, isSuperAdmin, async (req, res) => {
  const { user_id, role_id } = req.body;

  if (!user_id || !role_id) {
    return res.status(400).json({ message: 'user_id and role_id are required' });
  }

  try {
    /* ---------------------------
       1. Check user exists
    ---------------------------- */
    const userRes = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User does not exist' });
    }

    /* ---------------------------
       2. Check role exists
    ---------------------------- */
    const roleRes = await pool.query(
      'SELECT id FROM roles WHERE id = $1',
      [role_id]
    );

    if (roleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Role does not exist' });
    }

    /* ---------------------------
       3. Prevent duplicate
    ---------------------------- */
    const exists = await pool.query(
      `
      SELECT 1 FROM user_roles
      WHERE user_id = $1 AND role_id = $2
      `,
      [user_id, role_id]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: 'User already has this role' });
    }

    /* ---------------------------
       4. Assign role
    ---------------------------- */
    await pool.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      `
      ,
      [user_id, role_id]
    );

    res.status(201).json({
      message: 'Role assigned successfully'
    });

  } catch (err) {
    console.error('Role assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;