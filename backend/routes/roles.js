const express = require('express');
const router = express.Router();
const pool = require('../db');
require('dotenv').config();
const { verifyToken, isSuperAdmin } = require('../middlewares/superAdminMiddelware');

// Assign role to a user (idempotent)
router.put('/setRole', verifyToken, isSuperAdmin, async (req, res) => {
  const { user_id, role_id } = req.body;
  if (!user_id || !role_id) return res.status(400).json({ message: 'user_id and role_id required' });

  try {
    // ensure user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    // insert if not exists
    const existing = await pool.query('SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2', [user_id, role_id]);
    if (existing.rows.length === 0) {
      await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user_id, role_id]);
    }

    res.json({ message: 'Role assigned' });
  } catch (err) {
    console.error('setRole error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new role
router.post('/roles', verifyToken, isSuperAdmin, async (req, res) => {
  const { role_name } = req.body;
  if (!role_name) return res.status(400).json({ message: 'role_name required' });

  try {
    // check duplicate
    const dup = await pool.query('SELECT id FROM roles WHERE role_name = $1', [role_name]);
    if (dup.rows.length > 0) return res.status(400).json({ message: 'Role already exists' });

    const insert = await pool.query('INSERT INTO roles (role_name) VALUES ($1) RETURNING *', [role_name]);
    res.status(201).json({ message: 'Role created', role: insert.rows[0] });
  } catch (err) {
    console.error('create role error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;