import React from 'react';

function Sidebar({ rooms, users, onlineUserIds, selected, onSelect }) {
  return (
    <div className="sidebar">
      <h3>Rooms</h3>
      <ul className="room-list">
        {rooms.map((room) => (
          <li
            key={`room-${room.id}`}
            className={
              selected.type === 'room' && selected.id === room.id ? 'selected' : ''
            }
            onClick={() => onSelect({ type: 'room', id: room.id, name: room.name })}
          >
            # {room.name}
          </li>
        ))}
      </ul>

      <h3>Direct Messages</h3>
      <ul className="user-list">
        {users.map((u) => (
          <li
            key={`user-${u.id}`}
            className={
              selected.type === 'private' && selected.id === u.id ? 'selected' : ''
            }
            onClick={() => onSelect({ type: 'private', id: u.id, name: u.username })}
          >
            <span
              className={`status-dot ${onlineUserIds.includes(u.id) ? 'online' : 'offline'}`}
              title={onlineUserIds.includes(u.id) ? 'Online' : 'Offline'}
            />
            {u.username}
          </li>
        ))}
        {users.length === 0 && <li className="empty-hint">No other users yet</li>}
      </ul>
    </div>
  );
}

export default Sidebar;
