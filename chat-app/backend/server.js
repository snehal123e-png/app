// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const UserRoutes = require('./routes/UserRoutes');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app); // We need a plain http server so Socket.io can attach to it

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sers', userRoutes);

app.get('/', (req, res) => {
  res.send('Chat API is running!');
});

// --- Socket.io setup ---
const io = new Server(server, {
  cors: {
    origin: '*' // For local development. Restrict this in production.
  }
});

setupSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
