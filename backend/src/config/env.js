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

  // Block 4: Datei-/Foto-Ablage
  uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024,

  seedUsers: [
    {
      name: process.env.SEED_USER1_NAME || 'Fabian',
      email: process.env.SEED_USER1_EMAIL || 'fabian@example.com',
      password: process.env.SEED_USER1_PASSWORD || '',
    },
    {
      name: process.env.SEED_USER2_NAME || 'Partnerin',
      email: process.env.SEED_USER2_EMAIL || 'partnerin@example.com',
      password: process.env.SEED_USER2_PASSWORD || '',
    },
  ],
};

export function assertSecrets() {
  if (config.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET ist nicht gesetzt (Pflicht in production).');
    }
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL ist nicht gesetzt (Pflicht in production).');
    }
  }
}
