const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS company_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT, address TEXT, tax_id TEXT,
      email TEXT, phone TEXT, website TEXT, logo_url TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS quote_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      origin TEXT, destination TEXT, cargo TEXT,
      client TEXT, forwarders_count INTEGER, incoterm TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS document_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      invoice_no TEXT, importer TEXT, total_value TEXT,
      currency TEXT, incoterm TEXT, documents TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initDB };
