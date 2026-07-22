# Real-Time Chat Application

A real-time chat app with multiple chat rooms, private one-on-one messaging,
user authentication, online/offline status indicators, and persisted chat history.

## Tech Stack

- **Frontend:** React (Vite), React Router, Socket.io-client, Axios
- **Backend:** Node.js, Express, Socket.io
- **Database:** A simple JSON file (`db.json`) — no installation needed, works on any OS
- **Auth:** JWT (JSON Web Tokens) + bcrypt for password hashing

## Folder Structure

```
chat-app/
├── backend/      <- Express + Socket.io server
└── frontend/     <- React app (Vite)
```

## Prerequisites

You need **Node.js** installed (version 18 or higher recommended). Check with:
```
node -v
npm -v
```

## Step 1: Run the Backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

(If `npm run dev` fails because `nodemon` isn't found, just run `npm start` instead.)

You should see:
```
Server is running on http://localhost:5001
```

Leave this terminal running. Note: this uses **port 5001** (not 5000), so you can run
this chat app and the blog app from Task 1 at the same time without conflicts.

## Step 2: Run the Frontend

Open a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
Local:   http://localhost:5174/
```

Open that URL in your browser. (Port 5174, not 5173, so it won't conflict with the blog app's frontend.)

## Step 3: Try It Out (Use Two Browser Windows!)

Real-time chat is best tested with **two different logged-in users** at once:

1. Register an account (e.g. "alice") in one browser window.
2. Open a **second browser window in Incognito/Private mode** (so it doesn't share the same login), and register a second account (e.g. "bob").
3. In Alice's window, click on a room like **# General** and send a message — it should appear instantly in Bob's window too if Bob is also viewing that room.
4. Click on the other user's name under **Direct Messages** to send a private message — only that user will receive it.
5. Notice the green/grey dot next to each user's name — it shows whether they're currently online.
6. Close one browser window and watch the other update the status dot to offline.

## How It Works (Beginner Notes)

### Backend (`/backend`)
- `server.js` — starts Express AND attaches Socket.io to the same HTTP server
- `db.js` — the JSON-file database (same approach as the blog app), storing users, rooms, room messages, and private messages
- `routes/auth.js` — handles `/register` and `/login`
- `routes/chat.js` — plain HTTP routes used only to **load** existing data: the room list, a room's message history, the list of other users, and private message history. This is used once when you first open a conversation.
- `middleware/auth.js` — protects the HTTP routes above with JWT
- `socket/index.js` — **this is the heart of the real-time feature.** It:
  - Verifies the user's JWT token when their browser connects via Socket.io
  - Tracks who's online in an in-memory map (`userId -> socket.id`)
  - Listens for `room:join`/`room:leave` events to manage which "room" each browser is subscribed to
  - Listens for `room:message` — saves it to the database, then broadcasts it to everyone in that room
  - Listens for `private:message` — saves it, then sends it directly to ONLY the recipient's socket (and echoes it back to the sender)
  - Broadcasts `presence:update` to everyone whenever a user connects or disconnects

### Frontend (`/frontend/src`)
- `socket.js` — creates a single Socket.io connection using the saved JWT token
- `api.js` — axios instance for the plain HTTP calls (loading rooms, users, history)
- `pages/Chat.jsx` — the main chat screen: connects the socket, loads rooms/users, listens for incoming messages/presence updates, and lets you switch between rooms and private chats
- `components/Sidebar.jsx` — lists rooms and users, shows the online/offline dot
- `components/ChatWindow.jsx` — displays messages for the currently selected conversation and the message input box

## Real-Time Flow Summary

1. Browser connects to Socket.io and proves identity with its JWT token
2. Backend marks that user as "online" and tells every connected browser (`presence:update`)
3. When you send a message, it goes out over the socket connection (not a normal HTTP request) — the backend saves it and instantly pushes it to whoever should see it
4. When you reopen a room or private chat, the message **history** is fetched once via a normal HTTP request (`GET /api/chat/...`) so you see everything that happened before you connected

## Deploying (Optional — for your internship deliverable)

- **Backend:** Deploy to Render or Railway (these support WebSocket connections). Set `JWT_SECRET` as an environment variable. As with the blog app, the JSON-file database isn't durable on most free hosts — for production you'd swap it for MongoDB or PostgreSQL.
- **Frontend:** Deploy to Vercel or Netlify. Update the URLs in `frontend/src/api.js` and `frontend/src/socket.js` to point to your deployed backend instead of `localhost:5001`.

## Troubleshooting

- **Messages aren't appearing in real time** → Make sure the backend terminal is still running with no errors, and check your browser's developer console (F12) for connection errors.
- **"Authentication error" in the backend logs** → Your token may have expired (tokens last 7 days) — log out and log back in.
- **Port already in use** → Change `PORT` in `backend/.env`, and update the URL in `frontend/src/api.js` and `frontend/src/socket.js` to match.
- **Only one of your two test users shows as online** → Make sure both browser windows are truly separate sessions (use a normal window + an Incognito/Private window, since both share the same browser would otherwise share the same login).
