// ═══════════ Données du jeu : espèces, types, zones ═══════════
// 24 créatures ORIGINALES (8 lignées × 3 stades) — pas de contenu Nintendo/Game Freak.

export const TYPES = ['feu', 'eau', 'plante', 'electrik', 'roche', 'psy', 'vent', 'ombre'];

export const TYPE_LABEL = {
  feu: 'Feu', eau: 'Eau', plante: 'Plante', electrik: 'Électrik',
  roche: 'Roche', psy: 'Psy', vent: 'Vent', ombre: 'Ombre',
};

// Table des forces : attaquant -> types contre lesquels il fait x2
// (et inversement x0.5 quand la cible résiste)
export const TYPE_CHART = {
  feu:      { strong: ['plante', 'vent'],   weak: ['eau', 'roche'] },
  eau:      { strong: ['feu', 'roche'],     weak: ['plante', 'electrik'] },
  plante:   { strong: ['eau', 'roche'],     weak: ['feu', 'vent'] },
  electrik: { strong: ['eau', 'vent'],      weak: ['roche', 'plante'] },
  roche:    { strong: ['feu', 'electrik'],  weak: ['eau', 'plante'] },
  psy:      { strong: ['ombre'],            weak: ['ombre'] },
  vent:     { strong: ['plante'],           weak: ['electrik', 'roche'] },
  ombre:    { strong: ['psy'],              weak: ['psy'] },
};

// Couleurs 3D par type [corps, ventre, ornement]
export const TYPE_COLORS = {
  feu:      [0xff7043, 0xffcc80, 0xff3d00],
  eau:      [0x42a5f5, 0xb3e5fc, 0x0d47a1],
  plante:   [0x66bb6a, 0xc8e6c9, 0x2e7d32],
  electrik: [0xffd23f, 0xfff59d, 0xff8f00],
  roche:    [0xa1887f, 0xd7ccc8, 0x5d4037],
  psy:      [0xec6bd8, 0xf8bbd0, 0x8e24aa],
  vent:     [0x80deea, 0xe0f7fa, 0x00838f],
  ombre:    [0x9575cd, 0x4527a0, 0x1a0d33],
};

export const TYPE_EMOJI = {
  feu: '🔥', eau: '💧', plante: '🌿', electrik: '⚡',
  roche: '🪨', psy: '🔮', vent: '🌪️', ombre: '🌑',
};

// stage: 1..3 | evolvesTo: id | evolveLevel | rarity: 1 commun … 4 très rare
// shape: paramètres du générateur 3D (body: forme du corps, ears, tail, horn…)
export const SPECIES = [
  // ── Lignée FEU ──
  { id: 'braisou',   name: 'Braisou',   type: 'feu', stage: 1, evolvesTo: 'pyrofel',   evolveLevel: 16, rarity: 1,
    base: { hp: 40, atk: 12, def: 8,  spd: 11 }, emoji: '🦊', desc: 'Un renardeau dont la queue couve une braise éternelle.' },
  { id: 'pyrofel',   name: 'Pyrofel',   type: 'feu', stage: 2, evolvesTo: 'infernyx',  evolveLevel: 32, rarity: 2,
    base: { hp: 58, atk: 18, def: 12, spd: 15 }, emoji: '🐺', desc: 'Sa fourrure s\'embrase quand il chasse au crépuscule.' },
  { id: 'infernyx',  name: 'Infernyx',  type: 'feu', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 80, atk: 26, def: 17, spd: 20 }, emoji: '🐲', desc: 'Le seigneur des volcans. Son rugissement fait fondre la roche.' },
  // ── Lignée EAU ──
  { id: 'gouttix',   name: 'Gouttix',   type: 'eau', stage: 1, evolvesTo: 'aquarel',   evolveLevel: 16, rarity: 1,
    base: { hp: 44, atk: 10, def: 10, spd: 10 }, emoji: '🐟', desc: 'Une gouttelette vivante, toujours joyeuse sous la pluie.' },
  { id: 'aquarel',   name: 'Aquarel',   type: 'eau', stage: 2, evolvesTo: 'torrentor', evolveLevel: 32, rarity: 2,
    base: { hp: 64, atk: 15, def: 15, spd: 13 }, emoji: '🐬', desc: 'Il peint des arcs-en-ciel en bondissant hors des vagues.' },
  { id: 'torrentor', name: 'Torrentor', type: 'eau', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 90, atk: 22, def: 22, spd: 16 }, emoji: '🐋', desc: 'Un titan des abysses capable de créer des maelströms.' },
  // ── Lignée PLANTE ──
  { id: 'feuillo',   name: 'Feuillo',   type: 'plante', stage: 1, evolvesTo: 'sylvard',   evolveLevel: 16, rarity: 1,
    base: { hp: 45, atk: 10, def: 12, spd: 8 }, emoji: '🐛', desc: 'Une pousse curieuse qui suit le soleil toute la journée.' },
  { id: 'sylvard',   name: 'Sylvard',   type: 'plante', stage: 2, evolvesTo: 'florakhan', evolveLevel: 32, rarity: 2,
    base: { hp: 66, atk: 14, def: 18, spd: 10 }, emoji: '🦎', desc: 'Gardien des sous-bois, ses épines sont enduites de sève.' },
  { id: 'florakhan', name: 'Florakhan', type: 'plante', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 95, atk: 20, def: 26, spd: 12 }, emoji: '🦖', desc: 'Une forêt entière vit sur son dos millénaire.' },
  // ── Lignée ÉLECTRIK ──
  { id: 'voltine',   name: 'Voltine',   type: 'electrik', stage: 1, evolvesTo: 'fulgurix', evolveLevel: 16, rarity: 2,
    base: { hp: 38, atk: 13, def: 7,  spd: 14 }, emoji: '🐭', desc: 'Ses moustaches crépitent d\'électricité statique.' },
  { id: 'fulgurix',  name: 'Fulgurix',  type: 'electrik', stage: 2, evolvesTo: 'megavolt', evolveLevel: 32, rarity: 2,
    base: { hp: 55, atk: 19, def: 11, spd: 19 }, emoji: '🐆', desc: 'Il court plus vite que la foudre qu\'il invoque.' },
  { id: 'megavolt',  name: 'Mégavolt',  type: 'electrik', stage: 3, evolvesTo: null,       evolveLevel: null, rarity: 3,
    base: { hp: 75, atk: 28, def: 15, spd: 24 }, emoji: '🦅', desc: 'Les orages le suivent comme des animaux de compagnie.' },
  // ── Lignée ROCHE ──
  { id: 'rocaillou', name: 'Rocaillou', type: 'roche', stage: 1, evolvesTo: 'granitor',  evolveLevel: 16, rarity: 1,
    base: { hp: 48, atk: 11, def: 15, spd: 5 }, emoji: '🐢', desc: 'On le confond souvent avec un simple galet… qui mord.' },
  { id: 'granitor',  name: 'Granitor',  type: 'roche', stage: 2, evolvesTo: 'titanroc',  evolveLevel: 32, rarity: 2,
    base: { hp: 70, atk: 16, def: 22, spd: 7 }, emoji: '🦏', desc: 'Son armure de granit a survécu à mille batailles.' },
  { id: 'titanroc',  name: 'Titanroc',  type: 'roche', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 100, atk: 24, def: 30, spd: 8 }, emoji: '🗿', desc: 'Une montagne qui marche. Les séismes sont ses pas.' },
  // ── Lignée PSY ──
  { id: 'psybulle',  name: 'Psybulle',  type: 'psy', stage: 1, evolvesTo: 'mentalys',  evolveLevel: 16, rarity: 2,
    base: { hp: 40, atk: 12, def: 9,  spd: 12 }, emoji: '🐙', desc: 'Il flotte en rêvassant et lit les pensées des passants.' },
  { id: 'mentalys',  name: 'Mentalys',  type: 'psy', stage: 2, evolvesTo: 'oracylon',  evolveLevel: 32, rarity: 3,
    base: { hp: 58, atk: 18, def: 13, spd: 16 }, emoji: '🦉', desc: 'Ses yeux voient trois secondes dans le futur.' },
  { id: 'oracylon',  name: 'Oracylon',  type: 'psy', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 4,
    base: { hp: 78, atk: 27, def: 18, spd: 21 }, emoji: '🔮', desc: 'On dit qu\'il connaît la fin de toutes les histoires.' },
  // ── Lignée VENT ──
  { id: 'plumze',    name: 'Plumzé',    type: 'vent', stage: 1, evolvesTo: 'aeriel',   evolveLevel: 16, rarity: 1,
    base: { hp: 38, atk: 11, def: 7,  spd: 15 }, emoji: '🐤', desc: 'Si léger qu\'un éternuement l\'envoie dans les nuages.' },
  { id: 'aeriel',    name: 'Aériel',    type: 'vent', stage: 2, evolvesTo: 'cyclonos', evolveLevel: 32, rarity: 2,
    base: { hp: 54, atk: 16, def: 11, spd: 21 }, emoji: '🦜', desc: 'Il danse avec les courants et nargue les tempêtes.' },
  { id: 'cyclonos',  name: 'Cyclonos',  type: 'vent', stage: 3, evolvesTo: null,       evolveLevel: null, rarity: 3,
    base: { hp: 72, atk: 23, def: 15, spd: 28 }, emoji: '🦢', desc: 'Ses ailes déchaînent des cyclones d\'une seule battue.' },
  // ── Lignée OMBRE ──
  { id: 'ombrion',   name: 'Ombrion',   type: 'ombre', stage: 1, evolvesTo: 'nocturnyx', evolveLevel: 16, rarity: 3,
    base: { hp: 42, atk: 14, def: 8,  spd: 13 }, emoji: '🦇', desc: 'Il naît dans l\'ombre des enfants qui font des cauchemars.' },
  { id: 'nocturnyx', name: 'Nocturnyx', type: 'ombre', stage: 2, evolvesTo: 'abyssum',  evolveLevel: 32, rarity: 3,
    base: { hp: 60, atk: 20, def: 12, spd: 17 }, emoji: '🐈‍⬛', desc: 'Un félin d\'encre qui se glisse entre les mondes.' },
  { id: 'abyssum',   name: 'Abyssum',   type: 'ombre', stage: 3, evolvesTo: null,       evolveLevel: null, rarity: 4,
    base: { hp: 82, atk: 29, def: 16, spd: 22 }, emoji: '👁️', desc: 'L\'abîme incarné. Le regarder trop longtemps est déconseillé.' },
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

// Zones d'exploration : chaque zone favorise certains types
export const ZONES = [
  { id: 'prairie',  name: 'Prairie Dorée',    ico: '🌾', types: ['plante', 'vent', 'electrik'], desc: 'Des herbes hautes où bruissent mille créatures.' },
  { id: 'volcan',   name: 'Mont Fournaise',   ico: '🌋', types: ['feu', 'roche'],               desc: 'Chaleur écrasante, trésors ardents.' },
  { id: 'lac',      name: 'Lac Miroir',       ico: '🏞️', types: ['eau', 'psy'],                 desc: 'Une eau si calme qu\'elle reflète les pensées.' },
  { id: 'crypte',   name: 'Crypte Oubliée',   ico: '🕸️', types: ['ombre', 'psy', 'roche'],      desc: 'Seuls les managers courageux y descendent…' },
];

// Les starters proposés au début
export const STARTERS = ['braisou', 'gouttix', 'feuillo'];
