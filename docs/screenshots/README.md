# Screenshots

Hier gehören Oberflächen-Screenshots hin (im README verlinkt).

So entstehen konsistente Bilder mit Beispieldaten:

1. Demo-Instanz starten:
   ```bash
   SEED_DATASET=demo docker compose -f docker-compose.public.yml up -d
   ```
2. Onboarding durchlaufen (Admin anlegen) und einloggen.
3. Von diesen Ansichten je einen Screenshot (Desktop **und** mobil) speichern als:
   - `dashboard.png` — Startseite mit Budget/Phase
   - `costs.png` — Kostenübersicht mit Prognose
   - `timeline.png` — Gantt-Zeitleiste
   - `phases.png` — Phase mit Checkliste
   - `twofactor.png` — 2FA-Einrichtung (Einstellungen)
4. Anschließend im Haupt-`README.md` referenzieren, z. B.:
   ```markdown
   ![Dashboard](docs/screenshots/dashboard.png)
   ```

> Keine echten personenbezogenen Daten in Screenshots — der `demo`-Datensatz ist dafür gedacht.
