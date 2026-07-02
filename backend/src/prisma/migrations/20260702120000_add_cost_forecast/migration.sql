-- Kostenprognose: Reifegrad je Aufgabe, Puffer/Reserve, Kostenstand-Snapshots.
-- Rein additiv: neue Spalten (mit Defaults / nullable) + eine neue Tabelle; bestehende Daten unverändert.

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "cost_status" TEXT NOT NULL DEFAULT 'geschaetzt';

-- AlterTable
ALTER TABLE "project_settings" ADD COLUMN "contingency_percent" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "cost_snapshots" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "phase_order" INTEGER,
    "auto" BOOLEAN NOT NULL DEFAULT false,
    "expected" DECIMAL(12,2) NOT NULL,
    "fixed" DECIMAL(12,2) NOT NULL,
    "committed" DECIMAL(12,2) NOT NULL,
    "open_amount" DECIMAL(12,2) NOT NULL,
    "contingency_percent" DECIMAL(5,2),
    "contingency_amount" DECIMAL(12,2),
    "optimistic" DECIMAL(12,2) NOT NULL,
    "pessimistic" DECIMAL(12,2) NOT NULL,
    "with_contingency" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_snapshots_pkey" PRIMARY KEY ("id")
);
