// backend/app.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// allow uploaded files locally will be removed latter in production
app.use('/uploads', express.static('uploads'));

const researcherRoutes = require("./routes/researcher");
app.use("/api/researchers", researcherRoutes);

const applicationRoutes = require("./routes/applications");
app.use("/api/applications", applicationRoutes);

app.get('/', (req, res) => {
  res.send('Express server is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
