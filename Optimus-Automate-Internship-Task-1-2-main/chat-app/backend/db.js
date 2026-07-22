// db.js
// Same approach as the blog app: a simple JSON file acting as our database.
// No native modules, so it installs and runs on any machine without build tools.

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      rooms: [
        { id: 1, name: 'General' },
        { id: 2, name: 'Random' },
        { id: 3, name: 'Tech Talk' }
      ],
      messages: [], // room messages: { id, roomId, senderId, text, createdAt }
      privateMessages: [], // { id, fromId, toId, text, createdAt }
      nextUserId: 1,
      nextRoomId: 4,
      nextMessageId: 1,
      nextPrivateMessageId: 1
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

initDB();

function readDB() {
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
