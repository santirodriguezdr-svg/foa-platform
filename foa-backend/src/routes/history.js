const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const quotes = await pool.query('SELECT * FROM quote_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 25', [req.user.id]);
  const docs = await pool.query('SELECT * FROM document_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 25', [req.user.id]);
  res.json({ quotes: quotes.rows, documents: docs.rows });
});

module.exports = router;
