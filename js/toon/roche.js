// ═══════════ Lignée ROCHE : Rocaillou -> Granitor -> Titanroc ═══════════
// Rocaillou : tortue-galet trapue / Granitor : rhino de granit / Titanroc : colosse a cristaux turquoise
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

export function buildRocaillou() { return placeholder(0.85, 0x9c8a76, '#2e2317', 'flat'); }
export function buildGranitor() { return placeholder(1.2, 0x7d6a58, '#d98e2b', 'flat'); }
export function buildTitanroc() { return placeholder(1.5, 0x5e5246, '#36e0c8', 'flat'); }
