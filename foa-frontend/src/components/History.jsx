import React, { useState, useEffect } from 'react';
import api from '../api';

export default function History() {
  const [data, setData] = useState({ quotes: [], documents: [] });

  useEffect(() => { api.get('/api/history').then(({ data }) => setData(data)); }, []);

  const Table = ({ headers, rows }) => (
    <div className="table-responsive">
      <table className="table table-sm table-hover">
        <thead className="table-dark"><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>) : <tr><td colSpan={headers.length} className="text-muted text-center">Sin registros aun.</td></tr>}</tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body p-4">
          <span className="section-label">Cotizaciones analizadas</span>
          <Table
            headers={['Fecha', 'Origen - Destino', 'Mercaderia', 'Cliente', 'Forwarders']}
            rows={data.quotes.map(r => [new Date(r.created_at).toLocaleDateString('es-AR'), `${r.origin} - ${r.destination}`, r.cargo, r.client, r.forwarders_count])}
          />
        </div>
      </div>
      <div className="card">
        <div className="card-body p-4">
          <span className="section-label">Documentos generados</span>
          <Table
            headers={['Fecha', 'N Invoice', 'Importador', 'Valor', 'Documentos']}
            rows={data.documents.map(r => [new Date(r.created_at).toLocaleDateString('es-AR'), r.invoice_no, r.importer, `${r.currency} ${r.total_value}`, r.documents])}
          />
        </div>
      </div>
    </div>
  );
}
