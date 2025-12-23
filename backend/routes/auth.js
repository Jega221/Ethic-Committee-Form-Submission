// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

//  Signup route
router.post('/signup', async (req, res) => {
  const { name, surname, role_id = 3, email, password } = req.body;

  try {
    // check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert new user
    const newUser = await pool.query(
      'INSERT INTO users (name,surname, email, password,role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name,surname, email, role_id',
      [name, surname, email, hashedPassword, role_id]
    );

    // generate JWT
    const token = jwt.sign({ id: newUser.rows[0].id, email, role: newUser.rows[0].role_id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: newUser.rows[0].id, name: newUser.rows[0].name, email: newUser.rows[0].email, role: newUser.rows[0].role_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//  Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check Super Admin
    let userResult = await pool.query('SELECT * FROM super_admin WHERE email = $1', [email]);
    let role = 'super_admin';
    let id_field = 'super_admin_id';

    // 2. Check Admin
    if (userResult.rows.length === 0) {
      userResult = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
      role = 'admin';
      id_field = 'admin_id';
    }

    // 3. Check Regular Users
    if (userResult.rows.length === 0) {
      userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userResult.rows.length > 0) {
        role = userResult.rows[0].role_id;
        id_field = 'id';
      }
    }

    if (userResult.rows.length === 0)
      return res.status(400).json({ message: 'Email not found' });

    const user = userResult.rows[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid password' });

    // generate token
    const userId = user[id_field];
    const token = jwt.sign({ id: userId, email: user.email, role: role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      token,
      user: {
        id: userId,
        name: user.name || user.first_name || 'Admin',
        surname: user.surname || user.last_name || '',
        email: user.email,
        role: role,
        role_id: typeof role === 'number' ? role : undefined
      }
    });
    console.log(`id: ${userId} role: ${role} logged in`);
  } catch (err) {
    console.error('Unified login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
