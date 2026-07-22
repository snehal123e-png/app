# Full Stack Blog Application

A blog platform where users can register, log in, create posts (with a rich text
editor and image upload), comment on posts, and like posts.

## Tech Stack

- **Frontend:** React (Vite), React Router, React-Quill (rich text editor), Axios
- **Backend:** Node.js, Express
- **Database:** A simple JSON file (`db.json`) — no installation needed, works on any OS
- **Auth:** JWT (JSON Web Tokens) + bcrypt for password hashing
- **File uploads:** Multer

## Folder Structure

```
blog-app/
├── backend/      <- Express API server
└── frontend/     <- React app (Vite)
```

## Prerequisites

You need **Node.js** installed (version 18 or higher recommended).
Check by running:
```
node -v
npm -v
```
If not installed, download it from https://nodejs.org

## Step 1: Run the Backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

(If you don't have `nodemon` installed and `npm run dev` fails, just use `npm start` instead.)

You should see:
```
Server is running on http://localhost:5000
```

Leave this terminal running. The backend will:
- Create a `db.json` file automatically (this is your "database")
- Create an `uploads/` folder for storing uploaded images
- Serve the API at `http://localhost:5000/api`

## Step 2: Run the Frontend

Open a **second** terminal (keep the backend running in the first one):

```bash
cd frontend
npm install
npm run dev
```

You should see something like:
```
Local:   http://localhost:5173/
```

Open that URL in your browser.

## Step 3: Use the App

1. Click **Register** and create an account.
2. You'll be logged in automatically.
3. Click **+ New Post** to write a post using the rich text editor, optionally attach a cover image.
4. Click **Publish Post**.
5. View the post, **like** it, and add **comments**.
6. Only the author of a post can delete it.

## How It Works (Beginner Notes)

- **Backend (`/backend`)**
  - `server.js` — starts the Express server and wires up routes
  - `db.js` — a tiny JSON-file database. Every read/write goes through `readDB()`/`writeDB()`
  - `routes/auth.js` — handles `/register` and `/login`, hashes passwords with bcrypt, issues JWT tokens
  - `routes/posts.js` — handles creating/listing/deleting posts, adding comments, and liking posts
  - `middleware/auth.js` — checks the JWT token on protected routes (creating posts, commenting, liking)

- **Frontend (`/frontend/src`)**
  - `api.js` — a configured axios instance that automatically attaches your login token to requests
  - `App.jsx` — sets up routing and tracks whether a user is logged in
  - `pages/` — one file per page (Home, Login, Register, CreatePost, PostDetail)
  - `components/` — reusable UI pieces (Navbar, PostCard)

## Authentication Flow

1. User registers/logs in → backend returns a JWT token
2. Frontend stores the token in `localStorage`
3. Every future request automatically includes `Authorization: Bearer <token>` header
4. Backend middleware verifies the token before allowing post creation, commenting, or liking

## Deploying (Optional — for your internship deliverable)

- **Backend:** Deploy to Render or Railway. Set the `JWT_SECRET` environment variable in their dashboard. Note: since we use a local JSON file as a database, file storage will reset on most free hosting platforms when the server restarts — for a real deployment you'd swap this for a real database like MongoDB or PostgreSQL (ask me and I can help you upgrade it).
- **Frontend:** Deploy to Vercel or Netlify. Update the `baseURL` in `frontend/src/api.js` to point to your deployed backend URL instead of `localhost:5000`.

## Troubleshooting

- **"Failed to load posts. Is the backend server running?"** → Make sure the backend terminal is still running and shows no errors.
- **Port already in use** → Another process is using port 5000 or 5173. Close it, or change the `PORT` in `backend/.env` (and update `frontend/src/api.js` to match).
- **Images not showing** → Make sure the backend is running, since images are served from `http://localhost:5000/uploads/...`.
