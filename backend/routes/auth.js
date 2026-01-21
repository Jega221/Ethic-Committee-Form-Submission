// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

// Helper to normalize role strings (consistent with frontend)
const normalizeRole = (s) => String(s || '').toLowerCase().replace(/[- ]+/g, '_').trim();

// Password validation helper
const validatePassword = (pwd) => {
  if (!pwd || pwd.length < 8) return "Password must be at least 8 characters long.";
  if (pwd.length > 128) return "Password must be less than 128 characters.";
  if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character.";
  return null;
};

// Signup route
router.post('/signup', async (req, res) => {
  const { name, surname, email, password, faculty_id, role_id, phone } = req.body;

  try {
    // check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert new user with faculty_id and phone_number
    const newUser = await pool.query(
      'INSERT INTO users (name, surname, email, password, faculty_id, phone_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, surname, email, faculty_id, phone_number',
      [name, surname, email, hashedPassword, faculty_id || null, phone || null]
    );

    const userId = newUser.rows[0].id;

    // Assign default role (researcher = 3, or use provided role_id)
    const defaultRoleId = role_id || 3; // 3 = researcher
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [userId, defaultRoleId]
    );

    // Fetch the role name
    const roleResult = await pool.query(
      'SELECT r.role_name FROM roles r WHERE r.id = $1',
      [defaultRoleId]
    );
    const roleName = roleResult.rows.length > 0 ? normalizeRole(roleResult.rows[0].role_name) : 'researcher';

    // Fetch faculty name if faculty_id provided
    let facultyName = null;
    if (faculty_id) {
      const facResult = await pool.query('SELECT name FROM faculties WHERE id = $1', [faculty_id]);
      if (facResult.rows.length > 0) {
        facultyName = facResult.rows[0].name;
      }
    }

    // generate JWT with roles and faculty_id
    const token = jwt.sign(
      { id: userId, email: newUser.rows[0].email, roles: [roleName], faculty_id: newUser.rows[0].faculty_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: userId,
        name: newUser.rows[0].name,
        surname: newUser.rows[0].surname,
        email: newUser.rows[0].email,
        phone_number: newUser.rows[0].phone_number,
        faculty_id: newUser.rows[0].faculty_id,
        faculty: facultyName,
        roles: [roleName]
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Find user with faculty info
    const userResult = await pool.query(
      `SELECT u.*, f.name as faculty_name 
       FROM users u 
       LEFT JOIN faculties f ON u.faculty_id = f.id 
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0)
      return res.status(400).json({ message: 'Email not found' });

    const user = userResult.rows[0];

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid password' });

    // 3️⃣ Fetch all roles for this user
    const rolesResult = await pool.query(
      `
      SELECT r.role_name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
      `,
      [user.id]
    );

    // Normalize role names to lowercase underscored form for consistency
    const normalizeRole = (s) => String(s || '').toLowerCase().replace(/[- ]+/g, '_').trim();
    const roles = rolesResult.rows.map(r => normalizeRole(r.role_name)); // ['admin', 'committee_member', ...]

    // 4️⃣ Generate JWT with roles array and faculty_id
    const token = jwt.sign({ id: user.id, email: user.email, roles, faculty_id: user.faculty_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 5️⃣ Response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        phone: user.phone_number,
        faculty_id: user.faculty_id,
        faculty: user.faculty_name,
        roles
      }
    });

    console.log(`id: ${user.id} name: ${user.name} logged in`);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Look up user; do not reveal existence in response for security
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // Generic response to avoid user enumeration
      return res.json({ message: 'If an account with that email exists, a reset token has been sent.' });
    }

    const user = userResult.rows[0];

    // Create a short-lived reset token. Replace sending logic with real email service.
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // TODO: send `resetToken` to user's email via your email service
    // For now we return token (remove this in production)
    res.json({ message: 'Password reset token generated', resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add JWT auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = payload; // { id, email, roles, ... }
    next();
  });
}

// Profile modification endpoint
router.put('/profile', authenticateToken, async (req, res) => {
  console.log('PUT /profile called');
  console.log('User:', req.user);
  console.log('Body:', req.body);
  const { name, surname, email, password, faculty_id, phone } = req.body;
  const userId = req.user && req.user.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // If email provided, ensure it's not used by another user
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, userId]);
      if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already in use' });
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (surname !== undefined) { fields.push(`surname = $${idx++}`); values.push(surname); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (phone !== undefined) { fields.push(`phone_number = $${idx++}`); values.push(phone); }
    if (faculty_id !== undefined) { fields.push(`faculty_id = $${idx++}`); values.push(faculty_id); }
    if (password !== undefined) {
      // Validate password if it's being updated
      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, surname, email, faculty_id, phone_number`;
    const updateRes = await pool.query(query, values);

    const updated = updateRes.rows[0];

    // Fetch roles to include in new token/response
    const rolesRes = await pool.query(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [updated.id]
    );
    const roles = rolesRes.rows.map(r => normalizeRole(r.role_name));

    // Regenerate token with roles and faculty_id
    const token = jwt.sign({ id: updated.id, email: updated.email, roles, faculty_id: updated.faculty_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Fetch faculty name for response
    let facultyName = null;
    if (updated.faculty_id) {
      const facRes = await pool.query('SELECT name FROM faculties WHERE id = $1', [updated.faculty_id]);
      if (facRes.rows.length > 0) facultyName = facRes.rows[0].name;
    }

    res.json({
      token,
      user: {
        id: updated.id,
        name: updated.name,
        surname: updated.surname,
        email: updated.email,
        phone: updated.phone_number,
        faculty_id: updated.faculty_id,
        faculty: facultyName,
        roles
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
