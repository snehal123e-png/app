import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">📝 MyBlog</Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/create">+ New Post</Link>
            <span className="welcome-text">Hi, {user.username}</span>
            <button onClick={handleLogoutClick} className="btn-link">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
