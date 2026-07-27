import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import api from "../api";
import { connectSocket } from "../socket";
import { useNavigate } from "react-router-dom";

function Chat({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [unread, setUnread] = useState({});
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [lastSeen, setLastSeen] = useState({});

  const [selected, setSelected] = useState(null);

  const [conversations, setConversations] = useState({});

  const [typingUser, setTypingUser] = useState(null);

  const socketRef = useRef(null);

  const typingTimeout = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (
      Notification.permission !== "granted"
    ) {

      Notification.requestPermission();

    }
    const socket = connectSocket();

    socketRef.current = socket;

    Promise.all([
      api.get("/chat/rooms"),
      api.get("/chat/users")
    ]).then(([roomsRes, usersRes]) => {

      setRooms(roomsRes.data);

      setUsers(usersRes.data);

      if (roomsRes.data.length > 0) {
        selectConversation({
          type: "room",
          id: roomsRes.data[0].id,
          name: roomsRes.data[0].name
        });
      }

    });

    // ----------------------
    // Presence
    // ----------------------

    socket.on("presence:update", (data) => {

      setOnlineUserIds(data.onlineUsers);

      setLastSeen(data.lastSeen);

    });

    // ----------------------
    // Room Message
    // ----------------------

    socket.on("room:message", (msg) => {

      const key = `room-${msg.roomId}`;

      setConversations(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), msg]
      }));

    });

    // ----------------------
    // Private Message
    // ----------------------

    socket.on("private:message", (msg) => {


      const otherId =
        msg.fromId === user.id
          ?
          msg.toId
          :
          msg.fromId;



      const key = `private-${otherId}`;



      setConversations(prev => ({

        ...prev,

        [key]: [
          ...(prev[key] || []),
          msg
        ]

      }));




      // ==========================
      // Unread Count
      // ==========================


      if (selected?.id !== otherId) {


        setUnread(prev => ({

          ...prev,

          [otherId]:
            (prev[otherId] || 0) + 1

        }));



        // Sound Notification

        const audio =
          new Audio(
            "/sounds/message.mp3"
          );


        audio.play()
          .catch(() => { });




        // Browser Notification

        if (Notification.permission === "granted") {


          new Notification(
            msg.senderName,
            {

              body:
                msg.text || "New message",

              icon:
                "/logo192.png"

            }

          );


        }


      }


    });
    // ----------------------
    // Room Typing
    // ----------------------

    socket.on("room:typing", ({ username }) => {

      setTypingUser(`${username} is typing...`);

      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => {

        setTypingUser(null);

      }, 1500);

    });

    // ----------------------
    // Private Typing
    // ----------------------

    socket.on("private:typing", ({ username }) => {

      setTypingUser(`${username} is typing...`);

      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => {

        setTypingUser(null);

      }, 1500);

    });

    return () => {

      socket.off("presence:update");
      socket.off("room:message");
      socket.off("private:message");
      socket.off("room:typing");
      socket.off("private:typing");

    };

  }, []);

  async function selectConversation(conv) {
    if (conv.type === "private") {


      setUnread(prev => ({

        ...prev,

        [conv.id]: 0

      }));


    }

    setSelected(conv);

    const key = `${conv.type}-${conv.id}`;

    if (conv.type === "room") {

      socketRef.current.emit("room:join", conv.id);

    }

    try {

      const endpoint =
        conv.type === "room"
          ? `/chat/rooms/${conv.id}/messages`
          : `/chat/private/${conv.id}`;

      const res = await api.get(endpoint);
      if (conv.type === "private") {

        res.data.forEach(msg => {

          if (
            msg.toId === user.id &&
            msg.status !== "read"
          ) {

            socketRef.current.emit(
              "message:read",
              {
                messageId: msg.id
              }
            );

          }

        });

      }

      setConversations(prev => ({
        ...prev,
        [key]: res.data
      }));

    } catch (err) {

      console.log(err);

    }

  }

  function handleSend(text) {

    if (!selected) return;

    if (selected.type === "room") {

      socketRef.current.emit("room:message", {
        roomId: selected.id,
        text
      });

    } else {

      socketRef.current.emit("private:message", {
        toUserId: selected.id,
        text
      });

    }

  }

  function handleTyping() {

    if (!selected) return;


    if (selected.type === "private") {

      socketRef.current.emit(
        "private:typing",
        {
          toUserId: selected.id
        }
      );

    }


    clearTimeout(typingTimeout.current);


    typingTimeout.current = setTimeout(() => {

      setTypingUser(null);

    }, 1500);

  }

  const currentKey = selected
    ? `${selected.type}-${selected.id}`
    : null;

  const currentMessages =
    currentKey
      ? conversations[currentKey] || []
      : [];

  return (

    <div className="chat-app">

      <div className="top-bar">

        <h2>WhatsApp Chat</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

          <img
            className="avatar"
            src={
              user.photo
                ? `http://localhost:5001${user.photo}`
                : `https://ui-avatars.com/api/?name=${user.username}`
            }
            alt=""
          />

          <b>{user.username}</b>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>
          <button

            onClick={() =>
              navigate("/starred")
            }

          >

            ⭐ Starred

          </button>

          <button onClick={() => navigate("/search")}>
            New Chat
          </button>
          <button
            onClick={() => navigate("/status")}
          >
            Status
          </button>
          <button
            onClick={() =>
              navigate("/create-group")
            }
          >
            Create Group
          </button>
          <button

            onClick={() =>
              navigate("/group-info")
            }

          >
            Group Info
          </button>
          <button onClick={() => navigate("/requests")}>
            Requests
          </button>

          <button onClick={onLogout}>
            Logout
          </button>

        </div>

      </div>

      <div className="chat-layout">

        <Sidebar
          rooms={rooms}
          users={users}
          selected={selected}
          onlineUserIds={onlineUserIds}
          lastSeen={lastSeen}
          unread={unread}
          currentUser={user}
          onSelect={selectConversation}
        />
        {selected && (

          <ChatWindow

            selectedUser={
              selected.type === "private"
                ? selected
                : null
            }


            selectedRoom={
              selected.type === "room"
                ? selected
                : null
            }


            messages={currentMessages}


            currentUser={user.id}

            sendMessage={handleSend}
            onlineUserIds={onlineUserIds}


            lastSeen={lastSeen}


            typingUser={typingUser}


            handleTyping={handleTyping}


          />


        )}

      </div>

    </div>

  );

}

export default Chat;