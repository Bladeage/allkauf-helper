# ---- Backend: Node 20 / Express / Prisma ----
FROM node:20-alpine

# Prisma benötigt OpenSSL auf Alpine (sonst Query-Engine-Fehler zur Laufzeit)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies (use lockfile if present for reproducible builds)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# App source
COPY . .

# Generate Prisma Client (schema path comes from package.json -> prisma.schema)
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Entrypoint: migrate (deploy) + idempotenter Seed, dann Server starten
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
