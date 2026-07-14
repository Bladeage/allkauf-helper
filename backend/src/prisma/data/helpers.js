// Gemeinsame Helfer für Seed-Datensätze.
//
// Kostenkategorien (für Aufgaben mit Budget-/Kostenbezug):
export const CAT = {
  paket: 'allkauf_paket', // Grundpreis / Festpreis-Pauschale des Hausanbieters
  bem: 'bemusterung_extra', // Bemusterungs-Aufpreise / Zusatzleistungen
  eigen: 'eigenleistung_material', // selbst gekauftes Material
  sonst: 'sonstiges', // Baunebenkosten (Vermessung, Bodenplatte, Hausanschlüsse, ...)
};

// O = offizieller/Basis-Punkt (Baseline, im UI nicht löschbar)
// S = ergänzende Empfehlung (is_custom = true, optional/löschbar)
export const O = (title, extra = {}) => ({ title, isCustom: false, ...extra });
export const S = (title, extra = {}) => ({ title, isCustom: true, ...extra });
