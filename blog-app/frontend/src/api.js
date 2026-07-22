// src/api.js
// A centralized place to configure axios so every request automatically
// includes the base URL and the auth token (if the user is logged in).

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://app-zve5.onrender.com/api'
});

// Attach the JWT token to every outgoing request, if it exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
