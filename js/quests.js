// ═══════════ Missions journalières + Succès ═══════════
// La rétention par les objectifs : 3 missions par jour (rotation), succès permanents.

import { state, save } from './state.js';
import { SPECIES_BY_ID } from './data.js';

const QUEST_DEFS = [
  { id: 'win3',     desc: 'Gagner 3 combats en Arène',        key: 'win',     goal: 3, reward: { gold: 120 } },
  { id: 'capture1', desc: 'Capturer 1 créature',              key: 'capture', goal: 1, reward: { capsules: 3 } },
  { id: 'train5',   desc: 'Faire 5 entraînements',            key: 'train',   goal: 5, reward: { gold: 80 } },
  { id: 'explore3', desc: 'Explorer 3 fois',                  key: 'explore', goal: 3, reward: { candies: 1 } },
  { id: 'win1',     desc: 'Battre NEXUS 1 fois',              key: 'win',     goal: 1, reward: { gold: 50 } },
  { id: 'capture2', desc: 'Capturer 2 créatures',             key: 'capture', goal: 2, reward: { gold: 150 } },
];

function today() { return new Date().toISOString().slice(0, 10); }

/** Initialise / réinitialise les missions du jour (3 tirées par date) */
export function ensureDaily() {
  const d = today();
  if (state.daily && state.daily.date === d) return;
  // Tirage stable par date : hash simple de la date
  let h = 0;
  for (const ch of d) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const picks = [];
  const pool = [...QUEST_DEFS];
  for (let i = 0; i < 3; i++) {
    const idx = (h + i * 7) % pool.length;
    picks.push(pool.splice(idx, 1)[0]);
  }
  state.daily = {
    date: d,
    quests: picks.map((q) => ({ id: q.id, progress: 0, claimed: false })),
  };
  save();
}

export function questDef(id) { return QUEST_DEFS.find((q) => q.id === id); }

/** Fait progresser toutes les missions liées à une action ('win'|'capture'|'train'|'explore') */
export function bumpQuest(key, n = 1) {
  ensureDaily();
  let completed = null;
  for (const q of state.daily.quests) {
    const def = questDef(q.id);
    if (def.key !== key || q.claimed) continue;
    const before = q.progress;
    q.progress = Math.min(def.goal, q.progress + n);
    if (before < def.goal && q.progress >= def.goal) completed = def;
  }
  save();
  return completed; // pour afficher un toast "mission accomplie"
}

/** Réclame la récompense d'une mission terminée */
export function claimQuest(id) {
  const q = state.daily.quests.find((x) => x.id === id);
  const def = questDef(id);
  if (!q || q.claimed || q.progress < def.goal) return null;
  q.claimed = true;
  if (def.reward.gold) state.gold += def.reward.gold;
  if (def.reward.capsules) state.capsules += def.reward.capsules;
  if (def.reward.candies) state.candies += def.reward.candies;
  save();
  return def.reward;
}

// ─── Succès permanents ───
export const ACHIEVEMENTS = [
  { id: 'first-capture', name: 'Première capture',   desc: 'Capturer ta première créature',  ico: '🔴', check: (s) => s.captures >= 1, reward: 50 },
  { id: 'first-evo',     name: 'Métamorphose',       desc: 'Faire évoluer une créature',      ico: '✨', check: (s) => [...s.team, ...s.box].some((c) => SPECIES_BY_ID[c.speciesId].stage >= 2), reward: 100 },
  { id: 'dex10',         name: 'Collectionneur',     desc: 'Découvrir 10 espèces',            ico: '📖', check: (s) => Object.keys(s.dex).length >= 10, reward: 150 },
  { id: 'dex24',         name: 'Pokédex complet',    desc: 'Découvrir les 24 espèces',        ico: '👑', check: (s) => Object.keys(s.dex).length >= 24, reward: 500 },
  { id: 'win10',         name: 'Gladiateur',         desc: 'Gagner 10 combats',               ico: '⚔️', check: (s) => s.wins >= 10, reward: 200 },
  { id: 'win50',         name: 'Légende de l\'Arène', desc: 'Gagner 50 combats',              ico: '🏆', check: (s) => s.wins >= 50, reward: 500 },
  { id: 'tournament',    name: 'Champion',           desc: 'Remporter un tournoi',            ico: '👑', check: (s) => s.tournaments >= 1, reward: 250 },
  { id: 'shiny',         name: 'Éclat doré',         desc: 'Trouver une créature chromatique', ico: '🌟', check: (s) => s.shinies >= 1, reward: 300 },
  { id: 'level30',       name: 'Maître dresseur',    desc: 'Monter une créature au niv. 30',  ico: '🎓', check: (s) => [...s.team, ...s.box].some((c) => c.level >= 30), reward: 200 },
  { id: 'rich',          name: 'Fortune',            desc: 'Posséder 1 000 pièces d\'or',     ico: '🪙', check: (s) => s.gold >= 1000, reward: 0 },
];

/** Vérifie les succès ; renvoie les nouveaux débloqués */
export function checkAchievements() {
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (state.ach[a.id]) continue;
    if (a.check(state)) {
      state.ach[a.id] = true;
      if (a.reward) state.gold += a.reward;
      unlocked.push(a);
    }
  }
  if (unlocked.length) save();
  return unlocked;
}
