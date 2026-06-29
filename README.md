# 🏠 allkauf Fertighaus-Helfer

Selbst gehosteter, mobil-optimierter Bau-Begleiter (PWA) für ein allkauf-Ausbauhaus (Modell *Home 12*, ~172 m²).
Bildet das Bauvorhaben **Phase für Phase** ab: Checklisten, Kostentracking, Wiedervorlagen mit E-Mail-Erinnerung,
Gantt-Zeitleiste, relative Meilensteine und ein experimentelles Haus-Planungsmodul.

Monorepo:

```
backend/    Node 20 · Express · Prisma · PostgreSQL  (JWT-Auth, CRUD, Kosten, Cron-Mail)
frontend/   React 18 · Vite · TypeScript · Tailwind  (PWA, installierbar)
docker-compose.yml   db · backend · frontend · Nginx Proxy Manager (Port 8081)
```

---

## 1. Voraussetzungen

- Docker + Docker Compose (v2)
- Ports am Host frei: **8081** (WebUI), **443** (HTTPS), **81** (NPM-Admin)

---

## 2. Schnellstart

```bash
# 1) .env anlegen (aus Vorlage) und Werte eintragen
cp .env.example .env
nano .env        # DB_PASSWORD, JWT_SECRET, ProtonMail, MAIL_TO, SEED-Passwörter …

# 2) Stack bauen & starten
docker compose up -d --build

# 3) DB-Migration + Seed laufen AUTOMATISCH beim Backend-Start.
#    Manuell (falls nötig):
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node src/prisma/seed.js
```

> Das Backend führt beim Start `prisma migrate deploy` und einen **idempotenten Seed** aus
> (legt nur fehlende Daten an, überschreibt nichts). Die App ist also direkt nach
> `docker compose up -d --build` befüllt.

### Wichtige `.env`-Variablen

| Variable | Zweck |
|---|---|
| `DB_PASSWORD` | Postgres-Passwort |
| `JWT_SECRET` | Signatur der Login-Tokens (langer Zufalls-String: `openssl rand -base64 48`) |
| `PROTON_SMTP_USER` / `PROTON_SMTP_PASSWORD` | ProtonMail-SMTP (Token aus der Proton-Weboberfläche) |
| `MAIL_TO` | Empfänger der Erinnerungen (kommagetrennt) |
| `APP_URL` | Basis-URL für Links in den E-Mails (eure Domain bzw. `http://<host>:8081`) |
| `ENABLE_HOUSE_MODULE` | `true`/`false` — Feature-Flag fürs Haus-Modul |
| `SEED_USER1_*`, `SEED_USER2_*` | Die zwei Login-Accounts (Name/E-Mail/Passwort) |

---

## 3. Reverse Proxy → Port 8081

Das **Frontend** (Nginx, liefert die PWA und proxyt `/api` → Backend) liegt direkt auf **Host-Port 8081**.

**Variante A — eigener/externer Reverse Proxy (Standard dieses Compose):**
Im vorhandenen Proxy einen Host anlegen, der auf **`http://<host>:8081`** weiterleitet, dort SSL
(Let's Encrypt) terminieren und optional eine Access-List (Basic Auth) davorschalten.
Damit das **Secure-Cookie** greift, muss der Proxy `X-Forwarded-Proto: https` setzen (Standard bei NPM/Traefik) —
das Frontend-Nginx reicht den Wert durch. Sonst nichts weiter zu tun.

**Variante B — gebündelter Nginx Proxy Manager (ohne eigenen Proxy):**
Beim `frontend`-Service das `ports: ["8081:80"]` entfernen und stattdessen den NPM starten:
`docker compose --profile bundled-proxy up -d`. Dann im NPM-Admin (`http://<host>:81`, Default-Login
ändern!) einen **Proxy Host → `frontend:80`** anlegen, SSL + Access-List aktivieren; WebUI dann auf `:8081`.

> Die App-eigene **JWT-Anmeldung** (httpOnly-Cookie) kommt zusätzlich hinter einer evtl. Basic-Auth.

### fail2ban (Host)

`fail2ban` auf dem Host gegen Brute-Force einrichten und die **NPM-Access-Logs**
(`./npm/data/logs/*.log`) überwachen. Ein Beispiel-Filter/-Jail liegt der NPM-Doku bei.

---

## 4. Lokale Entwicklung (ohne Docker)

```bash
# Backend
cd backend
cp ../.env.example .env        # DATABASE_URL auf lokale Postgres setzen
npm install
npx prisma migrate deploy && npm run seed
npm run dev                    # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev                    # http://localhost:5173  (proxyt /api -> :5000)
```

---

## 5. Sicherheit (Abschnitt 8 + Review-Härtung)

- **JWT-Login** (`POST /api/auth/login`), Passwörter mit **bcrypt** gehasht. Das Token liegt im
  **httpOnly-Cookie** (per JS nicht lesbar; `Secure` bei HTTPS, `SameSite=Lax`). „Eingeloggt bleiben"
  → 30 Tage, sonst `JWT_EXPIRES_IN` (Default 7 Tage). API-/CLI-Clients können alternativ den
  `Authorization: Bearer <token>`-Header nutzen (Token kommt zusätzlich im Login-Body).
- **Rate-Limiting** am Login (10 / 15 min / IP), enges Limit auf der Erinnerungs-Mail + sanftes API-Limit.
- **Security-Header** am ausliefernden Nginx: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy; Helmet am Backend. CORS standardmäßig nur same-origin (sonst `CORS_ORIGIN`).
- **HTTPS** über NPM (Let's Encrypt), **NPM Access-List** (Basic Auth) davor, **fail2ban** am Host.

Passwort eines Accounts zurücksetzen:

```bash
docker compose exec backend node src/scripts/resetPassword.js <email> <neues-passwort>
```

---

## 6. Funktionsumfang

- **Startseite** — aktuelle Phase, Budget (geplant vs. ausgegeben), Ausgaben der Phase, nächste Wiedervorlagen.
- **Zeitleiste** — Gantt (eigenes SVG) mit überlappenden Phasen-Balken, Meilenstein-Markern und „heute"-Linie.
- **Phasen** — Checklisten mit Abhaken, eigene Aufgaben, Fortschritt, abgeleiteter Status.
- **Kosten** — 4 Kategorien (allkauf-Grundpreis / Bemusterung / Eigenleistung Material / Sonstiges),
  pro Phase & gesamt, Soll/Ist, Eigenleistungs-Stunden + kalkulatorischer Geldwert.
- **Wiedervorlagen** — absolute Termine **oder** relative Meilensteine (X Tage vorher), überfällig hervorgehoben,
  tägliche Zusammenfassungs-Mail (ProtonMail, `node-cron`, 08:00 Europe/Berlin).
- **Haus** — experimentelles Planungsmodul (hinter `ENABLE_HOUSE_MODULE`).
- **PWA** — installierbar, App-Shell-Caching (offline-Grundnavigation).

---

## 7. Erweiterungen gegenüber dem Handover

Auf Basis einer Web-Recherche zum typischen Fertighaus-/Ausbauhaus-Ablauf wurden **ergänzende, optionale**
Inhalte hinzugefügt. Alle Ergänzungen sind **klar markiert** und leicht entfernbar:

- **Zusätzliche Checklisten-Punkte** sind als „eigene" Aufgaben (`is_custom=true`) angelegt und im UI mit dem Badge
  **„ergänzt"** gekennzeichnet — sie lassen sich jederzeit bearbeiten oder löschen. Die offiziellen §11-Punkte sind
  gesperrt (nicht löschbar). Inhaltlich u. a.: KfW/BEG-Förderung **vor** Vertragsabschluss, Energieeffizienz-Experte,
  Bauleistungs-/Bauherrenhaftpflicht-/Feuerrohbauversicherung, BG-BAU-Anmeldung der Bauhelfer, Baubeginnanzeige,
  OKFF/Höhenlage, Bautagebuch, Estrich-Trocknung + CM-Messung, Blower-Door-Test, unabhängiger Sachverständiger zur
  Abnahme, 5 % Sicherheitseinbehalt, Energieausweis, Hausnummer/Ummeldung.
- **Neue Phase 6 „Gewährleistung & nach dem Einzug"** (0–5 Jahre nach Abnahme): Unterlagen archivieren,
  Mängel rügen, hydraulischer Abgleich, Gewährleistungsbegehung vor Fristablauf, Wartungen.
- **Kosten-Platzhalter** für oft vergessene Baunebenkosten (Notar/Grunderwerbsteuer, Erschließung/Hausanschlüsse,
  Gerüst, Bauendreinigung, Außenanlagen, Puffer …) sowie die Bemusterungs-Beispiele aus Abschnitt 5.
- **Zusätzliche Felder** (additiv, unkritisch): an Aufgaben `plannedAmount` (Soll), `vendor`, `isPaid`/`paidDate`,
  `priority`; an Phasen `budget`; eine `project_settings`-Tabelle (Gesamtbudget, Projektstart/-ende, Übergabedatum,
  Eigenleistungs-Stundensatz, Wohnfläche) — speist Dashboard-Budget, Gantt-Marker und Stunden→Geldwert-Hochrechnung.

Nicht eingebaut, aber sinnvoll als nächste Schritte (bei Bedarf): Dokumenten-/Foto-Anhänge je Aufgabe,
CSV-/PDF-Export der Kosten, MaBV-Zahlungsplan-Ansicht.

---

## 8. Datenbasis & Platzhalter

Phasen, Checklisten und Meilensteine sind mit der **offiziellen allkauf-Baubeschreibung (Stand 06/2025)**
und der **allkauf-FAQ** abgeglichen: Ausbaupakete AP 1a/1b/2, Bemusterung im Bemusterungszentrum Heinsberg,
Bauherrenleistungen (SiGeKo, Zufahrt/Kran/Baustrom, Bodenplatte/Keller in Eigenleistung, Untermörteln …),
Versicherungspaket über allkauf, der offizielle Bauzeitenplan (Stelltermin 14 Wochen) und die Innenausbau-
Reihenfolge (Elektro → Trockenbau → HLS → Estrich → Trocknung → Spachteln → Außenputz).

Bewusst **leer** (vom Bauherrn zu füllen):
- **Beträge** (allkauf-Grundpreis-Pauschale, Bemusterungs-Aufpreise, Material) → je Aufgabe „Kosten" bzw. Phase „Pauschalen".
- **Termine** (Projektstart/-ende, Meilenstein-Datümer wie „Estrich fertig"/„Stelltermin") → Einstellungen bzw. Wiedervorlagen.
- **Projektname, Wohnfläche, Eigenleistungs-Stundensatz, Gesamtbudget** → Einstellungen.

> Die Referenz-PDFs (Handover, Baubeschreibung) liegen lokal im Projektordner und sind per `.gitignore`
> vom GitHub-Upload ausgeschlossen.

---

## 9. Nützliche Befehle

```bash
docker compose logs -f backend          # Backend-Logs (inkl. Cron/Seed)
docker compose exec backend node src/prisma/seed.js     # Seed erneut (idempotent)
docker compose restart backend
docker compose down                     # stoppen
docker compose down -v                  # stoppen + DB-Volume löschen (Achtung: Datenverlust)
```

Test-Erinnerungsmail sofort auslösen: in der App unter **Wiedervorlagen → „Test-Mail senden"**
(oder `POST /api/reminders/send-now`).
