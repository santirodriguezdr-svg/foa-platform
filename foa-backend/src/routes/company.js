const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM company_settings WHERE user_id = $1', [req.user.id]);
  res.json(rows[0] || {});
});

router.put('/', auth, async (req, res) => {
  const { name, address, tax_id, email, phone, website, logo_url } = req.body;
  const { rows } = await pool.query('SELECT id FROM company_settings WHERE user_id = $1', [req.user.id]);
  if (rows.length) {
    await pool.query('UPDATE company_settings SET name=$1, address=$2, tax_id=$3, email=$4, phone=$5, website=$6, logo_url=$7, updated_at=NOW() WHERE user_id=$8',
      [name, address, tax_id, email, phone, website, logo_url, req.user.id]);
  } else {
    await pool.query('INSERT INTO company_settings (user_id, name, address, tax_id, email, phone, website, logo_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [req.user.id, name, address, tax_id, email, phone, website, logo_url]);
  }
  res.json({ success: true });
});

module.exports = router;
