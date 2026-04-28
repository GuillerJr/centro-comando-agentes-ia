import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

async function startServer() {
  await pool.query('SELECT 1');
  app.listen(env.port, () => {
    console.log(`[server] backend listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
