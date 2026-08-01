// server.js
// Entry point of our backend application.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const supabase = require('./supabase');

const app = express();


// =======================
// Middleware
// =======================

app.use(cors()); // Allow frontend connection
app.use(express.json()); // Read JSON request bodies


// Serve uploaded images
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);


// =======================
// Routes
// =======================

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);


// Health check route
app.get('/', (req, res) => {
  res.send('Blog API is running!');
});


// =======================
// Supabase Connection Test
// =======================

async function testSupabaseConnection() {
  console.log("Testing Supabase connection...");

  const { data, error } = await supabase
    .from("users")
    .select("*");

  if (error) {
    console.error("❌ Supabase Error:", error.message);
  } else {
    console.log("✅ Supabase Connected");
    console.log("Users:", data);
  }
}


// =======================
// Start Server
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  await testSupabaseConnection();
});