const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../db');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!rows.length) return res.json({ success: false, error: 'Email no encontrado.' });
    const user = rows[0];
    if (user.status === 'pending') return res.json({ success: false, error: 'Cuenta pendiente de aprobacion.' });
    if (user.status === 'rejected') return res.json({ success: false, error: 'Solicitud de acceso rechazada.' });
    if (!user.password) return res.json({ success: false, error: 'Esta cuenta usa Google. Inicia sesion con Google.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, error: 'Contrasena incorrecta.' });
    res.json({ success: true, token: makeToken(user), name: user.name, is_admin: user.is_admin });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub: googleId } = ticket.getPayload();

    let { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user = rows[0];

    if (!user) {
      const result = await pool.query(
        'INSERT INTO users (email, name, google_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [email.toLowerCase(), name, googleId, 'pending']
      );
      user = result.rows[0];
    } else if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      user.google_id = googleId;
    }

    if (user.status === 'pending') return res.json({ status: 'pending' });
    if (user.status === 'rejected') return res.json({ status: 'rejected' });

    res.json({ success: true, token: makeToken(user), name: user.name, is_admin: user.is_admin });
  } catch (e) {
    console.error('Google auth error:', e.message);
    res.status(400).json({ error: 'Token de Google invalido.' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password, name, status) VALUES ($1, $2, $3, $4)',
      [email.toLowerCase(), hash, name, 'approved']
    );
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: 'Email ya registrado.' });
  }
});

module.exports = router;
