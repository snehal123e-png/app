import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import api from '../api.js';
import { connectSocket } from '../socket.js';

function Chat({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [selected, setSelected] = useState(null); // { type: 'room'|'private', id, name }
  const [conversations, setConversations] = useState({}); // key -> array of messages
  const [typingUser, setTypingUser] = useState(null);

  const socketRef = useRef(null);
  const selectedRef = useRef(null); // keeps the latest "selected" value reachable inside socket callbacks
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // --- Initial setup: connect socket, load rooms & users, set up listeners ---
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    // Load rooms and users from the backend
    Promise.all([api.get('/chat/rooms'), api.get('/chat/users')]).then(
      ([roomsRes, usersRes]) => {
        setRooms(roomsRes.data);
        setUsers(usersRes.data);
        if (roomsRes.data.length > 0) {
          selectConversation({ type: 'room', id: roomsRes.data[0].id, name: roomsRes.data[0].name });
        }
      }
    );

    socket.on('presence:update', (ids) => setOnlineUserIds(ids));

    socket.on('room:message', (msg) => {
      const key = `room-${msg.roomId}`;
      setConversations((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), msg]
      }));
    });

    socket.on('private:message', (msg) => {
      const otherId = msg.fromId === user.id ? msg.toId : msg.fromId;
      const key = `private-${otherId}`;
      setConversations((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), msg]
      }));
    });

    socket.on('room:typing', ({ username }) => {
      // Only show the indicator if it's relevant to the room we're currently viewing
      if (selectedRef.current?.type === 'room') {
        setTypingUser(username);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
      }
    });

    return () => {
      socket.off('presence:update');
      socket.off('room:message');
      socket.off('private:message');
      socket.off('room:typing');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Switch the active conversation (room or private chat) ---
  const selectConversation = async (conv) => {
    const prevSelected = selectedRef.current;
    const socket = socketRef.current;

    // Leave the previous room (if we were in one) so we stop receiving its broadcasts unnecessarily
    if (prevSelected?.type === 'room' && socket) {
      socket.emit('room:leave', prevSelected.id);
    }

    setSelected(conv);
    setTypingUser(null);

    const key = `${conv.type}-${conv.id}`;

    if (conv.type === 'room') {
      socket.emit('room:join', conv.id);
    }

    // Load history from the server if we haven't already cached it
    setConversations((prev) => {
      if (prev[key]) return prev; // already loaded
      return prev;
    });

    try {
      const endpoint =
        conv.type === 'room' ? `/chat/rooms/${conv.id}/messages` : `/chat/private/${conv.id}`;
      const res = await api.get(endpoint);
      setConversations((prev) => ({ ...prev, [key]: res.data }));
    } catch (err) {
      console.error('Failed to load conversation history', err);
    }
  };

  const handleSend = (text) => {
    const socket = socketRef.current;
    if (!selected || !socket) return;

    if (selected.type === 'room') {
      socket.emit('room:message', { roomId: selected.id, text });
    } else {
      socket.emit('private:message', { toUserId: selected.id, text });
    }
  };

  const handleTyping = () => {
    const socket = socketRef.current;
    if (selected?.type === 'room' && socket) {
      socket.emit('room:typing', { roomId: selected.id });
    }
  };

  const currentKey = selected ? `${selected.type}-${selected.id}` : null;
  const currentMessages = currentKey ? conversations[currentKey] || [] : [];

  return (
    <div className="chat-app">
      <div className="top-bar">
        <h1>💬 Real-Time Chat</h1>
        <div>
          <span className="welcome-text">Hi, {user.username}</span>
          <button onClick={onLogout} className="btn-link">Logout</button>
        </div>
      </div>

      <div className="chat-layout">
        {selected && (
          <Sidebar
            rooms={rooms}
            users={users}
            onlineUserIds={onlineUserIds}
            selected={selected}
            onSelect={selectConversation}
          />
        )}

        {selected ? (
          <div onKeyDown={handleTyping} style={{ flex: 1, display: 'flex' }}>
            <ChatWindow
              title={selected.type === 'room' ? `# ${selected.name}` : `@ ${selected.name}`}
              messages={currentMessages}
              currentUserId={user.id}
              onSend={handleSend}
              typingUser={selected.type === 'room' ? typingUser : null}
            />
          </div>
        ) : (
          <p>Loading chat...</p>
        )}
      </div>
    </div>
  );
}

export default Chat;
