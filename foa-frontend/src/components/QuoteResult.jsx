import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function QuoteResult({ result, shipment, onBack }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(result.clientEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const lines = (result.clientEmail || '').split('\n');
  const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
  const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '').trim() : '';
  const emailBody = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();

  return (
    <div>
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
        >
          ← Volver
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            {shipment.origen} → {shipment.destino}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {shipment.mercaderia && `${shipment.mercaderia} · `}{shipment.cliente}
          </div>
        </div>
      </div>

      {/* Analisis interno */}
      <div className="card mb-4">
        <div className="card-body p-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 4, height: 20, background: '#1c1917', borderRadius: 2 }} />
            <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1c1917' }}>
              Analisis interno
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.75, color: '#1e293b' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h6 style={{ fontWeight: 800, color: '#1c1917', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {children}
                  </h6>
                ),
                h3: ({ children }) => (
                  <div style={{ fontWeight: 700, color: '#334155', marginTop: '1rem', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    {children}
                  </div>
                ),
                table: ({ children }) => (
                  <div style={{ overflowX: 'auto', margin: '1rem 0', borderRadius: 8, border: '1.5px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead style={{ background: '#1c1917' }}>{children}</thead>,
                th: ({ children }) => (
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', fontSize: '0.78rem', letterSpacing: '0.03em' }}>
                    {children}
                  </th>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>{children}</tr>
                ),
                td: ({ children }) => (
                  <td style={{ padding: '8px 14px', color: '#334155', verticalAlign: 'top' }}>{children}</td>
                ),
                ul: ({ children }) => <ul style={{ paddingLeft: '1.4rem', margin: '0.5rem 0' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: '1.4rem', margin: '0.5rem 0' }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: '0.3rem', color: '#334155' }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: '#0f172a', fontWeight: 700 }}>{children}</strong>,
                p: ({ children }) => <p style={{ margin: '0.5rem 0', color: '#334155' }}>{children}</p>,
                blockquote: ({ children }) => (
                  <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '1rem', margin: '0.75rem 0', color: '#78716c', fontStyle: 'italic' }}>
                    {children}
                  </div>
                ),
              }}
            >
              {result.internalAnalysis}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Email al cliente */}
      <div className="card">
        <div className="card-body p-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 4, height: 20, background: '#f59e0b', borderRadius: 2 }} />
              <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1c1917' }}>
                Email al cliente
              </span>
            </div>
            <button
              onClick={copy}
              style={{ fontSize: '0.8rem', border: '1.5px solid #cbd5e1', borderRadius: 7, background: copied ? '#f0fdf4' : 'white', color: copied ? '#16a34a' : '#475569', padding: '5px 16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {copied ? '✓ Copiado' : 'Copiar email'}
            </button>
          </div>

          {/* Cabecera del email */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px 8px 0 0', padding: '0.875rem 1.25rem', borderBottom: 'none' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              Asunto
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
              {subject || '—'}
            </div>
          </div>

          {/* Cuerpo del email */}
          <div style={{
            border: '1.5px solid #e2e8f0',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '1.5rem 1.25rem',
            background: 'white',
            fontSize: '0.875rem',
            lineHeight: 1.85,
            color: '#334155',
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            wordBreak: 'break-word',
            minHeight: 120
          }}>
            {emailBody}
          </div>
        </div>
      </div>
    </div>
  );
}
