import React, { useState, useRef, useEffect } from 'react';
import api from '../api';

const fnLabel = (fn) => {
  if (!fn) return '';
  const tags = [];
  if (fn[0] === '1') tags.push('Puerto');
  if (fn.length > 3 && fn[3] === '4') tags.push('Aeropuerto');
  if (fn.length > 5 && fn[5] === '6') tags.push('Multimodal');
  return tags.join(' · ');
};

export default function PortSearch({ label, value, onChange, placeholder = 'Ciudad o código UNLOCODE' }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef();
  const wrapRef = useRef();

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sincronizar si el valor externo cambia (ej: reset del formulario)
  useEffect(() => { if (!value) setQuery(''); }, [value]);

  const search = (q) => {
    clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/ports/search?q=${encodeURIComponent(q)}`);
        setResults(data);
        setOpen(data.length > 0);
      } catch { setResults([]); }
      setLoading(false);
    }, 280);
  };

  const select = (port) => {
    const display = `${port.name} (${port.code})`;
    setQuery(display);
    onChange(display);
    setOpen(false);
    setResults([]);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    search(v);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          className="form-control"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2, color: '#94a3b8' }} />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 1000, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto'
        }}>
          {results.map((port) => (
            <div
              key={port.code}
              onMouseDown={() => select(port)}
              style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{port.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', marginLeft: '0.4rem' }}>{port.country}</span>
                {fnLabel(port.function) && (
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.4rem' }}>· {fnLabel(port.function)}</span>
                )}
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>
                {port.code}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
