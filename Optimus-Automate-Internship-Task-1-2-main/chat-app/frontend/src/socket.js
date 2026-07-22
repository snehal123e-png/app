// src/socket.js
// Sets up a single Socket.io connection to the backend, authenticated with
// the JWT token saved in localStorage after login.

import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  // Reuse the existing connection if we already have one
  if (socket && socket.connected) return socket;

  socket = io('http://localhost:5001', {
    auth: { token }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
