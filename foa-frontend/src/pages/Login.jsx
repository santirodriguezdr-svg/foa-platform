import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password: pass });
      if (data.success) onLogin(data.token);
      else setError(data.error);
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#1a365d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card p-4" style={{ width: 360 }}>
        <h4 className="fw-bold mb-1" style={{ color: '#1a365d' }}>FOA</h4>
        <p className="text-muted small mb-4">Forwarding Operations Assistant</p>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Contrasena</label>
            <input className="form-control" type="password" value={pass} onChange={e => setPass(e.target.value)} required />
          </div>
          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
          <button className="btn btn-navy w-100" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
