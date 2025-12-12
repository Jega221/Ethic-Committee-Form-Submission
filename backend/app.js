// backend/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Allow uploaded files locally (temporary for development)
app.use('/uploads', express.static('uploads'));

// === ROUTES IMPORTS ===
const researcherRoutes = require('./routes/researcher');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const getDataRouter = require('./routes/getData');
const setRoleRouter = require('./routes/roles');
const messagingRoutes = require('./routes/messaging');
const facultyRouter = require('./routes/faculty');
const workflowRouter = require('./routes/workflow');
const processRouter = require('./routes/process');
// const authMiddleware = require('./middlewares/authMiddleware'); // optional future use

// === ROUTES SETUP ===
app.use('/api/researchers', researcherRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/getData', getDataRouter);
app.use('/api/Role', setRoleRouter);
app.use('/api/messaging', messagingRoutes);
app.use('/api/faculty', facultyRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/process', processRouter);



// === CRON JOB (48-hour pending check) ===
const checkPendingApplications = require('./cron/checkPendingApplications');
setInterval(() => {
  console.log('⏱️ Running scheduled pending check...');
  checkPendingApplications();
}, 1000 * 60 * 60); // every 1 hour

// === ROOT ROUTE ===
app.get('/', (req, res) => {
  res.send('Express server is running');
});


// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
