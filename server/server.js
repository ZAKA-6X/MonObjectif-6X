const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

const userRoutes = require('./routes/userRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const presentationRoutes = require('./routes/presentationRoutes.js');
const presDetailRoutes = require('./routes/pres-detailRoutes.js'); // ← ADD THIS LINE
const groupRoutes = require('./routes/groupRoutes.js');

dotenv.config();

const app = express();
app.use(express.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// API routes
app.use('/api', userRoutes);
app.use('/api', uploadRoutes);
app.use('/api', presentationRoutes);
app.use('/api', presDetailRoutes); // ← ADD THIS LINE
app.use('/api', groupRoutes);

// Root route - serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/login.html'));
});

// Student dashboard
app.get('/pages/studentdash.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/studentdash.html'));
});

// Teacher dashboard
app.get('/pages/teacherdash.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/teacherdash.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

