#!/bin/sh
# Backup von Datenbank + Datei-/Foto-Anhängen des Fertighaus-Helfers.
#
# Nutzung (im Verzeichnis mit der docker-compose*.yml):
#   ./scripts/backup.sh [ZIEL-VERZEICHNIS]        # Standard: ./backups
#
# Für die Public-Compose-Variante COMPOSE-Env setzen, z. B.:
#   COMPOSE="docker compose -f docker-compose.public.yml" ./scripts/backup.sh
set -e

COMPOSE="${COMPOSE:-docker compose}"
DEST="${1:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

echo "[backup] Datenbank  -> $DEST/db-$STAMP.sql.gz"
$COMPOSE exec -T db pg_dump -U alkauf_user alkauf_haus | gzip > "$DEST/db-$STAMP.sql.gz"

echo "[backup] Anhänge    -> $DEST/uploads-$STAMP.tar.gz"
$COMPOSE exec -T backend tar czf - -C /app uploads > "$DEST/uploads-$STAMP.tar.gz"

echo "[backup] Fertig:"
echo "         $DEST/db-$STAMP.sql.gz"
echo "         $DEST/uploads-$STAMP.tar.gz"
echo "[backup] TIPP: vor jedem Update ausführen (der Backend-Start migriert die DB automatisch)."
