# 🏠 Fertighaus-Helfer

**English** · [Deutsch](README.md)

**Self-hosted build companion (PWA) for building a prefab / owner-finished house.**
Maps the building project **phase by phase** — from plot & contract to handover and warranty:
checklists, cost tracking with forecast, follow-ups with e-mail reminders, Gantt timeline,
defects list, construction diary, payment schedule and more. Runs entirely on your own server — **no cloud,
no external services**, all data stays with you.

> One household = one instance. The first user registers themselves as administrator on first launch;
> the admin invites further co-users (e.g. partner).

> **🇬🇧 English:** *Fertighaus-Helfer* is a self-hosted PWA companion for building a prefab / owner-finished
> house **in Germany**. The interface is **available in English** — switch via the sidebar (🇩🇪 DE / 🇬🇧 EN) or
> under **Settings**. An English checklist dataset can be seeded with `SEED_DATASET=generic-en`. Full English
> documentation: **[README.en.md](README.en.md)**. Note that the domain content references German building law
> (MaBV, § 650m BGB, KfW/BEG). One instance per household; the first visitor creates the admin account via onboarding.

---

## Features

- **Dashboard** — current phase, budget (planned vs. spent), upcoming follow-ups, guided setup assistant.
- **Phases & checklists** — checkable tasks per building phase, custom tasks, derived progress.
- **Costs & forecast** — planned/actual per phase and total, DIY hours → monetary value, cost forecast with
  range, maturity per item, buffer/reserve and cost-status history (snapshots).
- **Timeline** — Gantt with overlapping phases, milestone markers and a "today" line.
- **Follow-ups** — absolute dates **or** relative milestones (X days before), daily
  summary e-mail (via SMTP, configurable).
- **Defects list** — defects with photo, location, severity, deadline & status.
- **Construction diary** — dated entries (weather, trade, text) with photos; PDF export.
- **Payment schedule** — installments by construction progress (MaBV / § 650m BGB), planned/paid overview.
- **Contacts** — site manager, trades, authorities, utilities with direct phone/e-mail links.
- **File/photo attachments** — on tasks, defects and diary entries (local volume).
- **Exports** — costs as CSV/PDF, construction diary as PDF, appointments as ICS (calendar subscription).
- **House planning** — optional room-program module (feature flag).
- **PWA** — installable, app-shell caching (offline basic navigation), light/dark/system theme.
- **Bilingual** — interface switchable between **German/English** (sidebar & settings); optional English seed.
- **Security** — guided onboarding, JWT login (httpOnly cookie), optional **two-factor authentication
  (TOTP + recovery codes)**, rate limiting, security headers.

---

## Quick start (prebuilt image)

Prerequisite: **Docker** + **Docker Compose v2**. No source checkout required.

```bash
# 1) Fetch compose file and env template
curl -O https://raw.githubusercontent.com/Bladeage/fertighaus-helper/master/docker-compose.public.yml
curl -o .env https://raw.githubusercontent.com/Bladeage/fertighaus-helper/master/.env.example

# 2) Fill in .env — set at least DB_PASSWORD and JWT_SECRET
nano .env
#    Generate JWT_SECRET:  openssl rand -base64 48

# 3) Start
docker compose -f docker-compose.public.yml up -d
```

Then open **http://<host>:8081** → the **onboarding page** guides you through creating your admin account.

The images live in the GitHub Container Registry (multi-arch amd64/arm64):

- `ghcr.io/bladeage/fertighaus-helper-backend`
- `ghcr.io/bladeage/fertighaus-helper-frontend`

Pin a version instead of `latest`: `TAG=1.0.0 docker compose -f docker-compose.public.yml up -d` (image tag without `v`).

### Try it with sample data

For a first impression (populated budget, costs, project data instead of empty) load the demo dataset:

```bash
SEED_DATASET=demo docker compose -f docker-compose.public.yml up -d
```

For real use, use `generic` (default). Screenshots are under [`docs/screenshots/`](docs/screenshots/).

---

## Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `DB_PASSWORD` | Postgres password (choose freely) |
| `JWT_SECRET` | Signs the login tokens & key for 2FA secrets — **long random string** (`openssl rand -base64 48`) |
| `APP_URL` | Base URL for links in the e-mails (your domain or `http://<host>:8081`) |
| `WEB_PORT` | Host port of the WebUI (default `8081`) |
| `TAG` | Image tag (default `latest`) |
| `PROTON_SMTP_USER` / `PROTON_SMTP_PASSWORD` | SMTP access for reminder mails (default server ProtonMail; changeable via `PROTON_SMTP_SERVER`/`PROTON_SMTP_PORT`) |
| `MAIL_TO` | Recipients of the reminders (comma-separated) |
| `ENABLE_HOUSE_MODULE` | `true`/`false` — feature flag for the house module |
| `MAX_UPLOAD_MB` | max. size per file/photo attachment (default 15) |
| `SEED_DATASET` | Initial dataset (see [Datasets](#datasets)); `generic` (default), `demo` (sample data) or your own `custom` |
| `TRUST_PROXY` | Number of trusted reverse-proxy hops. **`1`** (default) for direct access on `:8081`; **`2`** if your own HTTPS reverse proxy sits in front. A wrong value renders the rate limits ineffective. |

> **Users are not created via `.env`.** The first admin is created exclusively through the onboarding page.

---

## Security

- **Onboarding**: On first launch (0 users) the WebUI creates the first **admin**. After that, registration is
  closed; the admin creates further users under **Users**.
- **Login**: Passwords hashed with **bcrypt**; token in an **httpOnly cookie** (`Secure` over HTTPS, `SameSite=Lax`).
  API/CLI clients can alternatively use `Authorization: Bearer <token>`.
- **Two-factor authentication (2FA/TOTP)** — optional per user, enable in **Settings**
  (QR code for authenticator apps like Google Authenticator, Aegis or 1Password). Login then becomes two-step
  (password → 6-digit code). Additionally **10 one-time recovery codes** for device loss. TOTP secrets
  are stored **AES-256-GCM-encrypted** in the database.
- **Rate limiting** on login/setup/2FA, **security headers** (CSP, X-Frame-Options, …) at Nginx, **Helmet** at the backend,
  CORS same-origin by default.
- **Reverse proxy recommended**: The frontend serves the PWA on port 8081 and proxies `/api` → backend. Put a
  reverse proxy (Nginx Proxy Manager, Traefik, Caddy …) in front that **terminates HTTPS** and
  sets `X-Forwarded-Proto: https` (required for the Secure cookie).

Admin tools (on the host):

```bash
# Reset password
docker compose exec backend node src/scripts/resetPassword.js <email> <new-password>

# Reset 2FA (if authenticator AND recovery codes were lost)
docker compose exec backend node src/scripts/disable2fa.js <email>
```

---

## Datasets

The seed populates the app on first launch with a **vendor-neutral** default roadmap for a prefab/
owner-finished house (phases, checklists, milestones, rooms, payment-schedule structure, contact roles). Amounts and dates
are deliberately empty and are filled in by you.

The dataset is interchangeable (`backend/src/prisma/data/`):

| File | Content | Included |
|---|---|---|
| `data/generic.js` | vendor-neutral default (German) | ✅ Default |
| `data/generic-en.js` | English translation of the default | ✅ (`SEED_DATASET=generic-en`) |
| `data/demo.js` | default + sample amounts/data | ✅ (`SEED_DATASET=demo`) |
| `data/custom.js` | your own/vendor-specific dataset | local (via `.gitignore`) |

Without `SEED_DATASET`, `custom` is preferred (if present), otherwise `generic`. `SEED_DATASET=generic|custom`
forces a dataset. You create your own dataset by copying `data/generic.js` to `data/custom.js`
and adjusting it.

> ⚠️ The seed matches tasks by title. Do **not** switch the dataset in an already-populated database —
> the tasks would be added in addition, not replaced.

---

## Build yourself / development

```bash
git clone https://github.com/Bladeage/fertighaus-helper.git
cd fertighaus-helper
cp .env.example .env && nano .env

# build & start from source
docker compose up -d --build
```

Locally without Docker:

```bash
# Backend
cd backend && npm install
npx prisma migrate deploy && npm run seed
npm run dev            # http://localhost:5000

# Frontend
cd frontend && npm install
npm run dev            # http://localhost:5173  (proxies /api -> :5000)
```

Building and publishing your own images is handled by the GitHub Actions workflow
(`.github/workflows/docker-publish.yml`): a push to `master` or a tag `v*` builds backend and frontend
(multi-arch) and pushes them to `ghcr.io`. The packages must be set to **public** once in the GitHub package settings
so they can be pulled without login.

---

## Useful commands

```bash
docker compose logs -f backend                       # Backend logs (incl. cron/seed)
docker compose exec backend node src/prisma/seed.js  # Seed again (idempotent)
docker compose down                                  # stop
docker compose down -v                               # stop + delete DB volume (data loss!)
```

### Backup & restore

The **database** and the **attachments** (`uploads_data`) must be backed up. Ready-made script (creates timestamped archives under `./backups/`):

```bash
./scripts/backup.sh
# Public compose:  COMPOSE="docker compose -f docker-compose.public.yml" ./scripts/backup.sh
```

**Take a backup before every update** — the backend startup migrates the database automatically.

Restore (caution: overwrites data):

```bash
gunzip -c backups/db-<stamp>.sql.gz | docker compose exec -T db psql -U alkauf_user -d alkauf_haus
docker compose exec -T backend tar xzf - -C /app < backups/uploads-<stamp>.tar.gz
docker compose restart backend
```

---

## Technology

`backend/` Node 20 · Express · Prisma · PostgreSQL — JWT auth, 2FA (TOTP), CRUD, costs, cron mail.
`frontend/` React 18 · Vite · TypeScript · Tailwind — installable PWA.
The backend runs as non-root in the container; migration & idempotent seed run automatically on startup.

---

## License

Released under the **MIT license** — see [LICENSE](LICENSE). Use, modification and distribution (including
commercial) are free as long as the copyright notice is retained. The software comes without warranty.

## Notes

The vendor-neutral dataset reflects the generally customary prefab-house process; references to laws and standards
(KfW/BEG, MaBV, § 650m BGB, DIN/VDE, MaStR, § 14a EnWG) are generally applicable. The project has **no
affiliation** with any particular house provider; any brand names mentioned (if used in your own `custom` dataset)
belong to their respective owners. No warranty — check the requirements applicable to your building project
yourself or with professionals.
