const { Pool } = require('pg');
const env = require('../config/env');
const { newDb } = require('pg-mem');

let pool = null;
let memDb = null;
let isMemory = false;

function initPool() {
  if (env.DATABASE_URL && !env.USE_MEMORY_DB) {
    try {
      pool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      isMemory = false;
      return;
    } catch (err) {
      console.warn('Postgres connection failed, falling back to in-memory PostgreSQL:', err.message);
    }
  }

  memDb = newDb({
    autoCreateForeignKeyIndices: true
  });

  memDb.public.registerFunction({
    name: 'current_timestamp',
    args: [],
    returns: memDb.public.getType('timestamp'),
    implementation: () => new Date()
  });

  const pgAdapter = memDb.adapters.createPg();
  pool = new pgAdapter.Pool();
  isMemory = true;
}

initPool();

async function query(text, params) {
  if (!pool) initPool();
  return pool.query(text, params);
}

function isMemoryDb() {
  return isMemory;
}

function getMemDb() {
  return memDb;
}

module.exports = {
  query,
  pool,
  isMemoryDb,
  getMemDb
};
