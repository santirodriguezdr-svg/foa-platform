import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function ClientSelect({ value, onChange, onSelectContact, placeholder = 'Nombre de la empresa' }) {
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const wrapRef = useRef();

  useEffect(() => {
    api.get('/api/contacts').then(({ data }) => setContacts(data)).catch(() => {});
  }, []);

  useEffect(() => { if (!value) setQuery(''); else setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = contacts.find(c => c.name.toLowerCase() === query.toLowerCase());

  const select = (contact) => {
    setQuery(contact.name);
    onChange(contact.name);
    onSelectContact && onSelectContact(contact);
    setOpen(false);
    setSaved(true);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setSaved(false);
    setOpen(v.length > 0);
  };

  const saveContact = async (extraData = {}) => {
    if (!query.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/api/contacts', { name: query.trim(), ...extraData });
      setContacts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="form-control"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(query.length > 0 || contacts.length > 0)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {/* Indicador de contacto guardado */}
        {saved && exactMatch && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
            ✓
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1000, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 260, overflowY: 'auto'
        }}>
          {filtered.length === 0 && query.length > 0 ? (
            <div style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#94a3b8' }}>
              No hay contactos guardados con ese nombre.
            </div>
          ) : (
            filtered.map(contact => (
              <div
                key={contact.id}
                onMouseDown={() => select(contact)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{contact.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 1 }}>
                  {[contact.country, contact.address].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))
          )}

          {/* Opción de guardar si es nombre nuevo */}
          {query.length > 1 && !exactMatch && (
            <div
              onMouseDown={() => { saveContact(); setOpen(false); }}
              style={{ padding: '10px 14px', cursor: 'pointer', background: '#f0fdf4', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
              onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>+ Guardar "{query}" como contacto</span>
            </div>
          )}
        </div>
      )}

      {/* Botón guardar con datos completos (cuando se tipea un nombre nuevo y el dropdown está cerrado) */}
      {query.length > 1 && !exactMatch && !open && !saved && (
        <button
          type="button"
          onClick={() => saveContact()}
          disabled={saving}
          style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#16a34a', background: 'none', border: '1px solid #86efac', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}
        >
          {saving ? 'Guardando...' : `+ Guardar "${query}" como contacto`}
        </button>
      )}
    </div>
  );
}
