import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Login({ onLogin, onPending }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: 320, text: 'signin_with', shape: 'rectangular' }
      );
    };

    return () => { document.head.removeChild(script); };
  }, []);

  const handleGoogleCredential = async (response) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/google', { token: response.credential });
      if (data.success) {
        onLogin(data.token, data.is_admin, data.name);
      } else if (data.status === 'pending') {
        onPending();
      } else if (data.status === 'rejected') {
        setError('Tu solicitud de acceso fue rechazada.');
      } else {
        setError(data.error || 'Error al iniciar sesion.');
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    }
    setLoading(false);
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password: pass });
      if (data.success) onLogin(data.token, data.is_admin, data.name);
      else setError(data.error);
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, background: '#f59e0b', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '1.2rem', fontWeight: 900, color: '#1c1917'
          }}>F</div>
          <h4 style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.3rem', marginBottom: 4 }}>FOA</h4>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Forwarding Operations Assistant</p>
        </div>

        {!showEmailForm ? (
          <>
            <div id="google-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}></div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 1.25rem' }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>o</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
              </div>
              <button
                onClick={() => setShowEmailForm(true)}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Iniciar sesion con email
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitEmail}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Contrasena</label>
              <input
                className="form-control"
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.875rem' }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem', background: '#f59e0b', color: '#1c1917',
                border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
              }}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              style={{
                width: '100%', marginTop: '0.75rem', background: 'none', border: 'none',
                color: '#64748b', fontSize: '0.875rem', cursor: 'pointer'
              }}
            >
              ← Volver
            </button>
          </form>
        )}

        {error && !showEmailForm && (
          <div className="alert alert-danger py-2" style={{ fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>
        )}

        {loading && !showEmailForm && (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>Verificando...</p>
        )}
      </div>
    </div>
  );
}
