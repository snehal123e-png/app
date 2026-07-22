import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import { disconnectSocket } from './socket.js';

function App() {
  const [user, setUser] = useState(null);

  // On first load, restore the logged-in user from localStorage (if any)
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    disconnectSocket();
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />}
      />
    </Routes>
  );
}

export default App;
