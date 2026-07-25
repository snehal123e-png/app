// socket/index.js

const jwt = require("jsonwebtoken");
const { readDB, writeDB } = require("../db");

// userId -> socket.id
const onlineUsers = new Map();

// userId -> lastSeen
const lastSeen = new Map();

function getPresence() {
  return {
    onlineUsers: Array.from(onlineUsers.keys()),
    lastSeen: Object.fromEntries(lastSeen),
  };
}

function setupSocket(io) {
  // ==========================
  // Authenticate Socket
  // ==========================
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded;

      next();
    } catch (err) {
      next(new Error("Invalid Token"));
    }
  });

  // ==========================
  // New Connection
  // ==========================
  io.on("connection", (socket) => {
    const { id: userId, username } = socket.user;

    console.log(`${username} connected`);

    onlineUsers.set(userId, socket.id);

    io.emit("presence:update", getPresence());

    // ==========================
    // Join Room
    // ==========================
    socket.on("room:join", (roomId) => {
      socket.join(`room-${roomId}`);
    });

    // ==========================
    // Leave Room
    // ==========================
    socket.on("room:leave", (roomId) => {
      socket.leave(`room-${roomId}`);
    });

    // ==========================
    // Room Message
    // ==========================
    socket.on("room:message", ({ roomId, text }) => {

      if (!text || !text.trim()) return;

      const db = readDB();

      const message = {
        id: db.nextMessageId,
        roomId: Number(roomId),
        senderId: userId,
        senderName: username,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      db.messages.push(message);
      db.nextMessageId++;

      writeDB(db);

      io.to(`room-${roomId}`).emit("room:message", message);
    });

    // ==========================
    // Private Message
    // ==========================
    socket.on("private:message", ({ toUserId, text }) => {

      if (!text || !text.trim()) return;

      const db = readDB();

      const message = {
        id: db.nextPrivateMessageId,
        fromId: userId,
        toId: Number(toUserId),
        senderName: username,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      db.privateMessages.push(message);

      db.nextPrivateMessageId++;

      writeDB(db);

      const receiverSocket = onlineUsers.get(Number(toUserId));

      if (receiverSocket) {
        io.to(receiverSocket).emit("private:message", message);
      }

      socket.emit("private:message", message);

    });

    // ==========================
    // Room Typing
    // ==========================
    socket.on("room:typing", ({ roomId }) => {

      socket.to(`room-${roomId}`).emit("room:typing", {
        username,
      });

    });

    // ==========================
    // Private Typing
    // ==========================
    socket.on("private:typing", ({ toUserId }) => {

      const receiverSocket = onlineUsers.get(Number(toUserId));

      if (receiverSocket) {

        io.to(receiverSocket).emit("private:typing", {
          fromId: userId,
          username,
        });

      }

    });

    // ==========================
    // Disconnect
    // ==========================
    socket.on("disconnect", () => {

      console.log(`${username} disconnected`);

      onlineUsers.delete(userId);

      lastSeen.set(userId, new Date().toISOString());

      io.emit("presence:update", getPresence());

    });

  });

}

module.exports = setupSocket;