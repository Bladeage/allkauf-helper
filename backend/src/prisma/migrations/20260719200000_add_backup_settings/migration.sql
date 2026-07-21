-- Datensicherung in der Oberfläche einstellbar machen.
-- Defaults sind bewusst so gesetzt, dass die Sicherung ohne Zutun aktiv ist:
-- täglich 03:30 Uhr, die letzten 14 Sicherungen werden aufbewahrt.
ALTER TABLE "project_settings" ADD COLUMN "backup_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "project_settings" ADD COLUMN "backup_frequency" TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE "project_settings" ADD COLUMN "backup_time" TEXT NOT NULL DEFAULT '03:30';
ALTER TABLE "project_settings" ADD COLUMN "backup_weekday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "project_settings" ADD COLUMN "backup_keep" INTEGER NOT NULL DEFAULT 14;
