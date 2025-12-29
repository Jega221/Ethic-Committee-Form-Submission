const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middlewares/superAdminMiddelware');
const { isAdminOrSuperAdmin } = require('../middlewares/adminOrSuperAdminMiddleware');

// In-memory cache for faculties
let facultiesCache = null;

// Public route to fetch faculties (for Signup)
router.get('/', async (req, res) => {
  // Check cache first
  if (facultiesCache) {
    return res.json(facultiesCache);
  }

  console.time('FetchFacultiesDB');
  try {
    const result = await pool.query('SELECT * FROM faculties ORDER BY name ASC');
    console.timeEnd('FetchFacultiesDB');

    // Store in cache
    facultiesCache = result.rows;
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching faculties:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Existing setFaculty route
router.put('/setFaculty', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  const { id, faculty_id } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0)
      return res.status(400).json({ message: 'User does not exist' });

    const result = await pool.query(
      `UPDATE users SET faculty_id = $1 WHERE id = $2 RETURNING *`, [faculty_id, id]
    );

    res.status(200).json({
      message: 'Faculty assignment successful',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Faculty assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ADD FACULTY
 */
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  const { faculty_name } = req.body;

  if (!faculty_name) {
    return res.status(400).json({ message: 'Faculty name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO faculties (name) VALUES ($1) RETURNING *',
      [faculty_name]
    );

    // Invalidate cache
    facultiesCache = null;

    res.status(201).json({
      message: 'Faculty added successfully',
      faculty: result.rows[0]
    });
  } catch (err) {
    console.error('Add faculty error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * UPDATE FACULTY
 */
router.put('/:id', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Faculty name is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE faculties SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Invalidate cache
    facultiesCache = null;

    res.json({
      message: 'Faculty updated successfully',
      faculty: result.rows[0]
    });
  } catch (err) {
    console.error('Update faculty error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE FACULTY
 */
router.delete('/:id', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM faculties WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Invalidate cache
    facultiesCache = null;

    res.json({ message: 'Faculty deleted successfully', faculty: result.rows[0] });
  } catch (err) {
    console.error('Delete faculty error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;