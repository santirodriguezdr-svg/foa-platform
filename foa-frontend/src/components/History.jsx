import React, { useState, useEffect } from 'react';
import api from '../api';

export default function History() {
  const [data, setData] = useState({ quotes: [], documents: [] });

  useEffect(() => { api.get('/api/history').then(({ data }) => setData(data)); }, []);

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body p-4">
          <span className="section-label">Cotizaciones analizadas</span>
          {data.quotes.length === 0 ? (
            <EmptyState text="Todavia no analizaste ninguna cotizacion." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Origen → Destino</th>
                    <th>Mercaderia</th>
                    <th>Cliente</th>
                    <th>Forwarders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.quotes.map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: '#64748b' }}>{new Date(r.created_at).toLocaleDateString('es-AR')}</td>
                      <td><span style={{ fontWeight: 600 }}>{r.origin}</span> → {r.destination}</td>
                      <td style={{ color: '#64748b' }}>{r.cargo}</td>
                      <td>{r.client}</td>
                      <td>
                        <span style={{
                          background: '#eff6ff', color: '#2563eb',
                          borderRadius: 999, padding: '0.2rem 0.6rem',
                          fontSize: '0.78rem', fontWeight: 700
                        }}>
                          {r.forwarders_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body p-4">
          <span className="section-label">Documentos generados</span>
          {data.documents.length === 0 ? (
            <EmptyState text="Todavia no generaste ningun documento." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>N Invoice</th>
                    <th>Importador</th>
                    <th>Valor</th>
                    <th>Documentos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.documents.map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: '#64748b' }}>{new Date(r.created_at).toLocaleDateString('es-AR')}</td>
                      <td><span style={{ fontWeight: 600 }}>{r.invoice_no}</span></td>
                      <td style={{ color: '#64748b' }}>{r.importer}</td>
                      <td>{r.currency} {r.total_value}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.documents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: '0.875rem',
      background: '#f8fafc',
      borderRadius: 10
    }}>
      {text}
    </div>
  );
}
