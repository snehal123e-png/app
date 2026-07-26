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
    socket.on(
      "private:message",
      ({
        toUserId,
        text,
        image = null,
        file = null,
        audio = null,
        replyTo = null
      }) => {
        if (!text || !text.trim()) return;

        const db = readDB();

        const receiverSocket = onlineUsers.get(Number(toUserId));

        const message = {
          id: db.nextPrivateMessageId++,

          fromId: userId,
          toId: Number(toUserId),

          senderName: username,

          text: text.trim(),
          image: image,
          audio: audio,

          createdAt: new Date().toISOString(),

          status: receiverSocket ? "delivered" : "sent",

          readAt: null,

          replyTo,

          deletedFor: [],

          deletedForEveryone: false
        };

        db.privateMessages.push(message);

        writeDB(db);

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
    // Message Read
    // ==========================
    socket.on("message:read", ({ messageId }) => {

      const db = readDB();

      const message = db.privateMessages.find(
        m => m.id === messageId
      );

      if (!message) return;

      message.status = "read";
      message.readAt = new Date().toISOString();

      writeDB(db);

      const senderSocket = onlineUsers.get(message.fromId);

      if (senderSocket) {
        io.to(senderSocket).emit("message:read", {
          messageId
        });
      }

    });
    socket.on("clear:chat", ({ userId }) => {

      const db = readDB();


      db.privateMessages =
        db.privateMessages.filter(
          msg =>
            !(
              (msg.fromId === socket.user.id &&
                msg.toId === Number(userId))
              ||
              (msg.fromId === Number(userId) &&
                msg.toId === socket.user.id)
            )
        );


      writeDB(db);


      socket.emit(
        "chat:cleared"
      );


    });

    // ==========================
    // Delete Message
    // ==========================

    socket.on("message:delete", ({ messageId, type }) => {


      const db = readDB();


      const message = db.privateMessages.find(
        m => m.id === messageId
      );


      if (!message) return;



      // Delete for everyone

      if (type === "everyone") {


        message.deletedForEveryone = true;

        message.text = "This message was deleted";



        // notify both users

        const receiverSocket =
          onlineUsers.get(message.toId);


        const senderSocket =
          onlineUsers.get(message.fromId);



        if (receiverSocket) {

          io.to(receiverSocket)
            .emit("message:deleted", {
              messageId,
              type: "everyone"
            });

        }



        if (senderSocket) {

          io.to(senderSocket)
            .emit("message:deleted", {
              messageId,
              type: "everyone"
            });

        }


      }



      // Delete for me

      if (type === "me") {


        if (!message.deletedFor) {

          message.deletedFor = [];

        }


        message.deletedFor.push(userId);



        socket.emit("message:deleted", {

          messageId,

          type: "me"

        });


      }



      writeDB(db);


    });
    // ==========================
    // Message Reaction
    // ==========================

    socket.on(
      "message:reaction",
      ({ messageId, emoji }) => {


        const db = readDB();


        const message =
          db.privateMessages.find(
            m => m.id === messageId
          );


        if (!message) return;



        if (!message.reactions) {

          message.reactions = [];

        }



        const existing =
          message.reactions.find(
            r =>
              r.userId === userId &&
              r.emoji === emoji
          );



        if (existing) {


          message.reactions =
            message.reactions.filter(
              r =>
                !(
                  r.userId === userId &&
                  r.emoji === emoji
                )
            );


        }
        else {


          message.reactions.push({

            userId: userId,

            emoji: emoji

          });


        }



        writeDB(db);




        const receiverSocket =
          onlineUsers.get(message.toId);



        const senderSocket =
          onlineUsers.get(message.fromId);



        const reactionData = {

          messageId,

          reactions: message.reactions

        };



        if (receiverSocket) {

          io.to(receiverSocket)
            .emit(
              "message:reaction",
              reactionData
            );

        }



        if (senderSocket) {

          io.to(senderSocket)
            .emit(
              "message:reaction",
              reactionData
            );

        }



      });
    // ==========================
    // Forward Message
    // ==========================

    socket.on(
      "message:forward",
      ({ messageId, toUserId }) => {


        const db = readDB();


        const oldMessage =
          db.privateMessages.find(
            m => m.id === messageId
          );



        if (!oldMessage) return;



        const receiverSocket =
          onlineUsers.get(Number(toUserId));



        const newMessage = {

          id: db.nextPrivateMessageId++,

          fromId: userId,

          toId: Number(toUserId),

          senderName: username,


          // Message content
          text: oldMessage.text,


          // Media
          image: oldMessage.image || null,

          audio: oldMessage.audio || null,

          file: oldMessage.file || null,


          // Forward flag
          forwarded: true,


          // Original sender info
          forwardedFrom:
          {
            id: oldMessage.fromId,
            name: oldMessage.senderName
          },


          createdAt: new Date().toISOString(),


          status:
            receiverSocket
              ?
              "delivered"
              :
              "sent",


          readAt: null,

          replyTo: null

        };



        db.privateMessages.push(newMessage);


        writeDB(db);



        if (receiverSocket) {

          io.to(receiverSocket)
            .emit(
              "private:message",
              newMessage
            );

        }



        socket.emit(
          "private:message",
          newMessage
        );



      });
    // ==========================
    // Edit Message
    // ==========================

    socket.on(
      "message:edit",
      ({ messageId, newText }) => {


        const db = readDB();


        const message =
          db.privateMessages.find(
            m => m.id === messageId
          );



        if (!message) return;


        // Only sender can edit

        if (message.fromId !== userId)
          return;



        message.text = newText;

        message.edited = true;

        message.editedAt =
          new Date().toISOString();



        writeDB(db);



        const receiverSocket =
          onlineUsers.get(message.toId);


        const senderSocket =
          onlineUsers.get(message.fromId);



        const data = {

          messageId,

          text: newText,

          edited: true,

          editedAt: message.editedAt

        };



        if (receiverSocket) {

          io.to(receiverSocket)
            .emit(
              "message:edited",
              data
            );

        }



        if (senderSocket) {

          io.to(senderSocket)
            .emit(
              "message:edited",
              data
            );

        }



      });
    // ==========================
    // Pin Message
    // ==========================

    socket.on(
      "message:pin",
      ({ messageId }) => {


        const db = readDB();


        const message =
          db.privateMessages.find(
            m => m.id === messageId
          );



        if (!message) return;



        message.pinned =
          !message.pinned;



        message.pinnedAt =
          message.pinned
            ?
            new Date().toISOString()
            :
            null;



        writeDB(db);



        const data = {

          messageId,

          pinned: message.pinned,

          pinnedAt: message.pinnedAt

        };



        const receiverSocket =
          onlineUsers.get(message.toId);



        const senderSocket =
          onlineUsers.get(message.fromId);



        if (receiverSocket) {

          io.to(receiverSocket)
            .emit(
              "message:pinned",
              data
            );

        }



        if (senderSocket) {

          io.to(senderSocket)
            .emit(
              "message:pinned",
              data
            );

        }



      });
    // ==========================
    // Join Group
    // ==========================

    socket.on(
      "group:join",
      (groupId) => {

        socket.join(
          `group-${groupId}`
        );

      });




    // ==========================
    // Group Message
    // ==========================

    socket.on(
      "group:message",
      ({ groupId, text }) => {


        if (!text.trim())
          return;



        const db = readDB();



        const message = {


          id:
            db.nextMessageId,


          groupId: Number(groupId),


          senderId: userId,


          senderName: username,


          text: text.trim(),


          createdAt:
            new Date().toISOString()


        };



        db.messages.push(message);


        db.nextMessageId++;


        writeDB(db);



        io.to(
          `group-${groupId}`
        )
          .emit(
            "group:message",
            message
          );



      });
    // ==========================
    // Star / Unstar Message
    // ==========================

    socket.on(
      "message:star",
      ({ messageId, starred }) => {


        const db = readDB();


        const message =
          db.privateMessages.find(
            m => m.id === messageId
          );


        if (!message) return;



        message.starred = starred;



        if (starred) {

          message.starredAt =
            new Date().toISOString();

        }
        else {

          message.starredAt = null;

        }



        writeDB(db);



        // update both users

        const senderSocket =
          onlineUsers.get(message.fromId);


        const receiverSocket =
          onlineUsers.get(message.toId);



        const data = {

          messageId,

          starred,

          starredAt: message.starredAt

        };



        if (senderSocket) {

          io.to(senderSocket)
            .emit(
              "message:starred",
              data
            );

        }



        if (receiverSocket) {

          io.to(receiverSocket)
            .emit(
              "message:starred",
              data
            );

        }


      }
    );
    // ==========================
    // Disconnect
    // ==========================
    socket.on("disconnect", () => {

      console.log(`${username} disconnected`);

      onlineUsers.delete(userId);

      lastSeen.set(userId, new Date().toISOString());

      io.emit("presence:update", getPresence());

    });

  }); // end io.on("connection")
} // end setupSocket

module.exports = setupSocket;
module.exports.onlineUsers = onlineUsers;