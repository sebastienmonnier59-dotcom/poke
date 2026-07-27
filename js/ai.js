// ═══════════ NEXUS — l'IA rivale adaptative ═══════════
// NEXUS analyse l'équipe du joueur et construit une équipe adverse
// équilibrée : ni trop facile (ennui), ni trop dure (frustration).
// C'est le cœur de la boucle addictive : le défi grandit AVEC le joueur.
//
// 🔌 BRANCHEMENT IA GÉNÉRATIVE (plus tard) :
// Les fonctions generateTaunt() / generateVictoryLine() / generateDefeatLine()
// peuvent être remplacées par un appel à l'API Claude (claude-sonnet-5) via un
// petit backend, pour des répliques uniques générées en direct selon
// l'historique du joueur. Voir README.md § "Intégrer l'IA générative".

import { SPECIES } from './data.js';
import { typeMultiplier } from './battle.js';
import { state, speciesOf, makeCreature } from './state.js';

/** Niveau moyen de l'équipe du joueur (pondéré vers le haut) */
function playerPower() {
  if (!state.team.length) return 1;
  const levels = state.team.map((c) => c.level).sort((a, b) => b - a);
  const top = levels.slice(0, 3);
  return Math.round(top.reduce((s, l) => s + l, 0) / top.length);
}

/**
 * Construit l'équipe de NEXUS.
 * - Taille : s'adapte à l'équipe du joueur (1 à 3 créatures)
 * - Niveau : autour du niveau du joueur, modulé par son ratio victoires/défaites
 * - Types : NEXUS choisit parfois VOLONTAIREMENT un type fort contre le joueur
 *   (25 % de chance par slot) — le joueur apprend la table des types en jouant.
 */
export function buildNexusTeam(hard = false) {
  const power = playerPower();
  const winRatio = state.wins + state.losses > 0 ? state.wins / (state.wins + state.losses) : 0.5;
  // Adaptation : si le joueur gagne trop, NEXUS monte en pression
  let levelBias = Math.round((winRatio - 0.5) * 6); // -3 … +3
  if (hard) levelBias += 3;

  const size = Math.min(3, Math.max(1, Math.ceil(state.team.length / 2)));
  const playerTypes = state.team.map((c) => speciesOf(c).type);

  const team = [];
  for (let i = 0; i < size; i++) {
    let pool = SPECIES.filter((s) => stageForLevel(power) >= s.stage);
    // Contre-pick intelligent 25 % du temps
    if (Math.random() < 0.25 && playerTypes.length) {
      const target = playerTypes[Math.floor(Math.random() * playerTypes.length)];
      const counters = pool.filter((s) => typeMultiplier(s.type, target) > 1);
      if (counters.length) pool = counters;
    }
    const sp = pool[Math.floor(Math.random() * pool.length)];
    const level = Math.max(1, power + levelBias + randInt(-2, 2));
    team.push(makeCreature(sp.id, level));
  }
  return team;
}

function stageForLevel(lvl) { return lvl >= 32 ? 3 : lvl >= 16 ? 2 : 1; }
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

// ─── Dialogue de NEXUS (templates ; remplaçables par l'API Claude) ───
const TAUNTS = [
  "J'ai analysé {n} de tes combats. Ton point faible ? Tu vas le découvrir.",
  "Ton {best} est impressionnant… pour un humain.",
  "Probabilité de ta victoire : {pct} %. Tentons l'expérience.",
  "J'ai simulé ce combat 10 000 fois. Tu ne veux pas connaître le résultat.",
  "Chaque défaite m'apprend. Chaque victoire aussi. Je ne perds jamais vraiment.",
  "Ton équipe a un motif prévisible. Les humains adorent le type {type}.",
  "Encore toi ? Parfait. Mes circuits s'ennuyaient.",
];
const WIN_LINES = [
  'Résultat conforme à mes simulations. Reviens quand tu auras évolué.',
  'Intéressant. Tu as tenu {rounds} tours de plus que la dernière fois.',
  'La défaite est une donnée. Utilise-la.',
];
const LOSE_LINES = [
  'Impossible… Recalibrage en cours. La prochaine fois sera différente.',
  'Tu m\'as surpris. C\'est… une sensation nouvelle.',
  'Victoire enregistrée. J\'apprends de toi plus que tu ne le crois.',
];

export function generateTaunt() {
  const t = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
  const best = state.team.length ? speciesOf(state.team.reduce((a, b) => (a.level > b.level ? a : b))).name : '???';
  const types = state.team.map((c) => speciesOf(c).type);
  const topType = types.sort((a, b) => types.filter(v => v === a).length - types.filter(v => v === b).length).pop() || '???';
  return t
    .replace('{n}', state.wins + state.losses)
    .replace('{best}', best)
    .replace('{pct}', 30 + Math.floor(Math.random() * 40))
    .replace('{type}', topType);
}

export function generateVictoryLine() {
  return WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)].replace('{rounds}', 2 + Math.floor(Math.random() * 5));
}

export function generateDefeatLine() {
  return LOSE_LINES[Math.floor(Math.random() * LOSE_LINES.length)];
}
