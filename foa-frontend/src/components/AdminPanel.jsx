import React, { useState, useEffect } from 'react';
import api from '../api';

const STATUS_LABEL = {
  pending: { text: 'Pendiente', color: '#f59e0b', bg: '#fef3c7' },
  approved: { text: 'Aprobado', color: '#10b981', bg: '#d1fae5' },
  rejected: { text: 'Rechazado', color: '#ef4444', bg: '#fee2e2' },
};

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/users/${id}/status`, { status });
      fetchUsers();
    } catch (e) {
      alert('Error al actualizar el estado.');
    }
  };

  const importLocode = async () => {
    setImporting(true);
    setImportLog('Iniciando importación...');
    try {
      const token = localStorage.getItem('foa_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ports/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let log = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        log += decoder.decode(value);
        setImportLog(log);
      }
    } catch (e) {
      setImportLog('Error: ' + e.message);
    }
    setImporting(false);
  };

  if (loading) return <p className="text-muted">Cargando usuarios...</p>;

  const pending = users.filter(u => u.status === 'pending');
  const others = users.filter(u => u.status !== 'pending');

  return (
    <div>
      <h5 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Panel de administración</h5>

      {/* Importar LOCODE */}
      <div className="card mb-4">
        <div className="card-body p-4">
          <span className="section-label">Base de datos UNLOCODE</span>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1rem' }}>
            Importa el dataset oficial de puertos y aeropuertos (~37k registros). Solo necesitas hacerlo una vez.
          </p>
          <button
            className="btn btn-navy px-4 py-2"
            onClick={importLocode}
            disabled={importing}
          >
            {importing ? <><span className="spinner-border spinner-border-sm me-2" />Importando...</> : 'Importar puertos UNLOCODE'}
          </button>
          {importLog && (
            <pre style={{ marginTop: '1rem', background: '#0f172a', color: '#7dd3fc', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', maxHeight: 160, overflowY: 'auto' }}>
              {importLog}
            </pre>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h6 style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '1rem' }}>
            ⏳ Solicitudes pendientes ({pending.length})
          </h6>
          {pending.map(u => (
            <UserRow key={u.id} user={u} onUpdate={updateStatus} />
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
          padding: '1rem 1.25rem', marginBottom: '2rem', color: '#166534', fontSize: '0.9rem'
        }}>
          No hay solicitudes pendientes.
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h6 style={{ fontWeight: 700, color: '#64748b', marginBottom: '1rem' }}>Todos los usuarios</h6>
          {others.map(u => (
            <UserRow key={u.id} user={u} onUpdate={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, onUpdate }) {
  const badge = STATUS_LABEL[user.status] || STATUS_LABEL.pending;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12,
      padding: '1rem 1.25rem', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem'
    }}>
      <div>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
          {user.name || '—'} {user.is_admin && <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>admin</span>}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{user.email}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
          {new Date(user.created_at).toLocaleDateString('es-AR')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          background: badge.bg, color: badge.color,
          padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700
        }}>
          {badge.text}
        </span>
        {user.status === 'pending' && (
          <>
            <button
              onClick={() => onUpdate(user.id, 'approved')}
              style={{
                background: '#10b981', color: 'white', border: 'none',
                borderRadius: 8, padding: '0.4rem 0.9rem', fontSize: '0.8rem',
                fontWeight: 700, cursor: 'pointer'
              }}
            >
              Aprobar
            </button>
            <button
              onClick={() => onUpdate(user.id, 'rejected')}
              style={{
                background: 'none', color: '#ef4444', border: '1.5px solid #ef4444',
                borderRadius: 8, padding: '0.4rem 0.9rem', fontSize: '0.8rem',
                fontWeight: 700, cursor: 'pointer'
              }}
            >
              Rechazar
            </button>
          </>
        )}
        {user.status === 'approved' && !user.is_admin && (
          <button
            onClick={() => onUpdate(user.id, 'rejected')}
            style={{
              background: 'none', color: '#94a3b8', border: '1.5px solid #e2e8f0',
              borderRadius: 8, padding: '0.4rem 0.9rem', fontSize: '0.8rem',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Revocar
          </button>
        )}
        {user.status === 'rejected' && (
          <button
            onClick={() => onUpdate(user.id, 'approved')}
            style={{
              background: 'none', color: '#10b981', border: '1.5px solid #10b981',
              borderRadius: 8, padding: '0.4rem 0.9rem', fontSize: '0.8rem',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Reactivar
          </button>
        )}
      </div>
    </div>
  );
}
