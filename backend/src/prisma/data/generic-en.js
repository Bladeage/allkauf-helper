// English standard seed dataset for a prefab / kit house in Germany.
// This is the English-language default dataset — activate it via SEED_DATASET=generic-en.
// Deliberately vendor-neutral (no specific house provider, no prices).
// Legal/standard references (KfW/BEG, MaBV, § 650m BGB, DIN/VDE, MaStR, § 14a EnWG) are
// generally applicable. Amounts, hours and dates are intentionally EMPTY (placeholders).

import { CAT, O, S } from './helpers.js';

export const PHASES = [
  {
    orderNumber: 0,
    title: 'Phase 0 — Preparation & contract',
    description: 'Plot, financing, house model, completion level, construction contract.',
    lumpSums: [],
    tasks: [
      O('Plot purchased / secured'),
      O('Soil survey commissioned', {
        description: 'Usually provided by the client. The subsoil risk is typically borne by the client (builder-owner).',
      }),
      O('Checked: protected area (e.g. water protection), building-authority conditions, contamination/unexploded ordnance'),
      O('Development plan / § 34 surroundings checked (roof shape, storeys, building lines, GRZ/GFZ)'),
      O('Financing cleared in principle (preliminary approval)'),
      O('House model & floor-plan variant selected'),
      O('Completion level defined (turnkey / kit-completion house / building kit)', {
        description: 'Determines the amount of self-performed work and thus price and build time.',
      }),
      O('Show home / reference property visited'),
      O('Construction-period insurance selected', {
        description: 'Builder liability, construction all-risk (Bauleistung), residential building incl. fire shell — tie start/end to the build schedule.',
      }),
      O('Construction contract (consumer building contract) reviewed & signed', {
        description: 'Secure the construction and services specification as part of the contract; note the 14-day right of withdrawal.',
      }),
      S('Check KfW/BEG funding BEFORE signing the contract & involve an energy-efficiency expert (EEE)', {
        priority: 'high',
        description: 'Funding is forfeited if applied for after the fact — supply/construction contracts also count as the start of the project.',
      }),
      S('Self-performed work realistically assessed', {
        description: 'Self-performed work ("sweat equity") is counted as equity by banks — but only estimate it realistically.',
      }),
      S('Term-life / occupational-disability insurance for borrowers checked'),
      S('Ancillary purchase costs: real-estate transfer tax', { costCategory: CAT.sonst }),
      S('Ancillary purchase costs: notary & land-register entry', { costCategory: CAT.sonst }),
      S('Estate-agent commission (if incurred)', { costCategory: CAT.sonst }),
      S('Commitment interest negotiated & budgeted', {
        costCategory: CAT.sonst,
        description:
          'Banks often charge ~3%/year on loan amounts not yet drawn down after the commitment-interest-free period (3–12 months negotiable). With a long build time and a lot of self-performed work this quickly adds several thousand euros.',
      }),
      S('Commitment-interest-free period & phase-accurate drawdown agreed with the bank', {
        description: 'Tie the drawdown to the instalment plan (MaBV), otherwise you risk commitment interest or a liquidity gap.',
      }),
      S('Real-estate transfer tax advantage checked (plot and house contracts cleanly separated)', {
        description:
          'If the plot purchase and the house supply contract come from different parties, real-estate transfer tax often applies only to the plot price. Keep the contracts cleanly separated and documented.',
      }),
    ],
  },
  {
    orderNumber: 1,
    title: 'Phase 1 — Planning & sample selection',
    description: 'Architect meeting, floor plan, structural design, sample selection, scope of self-performed work.',
    lumpSums: [],
    tasks: [
      O('Surveyor commissioned', {
        costCategory: CAT.sonst,
        description: 'Site plan, rough staking-out, fine surveying, profile boards — often not included in the house price.',
      }),
      O('Building-application meeting with architect / planner', {
        description: 'Basic evaluation, building position, floor-plan adjustment, building-application planning.',
      }),
      O('Floor plan finalised, special requests discussed', {
        description: 'Changes to load-bearing walls usually cost extra; clarify change requests before production release.',
      }),
      O('Structural calculations prepared', {
        description: 'Verifiable structural calculations as the basis for the foundation slab/basement. Commission an independent structural check (if required by the authority).',
      }),
      O('Sample selection attended', {
        description: 'Select sanitary ware & fittings, tiles, window sills, interior doors, floor coverings, wall finishes.',
      }),
      O('Sample-selection record & change costs reviewed and signed', {
        description: 'Check for completeness; depending on the provider, omitted items are often only credited, not refunded.',
      }),
      O('Scope of self-performed work / services defined (yourself vs. provider)', {
        description: 'Which trades does the provider/partner firms handle, and which do you do yourself? Define the interfaces cleanly.',
      }),
      S('Electrical / smart-home planning locked in', {
        priority: 'high',
        description: 'Plan the number of sockets, network/LAN, conduits for PV/wallbox/battery early — retrofitting is expensive.',
      }),
      S('Ventilation / heating concept clarified (e.g. heat pump + controlled mechanical ventilation with heat recovery)'),
      S('Sample selection: surcharge items (tile/bathroom/floor upgrades)', { costCategory: CAT.bem }),
      S('Kitchen planned / kitchen-studio appointment', { costCategory: CAT.bem }),
      S('Optional extras checked (garage/carport, PV system, fireplace, air conditioning, garden)', { costCategory: CAT.bem }),
      S('Special conduit/network requests communicated early to the electrical planner (PV-DC, battery, KNX, fibre, LAN)', {
        priority: 'high',
        description:
          'The electrical first-fix happens BEFORE the insulation — define conduits now. Retrofitting costs many times more; a fibre conduit never becomes obsolete.',
      }),
    ],
  },
  {
    orderNumber: 2,
    title: 'Phase 2 — Permit & site preparation',
    description: 'Building application, building permit, securities, utility connections, site setup.',
    lumpSums: [],
    tasks: [
      O('Building application submitted', {
        description: 'The planner supplies the building-application documents; the building and drainage applications must be signed and submitted by the client.',
      }),
      O('Building permit received / construction release'),
      O('Financing finally secured + security/guarantee provided if required', {
        description: 'Some providers require a guarantee/advance-payment security as a precondition for construction.',
      }),
      O('Utility connections applied for (electricity, water, sewage, telecom/fibre)', {
        costCategory: CAT.sonst,
        description: 'Obtain the application forms from the utility; provide the site plan/construction drawings for the trades.',
      }),
      O('Site prepared (access road, crane standing area, site power, site toilet)', {
        priority: 'high',
        description: 'Keep the access road and crane standing area clear for heavy loads/assembly crane; provide site power, site water and site toilet; site clear of obstacles for the assembly date.',
      }),
      S('SiGeKo appointed (health & safety coordinator)', {
        description: 'Mandatory under § 3 BaustellV when several trades work simultaneously.',
      }),
      S('Construction project registered with BG BAU (accident insurance for construction helpers)', { priority: 'high' }),
      S('Waste skip arranged (construction-waste disposal per the Commercial Waste Ordinance)', { costCategory: CAT.sonst }),
      S('Site power & site water (temporary)', { costCategory: CAT.sonst }),
      S('Construction-period insurance package activated', { costCategory: CAT.sonst }),
      S('Parking-space proof provided (car/bicycle, municipal parking by-law)', {
        description: 'The municipality may mandate a minimum number of parking spaces by by-law; proof or a buy-out payment is often due as early as the building application.',
      }),
      S('Rainwater: infiltration proof & split wastewater charge reported to the utility', {
        description: 'Declare paved/connected surfaces; a permit/proof for an infiltration system (swale/soakaway trench) may be required.',
      }),
    ],
  },
  {
    orderNumber: 3,
    title: 'Phase 3 — Foundation slab/basement & house assembly',
    description: 'Foundation slab/basement, dimensional-accuracy acceptance, house assembly/erection.',
    lumpSums: [{ label: 'Base price house (delivery + assembly + completion level) — please enter', amount: 0 }],
    tasks: [
      O('Earthworks / excavation, frost apron, profile boards if needed', {
        costCategory: CAT.sonst,
        description: 'Usually provided by the client.',
      }),
      O('Foundation slab or basement built', {
        costCategory: CAT.sonst,
        description: 'By self-performed work/external firm or for a surcharge via the provider. Happens BEFORE assembly (delivery precondition); keep dimensional accuracy exact. Do not spread de-icing agent/salt on fresh concrete.',
      }),
      O('Foundation slab/basement accepted for dimensional accuracy', {
        description: 'Arrange the acceptance appointment with the provider site management in good time.',
      }),
      O('Foundation slab curing awaited'),
      O('Assembly/erection date arranged', {
        description: 'Only after all construction & delivery preconditions are met (building permit, foundation slab, financing, sample selection, change costs).',
      }),
      O('House assembly / erection', {
        description: 'Prefabricated elements/timber-frame panels are erected (often in 1–3 days). Special crane/special transport is charged to the client.',
      }),
      O('House handover (wind-/weather-tight)', {
        description: 'Handover of the shell/kit-completion house; discuss further fit-out work with the site management.',
      }),
      O('Grout under exterior and interior walls + close ceiling penetrations', {
        description: 'Client task from top of basement ceiling/foundation slab, unless included in the scope of works of the provider.',
      }),
      S('Delivery checked (quantity/defect check, note complaints on the delivery note immediately)'),
      S('Construction diary / photo documentation kept'),
      S('Topping-out ceremony 🎉'),
      S('Backflow protection installed for drains below the backflow level (DIN EN 13564)', {
        priority: 'high',
        description: 'The municipal drainage by-law requires a backflow valve/lifting station for drains below street level. Without it, insurance cover lapses in the event of sewer backflow.',
      }),
    ],
  },
  {
    orderNumber: 4,
    title: 'Phase 4 — Interior fit-out',
    description: 'Sequence of trades from first-fix installation to final fit-out.',
    lumpSums: [],
    tasks: [
      O('Electrical first-fix', { description: 'Cables, boxes, distribution board — before the insulation/closing the walls.' }),
      O('Drywall / boarding', { description: 'Ceilings, sloped ceilings, stud walls; fill plasterboard joints.' }),
      O('Install staircase (ground/upper floor)'),
      O('Heating, ventilation & plumbing first-fix', {
        description: 'Lay underfloor heating; prepare heat pump/ventilation system.',
      }),
      O('Utilities ready for connection: electricity/water/telecom BEFORE the screed', {
        priority: 'high',
        description: 'Must be ready for connection before the screed — otherwise all subsequent trades are delayed.',
        milestone: { title: 'Screed complete', daysBefore: 14 },
      }),
      O('Lay screed', { description: 'Typical relative milestone — see reminders.' }),
      O('Screed drying + heat-up phase of underfloor heating', {
        description: 'Ventilate regularly; prove CM moisture measurement/readiness-to-cover before laying the floor.',
      }),
      O('Filling/skim work + commissioning of electrics & heating'),
      O('Tiling (bathroom, kitchen if applicable)', { costCategory: CAT.eigen }),
      O('Floor coverings (laminate/parquet/tiles/vinyl)', { costCategory: CAT.eigen }),
      O('Install interior doors'),
      O('Painting & wallpapering'),
      O('Sanitary ware final installation'),
      O('Electrical second-fix (switches, sockets, lights)'),
      O('Install kitchen', { costCategory: CAT.eigen }),
      O('External render / façade (weather-permitting)'),
      S('Brick / rear-ventilated façade (if chosen) — self-performed/external firm', {
        costCategory: CAT.sonst,
        description: 'Note the base sealing and rear ventilation.',
      }),
      S('Airtightness test (blower door) coordinated', {
        description: 'Often required for funding/GEG; have it carried out by an energy consultant.',
      }),
      S('Self-help workers registered with BG BAU'),
      S('Material: floor coverings (placeholder)', { costCategory: CAT.eigen }),
      S('Material: wall paint / wallpaper (placeholder)', { costCategory: CAT.eigen }),
      S('Material: tiles (placeholder)', { costCategory: CAT.eigen }),
      S('CM measurement / readiness-to-cover proven in writing BEFORE self-laid flooring', {
        priority: 'high',
        description:
          'Without a documented residual-moisture measurement (CM), the warranty on self-performed floor work lapses — applies equally to parquet/laminate, tiles and vinyl.',
      }),
      S('Heat-up log received from the screed layer & filed', {
        priority: 'high',
        description: 'Demand it dated/signed; it is a precondition for later warranty claims on the screed.',
      }),
      S('Before closing the walls: first-fix & vapour barrier photo-documented', {
        description: 'Last chance to check — later condensation/heat damage only shows up after years.',
      }),
      S('Construction moisture monitored during final fit-out (hygrometer/meter)', {
        description: 'Large amounts of water are introduced in a new build; closing floors/claddings too early promotes mould.',
      }),
      S('Test certificates from the trades requested (electrical VDE 0100-600, drinking-water pressure test/hygiene flush)', {
        priority: 'high',
        description:
          'The VDE test certificate is a precondition for meter installation. Pressure-test/flush the drinking water before commissioning (VDI/DVGW 6023) and document it.',
      }),
      S('Smoke alarms installed in bedrooms/children\'s rooms & hallways (state building code)', {
        description: 'Mandatory in all federal states before first occupancy — at least bedrooms/children\'s rooms and escape-route hallways.',
      }),
    ],
  },
  {
    orderNumber: 5,
    title: 'Phase 5 — Acceptance & move-in',
    description: 'Acceptance, defects, final invoice, insurance, move, outdoor works.',
    lumpSums: [],
    tasks: [
      O('Construction acceptance (defects record)'),
      O('Fix defects & re-inspect'),
      O('Review & settle the final invoice'),
      O('Insurance finalised', {
        description: 'Switch from construction-period to permanent cover (residential building insurance); construction all-risk insurance ends on acceptance.',
      }),
      O('Register meters / utility connections finalised'),
      O('Move'),
      O('Outdoor works (terrace, paths, drainage, garden)', {
        costCategory: CAT.eigen,
        description: 'Usually not included in the house price.',
      }),
      S('Independent expert brought in for construction acceptance', { priority: 'high', description: 'After acceptance, the burden of proof reverses.' }),
      S('Energy certificate (GEG) or KfW "confirmation after completion" (BnD) submitted by the EEE', { priority: 'high' }),
      S('House number applied for'),
      S('Re-registration at the residents registration office (within 2 weeks)'),
      S('Outdoor works: driveway/access (placeholder)', { costCategory: CAT.eigen }),
      S('Buffer / contingencies (placeholder)', { costCategory: CAT.sonst }),
      S('Completion notice submitted to the building supervisory authority', {
        priority: 'high',
        description: 'The completion of a permit-requiring building must be notified before occupancy (state building code). Failure to notify is an administrative offence.',
      }),
      S('Chimney-sweep initial inspection (fireplace inspection) before commissioning the heating', {
        priority: 'high',
        description: 'Every new combustion system/heat pump with a flue must be inspected by the district chimney sweep before first operation.',
      }),
      S('PV system + battery storage registered in the Market Master Data Register (MaStR)', {
        priority: 'high',
        description: 'Mandatory within 1 month of commissioning (EEG); a breach leads to a fine and loss of the feed-in tariff. (Only with a PV system.)',
      }),
      S('Wallbox & heat pump registered as controllable loads with the grid operator (§ 14a EnWG)', {
        description: 'Mandatory registration; a wallbox > 11 kW additionally requires approval. Yields a lower grid fee.',
      }),
    ],
  },
  {
    orderNumber: 6,
    title: 'Phase 6 — Warranty & after move-in',
    description: 'The first 0–5 years after acceptance.',
    lumpSums: [],
    tasks: [
      O('Warranty documents documented & archived', {
        description: 'The warranty is usually 5 years (BGB). Archive all documents (plans, structural calculations, records, insurance, maintenance logs) permanently.',
      }),
      S('Report defects in writing without delay & set a remedy deadline', { priority: 'high' }),
      S('Carry out hydraulic balancing of the heating (after the 1st heating season)'),
      S('Warranty inspection ~6 months before the 5-year period expires'),
      S('Residential building insurance checked for natural-hazard cover'),
      S('Annual maintenance (heat pump, ventilation system, chimney sweep)'),
      S('Effective ventilation observed (cross-ventilation several times daily; hygrometer 40–65%)'),
      S('Official building survey commissioned at the cadastral office', {
        priority: 'high',
        costCategory: CAT.sonst,
        description: 'After completion the new building must be surveyed into the real-estate cadastre at the expense of the owner (deadline varies by federal state). If missed, the authority carries out the survey with a surcharge.',
      }),
      S('Property-tax reassessment reported to the tax office', {
        priority: 'high',
        description: 'Report the new building by 31 March of the year following completion (§ 19 GrStG) → new property-tax value and assessment notice.',
      }),
      S('§ 35a EStG: from move-in, collect tradesperson/maintenance invoices (labour share)', {
        description: 'For later maintenance/repairs from move-in: 20% of the labour share, max. €1,200/year tax refund. Requirement: invoice + bank transfer.',
      }),
      S('Home office documented for tax purposes (room function in plans/with the tax office)', {
        description: 'Proportionally deductible if it is the centre of professional activity, otherwise the home-office flat rate. Define the room function early.',
      }),
    ],
  },
];

export const MILESTONES = [
  { title: 'Building application submitted', description: 'Via the planner/architect.', actualDate: null },
  { title: 'Building permit received', description: 'Construction release from the authority.', actualDate: null },
  { title: 'Structural calculations complete', description: 'Verifiable structural calculations are available.', actualDate: null },
  { title: 'Sample selection', description: 'Selection of fittings/materials.', actualDate: null },
  { title: 'Foundation slab/basement acceptance', description: 'Dimensional-accuracy check by the site management.', actualDate: null },
  { title: 'House assembly (erection date)', description: 'Erection of the house.', actualDate: null },
  { title: 'Screed complete', description: 'Start of the drying time — relative milestone.', actualDate: null },
  { title: 'House handover', description: 'Handover of the shell/kit-completion house.', actualDate: null },
];

export const HOUSE_AREAS = [
  // Outside
  { name: 'Garden', icon: '🌳', description: 'Lawn, beds, planting, fence.' },
  { name: 'Front garden', icon: '🌷', description: 'Entrance area, planting, paths.' },
  { name: 'Driveway', icon: '🚗', description: 'Access, parking space, paving (wallbox conduit?).' },
  { name: 'Terrace', icon: '⛱️', description: 'Surface, transition to the living room, furnishing.' },
  // Ground floor
  { name: 'Utility room', icon: '🧺', description: 'Washing, dryer, storage, building services.' },
  { name: 'Hallway', icon: '🚪', description: 'Coat area, lighting, floor transitions (ground floor).' },
  { name: 'Kitchen', icon: '🍳', description: 'Layout, connections, appliances, sample selection.' },
  { name: 'Staircase', icon: '🪜', description: 'Material, railing, lighting.' },
  { name: 'Study', icon: '💼', description: 'Home office, sockets, network/LAN.' },
  { name: 'Living room', icon: '🛋️', description: 'Floor covering, light, sockets, terrace access.' },
  // Upper floor
  { name: 'Master bedroom', icon: '🛏️', description: 'Dressing room, sockets, light.' },
  { name: 'Guest bathroom', icon: '🚻', description: 'WC/shower, tiles, fittings.' },
  { name: 'Main bathroom', icon: '🛁', description: 'Bathtub, shower, double vanity, tiles.' },
  { name: 'Child\'s room one', icon: '🧸', description: 'Flexible use, network/conduits.' },
  { name: 'Child\'s room two', icon: '🧒', description: 'Flexible use, network/conduits.' },
  { name: 'Upstairs hallway', icon: '🔝', description: 'Gallery/upper-floor hallway, lighting, sockets.' },
  { name: 'Attic', icon: '📦', description: 'Insulation, storage, possible later conversion.' },
];

// Instalment/payment plan — structure based on a typical construction sequence & § 650m BGB.
export const PAYMENT_PLAN = [
  { label: 'Instalment after contract & planning release', dueCondition: 'Contract signed / planning start', note: 'Consumer building contract (§ 650m BGB): with the 1st instalment, 5% may be withheld as completion security.' },
  { label: 'Instalment after building permit / production release', dueCondition: 'Building permit received, security provided' },
  { label: 'Instalment before house assembly (material delivery)', dueCondition: 'Delivery & construction preconditions met (foundation slab accepted)' },
  { label: 'Instalment after house assembly (erection date)', dueCondition: 'House erected, handed over wind-/weather-tight' },
  { label: 'Instalment after fit-out services', dueCondition: 'Commissioned trades (drywall/screed/HVAC-plumbing/electrical) complete' },
  { label: 'Final payment after acceptance', dueCondition: 'Construction acceptance without significant defects', note: 'Instalments are capped at max. 90% of the total sum until completion (§ 650m BGB).' },
  { label: '5% retention after defect rectification', dueCondition: 'All reported defects rectified', note: 'To secure freedom from defects; pay out only after proof.' },
];

// Contacts directory — role placeholders; enter names & contact details yourself.
export const CONTACTS = [
  { name: 'House provider — project handling', role: 'Developer / sales' },
  { name: 'Site manager (provider)', role: 'Site management (assembly & foundation-slab acceptance)' },
  { name: 'Architect / planner', role: 'Building application, structural design, site management' },
  { name: 'Surveyor', role: 'Surveying (site plan, staking-out, cadastral survey)' },
  { name: 'Electrician', role: 'Electrical' },
  { name: 'Heating / plumbing', role: 'Heating / plumbing' },
  { name: 'Drywall / screed', role: 'Drywall & screed' },
  { name: 'District chimney sweep', role: 'Fireplace inspection / acceptance' },
  { name: 'Electricity grid operator', role: 'Electricity connection / meter installation' },
  { name: 'Water/wastewater utility', role: 'Utility connection water / wastewater' },
  { name: 'Lower building authority / building office', role: 'Authority (permit, completion notice)' },
  { name: 'Bank / financing', role: 'Financing (instalments, commitment)' },
];
