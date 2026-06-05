import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Company() {
  const [form, setForm] = useState({ name: '', address: '', tax_id: '', email: '', phone: '', website: '', logo_url: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/company').then(({ data }) => { if (data.name) setForm(data); });
  }, []);

  const save = async () => {
    await api.put('/api/company', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              <label className="form-label">URL del logo</label>
              <input className="form-control" placeholder="https://..." value={form.logo_url} onChange={e => setForm({...form,logo_url:e.target.value})} />
              <div className="form-text mt-1">Subi tu logo a Google Drive o Imgur y pega la URL directa aqui.</div>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem' }}>
            <button className="btn btn-navy px-4 py-2" onClick={save}>
              Guardar configuracion
            </button>
          </div>

          {saved && (
            <div className="alert alert-success mt-3">
              ✓ Configuracion guardada correctamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
