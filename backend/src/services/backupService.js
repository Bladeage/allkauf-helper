import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { config } from '../config/env.js';

// Eingebaute Datensicherung: schreibt pro Lauf zwei Dateien nach config.backup.dir
//   db-<stamp>.sql.gz        — pg_dump der kompletten Datenbank
//   uploads-<stamp>.tar.gz   — alle hochgeladenen Dateien/Fotos
// Namensschema und Aufteilung entsprechen bewusst scripts/backup.sh, damit
// Sicherungen aus beiden Wegen identisch aussehen und gleich wiederhergestellt werden.

const STAMP_RE = /^(db|uploads)-(\d{8}-\d{6})\.(sql|tar)\.gz$/;

export const backupDir = config.backup.dir;

// Verhindert, dass ein manuell ausgelöster Lauf in den Cron-Lauf grätscht.
let running = null;

function stamp(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
    `-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
  );
}

export function ensureBackupDir() {
  fs.mkdirSync(backupDir, { recursive: true });
}

// path.basename schützt vor Path-Traversal, wenn ein Dateiname aus einem Request kommt.
export function backupPathFor(filename) {
  return path.join(backupDir, path.basename(String(filename)));
}

// Startet ein Kommando und leitet stdout in eine Datei. Bricht mit dem
// gesammelten stderr ab, damit z. B. eine pg_dump-Versionsmeldung sichtbar wird.
async function spawnToFile(cmd, args, destination, { gzip = false } = {}) {
  const tmp = `${destination}.part`;
  const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  let stderr = '';
  child.stderr.on('data', (c) => {
    if (stderr.length < 4000) stderr += c.toString();
  });

  const out = fs.createWriteStream(tmp);
  const stages = gzip ? [child.stdout, zlib.createGzip(), out] : [child.stdout, out];

  const exited = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} beendet mit Code ${code}: ${stderr.trim() || '(keine Ausgabe)'}`)),
    );
  });

  try {
    await Promise.all([pipeline(...stages), exited]);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e;
  }

  // Erst nach erfolgreichem Abschluss umbenennen — so liegt nie eine
  // halbfertige Datei herum, die wie ein gültiges Backup aussieht.
  fs.renameSync(tmp, destination);
  return fs.statSync(destination).size;
}

export function listBackups() {
  ensureBackupDir();
  return fs
    .readdirSync(backupDir)
    .filter((f) => STAMP_RE.test(f))
    .map((filename) => {
      const [, kind, when] = filename.match(STAMP_RE);
      return { filename, kind, stamp: when, size: fs.statSync(path.join(backupDir, filename)).size };
    })
    .sort((a, b) => b.stamp.localeCompare(a.stamp) || a.kind.localeCompare(b.kind));
}

// Fasst die Einzeldateien eines Laufs (db + uploads) zu einem Eintrag zusammen.
export function listBackupRuns() {
  const byStamp = new Map();
  for (const f of listBackups()) {
    const run = byStamp.get(f.stamp) || { stamp: f.stamp, files: [], size: 0 };
    run.files.push(f);
    run.size += f.size;
    byStamp.set(f.stamp, run);
  }
  // listBackups() ist bereits absteigend sortiert — Map behält die Reihenfolge.
  return [...byStamp.values()];
}

// Behält die neuesten `keep` Läufe und löscht ältere. 0 = nie aufräumen.
export function pruneBackups(keep = config.backup.keep) {
  if (!keep || keep <= 0) return [];
  const removed = [];
  for (const run of listBackupRuns().slice(keep)) {
    for (const f of run.files) {
      try {
        fs.unlinkSync(path.join(backupDir, f.filename));
        removed.push(f.filename);
      } catch (e) {
        console.error(`[backup] Konnte ${f.filename} nicht löschen:`, e.message);
      }
    }
  }
  return removed;
}

async function performBackup(keep) {
  ensureBackupDir();
  const s = stamp();
  const dbFile = path.join(backupDir, `db-${s}.sql.gz`);
  const uploadsFile = path.join(backupDir, `uploads-${s}.tar.gz`);

  if (!config.databaseUrl) throw new Error('DATABASE_URL ist nicht gesetzt — kein Datenbank-Backup möglich.');

  // --no-owner/--no-privileges: der Dump lässt sich so auch in eine Instanz mit
  // anderem DB-Benutzer einspielen (wichtig für fremde Installationen).
  const dbBytes = await spawnToFile(
    'pg_dump',
    ['--no-owner', '--no-privileges', config.databaseUrl],
    dbFile,
    { gzip: true },
  );

  // Uploads liegen in einem eigenen Volume; -C <parent> hält die Pfade im
  // Archiv relativ ("uploads/..."), damit das Entpacken vorhersagbar bleibt.
  const parent = path.dirname(config.uploadDir);
  const base = path.basename(config.uploadDir);
  fs.mkdirSync(config.uploadDir, { recursive: true });
  const uploadBytes = await spawnToFile('tar', ['czf', '-', '-C', parent, base], uploadsFile);

  const pruned = pruneBackups(keep);
  return {
    stamp: s,
    files: [
      { filename: path.basename(dbFile), size: dbBytes },
      { filename: path.basename(uploadsFile), size: uploadBytes },
    ],
    pruned,
  };
}

// Ein Lauf zur Zeit: parallele Aufrufe bekommen dasselbe Ergebnis-Promise.
export function runBackup(keep) {
  if (running) return running;
  running = performBackup(keep).finally(() => {
    running = null;
  });
  return running;
}

export function isBackupRunning() {
  return running !== null;
}
