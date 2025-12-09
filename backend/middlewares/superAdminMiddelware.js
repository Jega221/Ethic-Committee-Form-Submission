const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: 'Invalid token' });

    req.user = decoded;
    next();
  });
};

// Check if role is Super Admin
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin')
    return res.status(403).json({ message: 'Access denied: Super admin only' });
  next();
};

module.exports = { verifyToken, isSuperAdmin };
