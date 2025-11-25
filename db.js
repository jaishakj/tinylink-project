// db.js
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  // Neon requires TLS; ensure node pg uses it
  ssl: { rejectUnauthorized: false }
});

async function init() {
  const sql = `
  CREATE TABLE IF NOT EXISTS links (
    code TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_clicked TIMESTAMPTZ,
    deleted BOOLEAN NOT NULL DEFAULT false
  );`;
  await pool.query(sql);
}
init().catch(err => {
  console.error('DB init failed', err);
  process.exit(1);
});

module.exports = {
  // return single row
  get: async (text, params = []) => {
    const res = await pool.query(text, Array.isArray(params) ? params : [params]);
    return res.rows[0];
  },
  // return all rows
  all: async (text, params = []) => {
    const res = await pool.query(text, params);
    return res.rows;
  },
  // run query (insert/update/delete)
  run: async (text, params = []) => {
    return pool.query(text, params);
  },
  pool
};
