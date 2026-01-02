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
    // Normalize decoded token: support both `role` (singular) and `roles` (array)
    if (decoded && Array.isArray(decoded.roles) && decoded.roles.length > 0) {
      // set a singular `role` field for backward compatibility
      decoded.role = decoded.role || decoded.roles[0];
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

// Check if role is Committee/Faculty/Admin/SuperAdmin
const isStaff = (req, res, next) => {
  const staffRoles = ['admin', 'super_admin', 1, 6, 2, 4, 5]; // 2=Committee, 4=Faculty, 5=Rector
  if (!staffRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: Staff only' });
  }
  next();
};

module.exports = { verifyToken, isSuperAdmin, isAdmin, isFaculty, isResearcher, isStaff };
