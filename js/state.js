// ═══════════ État du jeu + sauvegarde localStorage ═══════════
import { SPECIES_BY_ID, movesFor, SHINY_RATE } from './data.js';

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
  captures: 0,
  trainings: 0,
  explorations: 0,
  tournaments: 0,
  shinies: 0,
  team: [],
  box: [],
  dex: {},          // speciesId -> 'seen' | 'caught'
  activeUid: null,
  effects: {},      // { xpBoost: ts, shopSale: ts, rareBoost: ts }
  starterChosen: false,
  lastEnergyTick: Date.now(),
  daily: null,      // { date: 'YYYY-MM-DD', quests: [{id, goal, progress, claimed}] }
  ach: {},          // achievements débloqués { id: true }
  muted: false,
};

// ─── Créatures ───
export function makeCreature(speciesId, level = 1, shinyBoost = 1) {
  const c = {
    uid: 'c' + uidCounter++ + '_' + Math.random().toString(36).slice(2, 7),
    speciesId,
    level,
    xp: 0,
    shiny: Math.random() < SHINY_RATE * shinyBoost,
    ivs: { hp: rand(0, 8), atk: rand(0, 8), def: rand(0, 8), spd: rand(0, 8) },
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

export function movesOf(c) { return movesFor(speciesOf(c).type, c.level); }

export function xpToNext(c) { return 25 * c.level; }

/** Ajoute de l'XP ; renvoie { levels, evolved, newMove } */
export function gainXp(c, amount) {
  if (state.effects.xpBoost && state.effects.xpBoost > Date.now()) amount *= 2;
  const movesBefore = movesOf(c).length + movesOf(c).map((m) => m.name).join();
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
  if (levels > 0) c.hp = maxHp(c); // soigne au passage de niveau — petite récompense
  const movesAfter = movesOf(c).map((m) => m.name).join();
  const newMove = movesBefore !== movesOf(c).length + movesAfter ? movesOf(c)[movesOf(c).length - 1] : null;
  return { levels, evolved, newMove };
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
  if (c.shiny) state.shinies++;
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
    // Migration des anciennes sauvegardes (v1 → v2)
    for (const c of [...state.team, ...state.box]) c.shiny = c.shiny || false;
    state.daily = state.daily || null;
    state.ach = state.ach || {};
    state.muted = state.muted || false;
    for (const k of ['captures', 'trainings', 'explorations', 'tournaments', 'shinies']) {
      state[k] = state[k] || 0;
    }
    uidCounter = state.team.length + state.box.length + 10;
    tickEnergy(); // applique la régénération hors-ligne
    return true;
  } catch (e) {
    return false;
  }
}

export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  location.reload();
}
