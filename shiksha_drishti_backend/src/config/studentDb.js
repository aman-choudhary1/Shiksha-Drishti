const { Pool } = require('pg');

/**
 * Read-only connection pool for the external student_data (UDISE) database.
 * This pool is kept separate from the main shiksha_drishti pool so that
 * heavy analytics queries on 6.9M rows do not starve the operational DB.
 */
const studentPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.STUDENT_DB_NAME || 'student_data',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: 0,
});

studentPool.on('error', (err) => {
  if (err.code === 'ECONNRESET' || err.code === '57P01' || err.code === 'EPIPE') {
    console.warn('[SD-StudentDB] Connection reset (recycling):', err.message);
  } else {
    console.error('[SD-StudentDB] Unexpected pool error', err);
  }
});

const originalQuery = studentPool.query.bind(studentPool);
studentPool.query = async function (...args) {
  try {
    return await originalQuery(...args);
  } catch (err) {
    if (err.code === 'ECONNRESET' || err.code === '57P01' || err.code === 'EPIPE') {
      console.warn('[SD-StudentDB] Retrying query after connection reset...');
      return await originalQuery(...args);
    }
    throw err;
  }
};

module.exports = studentPool;
