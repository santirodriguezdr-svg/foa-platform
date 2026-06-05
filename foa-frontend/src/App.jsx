import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PendingApproval from './pages/PendingApproval';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('foa_token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('foa_is_admin') === 'true');
  const [userName, setUserName] = useState(localStorage.getItem('foa_name') || '');
  const [pending, setPending] = useState(false);

  const handleLogin = (t, admin, name) => {
    localStorage.setItem('foa_token', t);
    localStorage.setItem('foa_is_admin', admin ? 'true' : 'false');
    localStorage.setItem('foa_name', name || '');
    setToken(t);
    setIsAdmin(!!admin);
    setUserName(name || '');
    setPending(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('foa_token');
    localStorage.removeItem('foa_is_admin');
    localStorage.removeItem('foa_name');
    setToken(null);
    setIsAdmin(false);
    setUserName('');
    setPending(false);
  };

  if (pending) return <PendingApproval onBack={() => setPending(false)} />;
  if (!token) return <Login onLogin={handleLogin} onPending={() => setPending(true)} />;
  return <Dashboard onLogout={handleLogout} isAdmin={isAdmin} userName={userName} />;
}
