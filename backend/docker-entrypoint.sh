#!/bin/sh
set -e

echo "[entrypoint] Migriere DB-Schema (prisma migrate deploy)..."
npx prisma migrate deploy || {
  echo "[entrypoint] migrate deploy fehlgeschlagen — Fallback auf 'prisma db push'..."
  npx prisma db push --skip-generate
}

echo "[entrypoint] Spiele Seed ein (idempotent)..."
node src/prisma/seed.js || echo "[entrypoint] Seed übersprungen/teilweise fehlgeschlagen (continuing)."

echo "[entrypoint] Starte Backend-Server..."
exec node src/server.js
