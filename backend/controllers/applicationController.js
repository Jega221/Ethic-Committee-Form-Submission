const pool = require('../db/index');
const path = require('path');

/* 
  APPLICATION CONTROLLER (Updated for unified users + faculties schema)
  --------------------------------------------------------------------
  - user_id instead of researcher_id
  - faculty_id instead of department_id
  - works with committee_id, role-based flow, and file uploads
  - includes checklist validation + auto-archive
*/

// ✅ 1. Submit a new application (Researcher)
async function submitApplication(req, res) {
  const { user_id, faculty_id, committee_id, title, description } = req.body;
  const files = req.files || [];

  // Checklist validation
  if (!user_id || !faculty_id || !committee_id || !title || !description) {
    return res.status(400).json({ error: "All form fields are required." });
  }

  if (!files.length || files.length < 2) {
    return res.status(400).json({
      error: "At least 2 documents are required (e.g., proposal and consent form)."
    });
  }

  try {
    // 1️⃣ Insert application
    const insertAppQuery = `
      INSERT INTO application (researcher_id, faculty_id, committee_id, title, description, status)
      VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *;
    `;
    const appResult = await pool.query(insertAppQuery, [
      user_id,
      faculty_id,
      committee_id,
      title,
      description
    ]);
    const application = appResult.rows[0];

    // 2️⃣ Insert uploaded documents
    const insertDocQuery = `
      INSERT INTO documents (application_id, file_name, file_type, file_url)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const docRows = [];
    for (const f of files) {
      const fileUrl = path.join('uploads', f.filename);
      const docRes = await pool.query(insertDocQuery, [
        application.application_id,
        f.originalname,
        f.mimetype,
        fileUrl
      ]);
      docRows.push(docRes.rows[0]);
    }

    res.status(201).json({ message: "Application submitted successfully", application, documents: docRows });
  } catch (err) {
    console.error("Error submitting application:", err);
    res.status(500).json({ error: "Application submission failed" });
  }
}

// ✅ 2. Get all applications (Admin, Committee, Faculty)
async function getAllApplications(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        a.application_id,
        a.title,
        a.description,
        a.status,
        a.submission_date,
        u.name AS researcher_name,
        u.surname AS researcher_surname,
        f.name AS faculty_name
      FROM application a
      JOIN users u ON a.researcher_id = u.id
      JOIN faculties f ON a.faculty_id = f.id
      ORDER BY a.submission_date DESC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching applications:", error.message);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}

// ✅ 3. Update application status + add committee review
async function updateApplicationStatus(req, res) {
  const { id } = req.params;
  const { status, comment, committee_id } = req.body;

  try {
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

    // Auto-archive approved or rejected
    if (["Approved", "Rejected"].includes(status)) {
      await pool.query(`UPDATE application SET is_archived = TRUE WHERE application_id = $1`, [id]);
    }

    // Insert a review note
    const insertReview = `
      INSERT INTO application_reviews (application_id, committee_id, comment, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const reviewResult = await pool.query(insertReview, [id, committee_id || null, comment || '', status]);

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

// ✅ 4. Get all reviews for a specific application
async function getApplicationReviews(req, res) {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        ar.review_id,
        ar.comment,
        ar.status,
        ar.review_date,
        c.committee_id,
        u.name AS committee_name
      FROM application_reviews ar
      JOIN committee c ON ar.committee_id = c.committee_id
      JOIN users u ON c.user_id = u.id
      WHERE ar.application_id = $1
      ORDER BY ar.review_date DESC;
    `;
    const result = await pool.query(query, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: "No reviews found for this application" });
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching reviews:", err.message);
    res.status(500).json({ error: "Failed to fetch application reviews" });
  }
}

// ✅ 5. Get archived (approved/rejected) applications
async function getArchivedApplications(req, res) {
  try {
    const result = await pool.query(`
      SELECT * FROM application
      WHERE is_archived = TRUE
      ORDER BY submission_date DESC;
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
  getArchivedApplications,
};
