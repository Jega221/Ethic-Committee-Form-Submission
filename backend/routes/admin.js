const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyToken, isSuperAdmin } = require('../middlewares/superAdminMiddelware');
require('dotenv').config();

console.log('verifyToken:', verifyToken);
console.log('isSuperAdmin:', isSuperAdmin);


/**
 * SUPER ADMIN SIGNUP (only first or manual creation)
 */
router.post('/superadmin/signup', async (req, res) => {
  const { first_name, last_name, email, password, notification_interval } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM super_admin WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'Super admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO super_admin (first_name, last_name, email, password, notification_interval)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING super_admin_id, first_name, last_name, email`,
      [first_name, last_name, email, hashedPassword, notification_interval || 24]
    );

    res.status(201).json({
      message: 'Super admin created successfully',
      super_admin: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating super admin:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * LOGIN for Super Admin & Admin
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let userResult = await pool.query('SELECT * FROM super_admin WHERE email = $1', [email]);
    let role = 'super_admin';

    if (userResult.rows.length === 0) {
      userResult = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
      role = 'admin';
    }

    if (userResult.rows.length === 0)
      return res.status(400).json({ message: 'Email not found' });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: role === 'super_admin' ? user.super_admin_id : user.admin_id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: role === 'super_admin' ? user.super_admin_id : user.admin_id,
        email: user.email,
        role,
      },
    });
    console.log(`${role} ${user.email} logged in`);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ADMIN SIGNUP — Only Super Admin can create admins
 */
router.post('/admin/signup', verifyToken, isSuperAdmin, async (req, res) => {
  const { email, password, notification_interval } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO admins (email, password, notification_interval, super_admin_id)
       VALUES ($1, $2, $3, $4)
       RETURNING admin_id, email`,
      [email, hashedPassword, notification_interval || 24, req.user.id]
    );

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: result.rows[0],
    });
  } catch (err) {
    console.error('Admin signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Example protected route
 */
router.get('/superadmin/dashboard', verifyToken, isSuperAdmin, (req, res) => {
  res.json({ message: 'Welcome to the Super Admin dashboard!' });
});

module.exports = router;
