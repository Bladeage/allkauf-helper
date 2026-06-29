import pkg from '@prisma/client';

const { Prisma } = pkg;

// Wandelt Prisma-Ergebnisse JSON-sicher um:
//  - Prisma.Decimal -> Number
//  - Date           -> ISO-String (Date-only-Felder bleiben als UTC-Mitternacht -> YYYY-MM-DD nutzbar)
export function serialize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal && value instanceof Prisma.Decimal) return Number(value);
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Defensive: sensible Felder niemals an den Client serialisieren
      if (k === 'passwordHash' || k === 'password') continue;
      out[k] = serialize(v);
    }
    return out;
  }
  return value;
}

// Antwort-Helfer: serialisiert und sendet
export function send(res, data, status = 200) {
  return res.status(status).json(serialize(data));
}
