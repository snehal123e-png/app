// db.js
// A simple JSON-file based database. We avoid native modules like sqlite3
// so that this project installs and runs on ANY machine without build tools.
// Data is stored in db.json in this same folder.

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize the file with empty tables if it doesn't exist yet
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      posts: [],
      comments: [],
      likes: [],
      nextUserId: 1,
      nextPostId: 1,
      nextCommentId: 1,
      nextLikeId: 1
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
