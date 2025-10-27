// index.js
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

/*CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL
);
POST http://localhost:5000/api/auth/signup
Body (JSON):

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
POST http://localhost:5000/api/auth/login
Body:

{
  "email": "alice@example.com",
  "password": "secret123"
}
*/


app.use(cors());           // Enable CORS
app.use(express.json());   // Parse JSON bodies

app.get('/', (req, res) => {
  res.send('Express server is running');
});
// Auth routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/users', authMiddleware, usersRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
