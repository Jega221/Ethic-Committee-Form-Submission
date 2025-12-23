const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error (getData.js flow):', err.message, 'Secret:', process.env.JWT_SECRET ? 'Present' : 'Missing');
      return res.status(403).json({ message: `JWT_VERIFY_FAIL: ${err.message}` });
    }

    req.user = decoded;
    next();
  });
};

// Check if role is Super Admin
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 1)
    return res.status(403).json({ message: 'Access denied: Super admin only' });
  next();
};

// Check if role is Admin or Super Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 1 && req.user.role !== 6)
    return res.status(403).json({ message: 'Access denied: Admin only' });
  next();
};

// Check if role is Faculty
const isFaculty = (req, res, next) => {
  if (req.user.role !== 4)
    return res.status(403).json({ message: 'Access denied: Faculty Admin only' });
  next();
};

// Check if role is Researcher (role_id 3 in DB)
const isResearcher = (req, res, next) => {
  if (req.user.role !== 3)
    return res.status(403).json({ message: 'Access denied: Researcher only' });
  next();
};

module.exports = { verifyToken, isSuperAdmin, isAdmin, isFaculty, isResearcher };
