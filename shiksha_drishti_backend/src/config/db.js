const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: '-c TimeZone=Asia/Kolkata',
  max: Number(process.env.DB_POOL_MAX) || 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  if (err.code === 'ECONNRESET' || err.code === '57P01' || err.code === 'EPIPE') {
    console.warn('[SD-DB] Connection reset in pool (recycling):', err.message);
  } else {
    console.error('[SD-DB] Unexpected pool error', err);
  }
});

const originalQuery = pool.query.bind(pool);
pool.query = async function (...args) {
  try {
    return await originalQuery(...args);
  } catch (err) {
    if (err.code === 'ECONNRESET' || err.code === '57P01' || err.code === 'EPIPE') {
      console.warn('[SD-DB] Retrying query after connection reset...');
      return await originalQuery(...args);
    }
    throw err;
  }
};

module.exports = pool;
