// ═══════════ PokéManager Arena — boucle principale ═══════════
import { SPECIES, SPECIES_BY_ID, ZONES } from './data.js';
import {
  state, load, save, makeCreature, addCreature, activeCreature, speciesOf,
  gainXp, maxHp, spendEnergy, tickEnergy, registerDex, xpToNext,
} from './state.js';
import { initViewer, showSpecies } from './creature3d.js';
import { simulateBattle } from './battle.js';
import { buildNexusTeam, generateTaunt, generateVictoryLine, generateDefeatLine } from './ai.js';
import { tickEvents, rareBoostActive } from './events.js';
import {
  renderResources, renderTeam, renderDex, renderZones, renderShop,
  renderStarterScreen, hideStarterScreen, renderEventBanner, renderViewerInfo,
  toast, logLine,
} from './ui.js';

const $ = (sel) => document.querySelector(sel);

// ─────────── Initialisation ───────────
const hadSave = load();
initViewer($('#viewer3d'));

if (!state.starterChosen) {
  renderStarterScreen((speciesId) => {
    const c = makeCreature(speciesId, 5);
    state.activeUid = c.uid;
    addCreature(c);
    state.starterChosen = true;
    hideStarterScreen();
    toast(`${SPECIES_BY_ID[speciesId].emoji} ${SPECIES_BY_ID[speciesId].name} rejoint ton équipe !`);
    save();
    refreshAll();
  });
} else if (hadSave) {
  toast('💾 Partie chargée — ton énergie s\'est régénérée pendant ton absence !');
}

// ─────────── Navigation par onglets ───────────
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    $('#panel-' + tab.dataset.tab).classList.add('active');
    refreshAll();
  });
});

// ─────────── Sélection d'une créature ───────────
function selectCreature(uid) {
  state.activeUid = uid;
  renderTeam(selectCreature);
  save();
}

// ─────────── Entraînement ───────────
$('#btn-train').addEventListener('click', () => {
  const c = activeCreature();
  if (!c) return toast('Choisis d\'abord une créature !');
  if (!spendEnergy(10)) return toast('⚡ Pas assez d\'énergie ! Elle se régénère avec le temps…');
  const xp = 15 + c.level * 2;
  applyXp(c, xp, '🏋️ Entraînement');
  save();
  refreshAll();
});

// ─────────── Potion ───────────
$('#btn-heal').addEventListener('click', () => {
  const c = activeCreature();
  if (!c) return;
  if (state.potions <= 0) return toast('Plus de potions ! Va à la boutique.');
  if (c.hp >= maxHp(c)) return toast(`${speciesOf(c).name} est déjà en pleine forme !`);
  state.potions--;
  c.hp = maxHp(c);
  toast(`🧪 ${speciesOf(c).name} récupère tous ses PV !`);
  save();
  refreshAll();
});

// ─────────── Bonbon XP ───────────
$('#btn-candy').addEventListener('click', () => {
  const c = activeCreature();
  if (!c) return;
  if (state.candies <= 0) return toast('Plus de bonbons ! Va à la boutique.');
  state.candies--;
  applyXp(c, 60, '🍬 Bonbon');
  save();
  refreshAll();
});

function applyXp(c, amount, label) {
  const before = speciesOf(c).name;
  const res = gainXp(c, amount);
  if (res.evolved) {
    const sp = SPECIES_BY_ID[res.evolved];
    toast(`✨ INCROYABLE ! ${before} évolue en ${sp.emoji} ${sp.name} !`, 'evo');
    if (c.uid === state.activeUid) showSpecies(sp.id);
  } else if (res.levels > 0) {
    toast(`⬆️ ${speciesOf(c).name} passe niveau ${c.level} !`);
  } else {
    toast(`${label} : +XP pour ${speciesOf(c).name}`);
  }
}

// ─────────── Exploration ───────────
let currentEncounter = null;

renderZones((zone) => {
  if (currentEncounter) return toast('Termine d\'abord la rencontre en cours !');
  if (!spendEnergy(20)) return toast('⚡ Pas assez d\'énergie pour explorer !');

  // Choix de l'espèce : types de la zone, pondérés par rareté
  let pool = SPECIES.filter((s) => zone.types.includes(s.type));
  const rare = rareBoostActive();
  const weighted = [];
  for (const sp of pool) {
    // rareté 1 = très fréquent … 4 = rarissime ; stade élevé plus rare aussi
    let w = rare ? sp.rarity * 2 : Math.max(1, 10 - sp.rarity * 2 - sp.stage * 2);
    for (let i = 0; i < w; i++) weighted.push(sp);
  }
  const sp = weighted[Math.floor(Math.random() * weighted.length)];
  const avgLvl = state.team.length
    ? Math.round(state.team.reduce((s, c) => s + c.level, 0) / state.team.length) : 3;
  const level = Math.max(1, avgLvl + Math.floor(Math.random() * 5) - 2);

  currentEncounter = { speciesId: sp.id, level };
  registerDex(sp.id, 'seen');
  showEncounter(sp, level, zone);
  logLine($('#explore-log'), `${zone.ico} ${zone.name} : un ${sp.name} sauvage (niv. ${level}) apparaît !`);
  save();
  refreshAll();
});

function showEncounter(sp, level, zone) {
  const box = $('#encounter-box');
  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="enc-emoji">${sp.emoji}</div>
    <h3>Un ${sp.name} sauvage apparaît !</h3>
    <p style="color:var(--muted)">Niveau ${level} — ${sp.desc}</p>
    <div class="enc-actions">
      <button class="btn primary" id="btn-capture">🔴 Capturer (1 capsule)</button>
      <button class="btn" id="btn-flee">🏃 Fuir</button>
    </div>`;
  $('#btn-capture').addEventListener('click', tryCapture);
  $('#btn-flee').addEventListener('click', () => {
    logLine($('#explore-log'), `Tu prends la fuite… ${sp.name} disparaît dans les fourrés.`);
    endEncounter();
  });
}

function tryCapture() {
  if (!currentEncounter) return;
  if (state.capsules <= 0) return toast('🔴 Plus de capsules ! Va à la boutique.');
  state.capsules--;
  const sp = SPECIES_BY_ID[currentEncounter.speciesId];
  const avgLvl = state.team.length
    ? state.team.reduce((s, c) => s + c.level, 0) / state.team.length : 5;
  // Chance : base 70 %, réduite si la cible est de plus haut niveau / rare
  let chance = 0.7 - (currentEncounter.level - avgLvl) * 0.05 - (sp.rarity - 1) * 0.08 - (sp.stage - 1) * 0.1;
  chance = Math.max(0.15, Math.min(0.95, chance));

  if (Math.random() < chance) {
    const c = makeCreature(currentEncounter.speciesId, currentEncounter.level);
    const where = addCreature(c);
    if (!state.activeUid) state.activeUid = c.uid;
    logLine($('#explore-log'), `🎉 ${sp.name} capturé ! ${where === 'box' ? '(envoyé dans la réserve — équipe pleine)' : 'Il rejoint ton équipe !'}`, 'win');
    toast(`🎉 ${sp.emoji} ${sp.name} capturé !`, 'evo');
    endEncounter();
  } else {
    logLine($('#explore-log'), `💨 Oh non, ${sp.name} s'est échappé de la capsule !`, 'lose');
    // La créature peut s'enfuir après un échec (tension !)
    if (Math.random() < 0.35) {
      logLine($('#explore-log'), `${sp.name} s'enfuit !`);
      endEncounter();
    } else {
      toast('Il est encore là… retente ta chance !');
      refreshAll();
    }
  }
  save();
}

function endEncounter() {
  currentEncounter = null;
  $('#encounter-box').classList.add('hidden');
  refreshAll();
}

// ─────────── Arène / Combats ───────────
$('#nexus-taunt').textContent = generateTaunt();

$('#btn-fight').addEventListener('click', () => startBattle(false));
$('#btn-tournament').addEventListener('click', () => startTournament());

let battleRunning = false;

async function startBattle(hard, silent = false) {
  if (battleRunning) return false;
  const fighters = state.team.filter((c) => c.hp > 0);
  if (!fighters.length) { toast('Toutes tes créatures sont K.O. ! Soigne-les d\'abord.'); return false; }
  if (!silent && !spendEnergy(15)) { toast('⚡ Pas assez d\'énergie !'); return false; } // le tournoi paie ses 40⚡ une seule fois

  battleRunning = true;
  const enemyTeam = buildNexusTeam(hard);
  for (const e of enemyTeam) registerDex(e.speciesId, 'seen');

  const logEl = $('#battle-log');
  if (!silent) logEl.innerHTML = '';
  const arena = $('#battle-arena');
  arena.classList.remove('hidden');

  $('#nexus-taunt').textContent = generateTaunt();

  const result = simulateBattle(fighters, enemyTeam);

  // Rejoue le log avec un délai pour le suspense
  for (const entry of result.log) {
    if (entry.snap) updateArena(entry.snap, entry.hitSide);
    logLine(logEl, entry.text, entry.cls);
    await sleep(420);
  }

  const avgEnemyLvl = Math.round(enemyTeam.reduce((s, c) => s + c.level, 0) / enemyTeam.length);
  if (result.winner === 'player') {
    const gold = 25 + avgEnemyLvl * 4 + (hard ? 40 : 0);
    const xp = 20 + avgEnemyLvl * 3;
    state.gold += gold;
    state.wins++;
    logLine(logEl, `🏆 VICTOIRE ! +${gold} or, +${xp} XP pour l'équipe !`, 'win');
    for (const c of fighters) applyXpSilent(c, xp);
    if (!hard && Math.random() < 0.15) { state.badges++; logLine(logEl, '🏅 NEXUS te concède un badge !', 'win'); }
    logLine(logEl, `🤖 NEXUS : ${generateDefeatLine()}`);
  } else {
    state.losses++;
    const gold = 5 + Math.floor(avgEnemyLvl);
    state.gold += gold;
    logLine(logEl, `💀 Défaite… +${gold} or de consolation. Entraîne-toi et reviens !`, 'lose');
    logLine(logEl, `🤖 NEXUS : ${generateVictoryLine()}`);
  }

  battleRunning = false;
  save();
  refreshAll();
  return result.winner === 'player';
}

async function startTournament() {
  if (battleRunning) return;
  if (state.team.filter((c) => c.hp > 0).length === 0) return toast('Soigne ton équipe d\'abord !');
  if (!spendEnergy(40)) return toast('⚡ Il faut 40 énergie pour un tournoi !');

  const logEl = $('#battle-log');
  logEl.innerHTML = '';
  logLine(logEl, '🏆 ═══ TOURNOI NEXUS — 3 manches ═══', 'win');
  let victories = 0;
  for (let i = 1; i <= 3; i++) {
    logLine(logEl, `── Manche ${i}/3 ──`);
    const won = await startBattle(i === 3, true);
    if (!won) break;
    victories++;
    await sleep(600);
  }
  if (victories === 3) {
    const bonus = 200;
    state.gold += bonus;
    state.badges++;
    logLine(logEl, `👑 CHAMPION DU TOURNOI ! +${bonus} or, +1 badge !`, 'win');
    toast('👑 CHAMPION DU TOURNOI !', 'evo');
  } else {
    logLine(logEl, `Tournoi terminé : ${victories}/3 manches gagnées.`);
  }
  save();
  refreshAll();
}

function applyXpSilent(c, amount) {
  const before = speciesOf(c).name;
  const res = gainXp(c, amount);
  if (res.evolved) {
    const sp = SPECIES_BY_ID[res.evolved];
    toast(`✨ ${before} évolue en ${sp.emoji} ${sp.name} !`, 'evo');
  }
}

function updateArena(snap, hitSide) {
  for (const [side, data] of [['player', snap.player], ['enemy', snap.enemy]]) {
    const el = $('#fighter-' + side);
    el.querySelector('.fighter-name').textContent = `${data.name} (niv. ${data.level})`;
    el.querySelector('.fighter-sprite').textContent = data.emoji;
    const pct = Math.max(0, Math.round((data.hp / data.max) * 100));
    el.querySelector('.hpfill').style.width = pct + '%';
  }
  if (hitSide) {
    const sprite = $('#fighter-' + hitSide + ' .fighter-sprite');
    sprite.classList.remove('hit');
    void sprite.offsetWidth; // force reflow pour relancer l'anim
    sprite.classList.add('hit');
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─────────── Boutique ───────────
function buyItem(item, price) {
  if (state.gold < price) return toast('🪙 Pas assez d\'or ! Gagne des combats.');
  state.gold -= price;
  item.apply();
  toast(`${item.ico} ${item.name} acheté !`);
  save();
  refreshAll();
}

// ─────────── Boucle de jeu (tick 1 s) ───────────
function refreshAll() {
  renderResources();
  renderTeam(selectCreature);
  renderDex();
  renderShop(buyItem);
  renderEventBanner();
}

setInterval(() => {
  tickEnergy();
  const ev = tickEvents();
  if (ev) {
    renderEventBanner(ev.title);
    toast(ev.title);
  } else {
    renderEventBanner();
  }
  renderResources();
}, 1000);

// Sauvegarde régulière + au départ
setInterval(save, 15000);
window.addEventListener('beforeunload', save);

refreshAll();
