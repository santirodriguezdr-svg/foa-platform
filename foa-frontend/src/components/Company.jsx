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
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="card-body p-4">
        <span className="section-label">Datos de tu empresa</span>
        <div className="row g-3">
          {[['name','Nombre de la empresa','Logistica S.A.'],['address','Direccion','Av. del Libertador 1234, Buenos Aires']].map(([k,l,p]) => (
            <div className="col-12" key={k}><label className="form-label">{l}</label><input className="form-control" placeholder={p} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} /></div>
          ))}
          {[['tax_id','CUIT / Tax ID','30-12345678-9'],['email','Email',''],['phone','Telefono',''],['website','Sitio web','']].map(([k,l,p]) => (
            <div className="col-md-6" key={k}><label className="form-label">{l}</label><input className="form-control" placeholder={p} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} /></div>
          ))}
          <div className="col-12">
            <label className="form-label">URL del logo</label>
            <input className="form-control" placeholder="https://..." value={form.logo_url} onChange={e => setForm({...form,logo_url:e.target.value})} />
            <div className="form-text">Subi tu logo a Google Drive y pega la URL directa aqui.</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <button className="btn btn-navy px-4 py-2" onClick={save}>Guardar configuracion</button>
        </div>
        {saved && <div className="alert alert-success mt-3">Guardado correctamente.</div>}
      </div>
    </div>
  );
}
