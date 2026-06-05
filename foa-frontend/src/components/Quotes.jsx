import React, { useState, useRef } from 'react';
import api from '../api';

export default function Quotes() {
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ origen: '', destino: '', mercaderia: '', peso: '', volumen: '', incoterm: 'FOB', cliente: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    setFiles(prev => [...prev, ...pdfs.filter(f => !prev.find(p => p.name === f.name))]);
  };

  const analyze = async () => {
    if (!form.origen || !form.destino || !form.cliente) { setError('Completa Origen, Destino y Cliente.'); return; }
    if (!files.length) { setError('Subi al menos un PDF.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f));
      const { data } = await api.post('/api/quotes/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.error) setError(data.error);
      else setResult(data);
    } catch { setError('Error al analizar. Intenta de nuevo.'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body p-4">
          <span className="section-label">Datos del embarque</span>
          <div className="row g-3">
            {[['origen','Origen','Inserte Origen'],['destino','Destino','Inserte Destino']].map(([k,l,p]) => (
              <div className="col-md-6" key={k}><label className="form-label">{l}</label><input className="form-control" placeholder={p} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} /></div>
            ))}
            <div className="col-12"><label className="form-label">Mercaderia</label><input className="form-control" placeholder="Descripcion de la mercaderia" value={form.mercaderia} onChange={e => setForm({...form,mercaderia:e.target.value})} /></div>
            <div className="col-md-3"><label className="form-label">Peso (kg)</label><input className="form-control" type="number" value={form.peso} onChange={e => setForm({...form,peso:e.target.value})} /></div>
            <div className="col-md-3"><label className="form-label">Volumen (CBM)</label><input className="form-control" type="number" value={form.volumen} onChange={e => setForm({...form,volumen:e.target.value})} /></div>
            <div className="col-md-3"><label className="form-label">Incoterm</label>
              <select className="form-select" value={form.incoterm} onChange={e => setForm({...form,incoterm:e.target.value})}>
                {['FOB','CIF','EXW','CFR','DAP','DDP'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-3"><label className="form-label">Cliente</label><input className="form-control" placeholder="Global Imports LLC" value={form.cliente} onChange={e => setForm({...form,cliente:e.target.value})} /></div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body p-4">
          <span className="section-label">PDFs de cotizacion</span>
          <div className="drop-zone" onClick={() => inputRef.current.click()}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            <div style={{ fontSize: '2rem' }}>&#128196;</div>
            <p className="fw-semibold mb-1">Subi los PDFs de cotizacion</p>
            <p className="text-muted small mb-0">Click o arrastra - Solo PDF</p>
            <input ref={inputRef} type="file" multiple accept=".pdf" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          </div>
          {files.map((f, i) => (
            <div key={i} className="d-flex justify-content-between align-items-center bg-light rounded px-3 py-1 mt-2" style={{ fontSize: '.85rem' }}>
              <span>[PDF] {f.name}</span>
              <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setFiles(files.filter((_,j) => j!==i))}>x</button>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="text-center mb-4">
        <button className="btn btn-navy btn-lg px-5 py-3" onClick={analyze} disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2" />Analizando...</> : 'Analizar cotizaciones'}
        </button>
      </div>

      {result && (
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card h-100"><div className="card-body p-4">
              <span className="section-label">Analisis interno</span>
              <pre>{result.internalAnalysis}</pre>
            </div></div>
          </div>
          <div className="col-md-6">
            <div className="card h-100"><div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="section-label mb-0">Email al cliente (English)</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => navigator.clipboard.writeText(result.clientEmail)}>Copiar</button>
              </div>
              <pre>{result.clientEmail}</pre>
            </div></div>
          </div>
        </div>
      )}
    </div>
  );
}
