import React, { useState } from 'react';
import Quotes from '../components/Quotes';
import Documents from '../components/Documents';
import Company from '../components/Company';
import History from '../components/History';
import AdminPanel from '../components/AdminPanel';

export default function Dashboard({ onLogout, isAdmin, userName }) {
  const baseTabs = [
    { label: 'Cotizaciones', icon: '📄' },
    { label: 'Documentacion', icon: '📝' },
    { label: 'Mi Empresa', icon: '🏢' },
    { label: 'Historial', icon: '🕐' },
  ];
  const tabs = isAdmin ? [...baseTabs, { label: 'Admin', icon: '⚙️' }] : baseTabs;
  const [tab, setTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '1.25rem 0' }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          <div className="d-flex justify-content-between align-items-center">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: 36, height: 36, background: '#2563eb', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, color: 'white', fontSize: '0.95rem', flexShrink: 0
              }}>F</div>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.3px' }}>
                  FOA
                </div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                  {userName ? `Hola, ${userName.split(' ')[0]}` : 'Forwarding Operations Assistant'}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#94a3b8', borderRadius: 8, padding: '0.4rem 1rem',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
              onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <ul className="nav-app">
        {tabs.map((t, i) => (
          <li key={i} style={{ listStyle: 'none' }}>
            <button className={`nav-link ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
              {t.icon} {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Content */}
      <div className="container py-4" style={{ maxWidth: 1040 }}>
        {tab === 0 && <Quotes />}
        {tab === 1 && <Documents />}
        {tab === 2 && <Company />}
        {tab === 3 && <History />}
        {tab === 4 && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
}
