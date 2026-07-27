// ═══════════ Lignée EAU : Gouttix -> Aquarel -> Torrentor ═══════════
// Gouttix : poisson-goutte rond flottant / Aquarel : dauphin joueur / Torrentor : baleine-leviathan
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

export function buildGouttix() { return placeholder(0.9, 0x3f9be8, '#0a2a66'); }
export function buildAquarel() { return placeholder(1.15, 0x2f7fd4, '#0d2c5c', 'smile'); }
export function buildTorrentor() { return placeholder(1.45, 0x1c4f9e, '#9adcff', 'flat'); }
