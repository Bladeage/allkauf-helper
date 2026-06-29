import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

export function createApp() {
  const app = express();

  // Hinter Reverse Proxy (NPM -> frontend-nginx -> backend)
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  // CORS (Abschnitt 8): leere Liste => erlaubt (Prod ist same-origin); gesetzt => nur diese Origins
  const allowed = new Set(config.corsOrigin);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // same-origin / serverseitig
        if (allowed.size === 0 || allowed.has(origin)) return cb(null, true);
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
