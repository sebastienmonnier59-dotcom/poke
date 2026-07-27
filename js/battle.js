// ═══════════ Moteur de combat auto (tour par tour) ═══════════
import { TYPE_CHART } from './data.js';
import { speciesOf, maxHp, atkOf, defOf, spdOf } from './state.js';

export function typeMultiplier(attType, defType) {
  const chart = TYPE_CHART[attType];
  if (!chart) return 1;
  if (chart.strong.includes(defType)) return 2;
  if (chart.weak.includes(defType)) return 0.5;
  return 1;
}

/**
 * Simule un combat complet entre deux équipes.
 * Renvoie { winner: 'player'|'enemy', log: [{text, cls?}], playerSurvivors }
 * Le log contient aussi des snapshots pour l'animation de l'UI.
 */
export function simulateBattle(playerTeam, enemyTeam) {
  const log = [];
  // Copies de travail (on ne touche pas aux vrais HP de l'ennemi ; ceux du joueur oui — le risque rend le jeu addictif)
  const pTeam = playerTeam.map((c) => ({ ref: c, hp: c.hp, max: maxHp(c) }));
  const eTeam = enemyTeam.map((c) => ({ ref: c, hp: maxHp(c), max: maxHp(c) }));

  let pi = 0, ei = 0;
  let round = 0;

  const alive = (f) => f && f.hp > 0;

  while (pi < pTeam.length && ei < eTeam.length && round < 200) {
    round++;
    const p = pTeam[pi], e = eTeam[ei];
    const pSp = speciesOf(p.ref), eSp = speciesOf(e.ref);

    if (round === 1 || log[log.length - 1]?.newFighter) {
      // rien : géré ci-dessous
    }

    // Ordre : le plus rapide frappe en premier
    const order = spdOf(p.ref) >= spdOf(e.ref) ? [['P', p, e], ['E', e, p]] : [['E', e, p], ['P', p, e]];

    for (const [who, att, def] of order) {
      if (!alive(att) || !alive(def)) continue;
      const aSp = speciesOf(att.ref), dSp = speciesOf(def.ref);
      const mult = typeMultiplier(aSp.type, dSp.type);
      const crit = Math.random() < 0.08 ? 1.8 : 1;
      const variance = 0.85 + Math.random() * 0.3;
      let dmg = Math.max(1, Math.round((atkOf(att.ref) * 1.6 * mult * crit * variance) - defOf(def.ref) * 0.5));
      def.hp = Math.max(0, def.hp - dmg);

      let text = `${aSp.emoji} ${aSp.name} attaque ${dSp.name} : ${dmg} dégâts`;
      if (mult > 1) text += ' (super efficace ! ×2)';
      if (mult < 1) text += ' (peu efficace… ×0.5)';
      if (crit > 1) text += ' 💥 CRITIQUE !';
      log.push({
        text, cls: crit > 1 ? 'crit' : undefined,
        snap: snapshot(p, e, pSp, eSp), hitSide: who === 'P' ? 'enemy' : 'player',
      });

      if (def.hp <= 0) {
        log.push({ text: `☠️ ${dSp.name} est K.O. !`, snap: snapshot(p, e, pSp, eSp) });
        break;
      }
    }

    if (!alive(e)) {
      ei++;
      if (ei < eTeam.length) {
        const next = speciesOf(eTeam[ei].ref);
        log.push({ text: `🤖 NEXUS envoie ${next.emoji} ${next.name} !`, newFighter: true });
      }
    }
    if (!alive(p)) {
      pi++;
      if (pi < pTeam.length) {
        const next = speciesOf(pTeam[pi].ref);
        log.push({ text: `👉 À toi, ${next.emoji} ${next.name} !`, newFighter: true });
      }
    }
  }

  // Applique les dégâts réels à l'équipe du joueur
  for (const f of pTeam) f.ref.hp = f.hp;

  const winner = ei >= eTeam.length ? 'player' : 'enemy';
  return { winner, log };
}

function snapshot(p, e, pSp, eSp) {
  return {
    player: { name: pSp.name, emoji: pSp.emoji, hp: p.hp, max: p.max, level: p.ref.level },
    enemy: { name: eSp.name, emoji: eSp.emoji, hp: e.hp, max: e.max, level: e.ref.level },
  };
}
