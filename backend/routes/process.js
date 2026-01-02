const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middlewares/superAdminMiddelware');
const { createNotification } = require('../controllers/notificationController');

router.post('/', verifyToken, async (req, res) => {
  const { application_id, action, comment } = req.body;
  const userRole = req.user.role; // e.g. 4, 2, 5, 'admin', etc.
  const userId = req.user.id;

  // Normalize action
  const act = (action || '').toLowerCase();
  if (!['approve', 'reject', 'rejected', 'revision', 'modification'].includes(act)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    // 1. Get current state
    const procRes = await pool.query('SELECT * FROM process WHERE application_id = $1', [application_id]);
    if (procRes.rows.length === 0) return res.status(404).json({ message: 'Process not found' });
    const proc = procRes.rows[0];
    const currentStep = (proc.current_step || '').toLowerCase();

    // 2. Define Flow
    // Faculty (4) -> Committee (2) -> Rector (5) -> Done

    let nextStep = currentStep;
    let nextStatus = 'Pending';
    let isApproved = (act === 'approve');

    // Authorization Check Helper
    const canAct = (role, step) => {
      const isSuper = ['admin', 'super_admin', 1, 6].includes(role);
      if (isSuper) return true;
      if (step === 'faculty' && role === 4) return true;
      if (step === 'committee' && role === 2) return true;
      if (step === 'rector' && role === 5) return true; // 'rector' step for Rector role
      if (step === 'rectorate' && role === 5) return true; // alias
      return false;
    };

    if (!canAct(userRole, currentStep)) {
      return res.status(403).json({ message: `Access denied. Role ${userRole} cannot act on step ${currentStep}` });
    }

    // 3. Logic
    if (isApproved) {
      if (currentStep === 'faculty') {
        nextStep = 'committee';
      } else if (currentStep === 'committee') {
        nextStep = 'rector';
      } else if (currentStep === 'rector' || currentStep === 'rectorate') {
        nextStep = 'done';
        nextStatus = 'Approved';
      } else {
        return res.status(400).json({ message: 'Cannot approve from current step / process already done' });
      }
    } else {
      // Reject or Revision -> Restart
      // Reset to 'faculty' step so it goes back to the beginning of approval chain
      // Status indicates what happened.
      nextStep = 'faculty';
      if (act === 'reject' || act === 'rejected') nextStatus = 'Rejected';
      else nextStatus = 'Revision Requested';
    }

    // 4. Update DB
    await pool.query('BEGIN');

    // Update Process
    // We update 'next_step' to NULL or something meaningful if we wanted, but sticking to current_step is key.
    const updateProc = await pool.query(
      `UPDATE process SET current_step = $1, updated_at = NOW() WHERE application_id = $2 RETURNING *`,
      [nextStep, application_id]
    );

    // Update Application Status
    await pool.query(
      `UPDATE application SET status = $1 WHERE application_id = $2`,
      [nextStatus, application_id]
    );

    // Auto-archive if Approved/Rejected
    if (['Approved', 'Rejected'].includes(nextStatus)) {
      await pool.query(`UPDATE application SET is_archived = TRUE WHERE application_id = $1`, [application_id]);
    }

    // Insert Review/Comment Record
    // We try to determine if the user is a committee member to link committee_id if possible, or just log the comment
    // For now, simpler: just insert into application_reviews if we can map it, or a generic log table if strictly needed.
    // The previous code in applicationController used 'application_reviews'. Let's use that.
    // We need 'committee_id'. If user is committee (role 2), we find their committee_id.
    let committee_id = null;
    if (userRole === 2) {
      const cRes = await pool.query('SELECT committee_id FROM committee WHERE user_id = $1', [userId]);
      if (cRes.rows.length > 0) committee_id = cRes.rows[0].committee_id;
    }

    if (comment || nextStatus !== 'Pending') {
      await pool.query(
        `INSERT INTO application_reviews (application_id, committee_id, comment, status) VALUES ($1, $2, $3, $4)`,
        [application_id, committee_id, comment || (isApproved ? 'Approved' : nextStatus), nextStatus]
      );
    }

    // 5. Send Notification (if revision)
    if (nextStatus === 'Revision Requested') {
      const appRes = await pool.query('SELECT researcher_id, title FROM application WHERE application_id = $1', [application_id]);
      if (appRes.rows.length > 0) {
        const { researcher_id, title } = appRes.rows[0];
        let msg = `Revision Requested: Your application "${title}" requires modification.`;
        if (comment) {
          msg += ` Reviewer Comment: "${comment}"`;
        }
        await createNotification(researcher_id, application_id, msg);
      }
    }

    await pool.query('COMMIT');

    res.json({
      message: `Process updated: ${act}`,
      process: updateProc.rows[0],
      newStatus: nextStatus
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
