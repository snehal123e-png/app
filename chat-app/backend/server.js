// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require("path");
const profileRoutes = require("./routes/profile");
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const pinChatRoutes = require("./routes/pinChat");
const uploadRoutes = require("./routes/upload");
const UserRoutes = require('./routes/UserRoutes');
const statusRoutes = require("./routes/status");
const groupRoutes = require("./routes/groups");
const setupSocket = require('./socket');
const contactRoutes = require("./routes/contact");
const starRoutes = require("./routes/star");
const app = express();
const server = http.createServer(app); // We need a plain http server so Socket.io can attach to it

// --- Middleware ---
app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);
app.use("/api/profile", profileRoutes);
app.use(
  "/api/status",
  statusRoutes
);
app.use(
  "/api/groups",
  groupRoutes
);
app.use("/api/contact", contactRoutes);
// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pin-chat', pinChatRoutes);
app.use('/api/star', starRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('Chat API is running!');
});

// --- Socket.io setup ---
const io = new Server(server, {
  cors: {
    origin: '*' // For local development. Restrict this in production.
  }
});
const onlineUsers = {};

app.set("io", io);
app.set("onlineUsers", onlineUsers);

setupSocket(io);

app.set("io", io);
app.set(
  "onlineUsers",
  require("./socket").onlineUsers
);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
