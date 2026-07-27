// ═══════════ PokéManager Arena — orchestration ═══════════
import { SPECIES, SPECIES_BY_ID, TYPE_LABEL } from './data.js';
import {
  state, load, save, resetSave, makeCreature, addCreature, activeCreature, speciesOf,
  gainXp, maxHp, spendEnergy, tickEnergy, registerDex, movesOf,
} from './state.js';
import {
  initStage, moveStageTo, resize, showSpecies, setupBattle, switchBattler,
  playAttack, playKO, endBattleScene, screenPosOf, getThumb,
} from './creature3d.js';
import { Battle, autoPickMove, typeMultiplier } from './battle.js';
import { buildNexusTeam, nexusPickMove, generateTaunt, generateVictoryLine, generateDefeatLine } from './ai.js';
import { tickEvents, rareBoostActive } from './events.js';
import { ensureDaily, bumpQuest, claimQuest, checkAchievements, questDef } from './quests.js';
import { sfx, initAudio } from './sfx.js';
import {
  renderResources, renderTeam, renderDex, renderZones, renderShop, renderMissions,
  renderStarterScreen, hideStarterScreen, renderEventBanner, renderCreaturePlate,
  toast, logLine,
} from './ui.js';

const $ = (sel) => document.querySelector(sel);

// ─────────── Initialisation ───────────
const hadSave = load();
ensureDaily();
initAudio();
initStage($('#stage-slot-team'));

if (!state.starterChosen) {
  renderStarterScreen((speciesId) => {
    sfx.capture();
    const c = makeCreature(speciesId, 5);
    state.activeUid = c.uid;
    addCreature(c);
    state.starterChosen = true;
    hideStarterScreen();
    toast(`${SPECIES_BY_ID[speciesId].name} rejoint ton escouade !`);
    save();
    refreshAll();
  });
} else if (hadSave) {
  toast('Partie chargée — ton énergie s\'est régénérée pendant ton absence.');
}

// ─────────── Navigation ───────────
let currentTab = 'team';
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    sfx.click();
    currentTab = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    $('#panel-' + currentTab).classList.add('active');
    // La scène 3D suit l'onglet (équipe ↔ arène)
    if (currentTab === 'team') {
      moveStageTo($('#stage-slot-team'));
      if (!battleActive) { const c = activeCreature(); if (c) showSpecies(c.speciesId, c.shiny); }
    } else if (currentTab === 'battle') {
      moveStageTo($('#stage-slot-battle'));
    }
    refreshAll();
  });
});

// ─────────── Sélection créature ───────────
function selectCreature(uid) {
  sfx.click();
  state.activeUid = uid;
  renderTeam(selectCreature);
  save();
}

// ─────────── Son ───────────
$('#btn-mute').addEventListener('click', () => {
  state.muted = !state.muted;
  save();
  renderResources();
});

// ─────────── Entraînement / objets ───────────
$('#btn-train').addEventListener('click', () => {
  const c = activeCreature();
  if (!c) return toast('Choisis d\'abord une créature.');
  if (!spendEnergy(10)) return toast('Pas assez d\'énergie — elle se régénère avec le temps.');
  state.trainings++;
  const done = bumpQuest('train');
  if (done) toast(`Mission accomplie : ${done.desc} !`, 'quest');
  applyXp(c, 15 + c.level * 2, 'Entraînement');
  save();
  refreshAll();
});

$('#btn-heal').addEventListener('click', () => {
  const c = activeCreature();
  if (!c) return;
  if (state.potions <= 0) return toast('Plus de potions — direction la boutique.');
  if (c.hp >= maxHp(c)) return toast(`${speciesOf(c).name} est déjà en pleine forme.`);
  state.potions--;
  c.hp = maxHp(c);
  sfx.levelup();
  toast(`${speciesOf(c).name} récupère tous ses PV.`);
  save();
  refreshAll();
});

$('#btn-candy').addEventListener('click', () => {
  const c = activeCreature();
  if (!c) return;
  if (state.candies <= 0) return toast('Plus de bonbons — direction la boutique.');
  state.candies--;
  applyXp(c, 60, 'Bonbon');
  save();
  refreshAll();
});

function applyXp(c, amount, label) {
  const before = speciesOf(c).name;
  const res = gainXp(c, amount);
  if (res.evolved) {
    const sp = SPECIES_BY_ID[res.evolved];
    sfx.evolve();
    toast(`✦ ${before} évolue en ${sp.name} !`, 'evo');
    if (c.uid === state.activeUid && currentTab === 'team') showSpecies(sp.id, c.shiny);
  } else if (res.levels > 0) {
    sfx.levelup();
    toast(`${speciesOf(c).name} passe NIV ${c.level}.`);
  } else {
    toast(`${label} : +${amount} XP pour ${speciesOf(c).name}.`);
  }
  const newAch = checkAchievements();
  for (const a of newAch) toast(`Succès débloqué : ${a.ico} ${a.name} !`, 'quest');
}

// ─────────── Exploration ───────────
let currentEncounter = null;

renderZones((zone) => {
  if (currentEncounter) return toast('Termine d\'abord la rencontre en cours.');
  if (!spendEnergy(20)) return toast('Pas assez d\'énergie pour explorer.');
  sfx.click();
  state.explorations++;
  const doneQ = bumpQuest('explore');
  if (doneQ) toast(`Mission accomplie : ${doneQ.desc} !`, 'quest');

  let pool = SPECIES.filter((s) => zone.types.includes(s.type));
  const rare = rareBoostActive();
  const weighted = [];
  for (const sp of pool) {
    const w = rare ? sp.rarity * 2 : Math.max(1, 10 - sp.rarity * 2 - sp.stage * 2);
    for (let i = 0; i < w; i++) weighted.push(sp);
  }
  const sp = weighted[Math.floor(Math.random() * weighted.length)];
  const avgLvl = state.team.length
    ? Math.round(state.team.reduce((s, c) => s + c.level, 0) / state.team.length) : 3;
  const level = Math.max(1, avgLvl + Math.floor(Math.random() * 5) - 2);
  const shinyBoost = rare ? 2 : 1;

  currentEncounter = { speciesId: sp.id, level, shinyBoost };
  registerDex(sp.id, 'seen');
  showEncounter(sp, level, zone);
  logLine($('#explore-log'), `${zone.name} — un ${sp.name} sauvage (NIV ${level}) apparaît !`);
  save();
  refreshAll();
});

function captureChance(sp, level) {
  const avgLvl = state.team.length
    ? state.team.reduce((s, c) => s + c.level, 0) / state.team.length : 5;
  let chance = 0.7 - (level - avgLvl) * 0.05 - (sp.rarity - 1) * 0.08 - (sp.stage - 1) * 0.1;
  return Math.max(0.15, Math.min(0.95, chance));
}

function showEncounter(sp, level) {
  const box = $('#encounter-box');
  box.classList.remove('hidden');
  const pct = Math.round(captureChance(sp, level) * 100);
  box.innerHTML = `
    <div class="enc-thumb"><img src="${getThumb(sp.id)}" alt="${sp.name}"></div>
    <div style="flex:1">
      <h3>${sp.name} sauvage <span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span></h3>
      <div class="enc-sub">NIV ${level} — ${sp.desc}</div>
      <div class="enc-actions">
        <button class="btn primary" id="btn-capture">Capturer<small>1 capsule · <span class="enc-chance">${pct} %</span></small></button>
        <button class="btn" id="btn-flee">Fuir</button>
      </div>
    </div>`;
  $('#btn-capture').addEventListener('click', tryCapture);
  $('#btn-flee').addEventListener('click', () => {
    sfx.click();
    logLine($('#explore-log'), `Tu prends la fuite — ${sp.name} disparaît.`);
    endEncounter();
  });
}

function tryCapture() {
  if (!currentEncounter) return;
  if (state.capsules <= 0) return toast('Plus de capsules — direction la boutique.');
  state.capsules--;
  const sp = SPECIES_BY_ID[currentEncounter.speciesId];
  const chance = captureChance(sp, currentEncounter.level);

  if (Math.random() < chance) {
    const c = makeCreature(currentEncounter.speciesId, currentEncounter.level, currentEncounter.shinyBoost);
    const where = addCreature(c);
    if (!state.activeUid) state.activeUid = c.uid;
    state.captures++;
    sfx.capture();
    const doneQ = bumpQuest('capture');
    if (doneQ) toast(`Mission accomplie : ${doneQ.desc} !`, 'quest');
    logLine($('#explore-log'), `● ${sp.name} capturé !${c.shiny ? ' ★ C\'EST UN SHINY !' : ''} ${where === 'box' ? '(envoyé en réserve — escouade pleine)' : ''}`, 'win');
    toast(c.shiny ? `★ SHINY ! ${sp.name} chromatique capturé !` : `${sp.name} capturé !`, 'evo');
    const newAch = checkAchievements();
    for (const a of newAch) toast(`Succès débloqué : ${a.ico} ${a.name} !`, 'quest');
    endEncounter();
  } else {
    sfx.fail();
    logLine($('#explore-log'), `${sp.name} s'est échappé de la capsule !`, 'lose');
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

// ─────────── Arène : combat interactif ───────────
$('#nexus-taunt').textContent = generateTaunt();

let battle = null;
let battleActive = false;
let tournament = null; // { round, total }
let stepQueue = Promise.resolve();

$('#btn-fight').addEventListener('click', () => beginBattle(false));
$('#btn-tournament').addEventListener('click', () => {
  if (battleActive) return;
  if (!spendEnergy(40)) return toast('Il faut 40 énergie pour un tournoi.');
  tournament = { round: 1, total: 3 };
  beginBattle(false, true);
});
$('#auto-battle').addEventListener('change', () => { if (battleActive) maybeAutoPlay(); });

function beginBattle(hard, isTournament = false) {
  if (battleActive) return;
  const fighters = state.team.filter((c) => c.hp > 0);
  if (!fighters.length) { toast('Toutes tes créatures sont K.O. — soigne-les d\'abord.'); return; }
  if (!isTournament && !tournament && !spendEnergy(15)) { toast('Pas assez d\'énergie.'); return; }

  const hardRound = tournament ? tournament.round === 3 : hard;
  const enemyTeam = buildNexusTeam(hardRound);
  for (const e of enemyTeam) registerDex(e.speciesId, 'seen');

  battle = new Battle(fighters, enemyTeam);
  battleActive = true;

  $('#battle-lobby').classList.add('hidden');
  $('#battle-view').classList.remove('hidden');
  $('#battle-ticker').innerHTML = '';
  moveStageTo($('#stage-slot-battle'));
  resize();

  const s = battle.snap();
  setupBattle(s.p.speciesId, s.p.shiny, s.e.speciesId);
  updatePlates(s);
  renderMoveButtons();
  ticker(tournament ? `— Tournoi · manche ${tournament.round}/${tournament.total} —` : '— Le combat commence —');
  maybeAutoPlay();
}

function renderMoveButtons() {
  const wrap = $('#move-buttons');
  wrap.innerHTML = '';
  if (!battle || battle.over) return;
  const moves = movesOf(battle.pA.ref);
  const enemyType = speciesOf(battle.eA.ref).type;
  for (const m of moves) {
    const mult = typeMultiplier(m.type, enemyType);
    const hint = mult > 1 ? ' ▲' : mult < 1 ? ' ▽' : '';
    const btn = document.createElement('button');
    btn.className = 'move-btn';
    btn.innerHTML = `<span>${m.name}${hint}</span>
      <span class="mv-pow"><span class="type-badge type-${m.type}">${m.type === 'normal' ? 'Normal' : TYPE_LABEL[m.type]}</span> ${m.power}</span>`;
    btn.addEventListener('click', () => playRound(m));
    wrap.appendChild(btn);
  }
}

function setMoveButtonsEnabled(on) {
  document.querySelectorAll('.move-btn').forEach((b) => { b.disabled = !on; });
}

function playRound(move) {
  if (!battle || battle.over) return;
  setMoveButtonsEnabled(false);
  const steps = battle.round(move, nexusPickMove);
  stepQueue = stepQueue.then(() => animateSteps(steps));
}

async function animateSteps(steps) {
  for (const st of steps) {
    if (st.type === 'attack') {
      const side = st.side;
      await playAttack(side, st.move.type, () => {
        if (st.crit) sfx.crit(); else if (st.mult > 1) sfx.super(); else sfx.hit();
        floatDamage(side === 'p' ? 'e' : 'p', st.dmg, st.crit, st.mult);
        updatePlates(st.snap);
      });
      let txt = `${st.side === 'p' ? '' : 'NEXUS · '}${st.move.name} — ${st.dmg} dégâts`;
      if (st.mult > 1) txt += ' · super efficace';
      if (st.mult < 1) txt += ' · peu efficace';
      if (st.crit) txt += ' · CRITIQUE';
      ticker(txt, st.crit ? 'crit' : undefined);
      if (st.ko) {
        sfx.ko();
        await playKO(st.side === 'p' ? 'e' : 'p');
        ticker('K.O. !');
      }
      await wait(240);
    } else if (st.type === 'switch') {
      switchBattler(st.side, st.speciesId, st.shiny);
      updatePlates(st.snap);
      if (st.side === 'p') renderMoveButtons();
      ticker(st.side === 'p' ? 'À toi de jouer !' : 'NEXUS envoie sa créature suivante.');
      await wait(420);
    } else if (st.type === 'end') {
      await finishBattle(st.winner);
      return;
    }
  }
  renderMoveButtons();
  setMoveButtonsEnabled(true);
  renderTeam(selectCreature);
  maybeAutoPlay();
}

function maybeAutoPlay() {
  if (!battleActive || !battle || battle.over) return;
  if (!$('#auto-battle').checked) return;
  setTimeout(() => {
    if (!battleActive || !battle || battle.over) return;
    const m = autoPickMove(battle.pA.ref, speciesOf(battle.eA.ref).type);
    playRound(m);
  }, 550);
}

async function finishBattle(winner) {
  const enemyLvls = battle.e.map((f) => f.ref.level);
  const avgEnemyLvl = Math.round(enemyLvls.reduce((a, b) => a + b, 0) / enemyLvls.length);
  const fighters = battle.p.map((f) => f.ref);

  if (winner === 'player') {
    sfx.win();
    const inTournament = !!tournament;
    const gold = 25 + avgEnemyLvl * 4 + (inTournament ? 20 : 0);
    const xp = 20 + avgEnemyLvl * 3;
    state.gold += gold;
    state.wins++;
    ticker(`VICTOIRE — +${gold} or · +${xp} XP pour l'escouade`, 'win');
    for (const c of fighters) {
      const res = gainXp(c, xp);
      if (res.evolved) {
        sfx.evolve();
        toast(`✦ Évolution : ${SPECIES_BY_ID[res.evolved].name} !`, 'evo');
      }
    }
    const doneQ = bumpQuest('win');
    if (doneQ) toast(`Mission accomplie : ${doneQ.desc} !`, 'quest');
    if (!inTournament && Math.random() < 0.15) { state.badges++; ticker('NEXUS te concède un badge ★', 'win'); }
    ticker(`NEXUS // ${generateDefeatLine()}`);

    if (tournament && tournament.round < tournament.total) {
      tournament.round++;
      save();
      await wait(1400);
      battleActive = false;
      beginBattle(false, true);
      return;
    }
    if (tournament) {
      state.gold += 200;
      state.badges++;
      state.tournaments++;
      toast('★ CHAMPION DU TOURNOI ! +200 or, +1 badge !', 'evo');
      ticker('CHAMPION DU TOURNOI — +200 or · +1 badge', 'win');
      tournament = null;
    }
  } else {
    sfx.lose();
    const gold = 5 + Math.floor(avgEnemyLvl);
    state.gold += gold;
    state.losses++;
    tournament = null;
    ticker(`Défaite — +${gold} or de consolation. Entraîne-toi et reviens.`, 'lose');
    ticker(`NEXUS // ${generateVictoryLine()}`);
  }

  const newAch = checkAchievements();
  for (const a of newAch) toast(`Succès débloqué : ${a.ico} ${a.name} !`, 'quest');

  save();
  battleActive = false;
  battle = null;
  await wait(2000);
  endBattleScene();
  $('#battle-view').classList.add('hidden');
  $('#battle-lobby').classList.remove('hidden');
  $('#nexus-taunt').textContent = generateTaunt();
  if (currentTab === 'team') moveStageTo($('#stage-slot-team'));
  const c = activeCreature();
  if (c) showSpecies(c.speciesId, c.shiny);
  refreshAll();
}

function updatePlates(snap) {
  for (const [side, data] of [['p', snap.p], ['e', snap.e]]) {
    if (!data) continue;
    const el = $('#plate-' + side);
    el.querySelector('.plate-name').textContent = (data.shiny ? '★ ' : '') + data.name;
    el.querySelector('.plate-lv').textContent = 'NIV ' + data.level + ' · ' + TYPE_LABEL[data.type].toUpperCase();
    const pct = Math.max(0, (data.hp / data.max) * 100);
    el.querySelector('.hpfill').style.width = pct + '%';
    el.querySelector('.plate-hp').textContent = `${data.hp} / ${data.max}`;
  }
}

function floatDamage(targetSide, dmg, crit, mult) {
  const pos = screenPosOf(targetSide);
  const el = document.createElement('div');
  el.className = 'dmg-float' + (crit ? ' crit' : mult > 1 ? ' super' : mult < 1 ? ' weak' : '');
  el.style.left = pos.x + 'px';
  el.style.top = pos.y + 'px';
  el.textContent = '−' + dmg;
  $('#fx-layer').appendChild(el);
  setTimeout(() => el.remove(), 950);
}

function ticker(text, cls) {
  const t = $('#battle-ticker');
  const line = document.createElement('div');
  line.className = 't-line' + (cls ? ' ' + cls : '');
  line.textContent = text;
  t.prepend(line);
  while (t.children.length > 4) t.lastChild.remove();
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─────────── Boutique ───────────
function buyItem(item, price) {
  if (state.gold < price) return toast('Pas assez d\'or — gagne des combats.');
  state.gold -= price;
  item.apply();
  sfx.coin();
  toast(`${item.name} acheté.`);
  save();
  refreshAll();
}

// ─────────── Missions ───────────
function onClaimQuest(id) {
  const reward = claimQuest(id);
  if (reward) {
    sfx.coin();
    toast('Récompense réclamée !', 'quest');
    refreshAll();
  }
}

$('#btn-reset').addEventListener('click', () => {
  if (confirm('Recommencer une partie ? Ta sauvegarde sera effacée.')) resetSave();
});

// ─────────── Boucle de jeu ───────────
function refreshAll() {
  renderResources();
  renderTeam(selectCreature);
  renderDex();
  renderShop(buyItem);
  renderMissions(onClaimQuest);
  renderEventBanner();
  $('#battle-record').textContent = `Bilan : ${state.wins} V — ${state.losses} D · Badges ★ ${state.badges}`;
}

setInterval(() => {
  tickEnergy();
  ensureDaily();
  const ev = tickEvents();
  if (ev) {
    renderEventBanner(ev.title);
    toast(ev.title);
  } else {
    renderEventBanner();
  }
  renderResources();
}, 1000);

setInterval(save, 15000);
window.addEventListener('beforeunload', save);

refreshAll();
