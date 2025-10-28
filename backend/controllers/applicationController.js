// backend/controllers/applicationController.js
const pool = require('../db/index');
const path = require('path');

// Submit a new application with documents function
async function submitApplication(req, res) {
  // expected JSON fields in body
  const { researcher_id, department_id, committee_id, title, description } = req.body;
  const files = req.files || []; // multer added files

// Checklist Validation
if (!researcher_id || !department_id || !committee_id || !title || !description) {
  return res.status(400).json({ error: "All form fields are required." });
}

if (!req.files || req.files.length < 2) {
  return res.status(400).json({
    error: "At least 2 documents are required (e.g., research proposal and consent form)."
  });
}


  try {
    // 1) insert application
    const insertAppQuery = `
      INSERT INTO application (researcher_id, department_id, committee_id, title, description, status)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const appResult = await pool.query(insertAppQuery, [
      researcher_id,
      department_id,
      committee_id,
      title,
      description,
      'Pending' // use string status
    ]);
    const application = appResult.rows[0];

    // 2) save document rows (file_url points to local path for now)
    const insertDocQuery = `
      INSERT INTO documents (application_id, file_name, file_type, file_url)
      VALUES ($1,$2,$3,$4) RETURNING *`;

    const docRows = [];
    for (const f of files) {
      // file path relative to server; backend dev will change to S3 URL later.
      const fileUrl = path.join('uploads', f.filename);
      const docRes = await pool.query(insertDocQuery, [
        application.application_id,
        f.originalname,
        f.mimetype,
        fileUrl
      ]);
      docRows.push(docRes.rows[0]);
    }

    // 3) return created application with docs
    res.status(201).json({ application, documents: docRows });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Application submission failed' });
  }
}

// get all applications function, so the admin, faculty, or committee can view every submitted form
async function getAllApplications(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        a.application_id,
        a.title,
        a.description,
        a.status,
        a.submission_date,
        r.first_name AS researcher_first_name,
        r.last_name AS researcher_last_name,
        d.email AS department_email
      FROM application a
      JOIN researcher r ON a.researcher_id = r.researcher_id
      JOIN department d ON a.department_id = d.department_id
      ORDER BY a.submission_date DESC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching applications:", error.message);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}

// PATCH - update application status + add review comment
async function updateApplicationStatus(req, res) {
  const { id } = req.params;
  const { status, comment, committee_id } = req.body;

  try {
    // 1. Update the main application status
    const updateQuery = `
      UPDATE application
      SET status = $1
      WHERE application_id = $2
      RETURNING *;
    `;
    const appResult = await pool.query(updateQuery, [status, id]);
    const updatedApp = appResult.rows[0];

    if (!updatedApp) {
      return res.status(404).json({ error: "Application not found" });
    }

    //Auto-archive when approved or rejected (ADD THIS)
    if (["Approved", "Rejected"].includes(status)) {
      await pool.query(
        `UPDATE application SET is_archived = TRUE WHERE application_id = $1`,
        [id]
      );
    }

    // 2. Insert a review comment
    const insertReview = `
      INSERT INTO application_reviews (application_id, committee_id, comment, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const reviewResult = await pool.query(insertReview, [
      id,
      committee_id || null,
      comment || '',
      status,
    ]);

    res.status(200).json({
      message: `Application status updated to ${status}`,
      application: updatedApp,
      review: reviewResult.rows[0],
    });
  } catch (err) {
    console.error("Error updating application status:", err);
    res.status(500).json({ error: "Failed to update application status" });
  }
}

//Get all reviews for a specific application
async function getApplicationReviews(req, res) {
  const { id } = req.params; // application_id

  try {
    const query = `
      SELECT 
        ar.review_id,
        ar.comment,
        ar.status,
        ar.review_date,
        c.f_name AS committee_first_name,
        c.l_name AS committee_last_name
      FROM application_reviews ar
      JOIN committee c ON ar.committee_id = c.committee_id
      WHERE ar.application_id = $1
      ORDER BY ar.review_date DESC;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No reviews found for this application" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching reviews:", err.message);
    res.status(500).json({ error: "Failed to fetch application reviews" });
  }
}

//Get all archived applications
async function getArchivedApplications(req, res) {
  try {
    const result = await pool.query(`
      SELECT * FROM application
      WHERE is_archived = TRUE
      ORDER BY submission_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching archived apps:", err.message);
    res.status(500).json({ error: "Failed to fetch archived apps" });
  }
}



module.exports = { 
  submitApplication, 
  getAllApplications, 
  updateApplicationStatus,
  getApplicationReviews,
  getArchivedApplications
 };

  
