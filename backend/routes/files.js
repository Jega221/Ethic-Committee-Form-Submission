const express = require('express');
const router = express.Router();
const { downloadDocument } = require('../controllers/fileController');
const authenticate = require('../middlewares/authMiddleware');

router.get('/download', authenticate, downloadDocument);

module.exports = router;
