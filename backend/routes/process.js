const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper to map template step names to database Enum values
const mapToEnum = (stepName) => {
  if (!stepName) return null;
  const lower = stepName.toLowerCase().trim();

  if (lower.includes('faculty')) return 'faculty_admin';
  if (lower.includes('committee')) return 'committee_member';
  if (lower.includes('rector')) return 'rector';
  if (lower.includes('supervisor')) return 'supervisor';
  if (lower === 'admin') return 'done'; // Map to done if it's the final step
  if (lower === 'done') return 'done';

  return lower;
};

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

    // Helper to parse Postgres array string if needed
    const parseSteps = (s) => {
      if (Array.isArray(s)) return s;
      if (typeof s === 'string') {
        // Remove {} and split by comma, handling quotes
        // This is a naive parser but works for simple role names
        return s.replace(/^{|}$/g, '')
          .split(',')
          .map(item => {
            // Remove wrapping double quotes if present
            if (item.startsWith('"') && item.endsWith('"')) {
              return item.slice(1, -1);
            }
            return item;
          });
      }
      return [];
    };

    const steps = parseSteps(proc.steps);
    const current_step = proc.current_step;

    if (proc.workflow_status !== 'current') {
      try { require('fs').appendFileSync('process_debug.log', `INFO: Workflow is ${proc.workflow_status} (not current), but proceeding for existing application ${application_id}\n`); } catch (e) { }
      // We allow processing existing applications even if the workflow is no longer the active "current" template.
    }

    if (!current_step) {
      try { require('fs').appendFileSync('process_debug.log', `ERROR: Current step not set\n`); } catch (e) { }
      return res.status(400).json({ message: 'Current step not set' });
    }

    /* ----------------------------------
       4. ROLE ↔ STEP AUTHORIZATION (FIX)
    ----------------------------------- */
    const isSuperAdmin = user.roles.includes('super_admin');

    // NORMALIZE CHECK:
    // User roles in JWT are normalized (e.g. 'Faculty Admin' -> 'faculty_admin')
    // current_step is DB Enum (e.g. 'faculty', 'committee', 'rectorate')

    let hasAccess = false;
    const roles = user.roles || [];
    const step = current_step; // current_step is now normalized in DB or should be matched exactly

    if (isSuperAdmin) {
      hasAccess = true;
    } else if (step === 'faculty_admin' && roles.includes('faculty_admin')) {
      hasAccess = true;
    } else if (step === 'committee_member' && roles.includes('committee_member')) {
      hasAccess = true;
    } else if (step === 'rector' && roles.includes('rector')) {
      hasAccess = true;
    } else if (roles.includes(step)) {
      hasAccess = true;
    }

    // Log access check for debugging
    const authLog = `AUTH: UserID=${user.id} CurrentStep=${current_step} Roles=${JSON.stringify(roles)} HasAccess=${hasAccess}`;
    console.log(authLog);
    try { require('fs').appendFileSync('process_debug.log', authLog + '\n'); } catch (e) { }

    if (!hasAccess) {
      const msg = `Access denied. Step "${current_step}" requires appropriate role. User roles: ${JSON.stringify(roles)}`;
      try { require('fs').appendFileSync('process_debug.log', `ERROR: ${msg}\n`); } catch (e) { }
      return res.status(403).json({
        message: `Access denied. Step "${current_step}" requires appropriate role.`
      });
    }

    /* ----------------------------------
       5. Find current index (Robust)
    ----------------------------------- */
    // Try direct match first
    let actualIndex = steps.findIndex(s => s.toLowerCase() === current_step.toLowerCase());

    // If no direct match, try fuzzy match (mapping workflow step names to Enums)
    if (actualIndex === -1) {
      actualIndex = steps.findIndex(s => {
        const mapped = mapToEnum(s);
        return mapped === current_step.toLowerCase();
      });
    }

    if (actualIndex === -1) {
      console.error(`Process Error: Step "${current_step}" not found in workflow steps`, steps);
      const msg = `Current step '${current_step}' not part of workflow: ${JSON.stringify(steps)}`;
      try { require('fs').appendFileSync('process_debug.log', `ERROR: ${msg}\n`); } catch (e) { }
      return res.status(400).json({
        message: `Current step '${current_step}' not part of workflow`
      });
    }


    /* ----------------------------------
       6. APPROVE
    ----------------------------------- */
    if (action.toLowerCase() === 'approve') {
      if (current_step === 'done') {
        return res.status(400).json({ message: 'Process already completed' });
      }

      const nextStepRaw = steps[actualIndex + 1] || 'done';
      const followingStepRaw = steps[actualIndex + 2] || null;

      const newCurrent = mapToEnum(nextStepRaw);
      const newNext = mapToEnum(followingStepRaw);

      const debugInfo = `APPROVE DEBUG: RawNext='${nextStepRaw}' -> Mapped='${newCurrent}' | RawFollow='${followingStepRaw}' -> Mapped='${newNext}'`;
      console.log(debugInfo);
      try { require('fs').appendFileSync('process_debug.log', debugInfo + '\n'); } catch (e) { }

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

      // If finished -> Update application status to Approved
      if (newCurrent === 'done') {
        await pool.query(
          `UPDATE application SET status = 'Approved', is_archived = TRUE WHERE application_id = $1`,
          [application_id]
        );
      }

      return res.json({
        message: 'Process approved' + (newCurrent === 'done' ? ' and application finalized' : ''),
        process: update.rows[0]
      });
    }

    /* ----------------------------------
       7. REJECT
    ----------------------------------- */
    if (['reject', 'rejected'].includes(action.toLowerCase())) {
      const firstRaw = steps[0];
      const secondRaw = steps[1] || null;

      const first = mapToEnum(firstRaw);
      const second = mapToEnum(secondRaw);

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

    /* ----------------------------------
       8. REVISION
    ----------------------------------- */
    /* ----------------------------------
       8. REVISION
    ----------------------------------- */
    if (action.toLowerCase() === 'revision') {
      const { comment } = req.body;

      // Update application status
      await pool.query(
        `UPDATE application SET status = 'Revision Requested' WHERE application_id = $1`,
        [application_id]
      );

      // Add review comment
      if (comment) {
        await pool.query(
          `INSERT INTO application_reviews (application_id, comment, status, review_date)
           VALUES ($1, $2, 'Revision Requested', NOW())`,
          [application_id, comment]
        );
      }

      // RESET WORKFLOW TO START (Start Again)
      const firstRaw = steps[0];
      const secondRaw = steps[1] || null;

      const first = mapToEnum(firstRaw);
      const second = mapToEnum(secondRaw);

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
        message: 'Revision requested and process reset',
        status: 'Revision Requested',
        process: update.rows[0]
      });
    }

    const errMsg = `Invalid action "${action}"`;
    try { require('fs').appendFileSync('process_error.log', errMsg + '\n'); } catch (e) { }
    return res.status(400).json({
      message: 'Invalid action (use approve, reject, or revision)'
    });

  } catch (err) {
    console.error('Process error:', err);
    try {
      require('fs').appendFileSync('process_error.log', `[${new Date().toISOString()}] Process Error: ${err.message}\nStack: ${err.stack}\n\n`);
    } catch (fsErr) { console.error('Failed to write log', fsErr); }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});



module.exports = { router, mapToEnum };
