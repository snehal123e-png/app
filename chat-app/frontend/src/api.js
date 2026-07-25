// src/api.js
// Centralized axios instance. Automatically attaches the JWT token
// (stored in localStorage after login) to every request.

import axios from 'axios';

const api = axios.create({
  baseURL: "https://chatapp-61ni.onrender.com/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
