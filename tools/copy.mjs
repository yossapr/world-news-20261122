// copy.mjs: every word that goes on the page, in our own phrasing, one entry per story of
// Sunday 22 November 2026. Facts (numbers, names, places) are the edition's; the sentences are ours.

export const leads = [
  {
    n: 1,
    kicker: 'ANTALYA, TURKEY · CLIMATE',
    fig: '1.5°C',
    figUnit: 'the limit the draft will pass',
    figSub: 'objections to 03:00 GMT; approval session at 07:00 GMT',
    art: 'deal',
    marker: ['Time', 'session set for 07:00 GMT'],
    head: ['COP31 closes in', 'on a final deal'],
    deck: 'The draft would acknowledge warming will pass 1.5°C and calls for faster carbon removal; oil producers fought to keep fossil fuels out.',
    src: 'Reuters · BBC',
  },
  {
    n: 2,
    kicker: 'KYIV, UKRAINE · WAR',
    fig: '400',
    figUnit: 'drones and 110 missiles',
    figSub: 'at least 11 dead; three Dnipro bridges hit',
    art: 'bridge',
    marker: ['Since yesterday', 'Putin threatened the Crimea bridge'],
    head: ['Kyiv’s bridges hit', 'in a 400-drone night'],
    deck: 'One of the war’s largest overnight attacks damaged three Dnipro bridges and a 750-kV substation, blacking out several regions.',
    src: 'Al Jazeera',
  },
  {
    n: 3,
    kicker: 'MANAMA, BAHRAIN · IRAN WAR',
    fig: '2',
    figUnit: 'US bases struck in Bahrain',
    figSub: 'Sheikh Isa and Al Juffair; no injuries reported',
    art: 'bases',
    marker: ['Sourcing', 'damage not independently verified'],
    head: ['Iran strikes two', 'US bases in Bahrain'],
    deck: 'The Revolutionary Guard attacked US bases at Sheikh Isa and Al Juffair, Fars reported; Bahrain says the drones were intercepted.',
    src: 'Al Jazeera · CNA',
  },
];

// Cards carry the story's own datum in bold, then the detail, then the outlet.
export const cards = [
  {
    n: 4,
    glyph: 'ship',
    kicker: 'GULF OF FINLAND · SHIPPING',
    datum: '16 crew out',
    head: 'Russian cargo ship burns after a strike',
    hook: 'Finland says Ukraine was likely behind it; the crew reached lifeboats.',
    src: 'BBC',
  },
  {
    n: 5,
    glyph: 'burst',
    kicker: 'KRYVYI RIH · WAR',
    datum: '60 wounded',
    head: 'A strike hits Zelensky’s home city',
    hook: 'Two people were killed, six of them children; 25 apartment blocks were damaged.',
    src: 'Al Jazeera',
  },
  {
    n: 6,
    glyph: 'boat',
    kicker: 'BAYELSA, NIGERIA · DISASTER',
    datum: '24 dead',
    head: 'A boat of mourners capsizes',
    hook: 'Up to 300 were aboard; 24 were rescued and needed medical care.',
    src: 'DW · Sky News',
  },
  {
    n: 7,
    glyph: 'talks',
    kicker: 'JERUSALEM · POLITICS',
    datum: 'Likud invited',
    head: 'Eisenkot opens coalition talks',
    hook: 'He is bidding for the broadest possible government.',
    src: 'Reuters',
  },
  {
    n: 8,
    glyph: 'aid',
    kicker: 'GAZA · AID',
    datum: '3 killed',
    head: 'A strike hits a food aid vehicle',
    hook: 'World Central Kitchen papers were found inside the wreck.',
    src: 'Al Jazeera · Reuters',
  },
  {
    n: 10,
    glyph: 'bolt',
    kicker: 'TEHRAN · ENERGY',
    datum: '2-hour cuts',
    head: 'Iran rations power from today',
    hook: 'Electricity is cut about two hours every two days as war damage bites.',
    src: 'Straits Times',
  },
  {
    n: 9,
    glyph: 'cuffs',
    kicker: 'SINALOA, MEXICO · DRUGS',
    datum: '11 dead',
    head: '‘El Chapo Isidro’ is caught',
    hook: 'The FBI had a $5m reward on the cartel boss; violence followed.',
    src: 'Sky News · BBC',
  },
  {
    n: 11,
    glyph: 'probe',
    kicker: 'WASHINGTON · MARKETS',
    datum: '−14%',
    head: 'Nvidia faces an SEC accounting probe',
    hook: 'The inquiry is at an early stage; weekly losses passed 20%.',
    src: 'Straits Times',
  },
  {
    n: 12,
    glyph: 'pulse',
    kicker: 'BRASILIA · HEALTH',
    datum: 'In intensive care',
    head: 'Bolsonaro has a bowel obstruction',
    hook: 'The hospital says the former president is stable.',
    src: 'Al Jazeera · Reuters',
  },
  {
    n: 13,
    glyph: 'sub',
    kicker: 'CANBERRA · DEFENCE',
    datum: 'Report rejected',
    head: 'Marles rejects AUKUS sub report',
    hook: 'The defence minister says the budget office is wrong.',
    src: 'ABC · Reuters',
  },
];

export const briefs = [
  { n: 14, place: 'US', text: 'The FBI probes an apparent hack of its crime database.', src: 'BBC' },
  { n: 15, place: 'US', text: 'A teen gamer helps the FBI rescue a girl online.', src: 'BBC' },
  { n: 16, place: 'US', text: 'Vance is cornered by the midterm defeat.', src: 'ST' },
  { n: 17, place: 'Saudi Arabia', text: 'Air defences down a missile.', src: 'Investing.com' },
  { n: 18, place: 'Lebanon', text: 'Aoun demands a pullout from ‘every inch’.', src: 'Al Jazeera' },
  { n: 19, place: 'Iran', text: 'Pezeshkian says the US wages a ‘silent economic war’.', src: 'Al Jazeera' },
  { n: 20, place: 'Hormuz', text: 'Pugh swims the strait as a tanker is hit nearby.', src: 'BBC' },
  { n: 21, place: 'Moldova', text: 'A Russian drone enters its airspace twice.', src: 'Kyiv Ind.' },
  { n: 22, place: 'Belgium', text: 'Air traffic stops for the 23 November strike.', src: 'ST' },
  { n: 23, place: 'Germany', text: 'IG Metall calls out 23,000 workers on Monday.', src: 'Reuters' },
  { n: 24, place: 'Portugal', text: 'Thousands march in Lisbon over living costs.', src: 'Reuters' },
  { n: 25, place: 'Denmark', text: 'A Russian attaché is expelled over a murder plot.', src: 'Guardian' },
  { n: 26, place: 'Bangladesh', text: '20 to 30 Awami League homes are set on fire.', src: 'TOI' },
  { n: 27, place: 'Australia', text: 'Fred Nile, a former NSW MP, dies at 92.', src: 'ABC' },
  { n: 28, place: 'Canberra', text: 'Bystanders pull a driver from a burning car.', src: 'ABC' },
  { n: 29, place: 'Melbourne', text: 'Dawn Fraser marks 70 years since the 1956 Games.', src: 'ABC' },
  { n: 30, place: 'Trade', text: 'The EU and Indonesia sign a deal after 10 years.', src: 'DW' },
  { n: 31, place: 'Rugby', text: 'England beat New Zealand 37-12 at Twickenham.', src: 'Reuters' },
  { n: 32, place: 'Rugby', text: 'France beat Argentina to reach the final.', src: 'Reuters' },
  { n: 33, place: 'Football', text: 'Arsenal draw 2-2; Leeds win 4-1 at Chelsea.', src: 'BBC' },
  { n: 34, place: 'Tennis', text: 'Zverev and Alcaraz meet in today’s ATP final.', src: 'TOI' },
  { n: 35, place: 'Football', text: 'Liverpool host Manchester United at Anfield.', src: 'Al Jazeera' },
];

// Ten figures from the day, each carried by a story above and attributed to its outlet.
export const numbers = [
  { fig: '400', cap: 'drones in Russia’s overnight attack', src: 'Al Jazeera' },
  { fig: '110', cap: 'missiles in the same attack', src: 'Al Jazeera' },
  { fig: '11', cap: 'dead across Ukraine, seven of them in Kyiv', src: 'Al Jazeera' },
  { fig: '60', cap: 'wounded in Kryvyi Rih, six of them children', src: 'Al Jazeera' },
  { fig: '24', cap: 'dead when a mourners’ boat sank in Bayelsa', src: 'Sky News' },
  { fig: '23,000', cap: 'workers IG Metall calls out on Monday', src: 'Reuters' },
  { fig: '14%', cap: 'Nvidia’s one-day fall; 20% for the week', src: 'Straits Times' },
  { fig: '$5m', cap: 'US reward for the cartel boss held in Sinaloa', src: 'BBC' },
  { fig: '15 km', cap: 'Lewis Pugh’s swim through the Strait of Hormuz', src: 'BBC' },
  { fig: '70 yrs', cap: 'since the 1956 Melbourne Olympics opened', src: 'ABC' },
];

// Region tallies are counted from the edition, not typed by hand. Each region keeps one hue:
// the paper tone for rules, glyphs and bullets; the lighter tone for dots on the dark map.
export const REGION = {
  europe: ['Europe', '#1f4e79', '#6ea8e0'],
  'middle-east': ['Middle East', '#a8600f', '#e0a94f'],
  asia: ['Asia', '#a8321f', '#ef6a4a'],
  africa: ['Africa', '#1c6b4a', '#4fbf8b'],
  americas: ['Americas', '#5a3a86', '#a987e0'],
  oceania: ['Oceania', '#0d6070', '#45c2d6'],
  world: ['World', '#43403a', '#c9ced4'],
};

// Labels for the three lead datelines on the map only.
export const MAP_POINTS = {
  1: { label: 'ANTALYA', dx: -6, dy: -6, anchor: 'end' },
  2: { label: 'KYIV', dx: 6, dy: -5, anchor: null },
  3: { label: 'MANAMA', dx: 8, dy: 1.5, anchor: null },
};
