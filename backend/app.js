// index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());           // Enable CORS
app.use(express.json());   // Parse JSON bodies

app.get('/', (req, res) => {
  res.send('Express server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
