// middleware/checkAdmin.js
const jwt = require("jsonwebtoken");

const checkAdmin = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify token and decode user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request object

    // Check if role 
    if (req.user.role !== 5) {
      return res.status(403).json({ message: "Access forbidden: Admins only." });
    }

    // If role is admin, continue to next handler
    next();

  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = checkAdmin;
