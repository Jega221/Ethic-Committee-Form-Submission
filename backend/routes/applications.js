// backend/routes/applications.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  submitApplication, 
  getAllApplications, 
  updateApplicationStatus,
  getApplicationReviews,
  getArchivedApplications
 } = require('../controllers/applicationController');
const pool = require('../db/index');

// set up multer to store files in backend/uploads temporarily
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => {
    // keep original name - you can change to timestamp or uuid
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET all applications
router.get('/', getAllApplications);

// Get applications by researcher ID
router.get('/researcher/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        a.application_id,
        a.title,
        a.description,
        a.status,
        a.submission_date
      FROM application a
      WHERE a.researcher_id = $1
      ORDER BY a.submission_date DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching researcher applications:', error.message);
    res.status(500).json({ error: 'Failed to fetch researcher applications' });
  }
});


// POST submit a new application with documents
router.post('/', upload.array('documents', 5), submitApplication);

// Update application status (Approve / Reject / Revision)
router.patch('/:id/status', updateApplicationStatus);

// GET all reviews for one application
router.get('/:id/reviews', getApplicationReviews);

// GET archived applications
router.get('/archived', getArchivedApplications);




module.exports = router;

