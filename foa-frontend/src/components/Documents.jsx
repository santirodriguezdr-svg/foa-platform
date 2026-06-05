import React, { useState } from 'react';
import api from '../api';

const INCOTERMS = ['FOB','CIF','EXW','CFR','DAP','DDP'];
const CURRENCIES = ['USD','EUR','ARS'];
const FREIGHTS = ['Freight Prepaid','Freight Collect','Freight as Arranged'];

export default function Documents() {
  const [form, setForm] = useState({
    invoiceNo: '', date: new Date().toISOString().split('T')[0], incoterm: 'FOB', currency: 'USD',
    importador: '', importadorCountry: '', importadorTaxId: '', importadorAddress: '',
    portOfLoading: '', portOfDischarge: '', countryOfOrigin: '', vessel: '', etd: '', eta: '',
    freightTerms: 'Freight Prepaid', specialInstructions: '', totalValue: '', totalGrossWeight: '', totalNetWeight: '', totalCBM: ''
  });
  const [items, setItems] = useState([{ description: '', hsCode: '', qty: '', unit: '', unitPrice: '', grossWeight: '', netWeight: '' }]);
  const [docTypes, setDocTypes] = useState({ invoice: true, packing: true, bl: true });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setItem = (i, k, v) => setItems(prev => prev.map((it, j) => j === i ? { ...it, [k]: v } : it));

  const generate = async () => {
    const types = Object.entries(docTypes).filter(([,v]) => v).map(([k]) => k);
    if (!types.length) return;
    if (!form.importador) return alert('Ingresa el nombre del importador.');
    setLoading(true); setSuccess(false);
    const allItems = items.map(it => ({ ...it, amount: ((parseFloat(it.qty)||0) * (parseFloat(it.unitPrice)||0)).toFixed(2), packages: '1' }));
    try {
      const { data } = await api.post('/api/documents/generate', { docTypes: types, data: { ...form, items: allItems } });
      if (data.error) return alert('Error: ' + data.error);
      data.documents.forEach(({ data: b64, fileName }) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const a = document.createElement('a'); a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      });
      setSuccess(true);
    } catch { alert('Error generando documentos.'); }
    setLoading(false);
  };

  const F = ({ label, id, type = 'text', placeholder = '' }) => (
    <><label className="form-label">{label}</label><input className="form-control" type={type} placeholder={placeholder} value={form[id]} onChange={e => setF(id, e.target.value)} /></>
  );

  return (
    <div>
      <div className="card mb-3"><div className="card-body p-4">
        <span className="section-label">Datos del documento</span>
        <div className="row g-3">
          <div className="col-md-4"><F label="N Invoice" id="invoiceNo" placeholder="INV-001" /></div>
          <div className="col-md-2"><F label="Fecha" id="date" type="date" /></div>
          <div className="col-md-3"><label className="form-label">Incoterm</label><select className="form-select" value={form.incoterm} onChange={e => setF('incoterm',e.target.value)}>{INCOTERMS.map(v=><option key={v}>{v}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label">Moneda</label><select className="form-select" value={form.currency} onChange={e => setF('currency',e.target.value)}>{CURRENCIES.map(v=><option key={v}>{v}</option>)}</select></div>
        </div>
      </div></div>

      <div className="card mb-3"><div className="card-body p-4">
        <span className="section-label">Importador</span>
        <div className="row g-3">
          <div className="col-md-6"><F label="Empresa" id="importador" placeholder="Global Imports LLC" /></div>
          <div className="col-md-3"><F label="Pais" id="importadorCountry" placeholder="USA" /></div>
          <div className="col-md-3"><F label="Tax ID" id="importadorTaxId" placeholder="EIN" /></div>
          <div className="col-12"><F label="Direccion" id="importadorAddress" placeholder="500 Commerce St, Miami FL" /></div>
        </div>
      </div></div>

      <div className="card mb-3"><div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="section-label mb-0">Mercaderia</span>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setItems([...items, { description:'',hsCode:'',qty:'',unit:'',unitPrice:'',grossWeight:'',netWeight:'' }])}>+ Agregar item</button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead className="table-dark"><tr><th>Descripcion</th><th>NCM</th><th>Cant.</th><th>Unidad</th><th>Precio Unit.</th><th>GW (kg)</th><th>NW (kg)</th><th></th></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  {['description','hsCode','qty','unit','unitPrice','grossWeight','netWeight'].map(k => (
                    <td key={k}><input className="form-control form-control-sm" value={it[k]} onChange={e => setItem(i,k,e.target.value)} /></td>
                  ))}
                  <td><button className="btn btn-sm text-danger" onClick={() => items.length > 1 && setItems(items.filter((_,j)=>j!==i))}>x</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row g-3 mt-1">
          {[['totalValue','Valor total'],['totalGrossWeight','GW total (kg)'],['totalNetWeight','NW total (kg)'],['totalCBM','Total CBM']].map(([k,l])=>(
            <div className="col-md-3" key={k}><F label={l} id={k} type="number" /></div>
          ))}
        </div>
      </div></div>

      <div className="card mb-3"><div className="card-body p-4">
        <span className="section-label">Routing</span>
        <div className="row g-3">
          <div className="col-md-4"><F label="Puerto origen" id="portOfLoading" placeholder="Puerto de Buenos Aires" /></div>
          <div className="col-md-4"><F label="Puerto destino" id="portOfDischarge" placeholder="Port of Miami" /></div>
          <div className="col-md-4"><F label="Pais de origen" id="countryOfOrigin" placeholder="Argentina" /></div>
          <div className="col-md-4"><F label="Buque / Vuelo" id="vessel" placeholder="MSC OSCAR V.0612" /></div>
          <div className="col-md-2"><F label="ETD" id="etd" type="date" /></div>
          <div className="col-md-2"><F label="ETA" id="eta" type="date" /></div>
          <div className="col-md-4"><label className="form-label">Flete</label><select className="form-select" value={form.freightTerms} onChange={e => setF('freightTerms',e.target.value)}>{FREIGHTS.map(v=><option key={v}>{v}</option>)}</select></div>
          <div className="col-12"><label className="form-label">Instrucciones especiales</label><textarea className="form-control" rows="2" value={form.specialInstructions} onChange={e => setF('specialInstructions',e.target.value)}></textarea></div>
        </div>
      </div></div>

      <div className="card mb-4"><div className="card-body p-4">
        <span className="section-label">Documentos a generar</span>
        <div className="d-flex gap-4 mb-4">
          {[['invoice','Commercial Invoice'],['packing','Packing List'],['bl','BL Instructions']].map(([k,l])=>(
            <div className="form-check" key={k}>
              <input className="form-check-input" type="checkbox" checked={docTypes[k]} onChange={e => setDocTypes({...docTypes,[k]:e.target.checked})} />
              <label className="form-check-label">{l}</label>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button className="btn btn-navy btn-lg px-5 py-3" onClick={generate} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Generando...</> : 'Generar y descargar PDFs'}
          </button>
        </div>
        {success && <div className="alert alert-success mt-3">Documentos generados. La descarga inicio automaticamente.</div>}
      </div></div>
    </div>
  );
}
