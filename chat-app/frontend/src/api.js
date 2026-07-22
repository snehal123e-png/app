// src/api.js
// Centralized axios instance. Automatically attaches the JWT token
// (stored in localStorage after login) to every request.

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
