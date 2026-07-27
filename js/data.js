// ═══════════ Données du jeu : espèces, types, attaques, zones ═══════════
// 24 créatures ORIGINALES (8 lignées × 3 stades) — pas de contenu Nintendo/Game Freak.

export const TYPES = ['feu', 'eau', 'plante', 'electrik', 'roche', 'psy', 'vent', 'ombre'];

export const TYPE_LABEL = {
  feu: 'Feu', eau: 'Eau', plante: 'Plante', electrik: 'Électrik',
  roche: 'Roche', psy: 'Psy', vent: 'Vent', ombre: 'Ombre',
};

// Table des forces : attaquant -> types contre lesquels il fait x2 / x0.5
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

export const TYPE_EMOJI = {
  feu: '🔥', eau: '💧', plante: '🌿', electrik: '⚡',
  roche: '🪨', psy: '🔮', vent: '🌪️', ombre: '🌑',
};

// Couleur d'impact des attaques par type (effets 3D + UI)
export const TYPE_FX = {
  feu: 0xff6a3d, eau: 0x3da9ff, plante: 0x5ade6e, electrik: 0xffe14d,
  roche: 0xd9a066, psy: 0xff5de1, vent: 0x8de8ff, ombre: 0xa06bff,
  normal: 0xcfd8ea,
};

// ─── Attaques : Charge commune + 3 attaques par type, apprises aux niv. 1/12/24 ───
export const CHARGE = { name: 'Charge', type: 'normal', power: 40 };

export const TYPE_MOVES = {
  feu:      [{ name: 'Flammèche', power: 45, level: 1 }, { name: 'Lance-Brasier', power: 75, level: 12 }, { name: 'Fournaise', power: 110, level: 24 }],
  eau:      [{ name: 'Jet d\'Eau', power: 45, level: 1 }, { name: 'Vague Déferlante', power: 75, level: 12 }, { name: 'Maelström', power: 110, level: 24 }],
  plante:   [{ name: 'Fouet Sève', power: 45, level: 1 }, { name: 'Ronce Vive', power: 75, level: 12 }, { name: 'Tempête Florale', power: 110, level: 24 }],
  electrik: [{ name: 'Étincelle', power: 45, level: 1 }, { name: 'Arc Voltaïque', power: 75, level: 12 }, { name: 'Mégafoudre', power: 110, level: 24 }],
  roche:    [{ name: 'Jet de Pierre', power: 45, level: 1 }, { name: 'Éboulement', power: 75, level: 12 }, { name: 'Fracas Titanesque', power: 110, level: 24 }],
  psy:      [{ name: 'Onde Mentale', power: 45, level: 1 }, { name: 'Choc Psychique', power: 75, level: 12 }, { name: 'Prémonition', power: 110, level: 24 }],
  vent:     [{ name: 'Bourrasque', power: 45, level: 1 }, { name: 'Lame d\'Air', power: 75, level: 12 }, { name: 'Ouragan', power: 110, level: 24 }],
  ombre:    [{ name: 'Griffe Nocturne', power: 45, level: 1 }, { name: 'Voile des Limbes', power: 75, level: 12 }, { name: 'Éclipse Totale', power: 110, level: 24 }],
};

/** Attaques connues d'une créature (type + niveau) */
export function movesFor(type, level) {
  const moves = [CHARGE, ...TYPE_MOVES[type].filter((m) => level >= m.level).map((m) => ({ ...m, type }))];
  return moves.slice(-4); // 4 attaques max, les plus récentes
}

// ─── Espèces ───
// plan : plan corporel 3D — quadruped | feline | aquatic | saurian | avian | golem | mystic | grub | bat
// palette : couleurs propres à l'ESPÈCE (corps, ventre, accent/ornements, iris)
// size : échelle globale du modèle
export const SPECIES = [
  // ── Lignée FEU (renard → loup → dragon) ──
  { id: 'braisou',   name: 'Braisou',   type: 'feu', stage: 1, evolvesTo: 'pyrofel',   evolveLevel: 16, rarity: 1,
    base: { hp: 40, atk: 12, def: 8,  spd: 11 }, emoji: '🦊', plan: 'quadruped', size: 0.8,
    palette: { body: 0xd96b3a, belly: 0xf5d9b8, accent: 0xff4d1a, eye: 0xffa028 },
    desc: 'Un renardeau dont la queue couve une braise éternelle.' },
  { id: 'pyrofel',   name: 'Pyrofel',   type: 'feu', stage: 2, evolvesTo: 'infernyx',  evolveLevel: 32, rarity: 2,
    base: { hp: 58, atk: 18, def: 12, spd: 15 }, emoji: '🐺', plan: 'quadruped', size: 1.05,
    palette: { body: 0xb54527, belly: 0xe8b98a, accent: 0xff3300, eye: 0xffc23d },
    desc: 'Sa fourrure s\'embrase quand il chasse au crépuscule.' },
  { id: 'infernyx',  name: 'Infernyx',  type: 'feu', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 80, atk: 26, def: 17, spd: 20 }, emoji: '🐲', plan: 'saurian', size: 1.3,
    palette: { body: 0x8f2410, belly: 0xf0a35e, accent: 0xff2200, eye: 0xffdd55 },
    desc: 'Le seigneur des volcans. Son rugissement fait fondre la roche.' },
  // ── Lignée EAU (poisson → dauphin → léviathan) ──
  { id: 'gouttix',   name: 'Gouttix',   type: 'eau', stage: 1, evolvesTo: 'aquarel',   evolveLevel: 16, rarity: 1,
    base: { hp: 44, atk: 10, def: 10, spd: 10 }, emoji: '🐟', plan: 'aquatic', size: 0.72,
    palette: { body: 0x3f9be8, belly: 0xcfeaff, accent: 0x1257c9, eye: 0x0a2a66 },
    desc: 'Une gouttelette vivante, toujours joyeuse sous la pluie.' },
  { id: 'aquarel',   name: 'Aquarel',   type: 'eau', stage: 2, evolvesTo: 'torrentor', evolveLevel: 32, rarity: 2,
    base: { hp: 64, atk: 15, def: 15, spd: 13 }, emoji: '🐬', plan: 'aquatic', size: 1.05,
    palette: { body: 0x2f7fd4, belly: 0xd8f2ff, accent: 0x123f9e, eye: 0x0d2c5c },
    desc: 'Il peint des arcs-en-ciel en bondissant hors des vagues.' },
  { id: 'torrentor', name: 'Torrentor', type: 'eau', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 90, atk: 22, def: 22, spd: 16 }, emoji: '🐋', plan: 'aquatic', size: 1.42,
    palette: { body: 0x1c4f9e, belly: 0xbfe4f5, accent: 0x0a2f73, eye: 0x9adcff },
    desc: 'Un titan des abysses capable de créer des maelströms.' },
  // ── Lignée PLANTE (chenille → lézard → dino-forêt) ──
  { id: 'feuillo',   name: 'Feuillo',   type: 'plante', stage: 1, evolvesTo: 'sylvard',   evolveLevel: 16, rarity: 1,
    base: { hp: 45, atk: 10, def: 12, spd: 8 }, emoji: '🐛', plan: 'grub', size: 0.7,
    palette: { body: 0x6fbf5a, belly: 0xe4f2c8, accent: 0x2e8f3a, eye: 0x1d4d22 },
    desc: 'Une pousse curieuse qui suit le soleil toute la journée.' },
  { id: 'sylvard',   name: 'Sylvard',   type: 'plante', stage: 2, evolvesTo: 'florakhan', evolveLevel: 32, rarity: 2,
    base: { hp: 66, atk: 14, def: 18, spd: 10 }, emoji: '🦎', plan: 'saurian', size: 1.02,
    palette: { body: 0x4a9e4f, belly: 0xd9ecb4, accent: 0x1f6e2e, eye: 0xffd12e },
    desc: 'Gardien des sous-bois, ses épines sont enduites de sève.' },
  { id: 'florakhan', name: 'Florakhan', type: 'plante', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 95, atk: 20, def: 26, spd: 12 }, emoji: '🦖', plan: 'saurian', size: 1.38,
    palette: { body: 0x2f7a3c, belly: 0xcfe6a8, accent: 0x145223, eye: 0xffb01e },
    desc: 'Une forêt entière vit sur son dos millénaire.' },
  // ── Lignée ÉLECTRIK (souris → guépard → rapace) ──
  { id: 'voltine',   name: 'Voltine',   type: 'electrik', stage: 1, evolvesTo: 'fulgurix', evolveLevel: 16, rarity: 2,
    base: { hp: 38, atk: 13, def: 7,  spd: 14 }, emoji: '🐭', plan: 'quadruped', size: 0.66,
    palette: { body: 0xf5cf3a, belly: 0xfdf3c4, accent: 0xff9500, eye: 0x3a2c00 },
    desc: 'Ses moustaches crépitent d\'électricité statique.' },
  { id: 'fulgurix',  name: 'Fulgurix',  type: 'electrik', stage: 2, evolvesTo: 'megavolt', evolveLevel: 32, rarity: 2,
    base: { hp: 55, atk: 19, def: 11, spd: 19 }, emoji: '🐆', plan: 'feline', size: 1.05,
    palette: { body: 0xe8b820, belly: 0xfbf0bb, accent: 0x2d2410, eye: 0x00d9ff },
    desc: 'Il court plus vite que la foudre qu\'il invoque.' },
  { id: 'megavolt',  name: 'Mégavolt',  type: 'electrik', stage: 3, evolvesTo: null,       evolveLevel: null, rarity: 3,
    base: { hp: 75, atk: 28, def: 15, spd: 24 }, emoji: '🦅', plan: 'avian', size: 1.25,
    palette: { body: 0xd9a410, belly: 0xfff3c2, accent: 0x00c8ff, eye: 0x00e0ff },
    desc: 'Les orages le suivent comme des animaux de compagnie.' },
  // ── Lignée ROCHE (tortue-galet → rhino → colosse) ──
  { id: 'rocaillou', name: 'Rocaillou', type: 'roche', stage: 1, evolvesTo: 'granitor',  evolveLevel: 16, rarity: 1,
    base: { hp: 48, atk: 11, def: 15, spd: 5 }, emoji: '🐢', plan: 'golem', size: 0.72,
    palette: { body: 0x9c8a76, belly: 0xd6c9b8, accent: 0x6b5a48, eye: 0x2e2317 },
    desc: 'On le confond souvent avec un simple galet… qui mord.' },
  { id: 'granitor',  name: 'Granitor',  type: 'roche', stage: 2, evolvesTo: 'titanroc',  evolveLevel: 32, rarity: 2,
    base: { hp: 70, atk: 16, def: 22, spd: 7 }, emoji: '🦏', plan: 'golem', size: 1.1,
    palette: { body: 0x7d6a58, belly: 0xc4b5a2, accent: 0x4c3d2e, eye: 0xd98e2b },
    desc: 'Son armure de granit a survécu à mille batailles.' },
  { id: 'titanroc',  name: 'Titanroc',  type: 'roche', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 3,
    base: { hp: 100, atk: 24, def: 30, spd: 8 }, emoji: '🗿', plan: 'golem', size: 1.45,
    palette: { body: 0x5e5246, belly: 0xa89a88, accent: 0x36e0c8, eye: 0x36e0c8 },
    desc: 'Une montagne qui marche. Les séismes sont ses pas.' },
  // ── Lignée PSY (méduse → hibou → oracle) ──
  { id: 'psybulle',  name: 'Psybulle',  type: 'psy', stage: 1, evolvesTo: 'mentalys',  evolveLevel: 16, rarity: 2,
    base: { hp: 40, atk: 12, def: 9,  spd: 12 }, emoji: '🐙', plan: 'mystic', size: 0.75,
    palette: { body: 0xe07bd4, belly: 0xf7d6f2, accent: 0x9b2fd4, eye: 0x5a0e8f },
    desc: 'Il flotte en rêvassant et lit les pensées des passants.' },
  { id: 'mentalys',  name: 'Mentalys',  type: 'psy', stage: 2, evolvesTo: 'oracylon',  evolveLevel: 32, rarity: 3,
    base: { hp: 58, atk: 18, def: 13, spd: 16 }, emoji: '🦉', plan: 'avian', size: 1.0,
    palette: { body: 0xb75fc9, belly: 0xefd9f5, accent: 0x6a1f9e, eye: 0xffd12e },
    desc: 'Ses yeux voient trois secondes dans le futur.' },
  { id: 'oracylon',  name: 'Oracylon',  type: 'psy', stage: 3, evolvesTo: null,        evolveLevel: null, rarity: 4,
    base: { hp: 78, atk: 27, def: 18, spd: 21 }, emoji: '🔮', plan: 'mystic', size: 1.25,
    palette: { body: 0x8f3ddb, belly: 0xe3c8f7, accent: 0xff5de1, eye: 0x00ffe1 },
    desc: 'On dit qu\'il connaît la fin de toutes les histoires.' },
  // ── Lignée VENT (poussin → perroquet → cygne-tempête) ──
  { id: 'plumze',    name: 'Plumzé',    type: 'vent', stage: 1, evolvesTo: 'aeriel',   evolveLevel: 16, rarity: 1,
    base: { hp: 38, atk: 11, def: 7,  spd: 15 }, emoji: '🐤', plan: 'avian', size: 0.62,
    palette: { body: 0xa8dfe8, belly: 0xf0fbfd, accent: 0x3fa8c4, eye: 0x114a5c },
    desc: 'Si léger qu\'un éternuement l\'envoie dans les nuages.' },
  { id: 'aeriel',    name: 'Aériel',    type: 'vent', stage: 2, evolvesTo: 'cyclonos', evolveLevel: 32, rarity: 2,
    base: { hp: 54, atk: 16, def: 11, spd: 21 }, emoji: '🦜', plan: 'avian', size: 0.98,
    palette: { body: 0x5fc4d9, belly: 0xeafcff, accent: 0x1279a3, eye: 0xffab1e },
    desc: 'Il danse avec les courants et nargue les tempêtes.' },
  { id: 'cyclonos',  name: 'Cyclonos',  type: 'vent', stage: 3, evolvesTo: null,       evolveLevel: null, rarity: 3,
    base: { hp: 72, atk: 23, def: 15, spd: 28 }, emoji: '🦢', plan: 'avian', size: 1.28,
    palette: { body: 0xd8f4fa, belly: 0xffffff, accent: 0x2a9bc4, eye: 0x0d5c7a },
    desc: 'Ses ailes déchaînent des cyclones d\'une seule battue.' },
  // ── Lignée OMBRE (chauve-souris → panthère → abîme) ──
  { id: 'ombrion',   name: 'Ombrion',   type: 'ombre', stage: 1, evolvesTo: 'nocturnyx', evolveLevel: 16, rarity: 3,
    base: { hp: 42, atk: 14, def: 8,  spd: 13 }, emoji: '🦇', plan: 'bat', size: 0.68,
    palette: { body: 0x4a3a75, belly: 0x8a7ab0, accent: 0xb14aff, eye: 0xff3d81 },
    desc: 'Il naît dans l\'ombre des enfants qui font des cauchemars.' },
  { id: 'nocturnyx', name: 'Nocturnyx', type: 'ombre', stage: 2, evolvesTo: 'abyssum',  evolveLevel: 32, rarity: 3,
    base: { hp: 60, atk: 20, def: 12, spd: 17 }, emoji: '🐈‍⬛', plan: 'feline', size: 1.02,
    palette: { body: 0x241d3d, belly: 0x4a3d6b, accent: 0x8a2fe0, eye: 0x00ff9d },
    desc: 'Un félin d\'encre qui se glisse entre les mondes.' },
  { id: 'abyssum',   name: 'Abyssum',   type: 'ombre', stage: 3, evolvesTo: null,       evolveLevel: null, rarity: 4,
    base: { hp: 82, atk: 29, def: 16, spd: 22 }, emoji: '👁️', plan: 'mystic', size: 1.3,
    palette: { body: 0x1a1030, belly: 0x3d2a66, accent: 0xff2f6b, eye: 0xffde3d },
    desc: 'L\'abîme incarné. Le regarder trop longtemps est déconseillé.' },
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

// Zones d'exploration
export const ZONES = [
  { id: 'prairie',  name: 'Prairie Dorée',    ico: '🌾', types: ['plante', 'vent', 'electrik'], desc: 'Des herbes hautes où bruissent mille créatures.', grad: ['#3a6b2e', '#d9c34a'] },
  { id: 'volcan',   name: 'Mont Fournaise',   ico: '🌋', types: ['feu', 'roche'],               desc: 'Chaleur écrasante, trésors ardents.', grad: ['#5c1a0e', '#ff6a3d'] },
  { id: 'lac',      name: 'Lac Miroir',       ico: '🏞️', types: ['eau', 'psy'],                 desc: 'Une eau si calme qu\'elle reflète les pensées.', grad: ['#0e3a5c', '#4fc4e8'] },
  { id: 'crypte',   name: 'Crypte Oubliée',   ico: '🕸️', types: ['ombre', 'psy', 'roche'],      desc: 'Seuls les managers courageux y descendent…', grad: ['#1a1030', '#8a2fe0'] },
];

export const STARTERS = ['braisou', 'gouttix', 'feuillo'];

// Probabilité shiny : 1/64 (doublée pendant une migration rare)
export const SHINY_RATE = 1 / 64;
