// routes/chat.js
// Plain HTTP routes used to LOAD existing data (room list, chat history, users).
// Sending NEW messages happens over Socket.io in real time (see socket/index.js),
// but loading history when you open the app/room is simpler as a normal HTTP request.

const express = require('express');
const { readDB } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET all chat rooms
router.get('/rooms', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.rooms);
});

// GET message history for a specific room
router.get('/rooms/:roomId/messages', authMiddleware, (req, res) => {
  const db = readDB();
  const roomId = parseInt(req.params.roomId);

  const messages = db.messages
    .filter((m) => m.roomId === roomId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((m) => {
      const sender = db.users.find((u) => u.id === m.senderId);
      return { ...m, senderName: sender ? sender.username : 'Unknown' };
    });

  res.json(messages);
});

// GET all registered users (so the current user can pick someone to private message)
router.get('/users', authMiddleware, (req, res) => {
  const db = readDB();
  const users = db.users
    .filter((u) => u.id !== req.user.id)
    .map((u) => ({ id: u.id, username: u.username }));
  res.json(users);
});

// GET private message history between the logged-in user and another user
router.get('/private/:userId', authMiddleware, (req, res) => {
  const db = readDB();
  const otherId = parseInt(req.params.userId);
  const myId = req.user.id;

  const messages = db.privateMessages
    .filter(
      (m) =>
        (m.fromId === myId && m.toId === otherId) ||
        (m.fromId === otherId && m.toId === myId)
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((m) => {
      const sender = db.users.find((u) => u.id === m.fromId);
      return { ...m, senderName: sender ? sender.username : 'Unknown' };
    });

  res.json(messages);
});

module.exports = router;
