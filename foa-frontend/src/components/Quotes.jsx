import React, { useState, useRef } from 'react';
import api from '../api';
import QuoteResult from './QuoteResult';
import PortSearch from './PortSearch';
import ClientSelect from './ClientSelect';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

export default function Quotes() {
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ origen: '', destino: '', mercaderia: '', peso: '', volumen: '', incoterm: 'FOB', cliente: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => ALLOWED_TYPES.includes(f.type) || f.name.match(/\.(pdf|xlsx|xls)$/i));
    setFiles(prev => [...prev, ...valid.filter(f => !prev.find(p => p.name === f.name))]);
  };

  const analyze = async () => {
    if (!form.origen || !form.destino || !form.cliente) { setError('Completa Origen, Destino y Cliente.'); return; }
    if (!files.length) { setError('Subi al menos un archivo de cotizacion (PDF o Excel).'); return; }
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f));
      const { data } = await api.post('/api/quotes/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
    } catch { setError('Error al analizar. Intenta de nuevo.'); }
    setLoading(false);
  };

  const handleBack = () => {
    setResult(null);
    setFiles([]);
  };

  if (result) {
    return <QuoteResult result={result} shipment={form} onBack={handleBack} />;
  }

  const fileIcon = (name) => name.match(/\.(xlsx|xls)$/i) ? '📊' : '📄';

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body p-4">
          <span className="section-label">Datos del embarque</span>
          <div className="row g-3">
            <div className="col-md-6">
              <PortSearch label="Origen" value={form.origen} onChange={v => setForm({...form, origen: v})} placeholder="Ciudad o código UNLOCODE" />
            </div>
            <div className="col-md-6">
              <PortSearch label="Destino" value={form.destino} onChange={v => setForm({...form, destino: v})} placeholder="Ciudad o código UNLOCODE" />
            </div>
            <div className="col-12">
              <label className="form-label">Mercaderia</label>
              <input className="form-control" placeholder="Descripcion de la mercaderia" value={form.mercaderia} onChange={e => setForm({...form,mercaderia:e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Peso (kg)</label>
              <input className="form-control" type="number" placeholder="0" value={form.peso} onChange={e => setForm({...form,peso:e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Volumen (CBM)</label>
              <input className="form-control" type="number" placeholder="0" value={form.volumen} onChange={e => setForm({...form,volumen:e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={form.incoterm} onChange={e => setForm({...form,incoterm:e.target.value})}>
                {['FOB','CIF','EXW','CFR','DAP','DDP'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Cliente</label>
              <ClientSelect
                value={form.cliente}
                onChange={v => setForm(f => ({ ...f, cliente: v }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body p-4">
          <span className="section-label">Archivos de cotizacion</span>
          <div
            className="drop-zone"
            onClick={() => inputRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
              Subi tus cotizaciones
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Click o arrastra · PDF o Excel (.xlsx, .xls)</p>
            <input ref={inputRef} type="file" multiple accept=".pdf,.xlsx,.xls" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          </div>
          {files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {files.map((f, i) => (
                <div key={i} className="file-badge">
                  <span>{fileIcon(f.name)} {f.name}</span>
                  <button onClick={() => setFiles(files.filter((_,j) => j!==i))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="text-center mb-4">
        <button className="btn btn-navy btn-lg px-5 py-3" onClick={analyze} disabled={loading}>
          {loading
            ? <><span className="spinner-border spinner-border-sm me-2" />Analizando con IA...</>
            : '✦ Analizar cotizaciones'}
        </button>
      </div>
    </div>
  );
}
