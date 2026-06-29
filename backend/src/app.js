import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

export function createApp() {
  const app = express();

  // Hinter zwei Reverse-Proxys (NPM -> frontend-nginx -> backend): 2 vertrauenswürdige Hops,
  // damit req.ip die echte Client-IP ist (sonst keyt der Rate-Limiter alle auf die NPM-IP).
  app.set('trust proxy', 2);
  app.disable('x-powered-by');

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  // CORS (Abschnitt 8): Default = nur same-origin/serverseitig. Cross-Origin nur, wenn
  // explizit in CORS_ORIGIN erlaubt (leere Liste blockt fremde Origins statt sie zu reflektieren).
  const allowed = new Set(config.corsOrigin);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // same-origin / serverseitig (kein Origin-Header)
        if (allowed.has(origin)) return cb(null, true);
        return cb(null, false);
      },
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiLimiter, apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
