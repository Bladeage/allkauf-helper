import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

export function createApp() {
  const app = express();

  // Vertrauenswürdige Reverse-Proxy-Hops (konfigurierbar via TRUST_PROXY, Default 1).
  // Wichtig für die Sicherheit: bei zu hohem Wert wird req.ip (Rate-Limit-Key) fälschbar,
  // weil der Client dann eigene X-Forwarded-For-Einträge unterschieben kann.
  app.set('trust proxy', config.trustProxy);
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
      credentials: true, // Cookies (httpOnly-Auth) erlauben
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiLimiter, apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
