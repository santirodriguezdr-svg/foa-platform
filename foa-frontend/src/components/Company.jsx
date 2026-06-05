import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function Company() {
  const [form, setForm] = useState({ name: '', address: '', tax_id: '', email: '', phone: '', website: '', logo_url: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    api.get('/api/company').then(({ data }) => { if (data.name) setForm(data); });
  }, []);

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Solo se permiten imagenes (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 1024 * 1024) {
      setLogoError('El archivo no puede superar 1 MB.');
      return;
    }
    setLogoError('');
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, logo_url: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm(f => ({ ...f, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.put('/api/company', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError('No se pudo guardar. Intenta de nuevo en unos segundos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card">
        <div className="card-body p-4">
          <span className="section-label">Datos de tu empresa</span>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
            Esta informacion se usa automaticamente en todos los documentos que generes.
          </p>

          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Nombre de la empresa</label>
              <input className="form-control" placeholder="Logistica S.A." value={form.name} onChange={e => setForm({...form,name:e.target.value})} />
            </div>
            <div className="col-12">
              <label className="form-label">Direccion</label>
              <input className="form-control" placeholder="Av. del Libertador 1234, Buenos Aires" value={form.address} onChange={e => setForm({...form,address:e.target.value})} />
            </div>
            <div className="col-md-6">
              <label className="form-label">CUIT / Tax ID</label>
              <input className="form-control" placeholder="30-12345678-9" value={form.tax_id} onChange={e => setForm({...form,tax_id:e.target.value})} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="contacto@empresa.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Telefono</label>
              <input className="form-control" placeholder="+54 11 1234-5678" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Sitio web</label>
              <input className="form-control" placeholder="www.empresa.com" value={form.website} onChange={e => setForm({...form,website:e.target.value})} />
            </div>

            <div className="col-12">
              <label className="form-label">Logo de la empresa</label>
              {form.logo_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc' }}>
                  <img src={form.logo_url} alt="Logo" style={{ height: 64, maxWidth: 160, objectFit: 'contain', borderRadius: '0.25rem' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Logo cargado correctamente</div>
                    <button
                      className="btn btn-sm mt-1"
                      style={{ fontSize: '0.75rem', color: '#ef4444', border: '1px solid #fca5a5', background: 'white', padding: '2px 10px' }}
                      onClick={removeLogo}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{ border: '1.5px dashed #cbd5e1', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🖼️</div>
                  <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>Haz clic para subir tu logo</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>PNG, JPG o SVG — max. 1 MB</div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogo}
              />
              {logoError && <div className="form-text text-danger mt-1">{logoError}</div>}
            </div>
          </div>

          <div style={{ marginTop: '1.75rem' }}>
            <button className="btn btn-navy px-4 py-2" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar configuracion'}
            </button>
          </div>

          {saved && (
            <div className="alert alert-success mt-3">
              ✓ Configuracion guardada correctamente.
            </div>
          )}
          {saveError && (
            <div className="alert alert-danger mt-3">
              {saveError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
