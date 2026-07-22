// server.js
// This is the entry point of our backend application.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();

// --- Middleware ---
app.use(cors());               // Allows our React frontend to talk to this backend
app.use(express.json());       // Allows the server to read JSON request bodies

// Serve uploaded images statically (so the browser can load them via URL)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Simple health check route
app.get('/', (req, res) => {
  res.send('Blog API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
