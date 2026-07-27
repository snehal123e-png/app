// routes/chat.js
// Plain HTTP routes used to LOAD existing data (room list, chat history, users).
// Sending NEW messages happens over Socket.io in real time (see socket/index.js),
// but loading history when you open the app/room is simpler as a normal HTTP request.

const express = require('express');
const { readDB, writeDB } = require('../db');
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
router.get("/users", authMiddleware, (req, res) => {

  const db = readDB();

  const myId = req.user.id;

  const contactIds = [];

  (db.contacts || []).forEach(contact => {

    if (contact.user1 === myId) {
      contactIds.push(contact.user2);
    }

    if (contact.user2 === myId) {
      contactIds.push(contact.user1);
    }

  });

  const users = db.users
    .filter(user => contactIds.includes(user.id))
    .map(user => ({
      id: user.id,
      username: user.username,
      photo: user.photo,
      about: user.about
    }));

  res.json(users);

});

router.get("/all-users", authMiddleware, (req, res) => {

  const db = readDB();

  const users = db.users
    .filter(user => user.id !== myId)
    .map(user => ({
      id: user.id,
      username: user.username,
      photo: user.photo,
      about: user.about
    }));

  res.json(users);

});

// GET private message history between the logged-in user and another user
// GET private message history between the logged-in user and another user
router.get('/private/:userId', authMiddleware, (req, res) => {

  const db = readDB();

  const otherId = parseInt(req.params.userId);
  const myId = req.user.id;


  let messages = db.privateMessages
    .filter(
      (m) =>
        (m.fromId === myId && m.toId === otherId) ||
        (m.fromId === otherId && m.toId === myId)
    );


  // Mark messages as read
  messages.forEach((msg) => {

    if (
      msg.toId === myId &&
      msg.fromId === otherId &&
      msg.status !== "read"
    ) {

      msg.status = "read";
      msg.readAt = new Date().toISOString();


      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");


      if (io && onlineUsers) {

        const senderSocket = onlineUsers.get(msg.fromId);


        if (senderSocket) {

          io.to(senderSocket).emit("message:read", {
            messageId: msg.id
          });

        }

      }

    }

  });


  writeDB(db);


  messages = messages
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((m) => {

      const sender = db.users.find(
        u => u.id === m.fromId
      );

      return {
        ...m,
        senderName: sender ? sender.username : "Unknown"
      };

    });


  res.json(messages);

});
// ==========================
// Get Starred Messages
// ==========================

router.get(
  "/starred",
  authMiddleware,
  (req, res) => {


    const db = readDB();


    const userId = req.user.id;



    const starredMessages =
      db.privateMessages.filter(
        msg =>
          msg.starred &&
          (
            msg.fromId === userId ||
            msg.toId === userId
          )

      );



    res.json(starredMessages);



  });
// ==========================
// Search Private Messages
// ==========================

router.get(
  "/search/:userId",
  authMiddleware,
  (req, res) => {


    const db = readDB();


    const myId = req.user.id;

    const otherId =
      Number(req.params.userId);


    const query =
      req.query.q?.toLowerCase();



    if (!query) {

      return res.json([]);

    }



    const results =
      db.privateMessages.filter(msg => {


        const betweenUsers =
          (
            msg.fromId === myId &&
            msg.toId === otherId
          )
          ||
          (
            msg.fromId === otherId &&
            msg.toId === myId
          );



        const textMatch =
          msg.text &&
          msg.text
            .toLowerCase()
            .includes(query);



        const fileMatch =
          msg.file &&
          msg.file
            .toLowerCase()
            .includes(query);



        return betweenUsers &&
          (textMatch || fileMatch);



      });



    res.json(results);



  });

module.exports = router;
