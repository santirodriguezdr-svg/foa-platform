const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!rows.length) return res.json({ success: false, error: 'Email no encontrado.' });
    const user = rows[0];
    if (user.status !== 'active') return res.json({ success: false, error: 'Cuenta inactiva.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, error: 'Contrasena incorrecta.' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, name: user.name });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password, name) VALUES ($1, $2, $3)', [email.toLowerCase(), hash, name]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: 'Email ya registrado.' });
  }
});

module.exports = router;
