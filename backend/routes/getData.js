//backend/routes/getData.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isSuperAdmin } = require('../middlewares/superAdminMiddelware');

/**
 * USERS - Fetch all users with role and faculty names
 */
router.get('/users', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, u.surname, u.email, u.role_id, u.faculty_id, r.role_name, f.name AS faculty_name, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN faculties f ON u.faculty_id = f.id
      ORDER BY u.id
    `;
    const users = (await pool.query(query)).rows;
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * APPLICATIONS - Fetch all applications with researcher, faculty, committee info
 */
router.get('/applications', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT a.application_id, a.title, a.description, a.status, a.submission_date,
             u.name || ' ' || u.surname AS researcher_name,
             f.name AS faculty_name,
             c.email AS committee_email
      FROM application a
      LEFT JOIN users u ON a.researcher_id = u.id
      LEFT JOIN faculties f ON a.faculty_id = f.id
      LEFT JOIN committee c ON a.committee_id = c.committee_id
      ORDER BY a.application_id
    `;
    const applications = (await pool.query(query)).rows;
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * COMMITTEES - Fetch all committees with user names
 */
router.get('/committees', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT c.committee_id, u.name || ' ' || u.surname AS user_name, c.email
      FROM committee c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.committee_id
    `;
    const committees = (await pool.query(query)).rows;
    res.json(committees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DOCUMENTS - Fetch all documents with application title
 */
router.get('/documents', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT d.document_id, d.file_name, d.file_type, d.file_url, d.submission_date,
             a.title AS application_title
      FROM documents d
      LEFT JOIN application a ON d.application_id = a.application_id
      ORDER BY d.document_id
    `;
    const documents = (await pool.query(query)).rows;
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * APPLICATION REVIEWS - Fetch all reviews with application title and committee email
 */
router.get('/reviews', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT ar.review_id, ar.comment, ar.status, ar.review_date,
             a.title AS application_title,
             c.email AS committee_email
      FROM application_reviews ar
      LEFT JOIN application a ON ar.application_id = a.application_id
      LEFT JOIN committee c ON ar.committee_id = c.committee_id
      ORDER BY ar.review_id
    `;
    const reviews = (await pool.query(query)).rows;
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/faculty', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM faculties
    `;
    const faculties = (await pool.query(query)).rows;
    res.json(faculties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
