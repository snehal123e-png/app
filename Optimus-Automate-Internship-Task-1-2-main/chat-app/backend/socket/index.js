// socket/index.js
// This file contains all the real-time logic using Socket.io.
//
// How it works:
// 1. When a browser connects, it must send its JWT token (handled in the
//    "io.use" middleware below). This identifies WHO is connecting.
// 2. We keep an in-memory map of which userId is connected to which socket.id,
//    so we know who is online and how to reach them directly for private messages.
// 3. Clients "join" a room (like joining a group chat). Messages sent to a room
//    are broadcast to everyone currently in that room.
// 4. Private messages are sent directly to one specific socket (the recipient),
//    not broadcast to everyone.
// 5. Every message (room or private) is saved to db.json so chat history persists.

const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../db');

// Maps a userId -> socket.id, so we know if a user is online and which socket to message
const onlineUsers = new Map();

function setupSocket(io) {
  // --- Authenticate every socket connection using the JWT token ---
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, username }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, username } = socket.user;
    console.log(`User connected: ${username} (socket ${socket.id})`);

    // Mark this user as online and tell everyone else
    onlineUsers.set(userId, socket.id);
    io.emit('presence:update', getOnlineUserIds());

    // --- Join a chat room ---
    socket.on('room:join', (roomId) => {
      socket.join(`room-${roomId}`);
    });

    // --- Leave a chat room ---
    socket.on('room:leave', (roomId) => {
      socket.leave(`room-${roomId}`);
    });

    // --- Send a message to a room ---
    socket.on('room:message', ({ roomId, text }) => {
      if (!text || !text.trim()) return;

      const db = readDB();
      const newMessage = {
        id: db.nextMessageId,
        roomId: parseInt(roomId),
        senderId: userId,
        text: text.trim(),
        createdAt: new Date().toISOString()
      };
      db.messages.push(newMessage);
      db.nextMessageId += 1;
      writeDB(db);

      // Broadcast to everyone in that room (including the sender, for confirmation)
      io.to(`room-${roomId}`).emit('room:message', {
        ...newMessage,
        senderName: username
      });
    });

    // --- Send a private message to a specific user ---
    socket.on('private:message', ({ toUserId, text }) => {
      if (!text || !text.trim()) return;

      const db = readDB();
      const newMessage = {
        id: db.nextPrivateMessageId,
        fromId: userId,
        toId: parseInt(toUserId),
        text: text.trim(),
        createdAt: new Date().toISOString()
      };
      db.privateMessages.push(newMessage);
      db.nextPrivateMessageId += 1;
      writeDB(db);

      const payload = { ...newMessage, senderName: username };

      // Send to the recipient, if they are currently online
      const recipientSocketId = onlineUsers.get(parseInt(toUserId));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('private:message', payload);
      }

      // Also send back to the sender's own socket, so their UI updates too
      socket.emit('private:message', payload);
    });

    // --- Typing indicator (optional nice touch) ---
    socket.on('room:typing', ({ roomId }) => {
      socket.to(`room-${roomId}`).emit('room:typing', { username });
    });

    // --- Handle disconnect (user closes tab / loses connection) ---
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${username}`);
      onlineUsers.delete(userId);
      io.emit('presence:update', getOnlineUserIds());
    });
  });
}

function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

module.exports = setupSocket;
