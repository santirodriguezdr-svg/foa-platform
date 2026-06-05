import React, { useState } from 'react';
import api from '../api';

const INCOTERMS = ['FOB','CIF','EXW','CFR','DAP','DDP'];
const CURRENCIES = ['USD','EUR','ARS'];
const FREIGHTS = ['Freight Prepaid','Freight Collect','Freight as Arranged'];
const UNITS = ['Cajas','Botellas','Pallets','Unidades','Bolsas','Tambores','Rollos','Piezas','KG','Litros','Sets','Pares'];

const F = ({ label, id, type = 'text', placeholder = '', form, onChange }) => (
  <><label className="form-label">{label}</label><input className="form-control" type={type} placeholder={placeholder} value={form[id]} onChange={e => onChange(id, e.target.value)} /></>
);

export default function Documents() {
  const [form, setForm] = useState({
    invoiceNo: '', date: new Date().toISOString().split('T')[0], incoterm: 'FOB', currency: 'USD',
    permisoEmbarque: '', cantOrig: '1', cantCopias: '3', lugarPago: '',
    importador: '', importadorCountry: '', importadorTaxId: '', importadorAddress: '',
    notificatario: '', notificatarioAddress: '',
    portOfLoading: '', portOfDischarge: '', destFinal: '', countryOfOrigin: '',
    vessel: '', etd: '', eta: '', freightTerms: 'Freight Prepaid',
    container: '', seal: '', booking: '', marcasNros: '',
    specialInstructions: '',
    totalValue: '', totalGrossWeight: '', totalNetWeight: '', totalCBM: ''
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

  return (
    <div>
      {/* Datos del documento */}
      <div className="card mb-3"><div className="card-body p-4">
        <span className="section-label">Datos del documento</span>
        <div className="row g-3">
          <div className="col-md-4"><F form={form} onChange={setF} label="Invoice / Referencia" id="invoiceNo" placeholder="INV-001" /></div>
          <div className="col-md-2"><F form={form} onChange={setF} label="Fecha" id="date" type="date" /></div>
          <div className="col-md-3"><label className="form-label">Incoterm</label><select className="form-select" value={form.incoterm} onChange={e => setF('incoterm',e.target.value)}>{INCOTERMS.map(v=><option key={v}>{v}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label">Moneda</label><select className="form-select" value={form.currency} onChange={e => setF('currency',e.target.value)}>{CURRENCIES.map(v=><option key={v}>{v}</option>)}</select></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="N° Permiso de Embarque" id="permisoEmbarque" placeholder="PE-0000000" /></div>
          <div className="col-md-2"><F form={form} onChange={setF} label="Cant. Originales" id="cantOrig" type="number" /></div>
          <div className="col-md-2"><F form={form} onChange={setF} label="Cant. Copias" id="cantCopias" type="number" /></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Lugar de Pago" id="lugarPago" placeholder="Buenos Aires" /></div>
        </div>
      </div></div>

      {/* Consignatario / Notificatario */}
      <div className="card mb-3"><div className="card-body p-4">
        <span className="section-label">Consignatario y Notificatario</span>
        <div className="row g-3">
          <div className="col-md-6"><F form={form} onChange={setF} label="Consignatario (empresa)" id="importador" placeholder="Nombre de la empresa" /></div>
          <div className="col-md-3"><F form={form} onChange={setF} label="Pais" id="importadorCountry" placeholder="Pais" /></div>
          <div className="col-md-3"><F form={form} onChange={setF} label="Tax ID / CUIT" id="importadorTaxId" placeholder="ID fiscal" /></div>
          <div className="col-12"><F form={form} onChange={setF} label="Domicilio del consignatario" id="importadorAddress" placeholder="Direccion completa" /></div>
          <div className="col-md-6"><F form={form} onChange={setF} label="Notificatario" id="notificatario" placeholder="Nombre (si difiere del consignatario)" /></div>
          <div className="col-md-6"><F form={form} onChange={setF} label="Domicilio del notificatario" id="notificatarioAddress" placeholder="Direccion" /></div>
        </div>
      </div></div>

      {/* Mercadería */}
      <div className="card mb-3"><div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="section-label mb-0">Mercaderia</span>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setItems([...items, { description:'',hsCode:'',qty:'',unit:'',unitPrice:'',grossWeight:'',netWeight:'' }])}>+ Agregar item</button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{minWidth:220}}>Descripcion de la mercaderia</th>
                <th style={{minWidth:90}}>NCM</th>
                <th style={{minWidth:70}}>Cant.</th>
                <th style={{minWidth:110}}>Unidad</th>
                <th style={{minWidth:100}}>Precio Unit.</th>
                <th style={{minWidth:80}}>GW (kg)</th>
                <th style={{minWidth:80}}>NW (kg)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      style={{resize:'vertical', minHeight:'64px'}}
                      value={it.description}
                      onChange={e => setItem(i,'description',e.target.value)}
                      placeholder="Descripcion detallada de la mercaderia"
                    />
                  </td>
                  <td><input className="form-control form-control-sm" value={it.hsCode} onChange={e => setItem(i,'hsCode',e.target.value)} placeholder="0000.00" /></td>
                  <td><input className="form-control form-control-sm" type="number" min="0" value={it.qty} onChange={e => setItem(i,'qty',e.target.value)} /></td>
                  <td>
                    <select className="form-select form-select-sm" value={it.unit} onChange={e => setItem(i,'unit',e.target.value)}>
                      <option value="">Seleccionar</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={it.unitPrice} onChange={e => setItem(i,'unitPrice',e.target.value)} /></td>
                  <td><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={it.grossWeight} onChange={e => setItem(i,'grossWeight',e.target.value)} /></td>
                  <td><input className="form-control form-control-sm" type="number" min="0" step="0.01" value={it.netWeight} onChange={e => setItem(i,'netWeight',e.target.value)} /></td>
                  <td><button className="btn btn-sm text-danger" onClick={() => items.length > 1 && setItems(items.filter((_,j)=>j!==i))}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row g-3 mt-1">
          {[['totalValue','Valor total'],['totalGrossWeight','GW total (kg)'],['totalNetWeight','NW total (kg)'],['totalCBM','Total CBM']].map(([k,l])=>(
            <div className="col-md-3" key={k}><F form={form} onChange={setF} label={l} id={k} type="number" /></div>
          ))}
        </div>
      </div></div>

      {/* Routing y transporte */}
      <div className="card mb-3"><div className="card-body p-4">
        <span className="section-label">Routing y transporte</span>
        <div className="row g-3">
          <div className="col-md-4"><F form={form} onChange={setF} label="Buque / Vuelo" id="vessel" placeholder="Nombre del buque o vuelo" /></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Puerto de carga" id="portOfLoading" placeholder="Ej: Puerto de Buenos Aires" /></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Puerto de descarga" id="portOfDischarge" placeholder="Ej: Port of Rotterdam" /></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Destino final" id="destFinal" placeholder="Ciudad / pais de destino final" /></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Pais de origen" id="countryOfOrigin" placeholder="Pais de origen de la mercaderia" /></div>
          <div className="col-md-2"><F form={form} onChange={setF} label="ETD" id="etd" type="date" /></div>
          <div className="col-md-2"><F form={form} onChange={setF} label="ETA" id="eta" type="date" /></div>
          <div className="col-md-4"><label className="form-label">Terminos de flete</label><select className="form-select" value={form.freightTerms} onChange={e => setF('freightTerms',e.target.value)}>{FREIGHTS.map(v=><option key={v}>{v}</option>)}</select></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Container N°" id="container" placeholder="MSCU1234567" /></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Seal N°" id="seal" placeholder="N° de precinto" /></div>
          <div className="col-md-4"><F form={form} onChange={setF} label="Booking N°" id="booking" placeholder="N° de booking" /></div>
          <div className="col-12"><F form={form} onChange={setF} label="Marcas y numeros" id="marcasNros" placeholder="Marcas, numeros de bultos u otras referencias" /></div>
          <div className="col-12"><label className="form-label">Observaciones</label><textarea className="form-control" rows="2" value={form.specialInstructions} onChange={e => setF('specialInstructions',e.target.value)} placeholder="Instrucciones especiales u observaciones"></textarea></div>
        </div>
      </div></div>

      {/* Documentos a generar */}
      <div className="card mb-4"><div className="card-body p-4">
        <span className="section-label">Documentos a generar</span>
        <div className="d-flex gap-4 mb-4">
          {[['invoice','Commercial Invoice'],['packing','Packing List'],['bl','Declaracion de Embarque']].map(([k,l])=>(
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
