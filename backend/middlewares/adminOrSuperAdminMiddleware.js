// backend/middlewares/adminOrSuperAdminMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const isAdminOrSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const role = req.user.role;
    if (role === 'admin' || role === 'super_admin') {
        return next();
    }

    return res.status(403).json({ message: 'Access denied: Admin or Super Admin only' });
};

module.exports = { isAdminOrSuperAdmin };
