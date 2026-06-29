// Herstellerneutraler Standard-Datensatz für ein Fertig-/Ausbauhaus in Deutschland.
// Bewusst anbieterunabhängig gehalten (kein konkreter Hausanbieter, keine Preise).
// Gesetzes-/Normbezüge (KfW/BEG, MaBV, § 650m BGB, DIN/VDE, MaStR, § 14a EnWG) sind
// allgemeingültig. Beträge, Stunden und Termine sind bewusst LEER (Platzhalter).

import { CAT, O, S } from './helpers.js';

export const PHASES = [
  {
    orderNumber: 0,
    title: 'Phase 0 — Vorbereitung & Vertrag',
    description: 'Grundstück, Finanzierung, Hausmodell, Ausbaustufe, Werkvertrag.',
    lumpSums: [],
    tasks: [
      O('Grundstück gekauft / gesichert'),
      O('Bodengutachten beauftragt', {
        description: 'In der Regel Bauherrenleistung. Das Baugrundrisiko trägt üblicherweise der Bauherr.',
      }),
      O('Geprüft: Schutzgebiet (z. B. Wasserschutz), Auflagen vom Bauamt, Altlasten/Kampfmittel'),
      O('Bebauungsplan / § 34-Umgebung geprüft (Dachform, Geschosse, Baugrenzen, GRZ/GFZ)'),
      O('Finanzierung grundsätzlich geklärt (Vorab-Zusage)'),
      O('Hausmodell & Grundriss-Variante ausgewählt'),
      O('Ausbaustufe festgelegt (schlüsselfertig / Ausbauhaus / Bausatz)', {
        description: 'Bestimmt den Eigenleistungsumfang und damit Preis und Bauzeit.',
      }),
      O('Musterhaus / Referenzobjekt besichtigt'),
      O('Versicherungen für die Bauzeit gewählt', {
        description: 'Bauherrenhaftpflicht, Bauleistungsversicherung, Wohngebäude inkl. Feuerrohbau — Beginn/Ende an den Bauzeitplan koppeln.',
      }),
      O('Werkvertrag (Verbraucherbauvertrag) geprüft & unterschrieben', {
        description: 'Bau- und Leistungsbeschreibung als Vertragsbestandteil sichern; Widerrufsrecht (14 Tage) beachten.',
      }),
      S('KfW/BEG-Förderung VOR Vertragsabschluss prüfen & Energieeffizienz-Experten (EEE) einbinden', {
        priority: 'high',
        description: 'Förderungen verfallen bei nachträglicher Beantragung — auch Liefer-/Bauverträge zählen als Vorhabenbeginn.',
      }),
      S('Eigenleistung realistisch eingeschätzt', {
        description: 'Eigenleistung („Muskelhypothek") wird von Banken als Eigenkapital gewertet — aber nur realistisch ansetzen.',
      }),
      S('Risikolebens-/BU-Versicherung für Kreditnehmer geprüft'),
      S('Erwerbsnebenkosten: Grunderwerbsteuer', { costCategory: CAT.sonst }),
      S('Erwerbsnebenkosten: Notar & Grundbucheintrag', { costCategory: CAT.sonst }),
      S('Maklerprovision (falls angefallen)', { costCategory: CAT.sonst }),
      S('Bereitstellungszinsen verhandelt & im Budget eingeplant', {
        costCategory: CAT.sonst,
        description:
          'Banken verlangen oft ~3 %/Jahr auf noch nicht abgerufene Kreditbeträge nach der bereitstellungszinsfreien Zeit (3–12 Monate verhandelbar). Bei langer Bauzeit mit viel Eigenleistung schnell mehrere Tausend Euro extra.',
      }),
      S('Bereitstellungszinsfreie Zeit & phasengenauen Kapitalabruf mit der Bank abgestimmt', {
        description: 'Kapitalabruf an den Ratenplan (MaBV) koppeln, sonst drohen Bereitstellungszinsen oder eine Liquiditätslücke.',
      }),
      S('Grunderwerbsteuer-Vorteil geprüft (Grundstücks- & Hauskaufvertrag sauber getrennt)', {
        description:
          'Stammen Grundstückskauf und Hausliefervertrag von verschiedenen Parteien, fällt Grunderwerbsteuer oft nur auf den Grundstückspreis an. Verträge sauber trennen und belegen.',
      }),
    ],
  },
  {
    orderNumber: 1,
    title: 'Phase 1 — Planung & Bemusterung',
    description: 'Architektengespräch, Grundriss, Statik, Bemusterung, Eigenleistungs-Umfang.',
    lumpSums: [],
    tasks: [
      O('Vermesser beauftragt', {
        costCategory: CAT.sonst,
        description: 'Lageplan, Grobabsteckung, Feineinmessung, Schnurgerüst — häufig nicht im Hauspreis enthalten.',
      }),
      O('Bauantragsgespräch mit Architekt / Planer', {
        description: 'Grundlagenermittlung, Gebäudelage, Grundriss-Anpassung, Bauantragsplanung.',
      }),
      O('Grundriss finalisiert, Sonderwünsche besprochen', {
        description: 'Änderungen an tragenden Wänden meist gegen Aufpreis; Änderungswünsche vor Produktionsfreigabe klären.',
      }),
      O('Statik erstellt', {
        description: 'Prüffähige Statik als Grundlage für Bodenplatte/Keller. Prüfstatik (falls behördlich gefordert) beauftragen.',
      }),
      O('Bemusterung wahrgenommen', {
        description: 'Sanitärobjekte & Armaturen, Fliesen, Fensterbänke, Innentüren, Bodenbeläge, Wandgestaltung auswählen.',
      }),
      O('Bemusterungsprotokoll & Änderungskosten geprüft und unterschrieben', {
        description: 'Auf Vollständigkeit prüfen; entfallene Posten werden je nach Anbieter oft nur verrechnet, nicht ausgezahlt.',
      }),
      O('Eigenleistungs-/Dienstleistungs-Umfang festgelegt (selbst vs. Anbieter)', {
        description: 'Welche Gewerke übernimmt der Anbieter/Partnerfirmen, welche du selbst? Schnittstellen sauber definieren.',
      }),
      S('Elektro-/Smart-Home-Planung fixiert', {
        priority: 'high',
        description: 'Steckdosenanzahl, Netzwerk/LAN, Leerrohre für PV/Wallbox/Speicher früh mitdenken — nachträglich teuer.',
      }),
      S('Lüftungs-/Heizkonzept geklärt (z. B. Wärmepumpe + kontrollierte Wohnraumlüftung mit Wärmerückgewinnung)'),
      S('Bemusterung: Aufpreis-Posten (Upgrades Fliesen/Bäder/Böden)', { costCategory: CAT.bem }),
      S('Küche geplant / Küchenstudio-Termin', { costCategory: CAT.bem }),
      S('Optionale Zusatzleistungen geprüft (Garage/Carport, PV-Anlage, Kamin, Klimaanlage, Garten)', { costCategory: CAT.bem }),
      S('Sonderwünsche Leerrohre/Netzwerk früh dem Elektroplaner mitgeteilt (PV-DC, Speicher, KNX, Glasfaser, LAN)', {
        priority: 'high',
        description:
          'Die Elektro-Rohinstallation erfolgt VOR der Dämmung — Leerrohre jetzt festlegen. Nachträgliche Verlegung kostet ein Vielfaches; ein Glasfaser-Leerrohr altert nicht.',
      }),
    ],
  },
  {
    orderNumber: 2,
    title: 'Phase 2 — Genehmigung & Baustellenvorbereitung',
    description: 'Bauantrag, Baugenehmigung, Sicherheiten, Hausanschlüsse, Baustelleneinrichtung.',
    lumpSums: [],
    tasks: [
      O('Bauantrag eingereicht', {
        description: 'Der Planer liefert die Bauantragsunterlagen; Bau- und Entwässerungsantrag sind vom Bauherrn zu unterschreiben und einzureichen.',
      }),
      O('Baugenehmigung erhalten / Baufreigabe'),
      O('Finanzierung final gesichert + ggf. Sicherheit/Bürgschaft vorgelegt', {
        description: 'Manche Anbieter verlangen eine Bürgschaft/Vorauszahlungssicherheit als Bauvoraussetzung.',
      }),
      O('Hausanschlüsse beantragt (Strom, Wasser, Abwasser, Telekom/Glasfaser)', {
        costCategory: CAT.sonst,
        description: 'Antragsformulare beim Versorger besorgen; Lageplan/Bauzeichnungen für die Gewerke bereitstellen.',
      }),
      O('Baustelle vorbereitet (Zufahrt, Kranstellplatz, Baustrom, Bau-WC)', {
        priority: 'high',
        description: 'Zufahrt und Kranstellplatz für Schwerlast/Montagekran freihalten; Baustrom, Bau-Wasser und Bau-WC bereitstellen; Baustelle zum Montagetermin frei von Hindernissen.',
      }),
      S('SiGeKo bestellt (Sicherheits- & Gesundheitsschutzkoordinator)', {
        description: 'Pflicht nach § 3 BaustellV, wenn mehrere Gewerke gleichzeitig tätig sind.',
      }),
      S('Bauvorhaben bei der BG BAU angemeldet (Unfallversicherung der Bauhelfer)', { priority: 'high' }),
      S('Abfallcontainer organisiert (Bauschuttentsorgung nach Gewerbeabfallverordnung)', { costCategory: CAT.sonst }),
      S('Baustrom & Bauwasser (Provisorium)', { costCategory: CAT.sonst }),
      S('Versicherungspaket Bauzeit aktiviert', { costCategory: CAT.sonst }),
      S('Stellplatznachweis erbracht (KFZ/Fahrrad, Stellplatzsatzung der Gemeinde)', {
        description: 'Die Gemeinde kann per Satzung Mindest-Stellplätze vorschreiben; Nachweis oder Ablösebetrag oft schon zum Bauantrag fällig.',
      }),
      S('Niederschlagswasser: Versickerungsnachweis & gesplittete Abwassergebühr beim Versorger angezeigt', {
        description: 'Befestigte/angeschlossene Flächen angeben; ggf. Genehmigung/Nachweis für eine Versickerungsanlage (Mulde/Rigole) erforderlich.',
      }),
    ],
  },
  {
    orderNumber: 3,
    title: 'Phase 3 — Bodenplatte/Keller & Hausmontage',
    description: 'Bodenplatte/Keller, Abnahme der Maßhaltigkeit, Hausmontage/Aufstellung.',
    lumpSums: [{ label: 'Grundpreis Haus (Lieferung + Montage + Ausbaustufe) — bitte eintragen', amount: 0 }],
    tasks: [
      O('Erdarbeiten / Aushub, Frostschürze, ggf. Schnurgerüst', {
        costCategory: CAT.sonst,
        description: 'In der Regel Bauherrenleistung.',
      }),
      O('Bodenplatte oder Keller erstellt', {
        costCategory: CAT.sonst,
        description: 'In Eigenleistung/Fremdfirma oder gegen Aufpreis über den Anbieter. Erfolgt VOR der Montage (Liefervoraussetzung); Maßhaltigkeit exakt einhalten. Auf frischem Beton kein Taumittel/Salz streuen.',
      }),
      O('Bodenplatte/Keller auf Maßhaltigkeit abgenommen', {
        description: 'Abnahmetermin rechtzeitig mit der Bauleitung des Anbieters vereinbaren.',
      }),
      O('Aushärtung der Bodenplatte abgewartet'),
      O('Montage-/Stelltermin vereinbart', {
        description: 'Erst nach Erfüllung aller Bau- & Liefervoraussetzungen (Baugenehmigung, Bodenplatte, Finanzierung, Bemusterung, Änderungskosten).',
      }),
      O('Hausmontage / Aufstellung', {
        description: 'Fertigteile/Holzständer werden aufgestellt (oft in 1–3 Tagen). Sonderkran/Sonderfahrten gehen zulasten des Bauherrn.',
      }),
      O('Hausübergabe (wind-/wetterdicht)', {
        description: 'Übergabe des Rohbaus/Ausbauhauses; weitere Ausbaumaßnahmen mit der Bauleitung besprechen.',
      }),
      O('Außen- und Innenwände untermörteln + Deckendurchbrüche schließen', {
        description: 'Bauherrenleistung ab OK Kellerdecke/Bodenplatte, sofern nicht im Anbieter-Umfang.',
      }),
      S('Lieferung kontrolliert (Mengen-/Mängelkontrolle, sofort auf Lieferschein rügen)'),
      S('Bautagebuch / Fotodokumentation geführt'),
      S('Richtfest 🎉'),
      S('Rückstausicherung für Abläufe unter der Rückstauebene eingebaut (DIN EN 13564)', {
        priority: 'high',
        description: 'Kommunale Entwässerungssatzung schreibt eine Rückstauklappe/-hebeanlage für Abläufe unterhalb der Straßenoberkante vor. Fehlt sie, entfällt der Versicherungsschutz bei Kanalrückstau.',
      }),
    ],
  },
  {
    orderNumber: 4,
    title: 'Phase 4 — Innenausbau',
    description: 'Reihenfolge der Gewerke von der Rohinstallation bis zum Endausbau.',
    lumpSums: [],
    tasks: [
      O('Elektro-Rohinstallation', { description: 'Leitungen, Dosen, Verteiler — vor der Dämmung/dem Schließen der Wände.' }),
      O('Trockenbau / Beplankung', { description: 'Decken, Dachschrägen, Vorwände; Gipskartonplatten verspachteln.' }),
      O('Treppe EG/DG einbauen'),
      O('Heizung, Lüftung & Sanitär-Rohinstallation', {
        description: 'Fußbodenheizung verlegen; Wärmepumpe/Lüftungsanlage vorbereiten.',
      }),
      O('Medien anschlussfertig: Strom/Wasser/Telekom VOR dem Estrich', {
        priority: 'high',
        description: 'Müssen vor dem Estrich anschlussfertig liegen — sonst verzögern sich alle Folgegewerke.',
        milestone: { title: 'Estrich fertig', daysBefore: 14 },
      }),
      O('Estrich einbringen', { description: 'Typischer relativer Meilenstein — siehe Wiedervorlagen.' }),
      O('Estrichtrocknung + Aufheizphase Fußbodenheizung', {
        description: 'Regelmäßig lüften; CM-Messung/Belegreife vor dem Bodenbelag nachweisen.',
      }),
      O('Spachtelarbeiten + Inbetriebnahme Elektro & Heizung'),
      O('Fliesen (Bad, ggf. Küche)', { costCategory: CAT.eigen }),
      O('Bodenbeläge (Laminat/Parkett/Fliesen/Vinyl)', { costCategory: CAT.eigen }),
      O('Innentüren einbauen'),
      O('Maler- & Tapezierarbeiten'),
      O('Sanitärobjekte Endmontage'),
      O('Elektro-Endmontage (Schalter, Steckdosen, Leuchten)'),
      O('Küche einbauen', { costCategory: CAT.eigen }),
      O('Außenputz / Fassade (witterungsbedingt)'),
      S('Klinker-/Vorhangfassade (falls gewählt) — Eigenleistung/Fremdfirma', {
        costCategory: CAT.sonst,
        description: 'Abdichtung am Fußpunkt und Hinterlüftung beachten.',
      }),
      S('Luftdichtheitsmessung (Blower-Door) koordiniert', {
        description: 'Für Förderung/GEG oft erforderlich; von einem Energieberater durchführen lassen.',
      }),
      S('Eigenleistungshelfer bei der BG BAU angemeldet'),
      S('Material: Bodenbeläge (Platzhalter)', { costCategory: CAT.eigen }),
      S('Material: Wandfarbe / Tapeten (Platzhalter)', { costCategory: CAT.eigen }),
      S('Material: Fliesen (Platzhalter)', { costCategory: CAT.eigen }),
      S('CM-Messung / Belegreife schriftlich nachgewiesen VOR eigenem Bodenbelag', {
        priority: 'high',
        description:
          'Ohne dokumentierte Restfeuchtemessung (CM) erlischt die Gewährleistung eigener Bodenarbeiten — gilt für Parkett/Laminat, Fliesen und Vinyl gleichermaßen.',
      }),
      S('Aufheizprotokoll vom Estrichleger erhalten & abgelegt', {
        priority: 'high',
        description: 'Datiert/unterschrieben einfordern; ist Voraussetzung für spätere Gewährleistungsansprüche am Estrich.',
      }),
      S('Vor dem Schließen der Wände: Rohinstallation & Dampfbremse fotodokumentiert', {
        description: 'Letzte Kontrollmöglichkeit — spätere Kondensat-/Wärmeschäden zeigen sich erst nach Jahren.',
      }),
      S('Baufeuchte im Endausbau überwacht (Hygrometer/Messgerät)', {
        description: 'Im Neubau werden große Mengen Wasser eingebracht; zu frühes Schließen von Böden/Verkleidungen begünstigt Schimmel.',
      }),
      S('Prüfprotokolle der Gewerke eingefordert (Elektro VDE 0100-600, Trinkwasser-Druckprüfung/Hygienespülung)', {
        priority: 'high',
        description:
          'Das VDE-Prüfprotokoll ist Voraussetzung für die Zählersetzung. Trinkwasser vor Inbetriebnahme drücken/spülen (VDI/DVGW 6023) und dokumentieren.',
      }),
      S('Rauchwarnmelder in Schlaf-/Kinderzimmern & Fluren montiert (Landesbauordnung)', {
        description: 'In allen Bundesländern Pflicht vor Erstbezug — mindestens Schlaf-/Kinderzimmer und Rettungswegflure.',
      }),
    ],
  },
  {
    orderNumber: 5,
    title: 'Phase 5 — Abnahme & Einzug',
    description: 'Abnahme, Mängel, Schlussrechnung, Versicherungen, Umzug, Außenanlagen.',
    lumpSums: [],
    tasks: [
      O('Bauabnahme (Mängelprotokoll)'),
      O('Mängel beheben & nachkontrollieren'),
      O('Schlussrechnung prüfen & begleichen'),
      O('Versicherungen final', {
        description: 'Von Bauzeit- auf Dauerbetrieb umstellen (Wohngebäudeversicherung); Bauleistungsversicherung endet mit der Abnahme.',
      }),
      O('Zähler anmelden / Hausanschlüsse final'),
      O('Umzug'),
      O('Außenanlagen (Terrasse, Wege, Entwässerung, Garten)', {
        costCategory: CAT.eigen,
        description: 'In der Regel nicht im Hauspreis.',
      }),
      S('Unabhängigen Sachverständigen zur Bauabnahme hinzugezogen', { priority: 'high', description: 'Nach der Abnahme kehrt die Beweislast um.' }),
      S('Energieausweis (GEG) bzw. KfW „Bestätigung nach Durchführung" (BnD) durch EEE eingereicht', { priority: 'high' }),
      S('Hausnummer beantragt'),
      S('Ummeldung beim Einwohnermeldeamt (innerhalb 2 Wochen)'),
      S('Außenanlagen: Einfahrt/Zufahrt (Platzhalter)', { costCategory: CAT.eigen }),
      S('Puffer / Unvorhergesehenes (Platzhalter)', { costCategory: CAT.sonst }),
      S('Baufertigstellungsanzeige bei der Bauaufsichtsbehörde eingereicht', {
        priority: 'high',
        description: 'Die Fertigstellung eines genehmigungspflichtigen Baus ist vor dem Bezug anzuzeigen (Landesbauordnung). Eine Nichtanzeige ist eine Ordnungswidrigkeit.',
      }),
      S('Schornsteinfeger-Erstabnahme (Feuerstättenschau) vor Inbetriebnahme der Heizung', {
        priority: 'high',
        description: 'Jede neue Feuerungsanlage/Wärmepumpe mit Abgasführung muss vor Erstbetrieb vom Bezirksschornsteinfeger abgenommen werden.',
      }),
      S('PV-Anlage + Batteriespeicher im Marktstammdatenregister (MaStR) angemeldet', {
        priority: 'high',
        description: 'Pflicht innerhalb 1 Monat nach Inbetriebnahme (EEG); Verstoß führt zu Bußgeld und Verlust der Einspeisevergütung. (Nur bei PV-Anlage.)',
      }),
      S('Wallbox & Wärmepumpe als steuerbare Verbraucher beim Netzbetreiber angemeldet (§ 14a EnWG)', {
        description: 'Pflichtanmeldung; eine Wallbox > 11 kW ist zusätzlich genehmigungspflichtig. Bringt ein günstigeres Netzentgelt.',
      }),
    ],
  },
  {
    orderNumber: 6,
    title: 'Phase 6 — Gewährleistung & nach dem Einzug',
    description: 'Die ersten 0–5 Jahre nach Abnahme.',
    lumpSums: [],
    tasks: [
      O('Gewährleistungsunterlagen dokumentiert & archiviert', {
        description: 'Gewährleistung beträgt i. d. R. 5 Jahre (BGB). Alle Unterlagen (Pläne, Statik, Protokolle, Versicherungen, Wartungshefte) dauerhaft archivieren.',
      }),
      S('Mängel unverzüglich schriftlich rügen & Nachbesserungsfrist setzen', { priority: 'high' }),
      S('Hydraulischen Abgleich der Heizung durchführen (nach 1. Heizperiode)'),
      S('Gewährleistungsbegehung ~6 Monate vor Ablauf der 5-Jahres-Frist'),
      S('Wohngebäudeversicherung auf Elementarschadendeckung geprüft'),
      S('Jährliche Wartung (Wärmepumpe, Lüftungsanlage, Schornsteinfeger)'),
      S('Effektives Lüften beachtet (mehrmals täglich Durchzug; Hygrometer 40–65 %)'),
      S('Amtliche Gebäudeeinmessung beim Katasteramt veranlasst', {
        priority: 'high',
        costCategory: CAT.sonst,
        description: 'Der Neubau ist nach Fertigstellung auf Eigentümerkosten ins Liegenschaftskataster einzumessen (Frist je Bundesland). Bei Versäumnis Einmessung durch die Behörde mit Aufschlag.',
      }),
      S('Grundsteuer-Nachfeststellung beim Finanzamt gemeldet', {
        priority: 'high',
        description: 'Den Neubau bis 31.03. des Folgejahres der Fertigstellung anzeigen (§ 19 GrStG) → neuer Grundsteuerwert- und Messbescheid.',
      }),
      S('§ 35a EStG: ab Einzug Handwerker-/Wartungsrechnungen sammeln (Lohnanteil)', {
        description: 'Für spätere Wartungen/Reparaturen ab Einzug: 20 % des Lohnanteils, max. 1.200 €/Jahr Steuererstattung. Voraussetzung: Rechnung + Banküberweisung.',
      }),
      S('Häusliches Arbeitszimmer steuerlich dokumentiert (Raumfunktion in Plänen/beim Finanzamt)', {
        description: 'Bei Mittelpunkt der beruflichen Tätigkeit anteilig absetzbar, sonst Homeoffice-Pauschale. Raumfunktion früh festlegen.',
      }),
    ],
  },
];

export const MILESTONES = [
  { title: 'Bauantrag eingereicht', description: 'Über den Planer/Architekten.', actualDate: null },
  { title: 'Baugenehmigung erhalten', description: 'Baufreigabe der Behörde.', actualDate: null },
  { title: 'Statik fertig', description: 'Prüffähige Statik liegt vor.', actualDate: null },
  { title: 'Bemusterung', description: 'Auswahl von Ausstattung/Materialien.', actualDate: null },
  { title: 'Abnahme Bodenplatte/Keller', description: 'Maßhaltigkeitsprüfung durch die Bauleitung.', actualDate: null },
  { title: 'Hausmontage (Stelltermin)', description: 'Aufstellung des Hauses.', actualDate: null },
  { title: 'Estrich fertig', description: 'Start der Trocknungszeit — relativer Meilenstein.', actualDate: null },
  { title: 'Hausübergabe', description: 'Übergabe des Rohbaus/Ausbauhauses.', actualDate: null },
];

export const HOUSE_AREAS = [
  // Außen
  { name: 'Garten', icon: '🌳', description: 'Rasen, Beete, Bepflanzung, Zaun.' },
  { name: 'Vorgarten', icon: '🌷', description: 'Eingangsbereich, Bepflanzung, Wege.' },
  { name: 'Einfahrt', icon: '🚗', description: 'Zufahrt, Stellplatz, Pflasterung (Wallbox-Leerrohr?).' },
  { name: 'Terrasse', icon: '⛱️', description: 'Belag, Übergang zum Wohnzimmer, Möblierung.' },
  // Erdgeschoss
  { name: 'Hauswirtschaftsraum', icon: '🧺', description: 'Waschen, Trockner, Stauraum, Technik.' },
  { name: 'Flur', icon: '🚪', description: 'Garderobe, Beleuchtung, Bodenübergänge (EG).' },
  { name: 'Küche', icon: '🍳', description: 'Grundriss, Anschlüsse, Geräte, Bemusterung.' },
  { name: 'Treppe', icon: '🪜', description: 'Material, Geländer, Beleuchtung.' },
  { name: 'Arbeitszimmer', icon: '💼', description: 'Homeoffice, Steckdosen, Netzwerk/LAN.' },
  { name: 'Wohnzimmer', icon: '🛋️', description: 'Bodenbelag, Licht, Steckdosen, Terrassenzugang.' },
  // Obergeschoss
  { name: 'Elternschlafzimmer', icon: '🛏️', description: 'Ankleide, Steckdosen, Licht.' },
  { name: 'Gästebad', icon: '🚻', description: 'WC/Dusche, Fliesen, Armaturen.' },
  { name: 'Hauptbadezimmer', icon: '🛁', description: 'Wanne, Dusche, Doppelwaschtisch, Fliesen.' },
  { name: 'Kinderzimmer eins', icon: '🧸', description: 'Flexible Nutzung, Netzwerk/Leerrohre.' },
  { name: 'Kinderzimmer zwei', icon: '🧒', description: 'Flexible Nutzung, Netzwerk/Leerrohre.' },
  { name: 'Flur oben', icon: '🔝', description: 'Galerie/Flur OG, Beleuchtung, Steckdosen.' },
  { name: 'Dachboden', icon: '📦', description: 'Dämmung, Stauraum, evtl. späterer Ausbau.' },
];

// Abschlags-/Zahlungsplan — Struktur nach typischem Bauablauf & § 650m BGB.
export const PAYMENT_PLAN = [
  { label: 'Abschlag nach Vertrag & Planungsfreigabe', dueCondition: 'Vertragsabschluss / Planungsbeginn', note: 'Verbraucherbauvertrag (§ 650m BGB): Bei der 1. Abschlagszahlung dürfen 5 % als Fertigstellungssicherheit einbehalten werden.' },
  { label: 'Abschlag nach Baugenehmigung / Produktionsfreigabe', dueCondition: 'Baugenehmigung erhalten, Sicherheit vorgelegt' },
  { label: 'Abschlag vor Hausmontage (Materiallieferung)', dueCondition: 'Liefer- & Bauvoraussetzungen erfüllt (Bodenplatte abgenommen)' },
  { label: 'Abschlag nach Hausmontage (Stelltermin)', dueCondition: 'Haus aufgebaut, wind-/wetterdicht übergeben' },
  { label: 'Abschlag nach Ausbau-Dienstleistungen', dueCondition: 'Beauftragte Gewerke (Trockenbau/Estrich/HLS/Elektro) fertig' },
  { label: 'Schlussrate nach Abnahme', dueCondition: 'Bauabnahme ohne wesentliche Mängel', note: 'Abschlagszahlungen sind bis zur Fertigstellung auf max. 90 % der Gesamtsumme begrenzt (§ 650m BGB).' },
  { label: 'Sicherheitseinbehalt 5 % nach Mängelbeseitigung', dueCondition: 'Alle gerügten Mängel beseitigt', note: 'Zur Absicherung der Mängelfreiheit; erst nach Nachweis auszahlen.' },
];

// Kontakte-Verzeichnis — Rollen-Platzhalter; Namen & Kontaktdaten selbst eintragen.
export const CONTACTS = [
  { name: 'Hausanbieter — Projektabwicklung', role: 'Bauträger / Vertrieb' },
  { name: 'Bauleiter (Anbieter)', role: 'Bauleitung (Montage & Abnahme Bodenplatte)' },
  { name: 'Architekt / Planer', role: 'Bauantrag, Statik, Bauleitung' },
  { name: 'Vermesser', role: 'Vermessung (Lageplan, Absteckung, Einmessung)' },
  { name: 'Elektriker', role: 'Elektro' },
  { name: 'Heizung / Sanitär', role: 'Heizung / Sanitär' },
  { name: 'Trockenbau / Estrich', role: 'Trockenbau & Estrich' },
  { name: 'Bezirksschornsteinfeger', role: 'Feuerstättenschau / Abnahme' },
  { name: 'Netzbetreiber Strom', role: 'Stromanschluss / Zählersetzung' },
  { name: 'Wasser-/Abwasserversorger', role: 'Hausanschluss Wasser / Abwasser' },
  { name: 'Untere Bauaufsicht / Bauamt', role: 'Behörde (Genehmigung, Fertigstellungsanzeige)' },
  { name: 'Bank / Finanzierung', role: 'Finanzierung (Abschläge, Bereitstellung)' },
];
