import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env.js';

export const uploadDir = config.uploadDir;

export function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// path.basename schützt vor Path-Traversal (../) im gespeicherten Dateinamen.
export function filePathFor(filename) {
  return path.join(uploadDir, path.basename(String(filename)));
}

// Löscht die zu Attachment-Datensätzen gehörenden Dateien von der Platte (Best effort).
export function removeFiles(attachments) {
  for (const a of attachments || []) {
    try {
      fs.unlinkSync(filePathFor(a.filename));
    } catch {
      /* Datei bereits weg / nicht vorhanden — ignorieren */
    }
  }
}
