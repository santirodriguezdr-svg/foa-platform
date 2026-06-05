import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('foa_token'));

  const handleLogin = (t) => {
    localStorage.setItem('foa_token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('foa_token');
    setToken(null);
  };

  if (!token) return <Login onLogin={handleLogin} />;
  return <Dashboard onLogout={handleLogout} />;
}
