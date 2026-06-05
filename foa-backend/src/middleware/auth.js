const jwt = require('jsonwebtoken');
const { pool } = require('../db');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT status FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length || rows[0].status !== 'approved') {
      return res.status(403).json({ error: 'Cuenta no aprobada' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token invalido' });
  }
};
