import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

function AnalysisCard({ text }) {
  return (
    <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#1e293b' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h6 style={{ fontWeight: 700, color: '#1a365d', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.35rem', marginTop: '1.25rem', marginBottom: '0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {children}
            </h6>
          ),
          h3: ({ children }) => (
            <div style={{ fontWeight: 700, color: '#334155', marginTop: '1rem', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
              {children}
            </div>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: '#1a365d', color: 'white' }}>{children}</thead>,
          th: ({ children }) => <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</th>,
          td: ({ children }) => <td style={{ padding: '5px 10px', borderBottom: '1px solid #e2e8f0' }}>{children}</td>,
          tr: ({ children, ...props }) => <tr style={{ background: props.style?.background || 'white' }}>{children}</tr>,
          ul: ({ children }) => <ul style={{ paddingLeft: '1.25rem', margin: '0.4rem 0' }}>{children}</ul>,
          li: ({ children }) => <li style={{ marginBottom: '0.2rem' }}>{children}</li>,
          strong: ({ children }) => <strong style={{ color: '#0f172a' }}>{children}</strong>,
          p: ({ children }) => <p style={{ margin: '0.4rem 0' }}>{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function EmailCard({ text, onCopy, copied }) {
  const lines = text.split('\n');
  const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
  const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '').trim() : '';
  const body = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();

  return (
    <div>
      {/* Email header */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem 0.5rem 0 0', padding: '0.75rem 1rem', borderBottom: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asunto</div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', wordBreak: 'break-word' }}>
              {subject || '(sin asunto)'}
            </div>
          </div>
          <button
            className="btn btn-sm"
            style={{ flexShrink: 0, fontSize: '0.75rem', border: '1px solid #cbd5e1', background: copied ? '#f0fdf4' : 'white', color: copied ? '#16a34a' : '#475569', padding: '4px 12px' }}
            onClick={onCopy}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Email body */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '0 0 0.5rem 0.5rem', padding: '1rem', background: 'white', fontSize: '0.875rem', lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'inherit', wordBreak: 'break-word' }}>
        {body}
      </div>
    </div>
  );
}

export default function Quotes() {
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ origen: '', destino: '', mercaderia: '', peso: '', volumen: '', incoterm: 'FOB', cliente: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => ALLOWED_TYPES.includes(f.type) || f.name.match(/\.(pdf|xlsx|xls)$/i));
    setFiles(prev => [...prev, ...valid.filter(f => !prev.find(p => p.name === f.name))]);
  };

  const copy = () => {
    navigator.clipboard.writeText(result.clientEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const analyze = async () => {
    if (!form.origen || !form.destino || !form.cliente) { setError('Completa Origen, Destino y Cliente.'); return; }
    if (!files.length) { setError('Subi al menos un archivo de cotizacion (PDF o Excel).'); return; }
    setError(''); setLoading(true); setResult(null); setCopied(false);
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

  const fileIcon = (name) => name.match(/\.(xlsx|xls)$/i) ? '📊' : '📄';

  return (
    <div>
      {/* Datos del embarque */}
      <div className="card mb-3">
        <div className="card-body p-4">
          <span className="section-label">Datos del embarque</span>
          <div className="row g-3">
            {[['origen','Origen','Ej: Buenos Aires, Argentina'],['destino','Destino','Ej: Miami, USA']].map(([k,l,p]) => (
              <div className="col-md-6" key={k}>
                <label className="form-label">{l}</label>
                <input className="form-control" placeholder={p} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
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
              <input className="form-control" placeholder="Global Imports LLC" value={form.cliente} onChange={e => setForm({...form,cliente:e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* Archivos */}
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

      {result && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body p-4">
                <span className="section-label">Analisis interno</span>
                <AnalysisCard text={result.internalAnalysis} />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body p-4">
                <span className="section-label mb-3 d-block">Email al cliente</span>
                <EmailCard text={result.clientEmail} onCopy={copy} copied={copied} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
