const express = require('express');
const router = express.Router();
const pool = require('../db'); //pg Pool connection
const { verifyToken, isSuperAdmin } = require('../middlewares/superAdminMiddelware'); // your middleware

// -------------------------------
// GET all workflows (protected)
// -------------------------------
router.get('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workflow ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------------------
// UPDATE workflow status to 'current' (protected)
// Only one workflow can be 'current'
// -------------------------------
router.put('/:id/set-current', verifyToken, isSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('BEGIN'); // start transaction

    // 1. Set all workflows to 'no_in_use'
    await pool.query(`UPDATE workflow SET status = 'no_in_use' WHERE status = 'current'`);

    // 2. Set the selected workflow to 'current'
    const updateResult = await pool.query(
      `UPDATE workflow SET status = 'current' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (updateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await pool.query('COMMIT');

    res.json({
      message: 'Workflow set to current successfully',
      workflow: updateResult.rows[0]
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------------------
// CREATE new workflow (protected, no duplicates)
// -------------------------------
router.post('/', verifyToken, isSuperAdmin, async (req, res) => {
  const { steps } = req.body;

  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'Steps must be a non-empty array' });
  }

  try {
    /* ----------------------------------
       1. Validate steps exist in roles
    ----------------------------------- */
    const rolesResult = await pool.query(
      `SELECT role_name FROM roles WHERE role_name = ANY($1::text[])`,
      [steps]
    );

    if (rolesResult.rows.length !== steps.length) {
      return res.status(400).json({
        error: 'One or more steps do not exist in roles table'
      });
    }

    /* ----------------------------------
       2. Prevent duplicate workflows
    ----------------------------------- */
    const duplicateCheck = await pool.query(
      `SELECT id FROM workflow WHERE steps = $1::text[]`,
      [steps]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Duplicate workflow exists' });
    }

    /* ----------------------------------
       3. Insert workflow
    ----------------------------------- */
    const insertResult = await pool.query(
      `INSERT INTO workflow (steps)
       VALUES ($1::text[])
       RETURNING *`,
      [steps]
    );

    res.status(201).json({
      message: 'Workflow created successfully',
      workflow: insertResult.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
