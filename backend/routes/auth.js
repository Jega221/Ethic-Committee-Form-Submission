// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

//  Signup route
router.post('/signup', async (req, res) => {
  const { name, surname, role_id = 3, email, password, faculty_id } = req.body;

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
      'INSERT INTO users (name, surname, email, password, role_id, faculty_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, surname, email, role_id, faculty_id',
      [name, surname, email, hashedPassword, role_id, faculty_id || null]
    );

    // Get faculty name if faculty_id exists
    let facultyName = null;
    if (faculty_id) {
      const facultyResult = await pool.query('SELECT name FROM faculties WHERE id = $1', [faculty_id]);
      if (facultyResult.rows.length > 0) {
        facultyName = facultyResult.rows[0].name;
      }
    }

    // generate JWT
    const token = jwt.sign({ id: newUser.rows[0].id, email, role: newUser.rows[0].role_id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ 
      token, 
      user: { 
        id: newUser.rows[0].id, 
        name: newUser.rows[0].name,
        firstName: newUser.rows[0].name,
        surname: newUser.rows[0].surname,
        email: newUser.rows[0].email, 
        role: newUser.rows[0].role_id,
        role_id: newUser.rows[0].role_id,
        faculty_id: newUser.rows[0].faculty_id,
        faculty: facultyName
      } 
    });
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
        // Get role_id from users table or from user_roles table
        const userRow = userResult.rows[0];
        role = userRow.role_id;
        
        // If role_id is null, try to get from user_roles table
        if (!role) {
          const roleResult = await pool.query(
            'SELECT role_id FROM user_roles WHERE user_id = $1 LIMIT 1',
            [userRow.id]
          );
          if (roleResult.rows.length > 0) {
            role = roleResult.rows[0].role_id;
          } else {
            // Default to researcher role (3) if no role found
            role = 3;
            console.warn(`User ${userRow.id} has no role assigned, defaulting to researcher (3)`);
          }
        }
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

    // Ensure role is never null/undefined
    if (!role) {
      role = 3; // Default to researcher
      console.warn(`Role is null for user ${user[id_field]}, defaulting to researcher (3)`);
    }

    // generate token
    const userId = user[id_field];
    const token = jwt.sign({ id: userId, email: user.email, role: role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Get faculty name if faculty_id exists (only for regular users table)
    let facultyName = null;
    let facultyId = null;
    
    // Only regular users table has faculty_id
    if (id_field === 'id' && user.faculty_id) {
      facultyId = user.faculty_id;
      console.log(`Fetching faculty for user ${userId}, faculty_id: ${facultyId}`);
      try {
        const facultyResult = await pool.query('SELECT name FROM faculties WHERE id = $1', [user.faculty_id]);
        if (facultyResult.rows.length > 0) {
          facultyName = facultyResult.rows[0].name;
          console.log(`Found faculty: ${facultyName}`);
        } else {
          console.warn(`Faculty with id ${facultyId} not found in faculties table`);
        }
      } catch (facultyErr) {
        console.error('Error fetching faculty:', facultyErr);
      }
    } else {
      console.log(`User ${userId} is ${role === 'super_admin' ? 'super_admin' : role === 'admin' ? 'admin' : 'regular user'}, no faculty_id`);
    }

    const userResponse = {
      id: userId,
      name: user.name || user.first_name || 'Admin',
      firstName: user.name || user.first_name || 'Admin',
      surname: user.surname || user.last_name || '',
      email: user.email,
      role: role,
      role_id: typeof role === 'number' ? role : undefined,
      faculty_id: facultyId,
      faculty: facultyName
    };

    console.log(`Login response for user ${userId}:`, JSON.stringify(userResponse, null, 2));

    res.json({
      token,
      user: userResponse
    });
    console.log(`id: ${userId} role: ${role} logged in`);
  } catch (err) {
    console.error('Unified login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile update route
router.put('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  const { name, surname, email, faculty_id } = req.body;
  const userId = decoded.id;
  const userRole = decoded.role;

  try {
    // Determine which table to update based on role
    let tableName = 'users';
    let idField = 'id';
    
    if (userRole === 'super_admin' || userRole === 1) {
      tableName = 'super_admin';
      idField = 'super_admin_id';
    } else if (userRole === 'admin' || userRole === 6) {
      tableName = 'admins';
      idField = 'admin_id';
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      // Check all tables for email conflicts
      const usersCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const adminsCheck = await pool.query('SELECT admin_id FROM admins WHERE email = $1', [email]);
      const superAdminCheck = await pool.query('SELECT super_admin_id FROM super_admin WHERE email = $1', [email]);
      
      // Check if email exists and belongs to a different user
      if (usersCheck.rows.length > 0 && (tableName !== 'users' || usersCheck.rows[0].id != userId)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      if (adminsCheck.rows.length > 0 && (tableName !== 'admins' || adminsCheck.rows[0].admin_id != userId)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      if (superAdminCheck.rows.length > 0 && (tableName !== 'super_admin' || superAdminCheck.rows[0].super_admin_id != userId)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (surname !== undefined) {
      // Some tables might use different column names
      if (tableName === 'users' || tableName === 'admins' || tableName === 'super_admin') {
        updateFields.push(`surname = $${paramCount++}`);
        values.push(surname);
      } else if (tableName === 'admins' || tableName === 'super_admin') {
        // Some admin tables might use last_name
        updateFields.push(`last_name = $${paramCount++}`);
        values.push(surname);
      }
    }
    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    // Only update faculty_id for regular users
    if (faculty_id !== undefined && tableName === 'users') {
      updateFields.push(`faculty_id = $${paramCount++}`);
      values.push(faculty_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(userId);
    const query = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE ${idField} = $${paramCount} RETURNING *`;
    
    console.log('Updating profile:', { tableName, idField, userId, query, values });
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updatedUser = result.rows[0];

    // Get faculty name if faculty_id exists (only for regular users)
    let facultyName = null;
    if (tableName === 'users' && updatedUser.faculty_id) {
      try {
        const facultyResult = await pool.query('SELECT name FROM faculties WHERE id = $1', [updatedUser.faculty_id]);
        if (facultyResult.rows.length > 0) {
          facultyName = facultyResult.rows[0].name;
        }
      } catch (facultyErr) {
        console.error('Error fetching faculty:', facultyErr);
      }
    }

    const response = {
      message: 'Profile updated successfully',
      user: {
        id: updatedUser[idField] || updatedUser.id,
        name: updatedUser.name || updatedUser.first_name || 'Admin',
        firstName: updatedUser.name || updatedUser.first_name || 'Admin',
        surname: updatedUser.surname || updatedUser.last_name || '',
        email: updatedUser.email,
        faculty_id: updatedUser.faculty_id || null,
        faculty: facultyName
      }
    };

    console.log('Profile update response:', response);
    res.json(response);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change password route
router.put('/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = decoded.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    // Check if user exists in users table
    let userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    
    // If not in users table, check admins table
    if (userResult.rows.length === 0) {
      userResult = await pool.query('SELECT password FROM admins WHERE admin_id = $1', [userId]);
    }
    
    // If not in admins table, check super_admin table
    if (userResult.rows.length === 0) {
      userResult = await pool.query('SELECT password FROM super_admin WHERE super_admin_id = $1', [userId]);
    }

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password - try users table first
    let updateResult = await pool.query('UPDATE users SET password = $1 WHERE id = $2 RETURNING id', [hashedPassword, userId]);
    
    // If not updated in users, try admins table
    if (updateResult.rowCount === 0) {
      updateResult = await pool.query('UPDATE admins SET password = $1 WHERE admin_id = $2 RETURNING admin_id', [hashedPassword, userId]);
    }
    
    // If not updated in admins, try super_admin table
    if (updateResult.rowCount === 0) {
      updateResult = await pool.query('UPDATE super_admin SET password = $1 WHERE super_admin_id = $2 RETURNING super_admin_id', [hashedPassword, userId]);
    }

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Failed to update password' });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
