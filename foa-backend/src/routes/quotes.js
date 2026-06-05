const router = require('express').Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { callGroq } = require('../services/groq');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/analyze', auth, upload.array('files'), async (req, res) => {
  try {
    const { origen, destino, mercaderia, peso, volumen, incoterm, cliente } = req.body;
    const quotes = [];

    for (const file of req.files) {
      try {
        const parsed = await pdfParse(file.buffer);
        const text = parsed.text.substring(0, 3000);
        if (text.length < 50) continue;

        const prompt = `You are a freight forwarding expert. Extract the freight quote from this document. Return ONLY a valid JSON object with these exact keys: forwarder (string), via as Air/Sea/Land (string), origin_charges (number), freight (number), destination_charges (number), total (number), transit_days (number), routing (string), currency (string), notes (string). Use 0 for missing numbers. File: ${file.originalname}\n---\n${text}`;
        const result = await callGroq(prompt);
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const q = JSON.parse(cleaned);
        q.source = file.originalname;
        quotes.push(q);
      } catch (e) { continue; }
    }

    if (!quotes.length) return res.json({ error: 'No se pudieron extraer cotizaciones.' });

    let quotesText = '';
    quotes.forEach((q, i) => {
      const total = q.total || (Number(q.origin_charges) + Number(q.freight) + Number(q.destination_charges));
      quotesText += `\nQuote ${i+1} [${q.source}]:\n  Forwarder: ${q.forwarder} | Mode: ${q.via}\n  Origin: ${q.currency} ${q.origin_charges} | Freight: ${q.currency} ${q.freight} | Dest: ${q.currency} ${q.destination_charges}\n  Total: ${q.currency} ${total} | Transit: ${q.transit_days} days | Routing: ${q.routing}\n`;
    });

    const analysisPrompt = `You are a senior freight forwarder.\nSHIPMENT: ${origen} to ${destino}\nCargo: ${mercaderia} | ${peso}kg / ${volumen}CBM | ${incoterm} | Client: ${cliente}\n\nQUOTES:${quotesText}\n\nRespond with EXACTLY two sections:\n## ANALISIS INTERNO\n(Spanish) Comparison table, ranking, recommendation, risks.\n\n## EMAIL AL CLIENTE\n(English) Subject: ...\nProfessional email to ${cliente} with recommended option, price breakdown, next steps.`;

    const analysis = await callGroq(analysisPrompt);
    const parts = analysis.split('## EMAIL AL CLIENTE');

    await pool.query('INSERT INTO quote_history (user_id, origin, destination, cargo, client, forwarders_count, incoterm) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user.id, origen, destino, mercaderia, cliente, quotes.length, incoterm]);

    res.json({
      success: true,
      internalAnalysis: parts[0].replace('## ANALISIS INTERNO', '').trim(),
      clientEmail: parts[1] ? parts[1].trim() : ''
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

module.exports = router;
