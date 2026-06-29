# Änderungshistorie

Wesentliche Änderungen am **allkauf Fertighaus-Helfer** — neueste zuerst.
Details und Hintergründe stehen in den jeweiligen Git-Commits.

## Kostenprognose
- **Kostenprognose**, die sich Phase für Phase verdichtet: beste Schätzung (Ist wo bekannt, sonst Soll) mit
  **Bandbreite** (optimistisch–pessimistisch).
- **Reifegrad je Kostenposition** (geschätzt → bemustert → beauftragt → abgerechnet) → Anteil „bereits fix".
- **Puffer / Reserve (%)** für Unvorhergesehenes / Nachträge (Einstellungen + Assistent).
- **Kostenstand-Verlauf**: Snapshots — automatisch beim Abschluss einer Phase oder manuell — mit Mini-Diagramm.
- Prognose zusätzlich in der Dashboard-Budget-Kachel; Budget-Warnung greift schon bei der Prognose inkl. Reserve.

## Einrichtungs-Assistent
- Mehrstufiger, geführter Assistent (Button im Dashboard + Auto-Vorschlag bei leerem Projekt):
  aktuelle Phase & rückwirkendes Abhaken, Projekt & Budget, Vertrag/Paket/Kosten, Schlüssel-Termine,
  Zahlungsplan, Kontakte, Abschluss mit Vollständigkeits-Check.

## Bug-Fix & Theme
- **Modal-Fokus-Bug** behoben (Fokus sprang bei jeder Eingabe auf das Schließen-Symbol).
- **Theme-System**: Hell / Dunkel / System + Schriftart + Schriftgröße (pro Gerät in `localStorage`),
  Schnellumschalter in der Kopfzeile, Abschnitt „Darstellung" in den Einstellungen. CSP-konform,
  reine System-Schriften (offline-tauglich).

## Bau-Praxis-Module
- **Mängelliste** (Foto, Ort, Schwere, Frist, Status), **Bautagebuch** (Datum/Wetter/Gewerk/Text/Fotos, PDF-Export).
- **Datei-/Foto-Anhänge** je Aufgabe / Mangel / Tagebuch-Eintrag (lokales Volume, kein externer Dienst).
- **MaBV-Zahlungsplan** (Abschläge nach Baufortschritt) und **Kontakte-Verzeichnis**.
- **Exporte**: Kosten als CSV/PDF, Bautagebuch als PDF, Termine als ICS.
- **Budget-Warnungen** (Dashboard & Kosten).
- ~25 ergänzte Checklisten-Punkte: Behörden-/Inbetriebnahme-Pflichten, Free-Time-Eigenleistungs-Nachweise,
  Finanzierungskosten & Steuervorteile (alle als „ergänzt" markiert und löschbar).

## Datenbasis & Administration
- Seed an die **offizielle allkauf-Baubeschreibung (06/2025)** und die allkauf-FAQ angeglichen; gewähltes
  Dienstleistungspaket **Free Time**; Beträge/Termine bewusst als Platzhalter leer.
- Haus-Bereiche = reales **17-Raum-Programm** (u. a. „Flur" EG vs. „Flur oben" getrennt).
- **Admin-Nutzerverwaltung** (RBAC): anlegen / auflisten / Rolle / Passwort / löschen (mit Selbst- und
  Letzter-Admin-Schutz).

## Erst-Release
- Monorepo: **Backend** (Node · Express · Prisma · PostgreSQL) + **Frontend** (React · Vite · TypeScript ·
  Tailwind, installierbare PWA), `docker-compose` (db · backend · frontend · optionaler Nginx Proxy Manager).
- Phasen & Checklisten, Kosten (Soll/Ist, 4 Kategorien, Eigenleistungs-Stunden & Geldwert), relative
  Meilensteine, Gantt-Zeitleiste, Wiedervorlagen mit ProtonMail-Erinnerung (node-cron), Haus-Planungsmodul.
- **Sicherheit**: JWT im httpOnly-Cookie (`Secure`/`SameSite`), Login-Rate-Limiting, Security-Header (CSP u. a.),
  Helmet; „eingeloggt bleiben".
- **UX**: Toasts, Bestätigungsdialoge, 404-Seite, PWA-Update-Prompt, WCAG-taugliche Kontraste.
