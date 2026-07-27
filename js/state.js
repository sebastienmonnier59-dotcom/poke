// ═══════════ État du jeu + sauvegarde localStorage ═══════════
import { SPECIES_BY_ID } from './data.js';

const SAVE_KEY = 'pokemanager-arena-v1';
export const ENERGY_MAX = 100;
export const ENERGY_REGEN_MS = 6000; // +1 énergie toutes les 6 s (même hors-ligne)
export const TEAM_MAX = 6;

let uidCounter = 1;

export const state = {
  gold: 100,
  energy: ENERGY_MAX,
  capsules: 5,
  potions: 2,
  candies: 0,
  badges: 0,
  wins: 0,
  losses: 0,
  team: [],
  box: [],
  dex: {},          // speciesId -> 'seen' | 'caught'
  activeUid: null,
  effects: {},      // { xpBoost: ts, shopSale: ts, rareBoost: ts }
  starterChosen: false,
  lastEnergyTick: Date.now(),
};

// ─── Créatures ───
export function makeCreature(speciesId, level = 1) {
  const sp = SPECIES_BY_ID[speciesId];
  const c = {
    uid: 'c' + uidCounter++ + '_' + Math.random().toString(36).slice(2, 7),
    speciesId,
    level,
    xp: 0,
    ivs: {
      hp: rand(0, 8), atk: rand(0, 8), def: rand(0, 8), spd: rand(0, 8),
    },
  };
  c.hp = maxHp(c);
  return c;
}

function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

export function speciesOf(c) { return SPECIES_BY_ID[c.speciesId]; }

export function maxHp(c) {
  const sp = speciesOf(c);
  return sp.base.hp * 2 + c.level * 5 + c.ivs.hp * 2;
}
export function atkOf(c) { const sp = speciesOf(c); return sp.base.atk + c.level * 2 + c.ivs.atk; }
export function defOf(c) { const sp = speciesOf(c); return sp.base.def + Math.floor(c.level * 1.5) + c.ivs.def; }
export function spdOf(c) { const sp = speciesOf(c); return sp.base.spd + c.level + c.ivs.spd; }

export function xpToNext(c) { return 25 * c.level; }

/** Ajoute de l'XP ; renvoie { levels: n, evolved: speciesId|null } */
export function gainXp(c, amount) {
  if (state.effects.xpBoost && state.effects.xpBoost > Date.now()) amount *= 2;
  c.xp += Math.round(amount);
  let levels = 0;
  let evolved = null;
  while (c.xp >= xpToNext(c) && c.level < 60) {
    c.xp -= xpToNext(c);
    c.level++;
    levels++;
    const sp = speciesOf(c);
    if (sp.evolvesTo && sp.evolveLevel && c.level >= sp.evolveLevel) {
      c.speciesId = sp.evolvesTo;
      evolved = sp.evolvesTo;
      registerDex(sp.evolvesTo, 'caught');
    }
  }
  if (levels > 0) c.hp = maxHp(c); // soigne au niveau supérieur — petite récompense
  return { levels, evolved };
}

export function registerDex(speciesId, status) {
  const cur = state.dex[speciesId];
  if (cur === 'caught') return;
  if (status === 'caught' || !cur) state.dex[speciesId] = status;
}

export function activeCreature() {
  return state.team.find((c) => c.uid === state.activeUid) || state.team[0] || null;
}

export function addCreature(c) {
  registerDex(c.speciesId, 'caught');
  if (state.team.length < TEAM_MAX) { state.team.push(c); return 'team'; }
  state.box.push(c);
  return 'box';
}

// ─── Énergie (régénération idle, y compris hors-ligne) ───
export function tickEnergy() {
  const now = Date.now();
  const elapsed = now - state.lastEnergyTick;
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (gained > 0) {
    state.energy = Math.min(ENERGY_MAX, state.energy + gained);
    state.lastEnergyTick += gained * ENERGY_REGEN_MS;
  }
  if (state.energy >= ENERGY_MAX) state.lastEnergyTick = now;
}

export function spendEnergy(n) {
  tickEnergy();
  if (state.energy < n) return false;
  state.energy -= n;
  return true;
}

// ─── Sauvegarde ───
export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { /* stockage indisponible : on joue sans sauvegarde */ }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    Object.assign(state, data);
    // Recale le compteur d'uid pour éviter les collisions
    uidCounter = state.team.length + state.box.length + 10;
    tickEnergy(); // applique la régénération hors-ligne
    return true;
  } catch (e) {
    return false;
  }
}

export function offlineGains() {
  // Appelé après load() : résume ce qui s'est passé pendant l'absence
  return null; // l'énergie est déjà recalculée par tickEnergy()
}
