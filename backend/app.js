// index.js
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
//const authMiddleware = require('./middlewares/authMiddleware');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());           // Enable CORS
app.use(express.json());   // Parse JSON bodies

app.get('/', (req, res) => {
  res.send('Express server is running');
});
// Auth routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Protected routes
//app.use('/api/users', authMiddleware, usersRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
