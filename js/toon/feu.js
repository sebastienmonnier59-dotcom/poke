// ═══════════ Lignée FEU : Braisou → Pyrofel → Infernyx ═══════════
// Braisou : renardeau chibi, flamme au bout de la queue (RÉFÉRENCE DE STYLE)
// Pyrofel : loup élancé, crinière ardente — stade 2, ~1.15 de haut
// Infernyx : dragon-renard bipède, ailes membrane, grande flamme — stade 3, ~1.45

import {
  THREE, TOON, GLOWTOON, outline, outlinedGeo, blob, teardrop, limb, loft,
  addFace, addOutlined, setAnim, OUTLINE_MAT,
} from './kit.js';

const COL = {
  fur: 0xf59a4a, furDark: 0xe07b2e, cream: 0xffe9c4,
  earTip: 0x8a3d1a, inner: 0xffd9ae,
  flame1: 0xff7a1f, flame2: 0xffb03d, flame3: 0xfff0b8,
};

/** Flamme toon à 3 couches (réutilisée par toute la lignée) */
export function toonFlame(scale = 1) {
  const g = new THREE.Group();
  const outer = teardrop(0.08 * scale, 2.3, COL.flame1, 0xff4a00);
  const mid = teardrop(0.052 * scale, 2.4, COL.flame2, 0xff7a00);
  mid.position.y = 0.015 * scale;
  const core = teardrop(0.028 * scale, 2.5, COL.flame3, 0xffc400);
  core.position.y = 0.03 * scale;
  g.add(outer, mid, core);
  const light = new THREE.PointLight(0xff8a30, 0.8, 1.6 * scale, 2);
  light.position.y = 0.1 * scale;
  g.add(light);
  g.userData.isFlame = true; // l'engin anime le scintillement
  return g;
}

// ── BRAISOU (référence du style, validée) ──
export function buildBraisou() {
  const g = new THREE.Group();

  const body = addOutlined(g, blob(0.23, 1.0, 1.08, 0.95, TOON(COL.fur)));
  body.position.y = 0.3;
  const belly = blob(0.17, 0.85, 0.9, 0.5, TOON(COL.cream), 32);
  belly.position.set(0, 0.27, 0.13);
  g.add(belly);

  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.78, 0.02);
  g.add(headGrp);
  const head = addOutlined(headGrp, blob(0.3, 1.06, 0.96, 1.0, TOON(COL.fur)));

  const face = addFace(headGrp, { r: 0.304, sx: 1.06, sy: 0.96, eye: '#d97a1c', mouth: 'cat' });

  // Oreilles
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.175, 0.22, -0.01);
    ear.rotation.z = s * 0.55;
    headGrp.add(ear);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 24, 4), TOON(COL.fur));
    outer.position.y = 0.14;
    outer.castShadow = true;
    ear.add(outer, outline(outer, 0.01));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.17, 20), TOON(COL.earTip));
    tip.position.y = 0.235;
    ear.add(tip);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.19, 18), TOON(COL.inner));
    inner.position.set(0, 0.09, 0.055);
    inner.scale.z = 0.55;
    ear.add(inner);
  }

  // Touffes de joues
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 12), TOON(COL.fur));
      tuft.position.set(s * 0.285, -0.06 + i * 0.055, 0.02);
      tuft.rotation.z = s * (Math.PI / 2 - 0.15 + i * 0.22);
      headGrp.add(tuft, outline(tuft, 0.008));
    }
  }

  // Bras + pieds
  for (const s of [-1, 1]) {
    const arm = blob(0.06, 0.9, 1.5, 0.9, TOON(COL.furDark), 20);
    arm.position.set(s * 0.19, 0.34, 0.09);
    arm.rotation.z = s * 0.55;
    arm.rotation.x = -0.25;
    g.add(arm, outline(arm, 0.008));
    const foot = blob(0.075, 1.15, 0.6, 1.35, TOON(COL.furDark), 20);
    foot.position.set(s * 0.1, 0.05, 0.06);
    g.add(foot, outline(foot, 0.008));
  }

  // Queue en S + flamme
  const tailGrp = new THREE.Group();
  tailGrp.position.set(0, 0.3, -0.16);
  g.add(tailGrp);
  const tailGeo = loft(
    [[0, 0, 0], [0.03, -0.02, -0.2], [0, 0.14, -0.34], [-0.02, 0.38, -0.38]],
    [[0, 0.05], [0.35, 0.11], [0.7, 0.09], [1, 0.035]]
  );
  const tail = new THREE.Mesh(tailGeo, TOON(COL.fur));
  tail.castShadow = true;
  tailGrp.add(tail, new THREE.Mesh(outlinedGeo(tailGeo), OUTLINE_MAT));
  const tailTip = blob(0.055, 1, 1.2, 1, TOON(COL.cream), 20);
  tailTip.position.set(-0.02, 0.42, -0.38);
  tailGrp.add(tailTip);
  const flame = toonFlame(1);
  flame.position.set(-0.02, 0.5, -0.38);
  tailGrp.add(flame);

  setAnim(g, body, { head: headGrp, tailGroup: tailGrp, face });
  g.userData.face = face;
  return g;
}

// ── PYROFEL (stub — à sculpter par l'agent : loup élancé quadrupède,
//    crinière de feu sur la nuque, chaussettes sombres, queue-flamme plus grande) ──
export function buildPyrofel() {
  return placeholder(1.15, 0xb54527, '#ffc23d');
}

// ── INFERNYX (stub — à sculpter par l'agent : dragon bipède, ailes membrane
//    translucides, cornes, grande flamme, aura d'étincelles) ──
export function buildInfernyx() {
  return placeholder(1.45, 0x8f2410, '#ffdd55');
}

// Placeholder générique en attendant la sculpture (TOUJOURS remplacer)
function placeholder(h, color, eye) {
  const g = new THREE.Group();
  const body = addOutlined(g, blob(h * 0.22, 1, 1.1, 0.95, TOON(color)));
  body.position.y = h * 0.26;
  const headGrp = new THREE.Group();
  headGrp.position.y = h * 0.62;
  g.add(headGrp);
  addOutlined(headGrp, blob(h * 0.22, 1.05, 0.95, 1, TOON(color)));
  const face = addFace(headGrp, { r: h * 0.22 + 0.004, sx: 1.05, sy: 0.95, eye });
  setAnim(g, body, { head: headGrp, face });
  g.userData.face = face;
  return g;
}
