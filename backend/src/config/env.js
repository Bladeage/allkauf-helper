import dotenv from 'dotenv';
dotenv.config();

function bool(v, def = false) {
  if (v === undefined || v === null || v === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function list(v) {
  return (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  cookieName: 'alkauf_token',
  rememberMaxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 Tage (persistentes „eingeloggt bleiben")

  smtp: {
    user: process.env.PROTON_SMTP_USER,
    password: process.env.PROTON_SMTP_PASSWORD,
    server: process.env.PROTON_SMTP_SERVER || 'smtp.protonmail.ch',
    port: Number(process.env.PROTON_SMTP_PORT) || 587,
  },
  mailTo: list(process.env.MAIL_TO),
  reminderLookaheadDays: Number(process.env.REMINDER_LOOKAHEAD_DAYS) || 7,

  appUrl: process.env.APP_URL || 'http://localhost:8081',
  corsOrigin: list(process.env.CORS_ORIGIN),
  enableHouseModule: bool(process.env.ENABLE_HOUSE_MODULE, true),

  // Anzahl vertrauenswürdiger Reverse-Proxy-Hops für Express `trust proxy`.
  // Muss zur Topologie passen, sonst ist req.ip (Rate-Limit-Key) fälschbar:
  //   1 = nur der ausliefernde Frontend-Nginx (Default, sicher bei Direktzugriff auf :8081)
  //   2 = zusätzlicher externer Reverse-Proxy davor (NPM/Traefik/Caddy → nginx → backend)
  trustProxy: process.env.TRUST_PROXY !== undefined ? Number(process.env.TRUST_PROXY) : 1,

  // Block 4: Datei-/Foto-Ablage
  uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024,
};

export function assertSecrets() {
  if (config.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET ist nicht gesetzt (Pflicht in production).');
    }
    // Aus JWT_SECRET wird u.a. der AES-Schlüssel für die 2FA-Secrets abgeleitet — zu kurz wäre gefährlich.
    if (process.env.JWT_SECRET.length < 16) {
      throw new Error('JWT_SECRET ist zu kurz (min. 16 Zeichen). Erzeugen mit: openssl rand -base64 48');
    }
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL ist nicht gesetzt (Pflicht in production).');
    }
  }
}
