const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const presentationRoutes = require('./routes/presentationRoutes.js');
const presDetailRoutes = require('./routes/pres-detailRoutes.js'); // ← ADD THIS LINE
const groupRoutes = require('./routes/groupRoutes.js');

dotenv.config();

const app = express();
app.use(express.json());

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'https://monobjective-6x.onrender.com',
  'https://www.monobjectif-6x.space',
  'https://monobjectif-6x.space',
];

const allowedOrigins = new Set(
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : defaultAllowedOrigins
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
