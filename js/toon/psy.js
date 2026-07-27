// ═══════════ Lignée PSY : Psybulle -> Mentalys -> Oracylon ═══════════
// Psybulle : meduse-bulle reveuse a tentacules / Mentalys : hibou mystique / Oracylon : oracle flottant a anneaux
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

export function buildPsybulle() { return placeholder(0.85, 0xe07bd4, '#5a0e8f'); }
export function buildMentalys() { return placeholder(1.1, 0xb75fc9, '#ffd12e', 'beak'); }
export function buildOracylon() { return placeholder(1.4, 0x8f3ddb, '#00ffe1', 'flat'); }
