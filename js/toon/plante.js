// ═══════════ Lignée PLANTE : Feuillo -> Sylvard -> Florakhan ═══════════
// Feuillo : chenille-pousse segmentee, feuille sur la tete / Sylvard : lezard des bois, epines-feuilles / Florakhan : dino-foret, arbre sur le dos
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

export function buildFeuillo() { return placeholder(0.85, 0x6fbf5a, '#1d4d22'); }
export function buildSylvard() { return placeholder(1.15, 0x4a9e4f, '#ffd12e', 'smile'); }
export function buildFlorakhan() { return placeholder(1.45, 0x2f7a3c, '#ffb01e', 'fang'); }
