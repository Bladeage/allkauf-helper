# ---- Backend: Node 20 / Express / Prisma ----
FROM node:20-alpine

# Prisma benötigt OpenSSL auf Alpine (sonst Query-Engine-Fehler zur Laufzeit)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies from the lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# App source
COPY . .

# Generate Prisma Client (schema path comes from package.json -> prisma.schema)
RUN npx prisma generate

# Upload-Verzeichnis anlegen und alles dem non-root 'node'-User geben.
# Das Named Volume erbt beim ersten Mount die Ownership dieses Pfads.
RUN mkdir -p /app/uploads && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Nicht als root laufen
USER node

# Healthcheck gegen /api/health (kein curl im Alpine-Image nötig)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Entrypoint: migrate (deploy) + idempotenter Seed, dann Server starten
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
