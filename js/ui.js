// ═══════════ Rendu de l'interface ═══════════
import { SPECIES, SPECIES_BY_ID, TYPE_LABEL, TYPE_EMOJI, ZONES, STARTERS } from './data.js';
import {
  state, speciesOf, maxHp, atkOf, defOf, spdOf, xpToNext, activeCreature,
} from './state.js';
import { activeEffects, shopSaleActive } from './events.js';
import { showSpecies } from './creature3d.js';

const $ = (sel) => document.querySelector(sel);

// ─── Ressources (header) ───
export function renderResources() {
  $('#res-gold').textContent = state.gold;
  $('#res-energy').textContent = Math.floor(state.energy);
  $('#res-capsules').textContent = state.capsules;
  $('#res-badges').textContent = state.badges;
}

// ─── Équipe ───
export function renderTeam(onSelect) {
  const list = $('#team-list');
  list.innerHTML = '';
  for (const c of state.team) list.appendChild(creatureCard(c, onSelect));

  const boxList = $('#box-list');
  boxList.innerHTML = '';
  $('#box-title').classList.toggle('hidden', state.box.length === 0);
  for (const c of state.box) boxList.appendChild(creatureCard(c, onSelect));

  renderViewerInfo();
  $('#potion-count').textContent = `(×${state.potions})`;
  $('#candy-count').textContent = `(×${state.candies})`;
}

function creatureCard(c, onSelect) {
  const sp = speciesOf(c);
  const div = document.createElement('div');
  div.className = 'creature-card' + (c.uid === state.activeUid ? ' selected' : '');
  const xpPct = Math.min(100, Math.round((c.xp / xpToNext(c)) * 100));
  const hpPct = Math.round((c.hp / maxHp(c)) * 100);
  div.innerHTML = `
    <div class="emoji">${sp.emoji}</div>
    <div class="info">
      <div class="name">${sp.name} <span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span></div>
      <div class="meta">Niv. ${c.level} — <span class="hpmini" style="color:${hpPct > 50 ? 'var(--green)' : hpPct > 20 ? 'var(--accent)' : 'var(--red)'}">PV ${c.hp}/${maxHp(c)}</span></div>
      <div class="xpbar"><div class="xpfill" style="width:${xpPct}%"></div></div>
    </div>`;
  div.addEventListener('click', () => onSelect(c.uid));
  return div;
}

export function renderViewerInfo() {
  const c = activeCreature();
  const info = $('#viewer-info');
  if (!c) { info.innerHTML = '<em>Aucune créature</em>'; return; }
  const sp = speciesOf(c);
  showSpecies(sp.id);
  const evoTxt = sp.evolvesTo
    ? `Évolue en <b>${SPECIES_BY_ID[sp.evolvesTo].name}</b> au niv. ${sp.evolveLevel}`
    : '⭐ Forme finale';
  info.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <b style="font-size:1.15rem">${sp.emoji} ${sp.name}</b>
        <span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span>
      </div>
      <b>Niv. ${c.level}</b>
    </div>
    <div style="color:var(--muted);font-size:0.85rem;margin:6px 0">${sp.desc}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;font-size:0.85rem">
      <div>❤️ ${c.hp}/${maxHp(c)}</div>
      <div>⚔️ ${atkOf(c)}</div>
      <div>🛡️ ${defOf(c)}</div>
      <div>💨 ${spdOf(c)}</div>
    </div>
    <div style="color:var(--accent);font-size:0.8rem;margin-top:6px">${evoTxt} — XP ${c.xp}/${xpToNext(c)}</div>`;
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
      <div class="dex-num">#${String(i + 1).padStart(3, '0')}</div>
      <div class="dex-emoji">${status ? sp.emoji : '❓'}</div>
      <div class="dex-name">${status ? sp.name : '???'}</div>
      ${status ? `<span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span>` : ''}
      <div class="dex-status">${status === 'caught' ? '✅ Capturé' : status === 'seen' ? '👁️ Vu' : 'Non découvert'}</div>`;
    if (status) card.title = sp.desc;
    grid.appendChild(card);
  });
  $('#dex-progress').textContent = `${discovered}/${SPECIES.length}`;
}

// ─── Zones d'exploration ───
export function renderZones(onExplore) {
  const wrap = $('#explore-zones');
  wrap.innerHTML = '';
  for (const z of ZONES) {
    const card = document.createElement('div');
    card.className = 'zone-card';
    card.innerHTML = `
      <div class="zone-ico">${z.ico}</div>
      <h3>${z.name}</h3>
      <p>${z.desc}</p>
      <p>${z.types.map((t) => TYPE_EMOJI[t]).join(' ')}</p>`;
    card.addEventListener('click', () => onExplore(z));
    wrap.appendChild(card);
  }
}

// ─── Boutique ───
export const SHOP_ITEMS = [
  { id: 'capsule', ico: '🔴', name: 'Capsule', desc: 'Indispensable pour capturer une créature sauvage.', price: 50, apply: () => { state.capsules++; } },
  { id: 'potion', ico: '🧪', name: 'Potion', desc: 'Restaure tous les PV d\'une créature.', price: 30, apply: () => { state.potions++; } },
  { id: 'candy', ico: '🍬', name: 'Bonbon XP', desc: 'Donne +60 XP à la créature sélectionnée.', price: 80, apply: () => { state.candies++; } },
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
      <div class="price">${sale ? `<span class="old">${item.price}</span>` : ''}🪙 ${price}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn primary';
    btn.textContent = 'Acheter';
    btn.disabled = state.gold < price;
    btn.addEventListener('click', () => onBuy(item, price));
    card.appendChild(btn);
    grid.appendChild(card);
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
      <div class="emoji">${sp.emoji}</div>
      <h3>${sp.name}</h3>
      <span class="type-badge type-${sp.type}">${TYPE_LABEL[sp.type]}</span>
      <p style="color:var(--muted);font-size:0.8rem;margin-top:8px">${sp.desc}</p>`;
    card.addEventListener('click', () => onChoose(id));
    wrap.appendChild(card);
  }
  $('#starter-screen').classList.remove('hidden');
}

export function hideStarterScreen() { $('#starter-screen').classList.add('hidden'); }

// ─── Bandeau événement + effets actifs ───
export function renderEventBanner(text) {
  const b = $('#event-banner');
  if (text) {
    b.textContent = text;
    b.classList.remove('hidden');
  } else {
    const fx = activeEffects();
    if (fx.length) {
      b.textContent = 'Effets actifs : ' + fx.join(' · ');
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
