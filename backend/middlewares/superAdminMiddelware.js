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
      console.error('JWT Verification Error (verifyToken):', err.message, 'Secret:', process.env.JWT_SECRET ? 'Present' : 'Missing');
      return res.status(403).json({ message: `JWT_VERIFY_FAIL: ${err.message}` });
    }
    // Normalize role strings for consistency across middleware and routes
    const normalizeRole = (r) => {
      if (r === null || r === undefined) return r;
      try { return String(r).toLowerCase().replace(/[- ]+/g, '_').trim(); } catch (e) { return r; }
    };

    if (decoded) {
      if (Array.isArray(decoded.roles)) {
        decoded.roles = decoded.roles.map(normalizeRole);
      }
      // set a singular `role` field for backward compatibility
      if (!decoded.role && Array.isArray(decoded.roles) && decoded.roles.length > 0) {
        decoded.role = decoded.roles[0];
      } else if (decoded.role) {
        decoded.role = normalizeRole(decoded.role);
      }
    }

    req.user = decoded;
    next();
  });
};

// Check if role is Super Admin
const isSuperAdmin = (req, res, next) => {
  const roleStr = typeof req.user.role === 'string' ? req.user.role : String(req.user.role || '');
  if (roleStr !== 'super_admin' && req.user.role !== 1)
    return res.status(403).json({ message: 'Access denied: Super admin only' });
  next();
};

// Check if role is Admin or Super Admin
const isAdmin = (req, res, next) => {
  const roleStr = typeof req.user.role === 'string' ? req.user.role : String(req.user.role || '');
  const allowed = ['admin', 'super_admin'];
  if (!allowed.includes(roleStr) && req.user.role !== 1 && req.user.role !== 6)
    return res.status(403).json({ message: 'Access denied: Admin only' });
  next();
};

// Check if role is Faculty
const isFaculty = (req, res, next) => {
  const roleStr = typeof req.user.role === 'string' ? req.user.role : String(req.user.role || '');
  // accept 'faculty', 'faculty_admin' and numeric id 4
  if (roleStr.includes('faculty') || req.user.role === 4) {
    return next();
  }
  // Also check roles array (for multi-role users)
  if (Array.isArray(req.user.roles)) {
    const hasFacultyRole = req.user.roles.some(r => {
      const normalizedRole = String(r || '').toLowerCase().replace(/[- ]+/g, '_').trim();
      return normalizedRole.includes('faculty');
    });
    if (hasFacultyRole) {
      return next();
    }
  }
  return res.status(403).json({ message: 'Access denied: Faculty Admin only' });
};

// Check if role is Researcher (role_id 3 in DB)
const isResearcher = (req, res, next) => {
  const roleStr = typeof req.user.role === 'string' ? req.user.role : String(req.user.role || '');
  if (roleStr !== 'researcher' && req.user.role !== 3)
    return res.status(403).json({ message: 'Access denied: Researcher only' });
  next();
};

// Check if role is Committee/Faculty/Admin/SuperAdmin
const isStaff = (req, res, next) => {
  const roleStr = typeof req.user.role === 'string' ? req.user.role : String(req.user.role || '');
  const staffStrings = ['admin', 'super_admin', 'committee', 'committee_member', 'faculty', 'rector'];
  const staffIds = [1, 6, 2, 4, 5];
  // Check single role
  if (staffStrings.some(s => roleStr.includes(s)) || staffIds.includes(req.user.role)) {
    return next();
  }
  // Also check roles array (for multi-role users)
  if (Array.isArray(req.user.roles)) {
    const hasStaffRole = req.user.roles.some(r => {
      const normalizedRole = String(r || '').toLowerCase().replace(/[- ]+/g, '_').trim();
      return staffStrings.some(s => normalizedRole.includes(s));
    });
    if (hasStaffRole) {
      return next();
    }
  }
  return res.status(403).json({ message: 'Access denied: Staff only' });
};

module.exports = { verifyToken, isSuperAdmin, isAdmin, isFaculty, isResearcher, isStaff };
