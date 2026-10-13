require('dotenv').config();
const app = require('./src/app');
const autoMigrate = require('./src/config/autoMigrate');

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Automatically verify schema, tables, and mock assessment seed data on ANY computer
    await autoMigrate();
  } catch (err) {
    console.warn('⚠️ [Startup] Auto-migration note:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n🎓 SHIKSHA DRISHTI API`);
    console.log(`   Chhattisgarh Student Performance Monitoring Platform`);
    console.log(`   ─────────────────────────────────────────────────────`);
    console.log(`   Server:   http://localhost:${PORT}`);
    console.log(`   Health:   http://localhost:${PORT}/health`);
    console.log(`   Env:      ${process.env.NODE_ENV}`);
    console.log(`   DB:       ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   ─────────────────────────────────────────────────────\n`);
  });
}

startServer();
