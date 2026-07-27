// ═══════════ Lignée OMBRE : Ombrion -> Nocturnyx -> Abyssum ═══════════
// Ombrion : chauve-souris de cauchemar mignon / Nocturnyx : panthere d'encre / Abyssum : abime incarne, oeil unique et anneaux
// ⚠️ STUBS — à sculpter (voir la mission de l'agent). Contrat : kit.js.

import {
  THREE, TOON, GLOWTOON, outline, outlinedGeo, blob, teardrop, limb, loft,
  addFace, addOutlined, setAnim, OUTLINE_MAT,
} from './kit.js';

function placeholder(h, color, eye, mouth = 'cat') {
  const g = new THREE.Group();
  const body = addOutlined(g, blob(h * 0.22, 1, 1.1, 0.95, TOON(color)));
  body.position.y = h * 0.26;
  const headGrp = new THREE.Group();
  headGrp.position.y = h * 0.62;
  g.add(headGrp);
  addOutlined(headGrp, blob(h * 0.22, 1.05, 0.95, 1, TOON(color)));
  const face = addFace(headGrp, { r: h * 0.22 + 0.004, sx: 1.05, sy: 0.95, eye, mouth });
  setAnim(g, body, { head: headGrp, face });
  g.userData.face = face;
  return g;
}

export function buildOmbrion() { return placeholder(0.8, 0x4a3a75, '#ff3d81', 'fang'); }
export function buildNocturnyx() { return placeholder(1.15, 0x241d3d, '#00ff9d', 'fang'); }
export function buildAbyssum() { return placeholder(1.45, 0x1a1030, '#ffde3d', 'flat'); }
