// index.js
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const getDataRouter = require('./routes/getData');
const setRoleRouter= require('./routes/roles');


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

// Protected routesapp.use('/api/admin', adminRoutes);
app.use('/api/getData', getDataRouter);
app.use('/api/Role',setRoleRouter);
//app.use('/api/users', authMiddleware, usersRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
