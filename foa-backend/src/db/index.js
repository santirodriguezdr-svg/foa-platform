const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      google_id TEXT,
      status TEXT DEFAULT 'pending',
      is_admin BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Migraciones para deployments existentes
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE users ALTER COLUMN name DROP NOT NULL`).catch(() => {});

  // Migrar status 'active' → 'approved'
  await pool.query(`UPDATE users SET status = 'approved' WHERE status = 'active'`);

  // Marcar admin
  await pool.query(`UPDATE users SET is_admin = true, status = 'approved' WHERE email = 'santirodriguezdr@gmail.com'`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT, address TEXT, tax_id TEXT,
      email TEXT, phone TEXT, website TEXT, logo_url TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quote_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      origin TEXT, destination TEXT, cargo TEXT,
      client TEXT, forwarders_count INTEGER, incoterm TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      invoice_no TEXT, importer TEXT, total_value TEXT,
      currency TEXT, incoterm TEXT, documents TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

module.exports = { pool, initDB };
