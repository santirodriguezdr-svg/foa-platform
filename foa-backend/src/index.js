require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/company', require('./routes/company'));
app.use('/api/history', require('./routes/history'));
app.use('/api/admin', require('./routes/admin'));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

initDB().then(() => {
  app.listen(PORT, () => console.log(`FOA Backend running on port ${PORT}`));
}).catch(e => { console.error('DB init failed:', e); process.exit(1); });
