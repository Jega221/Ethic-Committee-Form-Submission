// backend/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Allow uploaded files locally (temporary for development)
app.use('/uploads', express.static('uploads'));

// Import routes
const researcherRoutes = require("./routes/researcher");
const applicationRoutes = require("./routes/applications");
const notificationRoutes = require('./routes/notifications');
const authRouter = require('./routes/auth');

// Use routes
app.use("/api/researchers", researcherRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRouter);

// Import and schedule the 48-hour pending check
const checkPendingApplications = require('./cron/checkPendingApplications');
setInterval(() => {
  console.log("⏱️ Running scheduled pending check...");
  checkPendingApplications();
}, 1000 * 60 * 60); // every 1 hour

// Root route
app.get('/', (req, res) => {
  res.send('Express server is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
