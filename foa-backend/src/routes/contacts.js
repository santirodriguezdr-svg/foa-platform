const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM contacts WHERE user_id=$1 ORDER BY name', [req.user.id]
  );
  res.json(rows);
});

router.post('/', auth, async (req, res) => {
  const { name, country, tax_id, address, notificatario, notificatario_address, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido.' });
  const { rows } = await pool.query(
    `INSERT INTO contacts (user_id, name, country, tax_id, address, notificatario, notificatario_address, email, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.id, name, country, tax_id, address, notificatario, notificatario_address, email, phone]
  );
  res.json(rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { name, country, tax_id, address, notificatario, notificatario_address, email, phone } = req.body;
  const { rows } = await pool.query(
    `UPDATE contacts SET name=$1, country=$2, tax_id=$3, address=$4,
     notificatario=$5, notificatario_address=$6, email=$7, phone=$8
     WHERE id=$9 AND user_id=$10 RETURNING *`,
    [name, country, tax_id, address, notificatario, notificatario_address, email, phone, req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'No encontrado.' });
  res.json(rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM contacts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
