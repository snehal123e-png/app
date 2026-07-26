const jwt = require("jsonwebtoken");
const { readDB, writeDB } = require("../db");


// userId -> socket.id
const onlineUsers = new Map();


// userId -> lastSeen
const lastSeen = new Map();



function getPresence() {

  return {

    onlineUsers: Array.from(
      onlineUsers.keys()
    ),

    lastSeen: Object.fromEntries(
      lastSeen
    )

  };

}



function setupSocket(io) {


  // ==========================
  // Socket Authentication
  // ==========================

  io.use((socket, next) => {


    const token =
      socket.handshake.auth?.token;


    if (!token) {

      return next(
        new Error("Authentication error")
      );

    }


    try {


      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );


      socket.user = decoded;


      next();


    }
    catch (err) {


      next(
        new Error("Invalid Token")
      );


    }


  });





  io.on(
    "connection",
    (socket) => {


      const {
        id: userId,
        username
      } = socket.user;



      console.log(
        username,
        "connected"
      );



      onlineUsers.set(
        userId,
        socket.id
      );



      io.emit(
        "presence:update",
        getPresence()
      );






      // ==========================
      // ROOM JOIN
      // ==========================


      socket.on(
        "room:join",
        (roomId) => {


          socket.join(
            `room-${roomId}`
          );


        }
      );






      // ==========================
      // ROOM MESSAGE FIXED
      // ==========================


      ssocket.on(
        "room:message",
        ({
          roomId,
          text,
          image = null,
          audio = null
        }) => {


          if (
            (!text || !text.trim())
            &&
            !image
            &&
            !audio
          )
            return;



          const db =
            readDB();



          const message = {


            id:
              db.nextMessageId,


            roomId:
              Number(roomId),


            senderId:
              userId,


            senderName:
              username,


            text:
              text
                ?
                text.trim()
                :
                "",


            image,


            audio,


            createdAt:
              new Date()
                .toISOString()


          };




          db.messages.push(
            message
          );


          db.nextMessageId++;



          writeDB(db);




          io.to(
            `room-${roomId}`
          )
            .emit(
              "room:message",
              message
            );



        }
      );





      // ==========================
      // PRIVATE MESSAGE FIXED
      // ==========================


      socket.on(
        "private:message",
        ({
          toUserId,
          text,
          image = null,
          audio = null,
          replyTo = null
        }) => {



          // FIX
          if (
            (!text || !text.trim())
            &&
            !image
            &&
            !audio
          )
            return;





          const db =
            readDB();




          const receiverSocket =
            onlineUsers.get(
              Number(toUserId)
            );





          const message = {


            id:
              db.nextPrivateMessageId++,



            fromId:
              userId,



            toId:
              Number(toUserId),




            senderName:
              username,



            text:
              text
                ?
                text.trim()
                :
                "",



            image,

            audio,



            createdAt:
              new Date()
                .toISOString(),



            status:
              receiverSocket
                ?
                "delivered"
                :
                "sent",




            readAt: null,



            replyTo,



            deletedFor: [],


            deletedForEveryone: false


          };



          db.privateMessages.push(
            message
          );



          writeDB(db);





          if (receiverSocket) {


            io.to(receiverSocket)
              .emit(
                "private:message",
                message
              );


          }




          socket.emit(
            "private:message",
            message
          );




        }
      );
      // ==========================
      // PRIVATE TYPING
      // ==========================

      socket.on(
        "private:typing",
        ({
          toUserId
        }) => {


          const receiverSocket =
            onlineUsers.get(
              Number(toUserId)
            );



          if (receiverSocket) {


            io.to(receiverSocket)
              .emit(
                "private:typing",
                {
                  fromId: userId,
                  username
                }
              );


          }


        }
      );







      // ==========================
      // MESSAGE READ
      // ==========================


      socket.on(
        "message:read",
        ({
          messageId
        }) => {


          const db =
            readDB();



          const message =
            db.privateMessages.find(
              m =>
                m.id === messageId
            );



          if (!message)
            return;




          message.status =
            "read";



          message.readAt =
            new Date()
              .toISOString();



          writeDB(db);




          const senderSocket =
            onlineUsers.get(
              message.fromId
            );



          if (senderSocket) {


            io.to(senderSocket)
              .emit(
                "message:read",
                {
                  messageId
                }
              );


          }



        }
      );









      // ==========================
      // CLEAR CHAT
      // ==========================


      socket.on(
        "clear:chat",
        ({
          userId: otherUserId
        }) => {


          const db =
            readDB();




          db.privateMessages =
            db.privateMessages.filter(
              msg => !(

                (
                  msg.fromId === socket.user.id
                  &&
                  msg.toId === Number(otherUserId)
                )

                ||

                (
                  msg.fromId === Number(otherUserId)
                  &&
                  msg.toId === socket.user.id
                )

              )
            );



          writeDB(db);



          socket.emit(
            "chat:cleared"
          );


        }
      );









      // ==========================
      // DELETE MESSAGE
      // ==========================


      socket.on(
        "message:delete",
        ({
          messageId,
          type
        }) => {


          const db =
            readDB();



          const message =
            db.privateMessages.find(
              m =>
                m.id === messageId
            );



          if (!message)
            return;




          if (type === "everyone") {



            message.deletedForEveryone =
              true;



            message.text =
              "This message was deleted";




            const receiverSocket =
              onlineUsers.get(
                message.toId
              );



            const senderSocket =
              onlineUsers.get(
                message.fromId
              );




            if (receiverSocket) {


              io.to(receiverSocket)
                .emit(
                  "message:deleted",
                  {
                    messageId,
                    type
                  }
                );


            }




            if (senderSocket) {


              io.to(senderSocket)
                .emit(
                  "message:deleted",
                  {
                    messageId,
                    type
                  }
                );


            }



          }






          if (type === "me") {



            if (!message.deletedFor) {

              message.deletedFor = [];

            }



            message.deletedFor.push(
              userId
            );



            socket.emit(
              "message:deleted",
              {
                messageId,
                type
              }
            );



          }



          writeDB(db);



        }
      );










      // ==========================
      // EDIT MESSAGE
      // ==========================


      socket.on(
        "message:edit",
        ({
          messageId,
          newText
        }) => {


          const db =
            readDB();



          const message =
            db.privateMessages.find(
              m =>
                m.id === messageId
            );



          if (!message)
            return;




          if (message.fromId !== userId)
            return;





          message.text =
            newText;



          message.edited =
            true;



          message.editedAt =
            new Date()
              .toISOString();




          writeDB(db);




          const data = {


            messageId,

            text: newText,

            edited: true,

            editedAt:
              message.editedAt


          };




          const receiverSocket =
            onlineUsers.get(
              message.toId
            );



          const senderSocket =
            onlineUsers.get(
              message.fromId
            );




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




        }
      );
      // ==========================
      // MESSAGE REACTION
      // ==========================

      socket.on(
        "message:reaction",
        ({
          messageId,
          emoji
        }) => {


          const db =
            readDB();



          const message =
            db.privateMessages.find(
              m =>
                m.id === messageId
            );



          if (!message)
            return;



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

              userId,
              emoji

            });


          }




          writeDB(db);




          const data = {

            messageId,

            reactions:
              message.reactions

          };



          const senderSocket =
            onlineUsers.get(
              message.fromId
            );


          const receiverSocket =
            onlineUsers.get(
              message.toId
            );



          if (senderSocket) {

            io.to(senderSocket)
              .emit(
                "message:reaction",
                data
              );

          }


          if (receiverSocket) {

            io.to(receiverSocket)
              .emit(
                "message:reaction",
                data
              );

          }



        }
      );









      // ==========================
      // FORWARD MESSAGE
      // ==========================


      socket.on(
        "message:forward",
        ({
          messageId,
          toUserId
        }) => {


          const db =
            readDB();



          const oldMessage =
            db.privateMessages.find(
              m =>
                m.id === messageId
            );



          if (!oldMessage)
            return;




          const receiverSocket =
            onlineUsers.get(
              Number(toUserId)
            );




          const newMessage = {


            id:
              db.nextPrivateMessageId++,



            fromId:
              userId,



            toId:
              Number(toUserId),



            senderName:
              username,



            text:
              oldMessage.text,



            image:
              oldMessage.image || null,



            audio:
              oldMessage.audio || null,



            forwarded: true,



            forwardedFrom: {

              id:
                oldMessage.fromId,


              name:
                oldMessage.senderName

            },



            createdAt:
              new Date()
                .toISOString(),



            status:
              receiverSocket
                ?
                "delivered"
                :
                "sent",



            replyTo: null


          };




          db.privateMessages.push(
            newMessage
          );


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




        }
      );









      // ==========================
      // PIN MESSAGE
      // ==========================


      socket.on(
        "message:pin",
        ({
          messageId
        }) => {


          const db =
            readDB();



          const message =
            db.privateMessages.find(
              m =>
                m.id === messageId
            );



          if (!message)
            return;



          message.pinned =
            !message.pinned;



          message.pinnedAt =
            message.pinned
              ?
              new Date()
                .toISOString()
              :
              null;




          writeDB(db);




          const data = {

            messageId,

            pinned:
              message.pinned,


            pinnedAt:
              message.pinnedAt

          };




          const users = [

            message.fromId,

            message.toId

          ];




          users.forEach(id => {


            const socketId =
              onlineUsers.get(id);


            if (socketId) {


              io.to(socketId)
                .emit(
                  "message:pinned",
                  data
                );


            }


          });



        }
      );









      // ==========================
      // GROUP JOIN
      // ==========================


      socket.on(
        "group:join",
        (groupId) => {


          socket.join(
            `group-${groupId}`
          );


        }
      );









      // ==========================
      // GROUP MESSAGE
      // ==========================


      socket.on(
        "group:message",
        ({
          groupId,
          text
        }) => {


          if (!text || !text.trim())
            return;



          const db =
            readDB();




          const message = {


            id:
              db.nextMessageId,


            groupId:
              Number(groupId),



            senderId:
              userId,



            senderName:
              username,



            text:
              text.trim(),



            createdAt:
              new Date()
                .toISOString()


          };




          db.messages.push(
            message
          );



          db.nextMessageId++;



          writeDB(db);




          io.to(
            `group-${groupId}`
          )
            .emit(
              "group:message",
              message
            );



        }
      );









      // ==========================
      // STAR MESSAGE
      // ==========================


      socket.on(
        "message:star",
        ({
          messageId,
          starred
        }) => {


          const db =
            readDB();




          const message =
            db.privateMessages.find(
              m =>
                m.id === messageId
            );



          if (!message)
            return;



          message.starred =
            starred;



          message.starredAt =
            starred
              ?
              new Date()
                .toISOString()
              :
              null;




          writeDB(db);




          const data = {

            messageId,

            starred,

            starredAt:
              message.starredAt

          };




          [
            message.fromId,
            message.toId
          ]
            .forEach(id => {


              const socketId =
                onlineUsers.get(id);



              if (socketId) {


                io.to(socketId)
                  .emit(
                    "message:starred",
                    data
                  );


              }


            });




        }
      );









      // ==========================
      // DISCONNECT
      // ==========================


      socket.on(
        "disconnect",
        () => {


          console.log(
            username,
            "disconnected"
          );



          onlineUsers.delete(
            userId
          );



          lastSeen.set(
            userId,
            new Date()
              .toISOString()
          );



          io.emit(
            "presence:update",
            getPresence()
          );



        }
      );



    }
  );


}



module.exports = setupSocket;

module.exports.onlineUsers =
  onlineUsers;
