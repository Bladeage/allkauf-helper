import { createApp } from './app.js';
import { config, assertSecrets } from './config/env.js';
import { startCron } from './services/cronService.js';
import { prisma } from './config/db.js';

assertSecrets();

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[server] Backend läuft auf Port ${config.port} (${config.nodeEnv}).`);
  startCron();
});

async function shutdown(signal) {
  console.log(`[server] ${signal} empfangen — fahre herunter...`);
  server.close(() => {});
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
