// ═══════════ Lignée VENT : Plumze -> Aeriel -> Cyclonos ═══════════
// Plumze : poussin duveteux tout rond / Aeriel : perroquet acrobate / Cyclonos : cygne-tempete majestueux
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

export function buildPlumze() { return placeholder(0.75, 0xa8dfe8, '#114a5c', 'beak'); }
export function buildAeriel() { return placeholder(1.1, 0x5fc4d9, '#ffab1e', 'beak'); }
export function buildCyclonos() { return placeholder(1.4, 0xd8f4fa, '#0d5c7a', 'beak'); }
