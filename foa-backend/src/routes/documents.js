const router = require('express').Router();
const PDFDocument = require('pdfkit');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const NAVY = '#1a365d';

// ── Declaración de Embarque ──────────────────────────────────────────────────
function buildDeclaracion(doc, data, company) {
  const L = 35;       // left margin x
  const W = 525;      // usable width
  const LH = 13;      // label bar height
  const FH = 52;      // simple field total height (label + value area)
  const BH = 74;      // big field total height (embarcador / consignatario / notificatario)
  const SH = 38;      // small bottom fields (permiso, obs, confeccionado)

  // Column widths — match proportions del XLS
  const HALF  = 262;                    // 2-col layout: left
  const HALF2 = W - HALF;              // 2-col layout: right (263)
  const Q1 = 131, Q2 = 131, Q3 = W - Q1 - Q2;  // 3-col layout (row 16)
  // Mercadería: (10) MARCAS | (11) DESCRIPCION | (12) GW | (13) CBM
  const MC = [105, 236, 92, 92];

  let y = L; // start at top margin

  // ── HEADER: título centrado + info empresa ──────────────────────────────
  const HDR_H = 48;
  doc.rect(L, y, W, HDR_H).fill(NAVY);
  doc.fillColor('white').font('Helvetica-Bold').fontSize(13)
     .text('DECLARACION DE EMBARQUE', L, y + 8, { width: W, align: 'center' });
  doc.fillColor('#c8d8f0').font('Helvetica').fontSize(8)
     .text(
       [company.name, company.address, company.tax_id ? `CUIT: ${company.tax_id}` : ''].filter(Boolean).join('  ·  '),
       L, y + 28, { width: W, align: 'center' }
     );
  y += HDR_H;

  // Helper: dibuja barra de etiqueta
  const label = (x, ly, w, txt) => {
    doc.rect(x, ly, w, LH).fill(NAVY);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(6.5)
       .text(txt, x + 3, ly + 3, { width: w - 6, lineBreak: false });
  };

  // Helper: dibuja área de valor (borde, sin fill)
  const valueBox = (x, ly, w, h, txt, opts = {}) => {
    doc.rect(x, ly, w, h).stroke('#888');
    if (txt) {
      doc.fillColor('#111').font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(opts.size || 8.5)
         .text(txt, x + 4, ly + 5, { width: w - 8 });
    }
  };

  // ── (1) BUQUE  |  PUERTO DE CARGA ──────────────────────────────────────
  label(L,        y, HALF,  '(1) BUQUE');
  label(L + HALF, y, HALF2, 'PUERTO DE CARGA');
  y += LH;
  valueBox(L,        y, HALF,  FH - LH, data.vessel || '');
  valueBox(L + HALF, y, HALF2, FH - LH, data.portOfLoading || '');
  y += FH - LH;

  // ── (2) PUERTO DE DESCARGA  |  (3) DESTINO FINAL ───────────────────────
  label(L,        y, HALF,  '(2) PUERTO DE DESCARGA');
  label(L + HALF, y, HALF2, '(3) DESTINO FINAL');
  y += LH;
  valueBox(L,        y, HALF,  FH - LH, data.portOfDischarge || '');
  valueBox(L + HALF, y, HALF2, FH - LH, data.destFinal || '');
  y += FH - LH;

  // ── (4) CANT. ORIG.  |  (5) CANT. COPIAS  |  (6) LUGAR DE PAGO ────────
  label(L,           y, Q1, '(4) CANT. ORIG.');
  label(L + Q1,      y, Q2, '(5) CANT. COPIAS');
  label(L + Q1 + Q2, y, Q3, '(6) LUGAR DE PAGO');
  y += LH;
  valueBox(L,           y, Q1, FH - LH, data.cantOrig || '1');
  valueBox(L + Q1,      y, Q2, FH - LH, data.cantCopias || '3');
  valueBox(L + Q1 + Q2, y, Q3, FH - LH, data.lugarPago || '');
  y += FH - LH;

  // ── (7) EMBARCADOR ─────────────────────────────────────────────────────
  const shipperInfo = [company.name, company.address, company.tax_id ? `CUIT: ${company.tax_id}` : '', company.email].filter(Boolean).join('\n');
  label(L, y, W, '(7) EMBARCADOR (NOMBRE, DOMICILIO Y Nro DE C.U.I.T.)');
  y += LH;
  valueBox(L, y, W, BH - LH, shipperInfo);
  y += BH - LH;

  // ── (8) CONSIGNATARIO ──────────────────────────────────────────────────
  const consigneeInfo = [data.importador, data.importadorAddress, data.importadorCountry, data.importadorTaxId ? `Tax ID: ${data.importadorTaxId}` : ''].filter(Boolean).join('\n');
  label(L, y, W, '(8) CONSIGNATARIO (NOMBRE Y DOMICILIO)');
  y += LH;
  valueBox(L, y, W, BH - LH, consigneeInfo);
  y += BH - LH;

  // ── (9) NOTIFICATARIO ─────────────────────────────────────────────────
  const notifyInfo = data.notificatario
    ? [data.notificatario, data.notificatarioAddress].filter(Boolean).join('\n')
    : consigneeInfo;
  label(L, y, W, '(9) NOTIFICATARIO (NOMBRE Y DOMICILIO)');
  y += LH;
  valueBox(L, y, W, BH - LH, notifyInfo);
  y += BH - LH;

  // ── (10)(11)(12)(13) ENCABEZADO MERCADERÍA ─────────────────────────────
  const MHDR_H = 20;
  let cx = L;
  ['(10) MARCAS Y NROS', '(11) CANT. DE BULTOS Y DESCRIPCION DE LA MERCADERIA', '(12) PESO BRUTO', '(13) CUBICAJE'].forEach((h, i) => {
    doc.rect(cx, y, MC[i], MHDR_H).fill(NAVY);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(6.5)
       .text(h, cx + 3, y + 4, { width: MC[i] - 6 });
    cx += MC[i];
  });
  y += MHDR_H;

  // ── FILAS DE MERCADERÍA ────────────────────────────────────────────────
  const ROW_H = 20;

  const mercRow = (marcas, desc, gw, cbm, bg) => {
    cx = L;
    [marcas, desc, gw, cbm].forEach((v, i) => {
      doc.rect(cx, y, MC[i], ROW_H).fill(bg).stroke('#888');
      if (v) doc.fillColor('#111').font('Helvetica').fontSize(8)
               .text(v, cx + 3, y + 5, { width: MC[i] - 6, lineBreak: false });
      cx += MC[i];
    });
    y += ROW_H;
  };

  mercRow(`CONTAINER: ${data.container || ''}`, '', '', '', '#f0f4f8');
  mercRow(`SEAL: ${data.seal || ''}`,           '', '', '', 'white');
  mercRow(`BOOKING: ${data.booking || ''}`,     '', '', '', '#f0f4f8');

  const items = data.items || [];
  items.forEach((item, idx) => {
    const desc = [item.qty, item.unit, item.description].filter(Boolean).join(' ');
    const bg = idx % 2 === 0 ? 'white' : '#f8f9fa';

    doc.font('Helvetica').fontSize(8);
    const dynH = Math.max(ROW_H, doc.heightOfString(desc, { width: MC[1] - 6 }) + 10);

    cx = L;
    [data.marcasNros || '', desc, item.grossWeight || '', item.netWeight || ''].forEach((v, i) => {
      doc.rect(cx, y, MC[i], dynH).fill(bg).stroke('#888');
      if (v) doc.fillColor('#111').font('Helvetica').fontSize(8)
               .text(v, cx + 3, y + 5, { width: MC[i] - 6 });
      cx += MC[i];
    });
    y += dynH;
  });

  // Fila de totales
  cx = L;
  [['', MC[0] + MC[1]], [`${data.totalGrossWeight || ''} kg`, MC[2]], [`${data.totalCBM || ''} CBM`, MC[3]]].forEach(([v, w]) => {
    doc.rect(cx, y, w, ROW_H).fill('#e8f0fe').stroke('#888');
    if (v) doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8).text(v, cx + 3, y + 5, { lineBreak: false });
    cx += w;
  });
  y += ROW_H;

  // ── (13) CARGA PELIGROSA ───────────────────────────────────────────────
  label(L, y, W, '(13) SOLO PARA CARGA PELIGROSA');
  // IMO / UN / PAGE en la misma barra
  doc.fillColor('white').font('Helvetica').fontSize(6.5)
     .text('IMO:', L + 190, y + 3, { lineBreak: false })
     .text('UN:', L + 300, y + 3, { lineBreak: false })
     .text('PAGE:', L + 390, y + 3, { lineBreak: false });
  y += LH;
  doc.rect(L, y, W, SH - LH).stroke('#888');
  y += SH - LH;

  // ── (14) PERMISO DE EMBARQUE ──────────────────────────────────────────
  label(L, y, W, '(14) No. DE PERMISO DE EMBARQUE:');
  y += LH;
  valueBox(L, y, W, SH - LH, data.permisoEmbarque || '');
  y += SH - LH;

  // ── (16) OBSERVACIONES ────────────────────────────────────────────────
  label(L, y, W, '(16) OBSERVACIONES:');
  y += LH;
  valueBox(L, y, W, SH - LH, data.specialInstructions || '');
  y += SH - LH;

  // ── (17) CONFECCIONADO POR ────────────────────────────────────────────
  label(L, y, W, '(17) CONFECCIONADO POR:');
  y += LH;
  valueBox(L, y, W, SH - LH, `${company.name || ''}  ·  Forwarding Operations Assistant`);
}

// ── Invoice / Packing (sin cambios) ─────────────────────────────────────────
function buildStandardDoc(doc, data, company, docType) {
  const navy = NAVY;
  const titles = { invoice: 'COMMERCIAL INVOICE', packing: 'PACKING LIST' };

  doc.fontSize(18).fillColor(navy).font('Helvetica-Bold').text(company.name || 'Empresa', 50, 50);
  doc.fontSize(9).fillColor('#555').font('Helvetica').text(company.address || '', 50, 75);
  if (company.tax_id) doc.text(`Tax ID: ${company.tax_id}  |  ${company.email || ''}`, 50, 88);

  doc.rect(50, 105, 495, 4).fill(navy);
  doc.fontSize(16).fillColor(navy).font('Helvetica-Bold').text(titles[docType], 50, 118, { align: 'center', width: 495 });

  doc.fontSize(9).font('Helvetica');
  const infoY = 148;
  doc.rect(50, infoY, 120, 18).fill('#e8f0fe');
  doc.rect(170, infoY, 120, 18).fill('white');
  doc.rect(290, infoY, 120, 18).fill('#e8f0fe');
  doc.rect(410, infoY, 135, 18).fill('white');
  doc.fillColor(navy).font('Helvetica-Bold').text('No.', 55, infoY + 4).text('Date', 295, infoY + 4).text('Incoterm', 295, infoY + 22);
  doc.fillColor('#000').font('Helvetica').text(data.invoiceNo || '', 175, infoY + 4).text(data.date || '', 415, infoY + 4).text(data.incoterm || '', 415, infoY + 22);

  const partyY = 200;
  doc.rect(50, partyY, 247, 18).fill(navy).rect(297, partyY, 248, 18).fill(navy);
  doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text('SELLER / EXPORTER', 55, partyY + 4).text('BUYER / IMPORTER', 302, partyY + 4);
  const sellerInfo = [company.name, company.address, company.tax_id ? `Tax ID: ${company.tax_id}` : ''].filter(Boolean).join('\n');
  const buyerInfo  = [data.importador, data.importadorAddress, data.importadorCountry].filter(Boolean).join('\n');
  doc.fillColor('#333').font('Helvetica').fontSize(8).text(sellerInfo, 55, partyY + 22, { width: 237 }).text(buyerInfo, 302, partyY + 22, { width: 238 });

  const contentY = 300;

  if (docType === 'invoice') {
    const items = data.items || [];
    const headers = ['Description', 'HS Code', 'Qty / Unit', 'Unit Price', 'Amount'];
    const colW = [180, 80, 70, 85, 80];
    let x = 50, hY = contentY;
    headers.forEach((h, i) => { doc.rect(x, hY, colW[i], 18).fill(navy); doc.fillColor('white').font('Helvetica-Bold').fontSize(8).text(h, x+4, hY+4, {width: colW[i]-8}); x += colW[i]; });
    let rowY = contentY + 18;
    items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? 'white' : '#f0f4f8';
      const descH = Math.max(22, doc.font('Helvetica').fontSize(8).heightOfString(item.description || '', {width: colW[0]-8}) + 10);
      x = 50;
      const qtyUnit = [item.qty, item.unit].filter(Boolean).join(' ');
      [item.description, item.hsCode, qtyUnit, `${data.currency} ${item.unitPrice}`, `${data.currency} ${item.amount}`].forEach((v, i) => {
        doc.rect(x, rowY, colW[i], descH).fill(bg);
        doc.fillColor('#000').font('Helvetica').fontSize(8).text(v || '', x+4, rowY+4, {width: colW[i]-8});
        x += colW[i];
      });
      rowY += descH;
    });
    doc.rect(355, rowY, 90, 18).fill('#e8f0fe').rect(445, rowY, 100, 18).fill(navy);
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text('TOTAL', 359, rowY+4);
    doc.fillColor('white').text(`${data.currency} ${data.totalValue}`, 449, rowY+4);

  } else {
    const items = data.items || [];
    const headers = ['Description', 'Qty / Unit', 'GW (kg)', 'NW (kg)', 'CBM'];
    const colW = [200, 95, 75, 75, 100];
    let x = 50, hY = contentY;
    headers.forEach((h, i) => { doc.rect(x, hY, colW[i], 18).fill(navy); doc.fillColor('white').font('Helvetica-Bold').fontSize(8).text(h, x+4, hY+4); x += colW[i]; });
    let rowY = contentY + 18;
    items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? 'white' : '#f0f4f8';
      const descH = Math.max(22, doc.font('Helvetica').fontSize(8).heightOfString(item.description || '', {width: colW[0]-8}) + 10);
      const qtyUnit = [item.qty, item.unit].filter(Boolean).join(' ');
      x = 50;
      [item.description, qtyUnit, item.grossWeight, item.netWeight, ''].forEach((v, i) => {
        doc.rect(x, rowY, colW[i], descH).fill(bg);
        doc.fillColor('#000').font('Helvetica').fontSize(8).text(v || '', x+4, rowY+4, {width: colW[i]-8});
        x += colW[i];
      });
      rowY += descH;
    });
    x = 50;
    [['TOTALS','#e8f0fe'],['',' #e8f0fe'],[data.totalGrossWeight,'#e8f0fe'],[data.totalNetWeight,'#e8f0fe'],[data.totalCBM,'#e8f0fe']].forEach(([v,bg],i)=>{
      doc.rect(x,rowY,colW[i],18).fill(bg);
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text(v||'',x+4,rowY+4);
      x += colW[i];
    });
  }

  doc.rect(50, 750, 495, 20).fill('#e8f0fe');
  doc.fillColor('#555').font('Helvetica-Oblique').fontSize(8)
     .text(`Generated by ${company.name || 'FOA'} - Forwarding Operations Assistant`, 55, 755, { align: 'center', width: 485 });
}

// ── Main builder ─────────────────────────────────────────────────────────────
function buildPDF(docType, data, company) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 35, size: 'A4' });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    if (docType === 'bl') {
      buildDeclaracion(doc, data, company);
    } else {
      buildStandardDoc(doc, data, company, docType);
    }

    doc.end();
  });
}

router.post('/generate', auth, async (req, res) => {
  try {
    const { docTypes, data } = req.body;
    const compRes = await pool.query('SELECT * FROM company_settings WHERE user_id=$1', [req.user.id]);
    const company = compRes.rows[0] || {};
    const results = [];

    for (const type of docTypes) {
      const pdf = await buildPDF(type, data, company);
      results.push({ type, data: pdf.toString('base64'), fileName: `${type}_${data.invoiceNo || ''}.pdf` });
    }

    await pool.query(
      'INSERT INTO document_history (user_id, invoice_no, importer, total_value, currency, incoterm, documents) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user.id, data.invoiceNo, data.importador, data.totalValue, data.currency, data.incoterm, docTypes.join(', ')]
    );

    res.json({ success: true, documents: results });
  } catch (e) {
    res.json({ error: e.message });
  }
});

module.exports = router;
