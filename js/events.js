// ═══════════ Événements dynamiques ═══════════
// Un événement aléatoire se déclenche toutes les 1 à 3 minutes de jeu.
// C'est le moteur de la surprise : le joueur ne sait jamais ce qui arrive.

import { state, save } from './state.js';

const EVENTS = [
  {
    id: 'xp-boost',
    title: '🌠 Pluie d\'étoiles ! XP ×2 pendant 2 minutes !',
    apply: () => { state.effects.xpBoost = Date.now() + 2 * 60 * 1000; },
    duration: 2 * 60 * 1000,
  },
  {
    id: 'shop-sale',
    title: '🛒 Marchand ambulant ! -50 % à la boutique pendant 90 s !',
    apply: () => { state.effects.shopSale = Date.now() + 90 * 1000; },
    duration: 90 * 1000,
  },
  {
    id: 'rare-boost',
    title: '✨ Migration rare ! Créatures rares garanties en exploration (2 min) !',
    apply: () => { state.effects.rareBoost = Date.now() + 2 * 60 * 1000; },
    duration: 2 * 60 * 1000,
  },
  {
    id: 'gold-rain',
    title: '🪙 Pluie d\'or ! +{gold} or trouvé par ton équipe !',
    apply: () => {
      const gold = 30 + Math.floor(Math.random() * 70);
      state.gold += gold;
      return { gold };
    },
    duration: 8000,
  },
  {
    id: 'energy-gift',
    title: '⚡ Vent favorable ! +25 énergie !',
    apply: () => { state.energy = Math.min(100, state.energy + 25); },
    duration: 8000,
  },
  {
    id: 'capsule-gift',
    title: '🔴 Livraison surprise ! +2 capsules !',
    apply: () => { state.capsules += 2; },
    duration: 8000,
  },
];

let nextEventAt = Date.now() + delay();
let currentBannerUntil = 0;

function delay() { return (60 + Math.random() * 120) * 1000; } // 1 à 3 min

/** À appeler régulièrement ; renvoie l'événement déclenché ou null */
export function tickEvents() {
  const now = Date.now();
  if (now < nextEventAt) return null;
  nextEventAt = now + delay();

  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const extra = ev.apply() || {};
  currentBannerUntil = now + ev.duration;
  save();

  let title = ev.title;
  for (const [k, v] of Object.entries(extra)) title = title.replace(`{${k}}`, v);
  return { ...ev, title };
}

export function bannerActive() { return Date.now() < currentBannerUntil; }

/** Effets actifs (pour l'affichage) */
export function activeEffects() {
  const now = Date.now();
  const out = [];
  if (state.effects.xpBoost > now) out.push('🌠 XP ×2');
  if (state.effects.shopSale > now) out.push('🛒 Promo -50 %');
  if (state.effects.rareBoost > now) out.push('✨ Rares garantis');
  return out;
}

export function shopSaleActive() { return state.effects.shopSale > Date.now(); }
export function rareBoostActive() { return state.effects.rareBoost > Date.now(); }
