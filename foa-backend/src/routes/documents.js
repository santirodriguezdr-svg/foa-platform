const router = require('express').Router();
const PDFDocument = require('pdfkit');
const { pool } = require('../db');
const auth = require('../middleware/auth');

function buildPDF(docType, data, company) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const navy = '#1a365d';
    const titles = { invoice: 'COMMERCIAL INVOICE', packing: 'PACKING LIST', bl: 'BILL OF LADING INSTRUCTIONS' };

    // Header
    doc.fontSize(18).fillColor(navy).font('Helvetica-Bold').text(company.name || 'Empresa', 50, 50);
    doc.fontSize(9).fillColor('#555').font('Helvetica').text(company.address || '', 50, 75);
    if (company.tax_id) doc.text(`Tax ID: ${company.tax_id}  |  ${company.email || ''}`, 50, 88);

    // Blue bar
    doc.rect(50, 105, 495, 4).fill(navy);

    // Title
    doc.fontSize(16).fillColor(navy).font('Helvetica-Bold').text(titles[docType], 50, 118, { align: 'center', width: 495 });

    // Info table
    doc.fontSize(9).font('Helvetica');
    const infoY = 148;
    doc.rect(50, infoY, 120, 18).fill('#e8f0fe');
    doc.rect(170, infoY, 120, 18).fill('white');
    doc.rect(290, infoY, 120, 18).fill('#e8f0fe');
    doc.rect(410, infoY, 135, 18).fill('white');
    doc.fillColor(navy).font('Helvetica-Bold').text('No.', 55, infoY + 4).text('Date', 295, infoY + 4).text('Incoterm', 295, infoY + 22);
    doc.fillColor('#000').font('Helvetica').text(data.invoiceNo || '', 175, infoY + 4).text(data.date || '', 415, infoY + 4).text(data.incoterm || '', 415, infoY + 22);

    // Parties
    const partyY = 200;
    doc.rect(50, partyY, 247, 18).fill(navy).rect(297, partyY, 248, 18).fill(navy);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text('SELLER / EXPORTER', 55, partyY + 4).text('BUYER / IMPORTER', 302, partyY + 4);
    const sellerInfo = [company.name, company.address, company.tax_id ? `Tax ID: ${company.tax_id}` : ''].filter(Boolean).join('\n');
    const buyerInfo = [data.importador, data.importadorAddress, data.importadorCountry].filter(Boolean).join('\n');
    doc.fillColor('#333').font('Helvetica').fontSize(8).text(sellerInfo, 55, partyY + 22, { width: 237 }).text(buyerInfo, 302, partyY + 22, { width: 238 });

    // Content by type
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
    } else if (docType === 'packing') {
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
      [['TOTALS', '#e8f0fe'], ['' , '#e8f0fe'], [data.totalGrossWeight, '#e8f0fe'], [data.totalNetWeight, '#e8f0fe'], [data.totalCBM, '#e8f0fe']].forEach(([v, bg], i) => {
        doc.rect(x, rowY, colW[i], 18).fill(bg);
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text(v || '', x+4, rowY+4);
        x += colW[i];
      });
    } else {
      const fields = [
        ['Shipper', `${company.name || ''}\n${company.address || ''}`],
        ['Consignee', `${data.importador || ''}\n${data.importadorAddress || ''}`],
        ['Notify Party', data.importador || ''],
        ['Port of Loading', data.portOfLoading || ''],
        ['Port of Discharge', data.portOfDischarge || ''],
        ['Vessel / Flight', data.vessel || ''],
        ['ETD', data.etd || ''],
        ['ETA', data.eta || ''],
        ['Freight Terms', data.freightTerms || ''],
        ['Description of Goods', (data.items || []).map(i => [i.qty, i.unit, i.description].filter(Boolean).join(' ')).join('\n')],
        ['Gross Weight', `${data.totalGrossWeight || ''} kg`],
        ['Measurement', `${data.totalCBM || ''} CBM`]
      ];
      let fY = contentY;
      fields.forEach(([label, value], idx) => {
        const h = Math.max(20, Math.ceil(value.length / 40) * 12 + 8);
        doc.rect(50, fY, 150, h).fill(navy).rect(200, fY, 345, h).fill(idx % 2 === 0 ? '#f0f4f8' : 'white');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(8).text(label, 55, fY+4, {width: 140});
        doc.fillColor('#333').font('Helvetica').fontSize(8).text(value, 205, fY+4, {width: 335});
        fY += h;
      });
    }

    // Footer
    doc.rect(50, 750, 495, 20).fill('#e8f0fe');
    doc.fillColor('#555').font('Helvetica-Oblique').fontSize(8)
      .text(`Generated by ${company.name || 'FOA'} - Forwarding Operations Assistant`, 55, 755, { align: 'center', width: 485 });

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

    await pool.query('INSERT INTO document_history (user_id, invoice_no, importer, total_value, currency, incoterm, documents) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user.id, data.invoiceNo, data.importador, data.totalValue, data.currency, data.incoterm, docTypes.join(', ')]);

    res.json({ success: true, documents: results });
  } catch (e) {
    res.json({ error: e.message });
  }
});

module.exports = router;
