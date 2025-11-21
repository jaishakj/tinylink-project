const path = require('path');
const fs = require('fs');

// Determine DB type
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set. Please set it in .env to a PostgreSQL connection string.');
  console.error('Example: DATABASE_URL=postgres://user:pass@host:port/dbname');
  process.exit(1);
}

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon/many cloud providers
});

// Initialize Postgres table
pool.query(`
  CREATE TABLE IF NOT EXISTS links (
    code TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_clicked TIMESTAMP,
    deleted INTEGER NOT NULL DEFAULT 0
  );
`).catch(err => console.error('Error initializing Postgres:', err));

// Wrapper to match interface
const db = {
  get: async (sql, params = []) => {
    // Convert ? to $1, $2, etc.
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => '$' + (i++));
    const res = await pool.query(pgSql, Array.isArray(params) ? params : [params]);
    return res.rows[0];
  },
  all: async (sql, params = []) => {
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => '$' + (i++));
    const res = await pool.query(pgSql, Array.isArray(params) ? params : [params]);
    return res.rows;
  },
  run: async (sql, params = []) => {
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => '$' + (i++));
    const fixedSql = pgSql.replace("datetime('now')", 'NOW()');

    await pool.query(fixedSql, Array.isArray(params) ? params : [params]);
    return { changes: 1 }; // Mock return
  }
};

module.exports = db;

