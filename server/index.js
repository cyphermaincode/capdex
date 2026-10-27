const app = require('./src/app');
const env = require('./src/config/env');
const { runMigrations } = require('./src/db/migrate');
const { seed } = require('./src/db/seed');
const { isMemoryDb } = require('./src/db/pool');

async function startServer() {
  try {
    if (isMemoryDb()) {
      console.log('Running in-memory database mode: auto-seeding demo data...');
      await seed();
    }

    const server = app.listen(env.PORT, () => {
      console.log(`=========================================`);
      console.log(` CAPDEX REST API Server running on port ${env.PORT}`);
      console.log(` Environment: ${env.NODE_ENV}`);
      console.log(` Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`=========================================`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
