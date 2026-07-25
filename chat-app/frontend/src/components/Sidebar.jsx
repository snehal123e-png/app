import React from "react";

function Sidebar({
  rooms,
  users,
  onlineUserIds,
  lastSeen,
  selected,
  onSelect,
}) {
  return (
    <div className="sidebar">

      {/* ================= ROOMS ================= */}

      <div className="sidebar-section">

        <h3>Rooms</h3>

        {rooms.map((room) => (

          <div
            key={room.id}
            className={`sidebar-item ${selected?.type === "room" &&
              selected.id === room.id
              ? "active"
              : ""
              }`}
            onClick={() =>
              onSelect({
                type: "room",
                id: room.id,
                name: room.name,
              })
            }
          >
            <div className="avatar room-avatar">
              #
            </div>

            <div className="sidebar-info">

              <div className="sidebar-name">
                {room.name}
              </div>

              <div className="sidebar-last">
                Group Chat
              </div>

            </div>

          </div>

        ))}

      </div>

      {/* ================= USERS ================= */}

      <div className="sidebar-section">

        <h3>Direct Messages</h3>

        {users.length === 0 && (
          <p>No users found.</p>
        )}

        {users.map((u) => {

          const online = onlineUserIds.includes(u.id);

          return (

            <div
              key={u.id}
              className={`sidebar-item ${selected?.type === "private" &&
                selected.id === u.id
                ? "active"
                : ""
                }`}
              onClick={() =>
                onSelect({
                  type: "private",
                  id: u.id,
                  name: u.username,
                })
              }
            >

              <div className="avatar">

                {u.username.charAt(0).toUpperCase()}

                <span
                  className={
                    online
                      ? "status online"
                      : "status offline"
                  }
                />

              </div>

              <div className="sidebar-info">

                <div className="sidebar-name">

                  {u.username}

                </div>

                <div className="sidebar-last">

                  {online
                    ? "Online"
                    : lastSeen[u.id]
                      ? `Last seen ${new Date(
                        lastSeen[u.id]
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                      : "Offline"}

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );
}

export default Sidebar;