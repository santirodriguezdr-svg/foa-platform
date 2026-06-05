import React, { useState } from 'react';
import Quotes from '../components/Quotes';
import Documents from '../components/Documents';
import Company from '../components/Company';
import History from '../components/History';
import AdminPanel from '../components/AdminPanel';

export default function Dashboard({ onLogout, isAdmin, userName }) {
  const baseTabs = ['Cotizaciones', 'Documentacion', 'Mi Empresa', 'Historial'];
  const tabs = isAdmin ? [...baseTabs, 'Admin'] : baseTabs;
  const [tab, setTab] = useState(0);

  return (
    <>
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', color: 'white', padding: '1.5rem 0' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-0" style={{ color: 'white' }}>Forwarding Operations Assistant</h2>
              <p className="mb-0 mt-1" style={{ opacity: .7, fontSize: '.875rem' }}>
                {userName ? `Hola, ${userName}` : 'Herramienta profesional de comercio exterior'}
              </p>
            </div>
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>Salir</button>
          </div>
        </div>
      </div>

      <ul className="nav nav-app px-4">
        {tabs.map((t, i) => (
          <li className="nav-item" key={i}>
            <button className={`nav-link ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
              {t === 'Admin' ? '⚙️ Admin' : t}
            </button>
          </li>
        ))}
      </ul>

      <div className="container py-4" style={{ maxWidth: 960 }}>
        {tab === 0 && <Quotes />}
        {tab === 1 && <Documents />}
        {tab === 2 && <Company />}
        {tab === 3 && <History />}
        {tab === 4 && isAdmin && <AdminPanel />}
      </div>
    </>
  );
}
