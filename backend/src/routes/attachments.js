import { Router } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { uploadDir, ensureUploadDir, filePathFor, removeFiles } from '../utils/uploads.js';

const router = Router();
router.use(requireAuth);

ensureUploadDir();

const PARENTS = ['taskId', 'phaseId', 'defectId', 'diaryEntryId'];

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 12).replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `${crypto.randomUUID()}${ext || ''}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new HttpError(400, `Dateityp nicht erlaubt: ${file.mimetype}`));
  },
});

// Multer-Fehler (z. B. Größe) in saubere 400er übersetzen.
function uploadSingle(req, res, next) {
  multerUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Datei zu groß (max. ${Math.round(config.maxUploadBytes / 1024 / 1024)} MB)`
            : `Upload-Fehler: ${err.message}`;
        return next(new HttpError(400, msg));
      }
      return next(err);
    }
    next();
  });
}

// Liste der Anhänge eines übergeordneten Objekts: ?taskId= | ?phaseId= | ?defectId= | ?diaryEntryId=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};
    for (const k of PARENTS) if (req.query[k]) where[k] = Number(req.query[k]);
    const list = await prisma.attachment.findMany({ where, orderBy: { uploadedAt: 'desc' } });
    send(res, list);
  }),
);

// Upload: multipart/form-data mit Feld "file" + genau einer Eltern-ID.
router.post(
  '/',
  uploadSingle,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Keine Datei empfangen (Feld "file").');
    const provided = PARENTS.filter((p) => req.body[p] !== undefined && req.body[p] !== '' && req.body[p] !== null);
    if (provided.length !== 1) {
      removeFiles([{ filename: req.file.filename }]);
      throw new HttpError(400, 'Genau eine übergeordnete Referenz angeben (taskId | phaseId | defectId | diaryEntryId).');
    }
    const key = provided[0];
    const data = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      [key]: Number(req.body[key]),
    };
    try {
      const att = await prisma.attachment.create({ data });
      send(res, att, 201);
    } catch (e) {
      removeFiles([{ filename: req.file.filename }]);
      throw e;
    }
  }),
);

// Datei ausliefern (inline; ?download=1 erzwingt Download). Auth über Cookie => <img src> funktioniert.
router.get(
  '/:id/file',
  asyncHandler(async (req, res) => {
    const att = await prisma.attachment.findUnique({ where: { id: Number(req.params.id) } });
    if (!att) throw new HttpError(404, 'Anhang nicht gefunden');
    const p = filePathFor(att.filename);
    if (!fs.existsSync(p)) throw new HttpError(404, 'Datei nicht gefunden');
    const disp = req.query.download ? 'attachment' : 'inline';
    res.setHeader('Content-Type', att.mimeType);
    res.setHeader('Content-Disposition', `${disp}; filename*=UTF-8''${encodeURIComponent(att.originalName)}`);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    fs.createReadStream(p).pipe(res);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const att = await prisma.attachment.findUnique({ where: { id } });
    if (att) {
      removeFiles([att]);
      await prisma.attachment.delete({ where: { id } });
    }
    res.status(204).end();
  }),
);

export default router;
