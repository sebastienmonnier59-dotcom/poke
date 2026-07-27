// ═══════════ Moteur de combat interactif tour par tour ═══════════
import { TYPE_CHART } from './data.js';
import { speciesOf, maxHp, atkOf, defOf, spdOf, movesOf } from './state.js';

export function typeMultiplier(attType, defType) {
  if (attType === 'normal') return 1;
  const chart = TYPE_CHART[attType];
  if (!chart) return 1;
  if (chart.strong.includes(defType)) return 2;
  if (chart.weak.includes(defType)) return 0.5;
  return 1;
}

function damage(attacker, defender, move) {
  const mult = typeMultiplier(move.type, speciesOf(defender.ref).type);
  const crit = Math.random() < 0.08 ? 1.7 : 1;
  const variance = 0.88 + Math.random() * 0.24;
  const base = atkOf(attacker.ref) * 0.9 + move.power * 0.6;
  const dmg = Math.max(1, Math.round(base * mult * crit * variance - defOf(defender.ref) * 0.45));
  return { dmg, mult, crit: crit > 1 };
}

/**
 * Combat interactif. L'UI appelle round(move) à chaque tour du joueur
 * et anime la liste de "steps" renvoyée.
 */
export class Battle {
  constructor(playerCreatures, enemyCreatures) {
    // HP joueur : réels (le risque compte) ; HP ennemis : copies
    this.p = playerCreatures.map((c) => ({ ref: c, hp: c.hp, max: maxHp(c) }));
    this.e = enemyCreatures.map((c) => ({ ref: c, hp: maxHp(c), max: maxHp(c) }));
    this.pi = 0;
    this.ei = 0;
    this.over = false;
    this.winner = null;
  }

  get pA() { return this.p[this.pi]; }
  get eA() { return this.e[this.ei]; }

  snap() {
    const f = (x) => x ? {
      name: speciesOf(x.ref).name, speciesId: x.ref.speciesId, level: x.ref.level,
      hp: x.hp, max: x.max, shiny: !!x.ref.shiny, type: speciesOf(x.ref).type,
    } : null;
    return { p: f(this.pA), e: f(this.eA) };
  }

  /** Joue un tour complet : attaque du joueur (move choisi) + riposte. */
  round(playerMove, enemyMovePicker) {
    const steps = [];
    if (this.over) return steps;

    const pFirst = spdOf(this.pA.ref) >= spdOf(this.eA.ref);
    const order = pFirst ? ['p', 'e'] : ['e', 'p'];

    for (const side of order) {
      if (this.over) break;
      const att = side === 'p' ? this.pA : this.eA;
      const def = side === 'p' ? this.eA : this.pA;
      if (att.hp <= 0) continue;

      const move = side === 'p' ? playerMove : enemyMovePicker(this.eA.ref, speciesOf(this.pA.ref).type);
      const { dmg, mult, crit } = damage(att, def, move);
      def.hp = Math.max(0, def.hp - dmg);

      steps.push({
        type: 'attack', side, move, dmg, mult, crit,
        ko: def.hp <= 0, snap: this.snap(),
      });

      if (def.hp <= 0) {
        const defSide = side === 'p' ? 'e' : 'p';
        this._advance(defSide);
        if (!this.over && (defSide === 'e' ? this.eA : this.pA)) {
          const nxt = defSide === 'e' ? this.eA : this.pA;
          steps.push({ type: 'switch', side: defSide, speciesId: nxt.ref.speciesId, shiny: !!nxt.ref.shiny, snap: this.snap() });
        }
        break; // le tour s'arrête sur un K.O.
      }
    }

    // Applique les HP réels du joueur
    for (const f of this.p) f.ref.hp = f.hp;

    if (this.over) steps.push({ type: 'end', winner: this.winner });
    return steps;
  }

  _advance(side) {
    if (side === 'e') {
      this.ei++;
      if (this.ei >= this.e.length) { this.over = true; this.winner = 'player'; }
    } else {
      this.pi++;
      if (this.pi >= this.p.length) { this.over = true; this.winner = 'enemy'; }
    }
  }
}

/** Choix auto d'attaque pour le joueur (mode ⚡ Auto) : la plus efficace */
export function autoPickMove(creature, defenderType) {
  const moves = movesOf(creature);
  let best = moves[0], bestScore = -1;
  for (const m of moves) {
    const score = m.power * typeMultiplier(m.type, defenderType);
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}
