// ═══════════ Lignée ELECTRIK : Voltine -> Fulgurix -> Megavolt ═══════════
// Voltine : souris etincelante, joues electriques / Fulgurix : guepard-eclair race / Megavolt : rapace de foudre
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

export function buildVoltine() { return placeholder(0.8, 0xf5cf3a, '#3a2c00'); }
export function buildFulgurix() { return placeholder(1.15, 0xe8b820, '#00d9ff', 'fang'); }
export function buildMegavolt() { return placeholder(1.4, 0xd9a410, '#00e0ff', 'beak'); }
