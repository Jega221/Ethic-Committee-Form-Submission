const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Add process action endpoint (approve/rejected)
router.post('/', async (req, res) => {
  const { application_id, action } = req.body;

  try {
    /* ----------------------------------
       1. Extract & verify token
    ----------------------------------- */
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!Array.isArray(user.roles)) {
      return res.status(403).json({ message: 'User roles missing in token' });
    }

    /* ----------------------------------
       2. Validate input
    ----------------------------------- */
    if (!application_id || !action) {
      return res.status(400).json({
        message: 'application_id and action are required'
      });
    }

    /* ----------------------------------
       3. Load process + workflow steps
    ----------------------------------- */
    const procRes = await pool.query(
      `
      SELECT p.*, w.steps, w.status AS workflow_status
      FROM process p
      JOIN workflow w ON p.workflow_id = w.id
      WHERE p.application_id = $1
      `,
      [application_id]
    );

    if (procRes.rows.length === 0) {
      return res.status(404).json({ message: 'Process not found' });
    }

    const proc = procRes.rows[0];

    if (proc.workflow_status !== 'current') {
      return res.status(400).json({ message: 'Workflow not active' });
    }

    const { steps, current_step } = proc;

    if (!current_step) {
      return res.status(400).json({ message: 'Current step not set' });
    }

    /* ----------------------------------
       4. ROLE ↔ STEP AUTHORIZATION (FIX)
    ----------------------------------- */
    const isSuperAdmin = user.roles.includes('super_admin');

    if (!isSuperAdmin && !user.roles.includes(current_step)) {
      return res.status(403).json({
        message: `Access denied. Step "${current_step}" requires role "${current_step}"`
      });
    }

    /* ----------------------------------
       5. Find current index
    ----------------------------------- */
    const index = steps.indexOf(current_step);
    if (index === -1) {
      return res.status(400).json({
        message: 'Current step not part of workflow'
      });
    }

    /* ----------------------------------
       6. APPROVE
    ----------------------------------- */
    if (action.toLowerCase() === 'approve') {
      if (current_step === 'done') {
        return res.status(400).json({ message: 'Process already completed' });
      }

      const newCurrent = steps[index + 1] || 'done';
      const newNext = steps[index + 2] || null;

      const update = await pool.query(
        `
        UPDATE process
        SET current_step = $1,
            next_step = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
        `,
        [newCurrent, newNext, proc.id]
      );

      return res.json({
        message: 'Process approved',
        process: update.rows[0]
      });
    }

    /* ----------------------------------
       7. REJECT
    ----------------------------------- */
    if (['reject', 'rejected'].includes(action.toLowerCase())) {
      const first = steps[0];
      const second = steps[1] || null;

      const update = await pool.query(
        `
        UPDATE process
        SET current_step = $1,
            next_step = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
        `,
        [first, second, proc.id]
      );

      return res.json({
        message: 'Process rejected and reset',
        process: update.rows[0]
      });
    }

    return res.status(400).json({
      message: 'Invalid action (use approve or reject)'
    });

  } catch (err) {
    console.error('Process error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
