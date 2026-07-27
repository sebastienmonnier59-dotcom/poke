// ═══════════ Rendu de l'interface ═══════════
import { SPECIES, SPECIES_BY_ID, TYPE_LABEL, ZONES, STARTERS } from './data.js';
import {
  state, speciesOf, maxHp, atkOf, defOf, spdOf, xpToNext, activeCreature, movesOf,
  ENERGY_MAX,
} from './state.js';
import { activeEffects, shopSaleActive } from './events.js';
import { showSpecies, getThumb } from './creature3d.js';
import { ACHIEVEMENTS, questDef } from './quests.js';

const $ = (sel) => document.querySelector(sel);

// ─── Ressources (header) ───
export function renderResources() {
  $('#res-gold').textContent = state.gold;
  $('#res-energy').textContent = Math.floor(state.energy);
  $('#energy-fill').style.width = (state.energy / ENERGY_MAX) * 100 + '%';
  $('#res-capsules').textContent = state.capsules;
  $('#res-badges').textContent = state.badges;
  $('#btn-mute').classList.toggle('on', !state.muted);
  $('#btn-mute').textContent = state.muted ? '✕' : '♪';
}

// ─── Équipe ───
export function renderTeam(onSelect, updateStage = true) {
  const list = $('#team-list');
  list.innerHTML = '';
  for (const c of state.team) list.appendChild(creatureCard(c, onSelect));

  const boxList = $('#box-list');
  boxList.innerHTML = '';
  $('#box-title').classList.toggle('hidden', state.box.length === 0);
  for (const c of state.box) boxList.appendChild(creatureCard(c, onSelect));

  renderCreaturePlate(updateStage);
  $('#potion-count').textContent = `× ${state.potions}`;
  $('#candy-count').textContent = `× ${state.candies}`;
}

function creatureCard(c, onSelect) {
  const sp = speciesOf(c);
  const div = document.createElement('div');
  div.className = 'creature-card' + (c.uid === state.activeUid ? ' selected' : '');
  const xpPct = Math.min(100, Math.round((c.xp / xpToNext(c)) * 100));
  const hpPct = Math.round((c.hp / maxHp(c)) * 100);
  div.innerHTML = `
    ${c.shiny ? '<span class="shiny-star">★</span>' : ''}
    <div class="thumb"><img src="${getThumb(sp.id, c.shiny)}" alt="${sp.name}"></div>
    <div class="info">
      <div class="name">${sp.name}</div>
      <div class="meta">NIV ${c.level} · <span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span></div>
      <div class="hpmini-bar"><div class="hpmini-fill" style="width:${hpPct}%; background:${hpPct > 50 ? 'var(--green)' : hpPct > 20 ? 'var(--gold)' : 'var(--magenta)'}"></div></div>
      <div class="xpbar"><div class="xpfill" style="width:${xpPct}%"></div></div>
    </div>`;
  div.addEventListener('click', () => onSelect(c.uid));
  return div;
}

export function renderCreaturePlate(updateStage = true) {
  const c = activeCreature();
  const plate = $('#creature-plate');
  if (!c) { plate.innerHTML = '<em>Aucune créature</em>'; return; }
  const sp = speciesOf(c);
  if (updateStage) showSpecies(sp.id, c.shiny); // jamais pendant un combat : ça détruirait la scène
  const evoTxt = sp.evolvesTo
    ? `Évolution → ${SPECIES_BY_ID[sp.evolvesTo].name} · NIV ${sp.evolveLevel}`
    : '★ Forme finale';
  const moves = movesOf(c).map((m) => m.name).join(' · ');
  plate.innerHTML = `
    <div class="cp-head">
      <span class="cp-name">${c.shiny ? '<span style="color:var(--gold)">★</span> ' : ''}${sp.name}
        <span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span></span>
      <span class="cp-lv">NIV ${c.level}</span>
    </div>
    <div class="cp-desc">${sp.desc}</div>
    <div class="cp-stats">
      <div><b>PV</b>${c.hp}/${maxHp(c)}</div>
      <div><b>ATQ</b>${atkOf(c)}</div>
      <div><b>DÉF</b>${defOf(c)}</div>
      <div><b>VIT</b>${spdOf(c)}</div>
    </div>
    <div class="xpbar"><div class="xpfill" style="width:${Math.min(100, (c.xp / xpToNext(c)) * 100)}%"></div></div>
    <div class="cp-evo">${evoTxt} — Attaques : ${moves}</div>`;
}

// ─── Pokédex ───
export function renderDex() {
  const grid = $('#dex-grid');
  grid.innerHTML = '';
  let discovered = 0;
  SPECIES.forEach((sp, i) => {
    const status = state.dex[sp.id];
    if (status) discovered++;
    const card = document.createElement('div');
    card.className = 'dex-card ' + (status === 'caught' ? 'caught' : status === 'seen' ? 'seen' : 'unknown');
    card.innerHTML = `
      <div class="dex-thumb"><img src="${getThumb(sp.id)}" alt=""></div>
      <div class="dex-num">N° ${String(i + 1).padStart(3, '0')}</div>
      <div class="dex-name">${status ? sp.name : '???'}</div>
      ${status ? `<span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span>` : ''}
      <div class="dex-status">${status === 'caught' ? '● Capturé' : status === 'seen' ? '◐ Vu' : '○ Inconnu'}</div>`;
    if (status) card.title = sp.desc;
    grid.appendChild(card);
  });
  $('#dex-progress').textContent = `${discovered} / ${SPECIES.length}`;
}

// ─── Zones d'exploration ───
export function renderZones(onExplore) {
  const wrap = $('#explore-zones');
  wrap.innerHTML = '';
  for (const z of ZONES) {
    const card = document.createElement('div');
    card.className = 'zone-card';
    card.style.setProperty('--zone-grad', `linear-gradient(135deg, ${z.grad[0]}, ${z.grad[1]})`);
    card.innerHTML = `
      <div class="zone-ico">${z.ico}</div>
      <h3>${z.name}</h3>
      <p>${z.desc}</p>
      <div class="zone-types">${z.types.map((t) => `<span class="type-badge type-${t}">${TYPE_LABEL[t]}</span>`).join('')}</div>`;
    card.addEventListener('click', () => onExplore(z));
    wrap.appendChild(card);
  }
}

// ─── Boutique ───
export const SHOP_ITEMS = [
  { id: 'capsule', ico: '◉', name: 'Capsule', desc: 'Indispensable pour capturer une créature sauvage.', price: 50, apply: () => { state.capsules++; } },
  { id: 'potion', ico: '✚', name: 'Potion', desc: 'Restaure tous les PV d\'une créature.', price: 30, apply: () => { state.potions++; } },
  { id: 'candy', ico: '❖', name: 'Bonbon XP', desc: 'Donne +60 XP à la créature sélectionnée.', price: 80, apply: () => { state.candies++; } },
  { id: 'energy', ico: '⚡', name: 'Boisson tonique', desc: '+40 énergie immédiatement.', price: 60, apply: () => { state.energy = Math.min(100, state.energy + 40); } },
];

export function renderShop(onBuy) {
  const grid = $('#shop-grid');
  grid.innerHTML = '';
  const sale = shopSaleActive();
  $('#shop-sale-badge').classList.toggle('hidden', !sale);
  for (const item of SHOP_ITEMS) {
    const price = sale ? Math.ceil(item.price / 2) : item.price;
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="shop-ico">${item.ico}</div>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="price">${sale ? `<span class="old">${item.price}</span>` : ''}◆ ${price}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn primary';
    btn.textContent = 'Acheter';
    btn.disabled = state.gold < price;
    btn.addEventListener('click', () => onBuy(item, price));
    card.appendChild(btn);
    grid.appendChild(card);
  }
}

// ─── Missions & succès ───
export function renderMissions(onClaim) {
  const list = $('#daily-list');
  list.innerHTML = '';
  let claimable = false;
  for (const q of state.daily.quests) {
    const def = questDef(q.id);
    const done = q.progress >= def.goal;
    if (done && !q.claimed) claimable = true;
    const card = document.createElement('div');
    card.className = 'quest-card' + (done ? ' done' : '');
    const rewardTxt = Object.entries(def.reward).map(([k, v]) =>
      k === 'gold' ? `◆ ${v}` : k === 'capsules' ? `● ${v} capsules` : `❖ ${v} bonbon`).join(' + ');
    card.innerHTML = `
      <div class="q-info">
        <div class="q-desc">${def.desc}</div>
        <div class="q-bar"><div class="q-fill" style="width:${(q.progress / def.goal) * 100}%"></div></div>
        <div class="q-prog">${q.progress} / ${def.goal}</div>
      </div>
      <div class="q-reward">${rewardTxt}</div>`;
    if (done && !q.claimed) {
      const btn = document.createElement('button');
      btn.className = 'btn gold';
      btn.textContent = 'Réclamer';
      btn.addEventListener('click', () => onClaim(q.id));
      card.appendChild(btn);
    } else if (q.claimed) {
      const ok = document.createElement('span');
      ok.style.color = 'var(--green)';
      ok.textContent = '✓';
      card.appendChild(ok);
    }
    list.appendChild(card);
  }
  $('#quest-dot').classList.toggle('hidden', !claimable);

  // Succès
  const grid = $('#ach-grid');
  grid.innerHTML = '';
  for (const a of ACHIEVEMENTS) {
    const unlocked = !!state.ach[a.id];
    const card = document.createElement('div');
    card.className = 'ach-card' + (unlocked ? ' unlocked' : '');
    card.innerHTML = `
      <div class="a-ico">${a.ico}</div>
      <div>
        <div class="a-name">${a.name}</div>
        <div class="a-desc">${a.desc}${a.reward ? ` · ◆ ${a.reward}` : ''}</div>
      </div>`;
    grid.appendChild(card);
  }

  // Profil
  const stats = $('#profile-stats');
  stats.innerHTML = '';
  const tiles = [
    [state.wins, 'Victoires'], [state.losses, 'Défaites'], [state.captures, 'Captures'],
    [state.badges, 'Badges'], [state.tournaments, 'Tournois gagnés'], [state.shinies, 'Shiny trouvés'],
    [Object.keys(state.dex).length + ' / 24', 'Pokédex'], [state.trainings, 'Entraînements'],
  ];
  for (const [v, label] of tiles) {
    const t = document.createElement('div');
    t.className = 'stat-tile';
    t.innerHTML = `<b>${v}</b><span>${label}</span>`;
    stats.appendChild(t);
  }
}

// ─── Écran starter ───
export function renderStarterScreen(onChoose) {
  const wrap = $('#starter-choices');
  wrap.innerHTML = '';
  for (const id of STARTERS) {
    const sp = SPECIES_BY_ID[id];
    const card = document.createElement('div');
    card.className = 'starter-card';
    card.innerHTML = `
      <div class="st-thumb"><img src="${getThumb(sp.id)}" alt="${sp.name}"></div>
      <h3>${sp.name}</h3>
      <span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span>
      <p>${sp.desc}</p>`;
    card.addEventListener('click', () => onChoose(id));
    wrap.appendChild(card);
  }
  $('#starter-screen').classList.remove('hidden');
}

export function hideStarterScreen() { $('#starter-screen').classList.add('hidden'); }

// ─── Bandeau événement ───
export function renderEventBanner(text) {
  const b = $('#event-banner');
  if (text) {
    b.textContent = text;
    b.classList.remove('hidden');
  } else {
    const fx = activeEffects();
    if (fx.length) {
      b.textContent = 'EFFETS ACTIFS — ' + fx.join(' · ');
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  }
}

// ─── Toasts ───
export function toast(msg, cls = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + cls;
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// ─── Log helpers ───
export function logLine(el, text, cls) {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}
