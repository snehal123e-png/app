// src/socket.js

import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("token");

  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  socket = io("https://chatapp-61ni.onrender.com", {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
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