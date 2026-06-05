import React from 'react';

export default function PendingApproval({ onBack }) {
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
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⏳</div>
        <h4 style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
          Solicitud enviada
        </h4>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Tu cuenta está pendiente de aprobación. En cuanto el administrador la apruebe,
          vas a poder acceder a la plataforma.
        </p>
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '1rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: '#475569'
        }}>
          Si tenés urgencia, contactá a{' '}
          <a href="mailto:santirodriguezdr@gmail.com" style={{ color: '#d97706', fontWeight: 600 }}>
            santirodriguezdr@gmail.com
          </a>
        </div>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 10,
            padding: '0.6rem 1.5rem', color: '#64748b', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 600
          }}
        >
          Volver al login
        </button>
      </div>
    </div>
  );
}
