const pool = require('../db/index');
const path = require('path');
const { mapToEnum } = require('../routes/process');
const { createNotification } = require('../utils/notifications');

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
  // Use authenticated user ID from req.user
  const user_id = req.user.id;
  const { faculty_id, committee_id, title, description } = req.body;
  const files = req.files || [];

  console.log('--- Submit Application Debug ---');
  console.log('User ID:', user_id);
  console.log('Body:', req.body);
  console.log('Files:', files.length);
  console.log('Skip Documents:', req.body.skip_documents);
  console.log('--------------------------------');

  // Checklist validation
  const missingFields = [];
  if (!user_id) missingFields.push('user_id');
  if (!faculty_id) missingFields.push('faculty_id');
  if (!committee_id) missingFields.push('committee_id');
  if (!title) missingFields.push('title');
  if (!description) missingFields.push('description');

  if (missingFields.length > 0) {
    console.log('Missing fields:', missingFields);
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  // Allow skipping documents if flag is set
  const skipDocuments = req.body.skip_documents === 'true' || req.body.skip_documents === true;

  if ((!files.length || files.length < 1) && !skipDocuments) {
    return res.status(400).json({
      error: "At least 1 document is required."
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

    // 3️⃣ Initialize Workflow Process
    const wfRes = await pool.query("SELECT * FROM workflow WHERE status = 'current'");
    if (wfRes.rows.length > 0) {
      const workflow = wfRes.rows[0];

      // Parse steps if string
      const parseSteps = (s) => {
        if (Array.isArray(s)) return s;
        if (typeof s === 'string') {
          return s.replace(/^{|}$/g, '')
            .split(',')
            .map(item => {
              if (item.startsWith('"') && item.endsWith('"')) return item.slice(1, -1);
              return item;
            });
        }
        return [];
      };

      const steps = parseSteps(workflow.steps);
      const initialStepRaw = steps[0];
      const nextStepRaw = steps[1] || null;

      const initialStep = mapToEnum(initialStepRaw);
      const nextStep = mapToEnum(nextStepRaw);

      await pool.query(
        `INSERT INTO process (application_id, workflow_id, current_step, next_step)
        VALUES ($1, $2, $3, $4)`,
        [application.application_id, workflow.id, initialStep, nextStep]
      );
    }

    // Notify Researcher
    try {
      await createNotification(
        user_id,
        application.application_id,
        "Application submitted successfully. We will notify you of any updates."
      );
    } catch (e) {
      console.error("Submission Notification Error:", e);
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
    let query = `
      SELECT 
        a.application_id,
        a.title,
        a.description,
        a.status,
        a.submission_date,
        u.name AS researcher_name,
        u.surname AS researcher_surname,
        u.email,
        f.name AS faculty_name,
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
      JOIN users u ON a.researcher_id = u.id
      JOIN faculties f ON a.faculty_id = f.id
      LEFT JOIN process p ON a.application_id = p.application_id
    `;

    const userRoles = req.user.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');
    const isAdmin = userRoles.includes('admin');
    const isFacultyAdmin = userRoles.includes('faculty_admin');

    const params = [];
    if (!isSuperAdmin && !isAdmin && isFacultyAdmin) {
      // Filter by faculty for faculty admins
      query += ` WHERE a.faculty_id = $1`;
      params.push(req.user.faculty_id);
    }

    query += ` ORDER BY a.submission_date DESC;`;

    const result = await pool.query(query, params);

    const normalizeStep = (step) => {
      const map = {
        faculty: 'faculty_admin',
        committee: 'committee_member',
        rectorate: 'rector',
      };
      return map[step] || step;
    };

    const mappedRows = result.rows.map(row => ({
      ...row,
      current_step: normalizeStep(row.current_step)
    }));

    res.json(mappedRows);
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

    // Auto-archive approved ONLY (Rejected needs to go back to researcher)
    if (status === "Approved") {
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
    // Ownership check: Researchers can only see reviews for their own applications
    const appCheck = await pool.query('SELECT researcher_id FROM application WHERE application_id = $1', [id]);
    if (appCheck.rows.length > 0) {
      const ownerId = appCheck.rows[0].researcher_id;
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && ownerId !== req.user.id) {
        return res.status(403).json({ error: "Access denied. You can only view reviews for your own applications." });
      }
    }

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

// ✅ 6. Modify an existing application (only if status = 'Revision Requested')
async function modifyApplication(req, res) {
  const { id } = req.params;
  const {
    title, description,
    research_type, start_date, end_date, funding_source,
    participant_count, vulnerable_populations, risk_level, data_protection
  } = req.body;
  const files = req.files || [];

  try {
    // 1️⃣ Fetch application first
    const appQuery = `SELECT * FROM application WHERE application_id = $1`;
    const result = await pool.query(appQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const app = result.rows[0];

    // Ownership check: Only the researcher who submitted it can modify it
    if (app.researcher_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: "Access denied. You can only modify your own applications." });
    }

    // Only allowed when status = Revision Requested or Rejected
    if (app.status !== "Revision Requested" && app.status !== "Rejected") {
      return res.status(403).json({
        error: "Application cannot be modified unless it is in 'Revision Requested' or 'Rejected' status."
      });
    }

    // 2️⃣ Update all fields
    const updateQuery = `
      UPDATE application
      SET title = $1, description = $2, status = 'Pending',
          research_type = $3, start_date = $4, end_date = $5, funding_source = $6,
          participant_count = $7, vulnerable_populations = $8, risk_level = $9, data_protection = $10
      WHERE application_id = $11
      RETURNING *;
    `;

    const updated = await pool.query(updateQuery, [
      title, description,
      research_type, start_date, end_date, funding_source,
      participant_count, vulnerable_populations, risk_level, data_protection,
      id
    ]);

    // 3️⃣ If new documents uploaded → replace old ones
    if (files.length > 0) {
      // Delete old docs
      await pool.query(`DELETE FROM documents WHERE application_id = $1`, [id]);

      // Insert new ones
      const insertDocQuery = `
        INSERT INTO documents (application_id, file_name, file_type, file_url)
        VALUES ($1, $2, $3, $4)
      `;

      for (const f of files) {
        const fileUrl = path.join("uploads", f.filename);
        await pool.query(insertDocQuery, [
          id,
          f.originalname,
          f.mimetype,
          fileUrl
        ]);
      }
    }

    // Notify Researcher
    try {
      await createNotification(
        req.user.id,
        id,
        "Application plan updated and re-submitted."
      );
    } catch (e) { console.error('Modification notification failed', e); }

    return res.status(200).json({
      message: "Application updated successfully.",
      application: updated.rows[0]
    });

  } catch (err) {
    console.error("Error modifying application:", err);
    res.status(500).json({ error: "Failed to modify application" });
  }
}

// ✅ 7. Get single application by ID
async function getApplicationById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        a.*,
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
       WHERE a.application_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const app = result.rows[0];

    // Ownership check: Researchers can only view their own applications
    // Admins/Super Admins/Staff can view all (assuming role 1, 2, 6 are privileged)
    // We can just rely on basic check here matching getResearcherApplications logic or simpler
    const isPrivileged = ['admin', 'super_admin', 'faculty_admin', 'chairman', 'member', 'rector'].includes(req.user.role) || [1, 2, 3, 4, 5, 6].includes(req.user.role);

    if (!isPrivileged && app.researcher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only view your own applications." });
    }

    res.json(app);
  } catch (err) {
    console.error("Error fetching application:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
}

module.exports = {
  submitApplication,
  getAllApplications,
  updateApplicationStatus,
  getApplicationReviews,
  getArchivedApplications,
  modifyApplication,
  getApplicationById
};
