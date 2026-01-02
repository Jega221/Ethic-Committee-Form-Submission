const express = require('express');
const router = express.Router();
const pool = require('../db');
require('dotenv').config();
const { verifyToken, isSuperAdmin } = require('../middlewares/superAdminMiddelware');

// GET all workflows (protected)
router.get('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workflow ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set a workflow as current (transactional)
router.put('/:id/set-current', verifyToken, isSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('BEGIN');
    await pool.query("UPDATE workflow SET status = 'no_in_use' WHERE status = 'current'");
    const updateResult = await pool.query('UPDATE workflow SET status = $1 WHERE id = $2 RETURNING *', ['current', id]);
    if (updateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Workflow not found' });
    }
    await pool.query('COMMIT');
    res.json({ message: 'Workflow set to current successfully', workflow: updateResult.rows[0] });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new workflow (steps is a text[])
router.post('/', verifyToken, isSuperAdmin, async (req, res) => {
  const { name, steps } = req.body; // steps should be an array of role names

  if (!Array.isArray(steps) || steps.length === 0) return res.status(400).json({ message: 'steps must be a non-empty array' });

  try {
    // Validate each step exists as a role
    const roleNames = steps;
    const rolesRes = await pool.query('SELECT role_name FROM roles WHERE role_name = ANY($1)', [roleNames]);
    if (rolesRes.rows.length !== roleNames.length) {
      return res.status(400).json({ message: 'One or more steps reference non-existent roles' });
    }

    // Check duplicate by exact steps array
    const dup = await pool.query('SELECT * FROM workflow WHERE steps = $1', [steps]);
    if (dup.rows.length > 0) return res.status(400).json({ message: 'Duplicate workflow exists' });

    const insert = await pool.query('INSERT INTO workflow (name, steps, status) VALUES ($1, $2, $3) RETURNING *', [name || null, steps, 'no_in_use']);
    res.status(201).json({ message: 'Workflow created', workflow: insert.rows[0] });
  } catch (err) {
    console.error('create workflow error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update workflow (no duplicate check across different id)
router.put('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, steps } = req.body;

  if (steps && (!Array.isArray(steps) || steps.length === 0)) return res.status(400).json({ message: 'steps must be a non-empty array' });

  try {
    const target = await pool.query('SELECT * FROM workflow WHERE id = $1', [id]);
    if (target.rows.length === 0) return res.status(404).json({ message: 'Workflow not found' });

    if (steps) {
      const rolesRes = await pool.query('SELECT role_name FROM roles WHERE role_name = ANY($1)', [steps]);
      if (rolesRes.rows.length !== steps.length) return res.status(400).json({ message: 'One or more steps reference non-existent roles' });
    }

    const update = await pool.query('UPDATE workflow SET name = COALESCE($1, name), steps = COALESCE($2, steps) WHERE id = $3 RETURNING *', [name, steps, id]);
    res.json({ message: 'Workflow updated', workflow: update.rows[0] });
  } catch (err) {
    console.error('update workflow error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete workflow
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const del = await pool.query('DELETE FROM workflow WHERE id = $1 RETURNING *', [id]);
    if (del.rows.length === 0) return res.status(404).json({ message: 'Workflow not found' });
    res.json({ message: 'Workflow deleted', workflow: del.rows[0] });
  } catch (err) {
    console.error('delete workflow error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
