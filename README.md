# 🏠 Fertighaus-Helfer

**Selbst gehosteter Bau-Begleiter (PWA) für den Bau eines Fertig- bzw. Ausbauhauses.**
Bildet das Bauvorhaben **Phase für Phase** ab — von Grundstück & Vertrag bis Abnahme und Gewährleistung:
Checklisten, Kostentracking mit Prognose, Wiedervorlagen mit E-Mail-Erinnerung, Gantt-Zeitleiste,
Mängelliste, Bautagebuch, Zahlungsplan und mehr. Läuft komplett auf deinem eigenen Server — **keine Cloud,
keine externen Dienste**, alle Daten bleiben bei dir.

> Ein Haushalt = eine Instanz. Der erste Nutzer legt sich beim ersten Start selbst als Administrator an;
> weitere Mitnutzer (z. B. Partner:in) lädt der Admin ein.

> **🇬🇧 English:** *Fertighaus-Helfer* is a self-hosted PWA companion for building a prefab / owner-finished
> house **in Germany**. The interface and the built-in checklists are **German only** and reference German
> building law (MaBV, § 650m BGB, KfW/BEG); a partial English UI would be misleading, so it is intentionally
> not provided. Installation, configuration and Docker usage are documented below (in German). One instance
> per household; the first visitor creates the admin account via the onboarding page.

---

## Funktionen

- **Dashboard** — aktuelle Phase, Budget (geplant vs. ausgegeben), nächste Wiedervorlagen, geführter Einrichtungs-Assistent.
- **Phasen & Checklisten** — abhakbare Aufgaben je Bauphase, eigene Aufgaben, abgeleiteter Fortschritt.
- **Kosten & Prognose** — Soll/Ist je Phase und gesamt, Eigenleistungs-Stunden → Geldwert, Kostenprognose mit
  Bandbreite, Reifegrad je Position, Puffer/Reserve und Kostenstand-Verlauf (Snapshots).
- **Zeitleiste** — Gantt mit überlappenden Phasen, Meilenstein-Markern und „heute"-Linie.
- **Wiedervorlagen** — absolute Termine **oder** relative Meilensteine (X Tage vorher), tägliche
  Zusammenfassungs-Mail (per SMTP, konfigurierbar).
- **Mängelliste** — Mängel mit Foto, Ort, Schwere, Frist & Status.
- **Bautagebuch** — datierte Einträge (Wetter, Gewerk, Text) mit Fotos; PDF-Export.
- **Zahlungsplan** — Abschläge nach Baufortschritt (MaBV / § 650m BGB), Soll/Bezahlt-Übersicht.
- **Kontakte** — Bauleiter, Gewerke, Ämter, Versorger mit Tel-/E-Mail-Direktlinks.
- **Datei-/Foto-Anhänge** — an Aufgaben, Mängeln und Tagebuch-Einträgen (lokales Volume).
- **Exporte** — Kosten als CSV/PDF, Bautagebuch als PDF, Termine als ICS (Kalender-Abo).
- **Haus-Planung** — optionales Raumprogramm-Modul (Feature-Flag).
- **PWA** — installierbar, App-Shell-Caching (Offline-Grundnavigation), Hell/Dunkel/System-Theme.
- **Sicherheit** — geführtes Onboarding, JWT-Login (httpOnly-Cookie), optionale **Zwei-Faktor-Authentisierung
  (TOTP + Recovery-Codes)**, Rate-Limiting, Security-Header.

---

## Schnellstart (fertiges Image)

Voraussetzung: **Docker** + **Docker Compose v2**. Kein Quellcode-Checkout nötig.

```bash
# 1) Compose-Datei und Env-Vorlage holen
curl -O https://raw.githubusercontent.com/Bladeage/fertighaus-helper/master/docker-compose.public.yml
curl -o .env https://raw.githubusercontent.com/Bladeage/fertighaus-helper/master/.env.example

# 2) .env ausfüllen — mindestens DB_PASSWORD und JWT_SECRET setzen
nano .env
#    JWT_SECRET erzeugen:  openssl rand -base64 48

# 3) Starten
docker compose -f docker-compose.public.yml up -d
```

Dann **http://<host>:8081** öffnen → die **Onboarding-Seite** führt durch das Anlegen deines Admin-Accounts.

Die Images liegen in der GitHub Container Registry (multi-arch amd64/arm64):

- `ghcr.io/bladeage/fertighaus-helper-backend`
- `ghcr.io/bladeage/fertighaus-helper-frontend`

Feste Version statt `latest`: `TAG=1.0.0 docker compose -f docker-compose.public.yml up -d` (Image-Tag ohne `v`).

### Mit Beispieldaten ausprobieren

Für einen ersten Eindruck (befülltes Budget, Kosten, Projektdaten statt leer) den Demo-Datensatz laden:

```bash
SEED_DATASET=demo docker compose -f docker-compose.public.yml up -d
```

Für den echten Einsatz `generic` (Default) verwenden. Screenshots liegen unter [`docs/screenshots/`](docs/screenshots/).

---

## Konfiguration (`.env`)

| Variable | Zweck |
|---|---|
| `DB_PASSWORD` | Postgres-Passwort (frei wählen) |
| `JWT_SECRET` | Signatur der Login-Tokens & Schlüssel für 2FA-Secrets — **langer Zufalls-String** (`openssl rand -base64 48`) |
| `APP_URL` | Basis-URL für Links in den E-Mails (deine Domain bzw. `http://<host>:8081`) |
| `WEB_PORT` | Host-Port der WebUI (Default `8081`) |
| `TAG` | Image-Tag (Default `latest`) |
| `PROTON_SMTP_USER` / `PROTON_SMTP_PASSWORD` | SMTP-Zugang für Erinnerungs-Mails (Default-Server ProtonMail; via `PROTON_SMTP_SERVER`/`PROTON_SMTP_PORT` änderbar) |
| `MAIL_TO` | Empfänger der Erinnerungen (kommagetrennt) |
| `ENABLE_HOUSE_MODULE` | `true`/`false` — Feature-Flag fürs Haus-Modul |
| `MAX_UPLOAD_MB` | max. Größe je Datei-/Foto-Anhang (Default 15) |
| `SEED_DATASET` | Startdatensatz (siehe [Datensätze](#datensätze)); `generic` (Default), `demo` (Beispieldaten) oder eigener `custom` |
| `TRUST_PROXY` | Anzahl vertrauenswürdiger Reverse-Proxy-Hops. **`1`** (Default) bei Direktzugriff auf `:8081`; **`2`**, wenn ein eigener HTTPS-Reverse-Proxy davor steht. Falscher Wert macht die Rate-Limits wirkungslos. |

> **Nutzer werden nicht über `.env` angelegt.** Der erste Admin entsteht ausschließlich über die Onboarding-Seite.

---

## Sicherheit

- **Onboarding**: Beim ersten Start (0 Nutzer) legt die WebUI den ersten **Admin** an. Danach ist die Registrierung
  geschlossen; weitere Nutzer erstellt der Admin unter **Nutzer**.
- **Login**: Passwörter mit **bcrypt** gehasht; Token im **httpOnly-Cookie** (`Secure` bei HTTPS, `SameSite=Lax`).
  API-/CLI-Clients können alternativ `Authorization: Bearer <token>` nutzen.
- **Zwei-Faktor-Authentisierung (2FA/TOTP)** — optional pro Nutzer, in den **Einstellungen** aktivierbar
  (QR-Code für Authenticator-Apps wie Google Authenticator, Aegis oder 1Password). Login wird dann zweistufig
  (Passwort → 6-stelliger Code). Zusätzlich **10 einmalige Recovery-Codes** für den Geräteverlust. TOTP-Secrets
  liegen **AES-256-GCM-verschlüsselt** in der Datenbank.
- **Rate-Limiting** an Login/Setup/2FA, **Security-Header** (CSP, X-Frame-Options, …) am Nginx, **Helmet** am Backend,
  CORS standardmäßig same-origin.
- **Reverse Proxy empfohlen**: Das Frontend liefert die PWA auf Port 8081 und proxyt `/api` → Backend. Stelle einen
  Reverse Proxy (Nginx Proxy Manager, Traefik, Caddy …) davor, der **HTTPS terminiert** und
  `X-Forwarded-Proto: https` setzt (nötig fürs Secure-Cookie).

Admin-Werkzeuge (auf dem Host):

```bash
# Passwort zurücksetzen
docker compose exec backend node src/scripts/resetPassword.js <email> <neues-passwort>

# 2FA zurücksetzen (falls Authenticator UND Recovery-Codes verloren gingen)
docker compose exec backend node src/scripts/disable2fa.js <email>
```

---

## Datensätze

Der Seed füllt die App beim ersten Start mit einem **herstellerneutralen** Standard-Fahrplan für ein Fertig-/
Ausbauhaus (Phasen, Checklisten, Meilensteine, Räume, Zahlungsplan-Struktur, Kontaktrollen). Beträge und Termine
sind bewusst leer und werden von dir gefüllt.

Der Datensatz ist austauschbar (`backend/src/prisma/data/`):

| Datei | Inhalt | Enthalten |
|---|---|---|
| `data/generic.js` | herstellerneutraler Standard | ✅ Default |
| `data/custom.js` | eigener/anbieterspezifischer Datensatz | lokal (per `.gitignore`) |

Ohne `SEED_DATASET` wird `custom` bevorzugt (falls vorhanden), sonst `generic`. `SEED_DATASET=generic|custom`
erzwingt einen Datensatz. Einen eigenen Datensatz legst du an, indem du `data/generic.js` nach `data/custom.js`
kopierst und anpasst.

> ⚠️ Der Seed matcht Aufgaben per Titel. Wechsle den Datensatz **nicht** in einer bereits befüllten Datenbank —
> die Aufgaben würden zusätzlich angelegt, nicht ersetzt.

---

## Selbst bauen / Entwicklung

```bash
git clone https://github.com/Bladeage/fertighaus-helper.git
cd fertighaus-helper
cp .env.example .env && nano .env

# aus dem Quellcode bauen & starten
docker compose up -d --build
```

Lokal ohne Docker:

```bash
# Backend
cd backend && npm install
npx prisma migrate deploy && npm run seed
npm run dev            # http://localhost:5000

# Frontend
cd frontend && npm install
npm run dev            # http://localhost:5173  (proxyt /api -> :5000)
```

Eigene Images bauen und veröffentlichen übernimmt der GitHub-Actions-Workflow
(`.github/workflows/docker-publish.yml`): Push auf `master` oder ein Tag `v*` baut Backend und Frontend
(multi-arch) und pusht sie nach `ghcr.io`. Die Packages müssen einmalig in den GitHub-Package-Settings auf
**public** gestellt werden, damit sie ohne Login ziehbar sind.

---

## Nützliche Befehle

```bash
docker compose logs -f backend                       # Backend-Logs (inkl. Cron/Seed)
docker compose exec backend node src/prisma/seed.js  # Seed erneut (idempotent)
docker compose down                                  # stoppen
docker compose down -v                               # stoppen + DB-Volume löschen (Datenverlust!)
```

### Backup & Restore

Gesichert werden müssen **Datenbank** und **Anhänge** (`uploads_data`). Fertiges Skript (legt Zeitstempel-Archive unter `./backups/` an):

```bash
./scripts/backup.sh
# Public-Compose:  COMPOSE="docker compose -f docker-compose.public.yml" ./scripts/backup.sh
```

**Vor jedem Update ein Backup ziehen** — der Backend-Start migriert die Datenbank automatisch.

Restore (Achtung: überschreibt Daten):

```bash
gunzip -c backups/db-<stamp>.sql.gz | docker compose exec -T db psql -U alkauf_user -d alkauf_haus
docker compose exec -T backend tar xzf - -C /app < backups/uploads-<stamp>.tar.gz
docker compose restart backend
```

---

## Technik

`backend/` Node 20 · Express · Prisma · PostgreSQL — JWT-Auth, 2FA (TOTP), CRUD, Kosten, Cron-Mail.
`frontend/` React 18 · Vite · TypeScript · Tailwind — installierbare PWA.
Das Backend läuft im Container als non-root; Migration & idempotenter Seed laufen automatisch beim Start.

---

## Lizenz

Veröffentlicht unter der **MIT-Lizenz** — siehe [LICENSE](LICENSE). Nutzung, Änderung und Weitergabe (auch
kommerziell) sind frei, solange der Copyright-Vermerk erhalten bleibt. Die Software kommt ohne Gewährleistung.

## Hinweise

Der herstellerneutrale Datensatz bildet den allgemein üblichen Fertighaus-Ablauf ab; Gesetzes- und Normbezüge
(KfW/BEG, MaBV, § 650m BGB, DIN/VDE, MaStR, § 14a EnWG) sind allgemeingültig. Das Projekt steht in **keiner
Verbindung** zu einem bestimmten Hausanbieter; genannte Markennamen (sofern in einem eigenen `custom`-Datensatz
verwendet) gehören ihren jeweiligen Inhabern. Ohne Gewähr — prüfe die für dein Bauvorhaben geltenden Anforderungen
selbst bzw. mit Fachleuten.
