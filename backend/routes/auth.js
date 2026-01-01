const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

//  Signup route
router.post('/signup', async (req, res) => {
  const { name, surname, email, password } = req.body; // removed role_id

  try {
    // check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert new user (no role handling here)
    const newUser = await pool.query(
      'INSERT INTO users (name,surname, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, surname, email',
      [name, surname, email, hashedPassword]
    );

    // generate JWT (no role)
    const token = jwt.sign({ id: newUser.rows[0].id, email: newUser.rows[0].email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: newUser.rows[0].id, name: newUser.rows[0].name, email: newUser.rows[0].email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
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

    const roles = rolesResult.rows.map(r => r.role_name); // ['ADMIN', 'COMMITTEE', ...]

    // 4️⃣ Generate JWT with roles array
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5️⃣ Response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: roles
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

module.exports = router;
