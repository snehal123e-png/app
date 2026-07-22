import React, { useEffect, useRef, useState } from 'react';

function ChatWindow({ title, messages, currentUserId, onSend, typingUser }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{title}</h2>
      </div>

      <div className="messages">
        {messages.map((m) => {
          const isMine = (m.senderId || m.fromId) === currentUserId;
          return (
            <div key={m.id + '-' + m.createdAt} className={`message ${isMine ? 'mine' : ''}`}>
              {!isMine && <span className="message-sender">{m.senderName}</span>}
              <span className="message-text">{m.text}</span>
              <span className="message-time">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && <p className="empty-hint">No messages yet. Say hello!</p>}
        {typingUser && <p className="typing-indicator">{typingUser} is typing...</p>}
        <div ref={bottomRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatWindow;
