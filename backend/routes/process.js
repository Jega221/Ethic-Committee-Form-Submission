const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Add process action endpoint (approve/rejected)
router.post('/', async (req, res) => {
  const { application_id, action } = req.body;
  // Authorization: token in Authorization header (supports "Bearer <token>" or raw token)
  try {
    const authHeader = req.header('Authorization') || req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!application_id || !action) {
      return res.status(400).json({ message: 'application_id and action are required' });
    }

    // Load process with workflow steps
    const procRes = await pool.query(
      `SELECT p.*, w.first_step, w.second_step, w.third_step, w.fourth_step, w.fifth_step, w.status as workflow_status
       FROM process p
       JOIN workflow w ON p.workflow_id = w.id
       WHERE p.application_id = $1`,
      [application_id]
    );

    if (procRes.rows.length === 0) {
      return res.status(404).json({ message: 'Process not found for given application_id' });
    }

    const proc = procRes.rows[0];

    // Check workflow is active
    if (proc.workflow_status !== 'current') {
      return res.status(400).json({ message: 'Workflow is not currently in use' });
    }

    const currentStep = proc.current_step;
    if (!currentStep) {
      return res.status(400).json({ message: 'Current step is not set' });
    }

    // Role authorization mapping
    // Numeric role values presumed:
    // 1 = researcher, 2 = doctor (supervisor), 3 = dean, 4 = vice-dean, 5 = rector, 6 = committee
    const userRole = user.role;
    const isSuperAdmin = (typeof userRole === 'string' && userRole === 'super_admin');
    const allowedForStep = (step) => {
      switch (step) {
        case 'supervisor': return [2]; // doctor
        case 'faculty': return [3, 4]; // dean or vice-dean
        case 'committee': return [6]; // committee (assumed role id 6)
        case 'rectorate': return [5]; // rector
        case 'done': return []; // no one
        default: return [];
      }
    };

    if (!isSuperAdmin) {
      const allowed = allowedForStep(currentStep);
      // if allowed array empty and not super admin => forbidden
      if (!allowed.includes(userRole)) {
        return res.status(403).json({ message: 'Access forbidden for this workflow step' });
      }
    }

    const steps = [
      proc.first_step,
      proc.second_step,
      proc.third_step,
      proc.fourth_step,
      proc.fifth_step
    ].filter(Boolean);

    const idx = steps.indexOf(currentStep);

    if (action.toLowerCase() === 'approve') {
      if (currentStep === 'done') {
        return res.status(400).json({ message: 'Process is already completed' });
      }
      if (idx === -1) {
        return res.status(400).json({ message: 'Current step is not part of workflow steps' });
      }

      const nextStep = steps[idx + 1] || null; // may be 'done' or undefined
      const nextNextStep = steps[idx + 2] || null;

      // If nextStep is null and last step wasn't 'done', but the workflow's last value might be 'done'
      // We set current to nextStep if exists, otherwise set to 'done' if last of workflow equals 'done'
      let newCurrent = nextStep;
      let newNext = nextNextStep;

      // If there is no nextStep but the last defined step is 'done', set current to 'done'
      if (!newCurrent) {
        const lastDefined = steps[steps.length - 1];
        if (lastDefined === 'done') newCurrent = 'done';
      }

      // If still no newCurrent, set to 'done' as safe fallback
      if (!newCurrent) newCurrent = 'done';
      // For 'done' next should be null
      if (newCurrent === 'done') newNext = null;

      const updateRes = await pool.query(
        `UPDATE process SET current_step = $1, next_step = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
        [newCurrent, newNext, proc.id]
      );

      return res.json({ message: 'Process updated (approved)', process: updateRes.rows[0] });
    }

    if (action.toLowerCase() === 'rejected' || action.toLowerCase() === 'reject') {
      // Reset to first step of workflow
      const first = proc.first_step || null;
      const second = proc.second_step || null;

      if (!first) {
        return res.status(400).json({ message: 'Workflow first step not defined' });
      }

      const updateRes = await pool.query(
        `UPDATE process SET current_step = $1, next_step = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
        [first, second, proc.id]
      );

      return res.json({ message: 'Process reset to first step (rejected)', process: updateRes.rows[0] });
    }

    if (action.toLowerCase() === 'revision' || action.toLowerCase() === 'modification') {
      // Reset to first step of workflow and set status to 'Revision Requested'
      const first = proc.first_step || null;
      const second = proc.second_step || null;

      if (!first) {
        return res.status(400).json({ message: 'Workflow first step not defined' });
      }

      await pool.query('BEGIN');
      try {
        const updateProcRes = await pool.query(
          `UPDATE process SET current_step = $1, next_step = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
          [first, second, proc.id]
        );

        await pool.query(
          `UPDATE application SET status = 'Revision Requested' WHERE application_id = $1`,
          [application_id]
        );

        await pool.query('COMMIT');
        return res.json({ message: 'Revision requested (reset to first step)', process: updateProcRes.rows[0] });
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    }

    return res.status(400).json({ message: 'Invalid action. Use "approve", "rejected", or "revision".' });
  } catch (err) {
    console.error('Process action error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
