const router = require('express').Router();
const https = require('https');
const { pool } = require('../db');
const auth = require('../middleware/auth');

// GET /api/ports/search?q=buenos
router.get('/search', auth, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  try {
    const upper = q.toUpperCase();
    const { rows } = await pool.query(`
      SELECT code, country, name, name_alt, function, coordinates
      FROM locode
      WHERE code = $1
         OR name_alt ILIKE $2
         OR name ILIKE $2
      ORDER BY
        CASE WHEN code = $1 THEN 0
             WHEN name_alt ILIKE $3 THEN 1
             WHEN name ILIKE $3 THEN 2
             ELSE 3 END,
        name
      LIMIT 10
    `, [upper, `%${q}%`, `${q}%`]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ports/import  (solo admin, ejecutar una vez)
router.post('/import', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Solo admins' });

  const count = await pool.query('SELECT COUNT(*) FROM locode');
  if (parseInt(count.rows[0].count) > 0) {
    return res.json({ message: 'Ya importado', count: count.rows[0].count });
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' });
  res.write('Descargando dataset UNLOCODE...\n');

  const CSV_URL = 'https://raw.githubusercontent.com/datasets/un-locode/main/data/code-list.csv';

  const csvData = await new Promise((resolve, reject) => {
    https.get(CSV_URL, resp => {
      let data = '';
      resp.on('data', chunk => { data += chunk; });
      resp.on('end', () => resolve(data));
      resp.on('error', reject);
    }).on('error', reject);
  });

  res.write('Parseando CSV...\n');

  const lines = csvData.split('\n');
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV parse simple (los campos no contienen comas internas en este dataset)
    const cols = line.split(',');
    if (cols.length < 8) continue;

    const country  = cols[1]?.trim();
    const location = cols[2]?.trim();
    const name     = cols[3]?.replace(/"/g, '').trim();
    const nameAlt  = cols[4]?.replace(/"/g, '').trim();
    const fn       = cols[7]?.trim();
    const coords   = cols[10]?.trim() || '';

    if (!country || !location || !name || !fn) continue;

    // Solo puertos marítimos, aeropuertos y multimodal
    const isMaritime   = fn[0] === '1';
    const isAirport    = fn.length > 3 && fn[3] === '4';
    const isMultimodal = fn.length > 5 && fn[5] === '6';
    if (!isMaritime && !isAirport && !isMultimodal) continue;

    records.push([`${country}${location}`, country, location, name, nameAlt || name, fn, coords]);
  }

  res.write(`Importando ${records.length} registros...\n`);

  const BATCH = 500;
  let imported = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const values = batch.map((r, j) => {
      const base = j * 7;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7})`;
    }).join(',');
    const flat = batch.flat();
    await pool.query(
      `INSERT INTO locode (code,country,location,name,name_alt,function,coordinates) VALUES ${values} ON CONFLICT DO NOTHING`,
      flat
    );
    imported += batch.length;
    if (imported % 5000 === 0) res.write(`  ${imported}/${records.length}...\n`);
  }

  res.write(`Listo! ${imported} puertos importados.\n`);
  res.end();
});

module.exports = router;
