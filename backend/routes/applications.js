// backend/routes/applications.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  submitApplication,
  getAllApplications,
  updateApplicationStatus,
  getApplicationReviews,
  getArchivedApplications,
  modifyApplication
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
  const researcherId = parseInt(id, 10);

  if (isNaN(researcherId)) {
    return res.status(400).json({ error: 'Invalid researcher ID' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        a.application_id,
        a.title,
        a.description,
        a.status,
        a.submission_date,
        p.current_step,
        (
          SELECT json_agg(json_build_object(
            'document_id', d.document_id,
            'file_name', d.file_name,
            'file_type', d.file_type,
            'file_url', d.file_url
          ))
          FROM documents d
          WHERE d.application_id = a.application_id
        ) AS documents
      FROM application a
      LEFT JOIN process p ON a.application_id = p.application_id
      WHERE a.researcher_id = $1
      ORDER BY a.submission_date DESC`,
      [researcherId]
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

// Modify application (only if status = 'Revision Requested')
router.put('/:id', upload.array('documents', 5), modifyApplication);


// GET archived applications
router.get('/archived', getArchivedApplications);




module.exports = router;

