// ═══════════ Lignée PLANTE : Feuillo → Sylvard → Florakhan ═══════════
// Feuillo : chenille-pousse chibi, grande feuille sur la tête — stade 1, ~0.85
// Sylvard : lézard bipède feuillu, épines-feuilles dorsales, queue-liane — stade 2, ~1.15
// Florakhan : dino-forêt quadrupède, arbre-canopée fleuri sur le dos — stade 3, ~1.45

import {
  THREE, TOON, GLOWTOON, outline, outlinedGeo, blob, teardrop, limb, loft,
  addFace, addOutlined, setAnim, OUTLINE_MAT,
} from './kit.js';

const COL = {
  leaf1: 0x6fbf5a, leaf2: 0x4a9e4f, leaf3: 0x2f7a3c,
  cream1: 0xe4f2c8, cream2: 0xd9ecb4, cream3: 0xcfe6a8,
  dark1: 0x2e8f3a, dark2: 0x1f6e2e, dark3: 0x145223,
  bark: 0x6e4b2a, canopy: 0x3f9448,
  flower: 0xff9ed1, flowerGlow: 0xff4f9e,
};

/** Feuille toon : limbe en amande + petite tige. Pointe vers +Y. */
function makeLeaf(len, color, darkColor) {
  const grp = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(len * 0.045, len * 0.06, len * 0.4, 10), TOON(darkColor));
  stem.position.y = len * 0.18;
  stem.castShadow = true;
  grp.add(stem, outline(stem, 0.006));
  const blade = blob(len * 0.34, 0.62, 1.5, 0.2, TOON(color), 26);
  blade.position.y = len * 0.72;
  grp.add(blade, outline(blade, 0.01));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(len * 0.09, len * 0.3, 12), TOON(color));
  tip.position.y = len * 1.2;
  tip.scale.z = 0.35;
  grp.add(tip, outline(tip, 0.008));
  return grp;
}

// ── FEUILLO : chenille-pousse ──
export function buildFeuillo() {
  const g = new THREE.Group();

  // Tête = premier segment (grosse, chibi)
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.3, 0.27);
  g.add(headGrp);
  addOutlined(headGrp, blob(0.27, 1.05, 1.0, 0.94, TOON(COL.leaf1)));
  const face = addFace(headGrp, {
    r: 0.274, sx: 1.05, sy: 1.0, eye: '#1d4d22', mouth: 'cat',
    blush: 'rgba(120,200,90,0.55)',
  });

  // GRANDE feuille signature sur la tête
  const leaf = makeLeaf(0.42, COL.dark1, COL.dark2);
  leaf.position.set(0, 0.22, -0.04);
  leaf.rotation.x = -0.38;
  headGrp.add(leaf);

  // Pieds boutons avant (sous la tête)
  for (const s of [-1, 1]) {
    const foot = blob(0.055, 1.1, 0.7, 1.2, TOON(COL.dark1), 16);
    foot.position.set(s * 0.13, 0.045, 0.34);
    g.add(foot, outline(foot, 0.007));
  }

  // Segments arrière en léger arc (anim.tail : ondulation en x)
  const segDefs = [
    { z: -0.05, x: 0.0,  r: 0.19,  c: COL.cream1 },
    { z: -0.27, x: 0.04, r: 0.165, c: COL.leaf1 },
    { z: -0.46, x: 0.1,  r: 0.14,  c: COL.cream1 },
    { z: -0.62, x: 0.17, r: 0.11,  c: COL.leaf1 },
  ];
  const tail = [];
  let bodyMesh = null;
  segDefs.forEach((d, i) => {
    const seg = new THREE.Group();
    seg.position.set(d.x, d.r * 0.92, d.z);
    seg.userData.bx = d.x;
    g.add(seg);
    const m = addOutlined(seg, blob(d.r, 1.0, 1.02, 0.95, TOON(d.c), 30));
    if (i === 0) bodyMesh = m;
    // petits pieds boutons sur les 2 premiers segments
    if (i < 2) for (const s of [-1, 1]) {
      const foot = blob(0.045, 1.1, 0.7, 1.15, TOON(COL.dark1), 14);
      foot.position.set(s * d.r * 0.72, -d.r * 0.78, 0.03);
      seg.add(foot, outline(foot, 0.006));
    }
    // pastille verte décorative sur les segments crème
    if (d.c === COL.cream1) {
      const dot = blob(d.r * 0.34, 1, 1, 0.4, TOON(COL.dark1), 14);
      dot.position.set(0, d.r * 0.55, d.r * 0.62);
      seg.add(dot);
    }
    tail.push(seg);
  });

  setAnim(g, bodyMesh, { head: headGrp, tail, face });
  g.userData.face = face;
  return g;
}

// ── SYLVARD : lézard bipède feuillu ──
export function buildSylvard() {
  const g = new THREE.Group();

  // Corps dressé
  const body = addOutlined(g, blob(0.25, 0.95, 1.22, 0.9, TOON(COL.leaf2)));
  body.position.y = 0.52;
  const belly = blob(0.185, 0.82, 1.05, 0.5, TOON(COL.cream2), 30);
  belly.position.set(0, 0.5, 0.12);
  g.add(belly);

  // Tête
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.96, 0.03);
  g.add(headGrp);
  addOutlined(headGrp, blob(0.235, 1.08, 0.94, 0.98, TOON(COL.leaf2)));
  const face = addFace(headGrp, {
    r: 0.239, sx: 1.08, sy: 0.94, eye: '#ffd12e', mouth: 'smile',
    blush: 'rgba(110,190,80,0.45)',
  });

  // Épines-feuilles dorsales : rangée de cônes (2 sur la tête, 3 sur le dos)
  const spineDefs = [
    { p: [0, 1.18, -0.1],  s: 0.1,  h: 0.24, rx: -0.55 },
    { p: [0, 1.06, -0.21], s: 0.09, h: 0.22, rx: -0.75 },
    { p: [0, 0.78, -0.2],  s: 0.085, h: 0.2, rx: -0.9 },
    { p: [0, 0.58, -0.22], s: 0.075, h: 0.18, rx: -1.05 },
    { p: [0, 0.4, -0.19],  s: 0.065, h: 0.16, rx: -1.2 },
  ];
  for (const d of spineDefs) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(d.s, d.h, 14), TOON(COL.dark2));
    spike.position.set(...d.p);
    spike.rotation.x = d.rx;
    spike.scale.x = 0.55;
    spike.castShadow = true;
    g.add(spike, outline(spike, 0.008));
  }

  // Bras + bracelets de feuilles
  for (const s of [-1, 1]) {
    const arm = limb([s * 0.2, 0.62, 0.06], [s * 0.3, 0.4, 0.14], 0.05, 0.038, TOON(COL.leaf2));
    g.add(arm, outline(arm, 0.008));
    const hand = blob(0.055, 1, 0.9, 1.1, TOON(COL.leaf2), 16);
    hand.position.set(s * 0.31, 0.38, 0.15);
    g.add(hand, outline(hand, 0.007));
    // bracelet : anneau + 3 petites feuilles
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.022, 10, 20), TOON(COL.dark2));
    ring.position.set(s * 0.295, 0.44, 0.125);
    ring.rotation.x = Math.PI / 2 - 0.4;
    g.add(ring, outline(ring, 0.006));
    for (let i = 0; i < 3; i++) {
      const lf = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.11, 10), TOON(COL.dark1));
      const a = -0.6 + i * 1.1;
      lf.position.set(s * (0.295 + Math.sin(a) * 0.06), 0.46, 0.125 + Math.cos(a) * 0.05);
      lf.rotation.z = s * (0.5 - i * 0.5);
      lf.scale.z = 0.4;
      g.add(lf, outline(lf, 0.006));
    }
  }

  // Jambes trapues + pieds
  for (const s of [-1, 1]) {
    const thigh = blob(0.1, 0.95, 1.2, 0.95, TOON(COL.leaf2), 20);
    thigh.position.set(s * 0.15, 0.22, 0.0);
    g.add(thigh, outline(thigh, 0.008));
    const foot = blob(0.085, 1.1, 0.55, 1.45, TOON(COL.dark2), 20);
    foot.position.set(s * 0.16, 0.05, 0.07);
    g.add(foot, outline(foot, 0.008));
  }

  // Queue-liane avec feuille au bout
  const tailGrp = new THREE.Group();
  tailGrp.position.set(0, 0.36, -0.18);
  g.add(tailGrp);
  const tailGeo = loft(
    [[0, 0, 0], [0, -0.06, -0.24], [0.03, 0.04, -0.44], [0, 0.26, -0.56]],
    [[0, 0.055], [0.4, 0.045], [0.75, 0.032], [1, 0.018]]
  );
  const tailM = new THREE.Mesh(tailGeo, TOON(COL.dark2));
  tailM.castShadow = true;
  tailGrp.add(tailM, new THREE.Mesh(outlinedGeo(tailGeo, 0.008), OUTLINE_MAT));
  const tipLeaf = makeLeaf(0.3, COL.dark1, COL.dark2);
  tipLeaf.position.set(0, 0.26, -0.57);
  tipLeaf.rotation.x = -0.5;
  tailGrp.add(tipLeaf);

  setAnim(g, body, { head: headGrp, tailGroup: tailGrp, face });
  g.userData.face = face;
  return g;
}

// ── FLORAKHAN : dino-forêt quadrupède, arbre sur le dos ──
export function buildFlorakhan() {
  const g = new THREE.Group();

  // Corps massif
  const body = addOutlined(g, blob(0.4, 1.1, 0.92, 1.32, TOON(COL.leaf3)));
  body.position.y = 0.56;

  // Pattes-troncs (écorce)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.115, 0.5, 16), TOON(COL.bark));
    leg.position.set(sx * 0.26, 0.25, sz * 0.32);
    leg.castShadow = true;
    g.add(leg, outline(leg, 0.01));
    const toe = blob(0.1, 1.15, 0.42, 1.2, TOON(COL.cream3), 18);
    toe.position.set(sx * 0.26, 0.05, sz * 0.32 + 0.06);
    g.add(toe, outline(toe, 0.008));
  }

  // Plaques crème sur le ventre / poitrail
  const chest = blob(0.24, 1.05, 0.85, 0.55, TOON(COL.cream3), 28);
  chest.position.set(0, 0.48, 0.42);
  g.add(chest, outline(chest, 0.01));
  const plate = blob(0.28, 1.15, 0.5, 1.0, TOON(COL.cream3), 28);
  plate.position.set(0, 0.26, 0.02);
  g.add(plate);

  // Tête
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.9, 0.62);
  g.add(headGrp);
  addOutlined(headGrp, blob(0.29, 1.06, 0.93, 0.96, TOON(COL.leaf3)));
  const face = addFace(headGrp, {
    r: 0.294, sx: 1.06, sy: 0.93, eye: '#ffb01e', mouth: 'fang', blush: null,
  });
  // petites cornes-pousses
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 12), TOON(COL.cream3));
    horn.position.set(s * 0.15, 0.25, -0.06);
    horn.rotation.z = s * 0.45;
    headGrp.add(horn, outline(horn, 0.007));
  }

  // ARBRE-canopée sur le dos
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.09, 0.42, 14), TOON(COL.bark));
  trunk.position.set(0, 1.02, -0.16);
  trunk.rotation.x = 0.08;
  trunk.castShadow = true;
  g.add(trunk, outline(trunk, 0.009));
  const canopyDefs = [
    { p: [0, 1.3, -0.17], r: 0.21, c: COL.canopy },
    { p: [0.16, 1.19, -0.04], r: 0.15, c: COL.leaf3 },
    { p: [-0.15, 1.21, -0.3], r: 0.14, c: COL.leaf3 },
  ];
  for (const d of canopyDefs) {
    const ball = blob(d.r, 1.05, 0.95, 1.05, TOON(d.c), 26);
    ball.position.set(...d.p);
    g.add(ball, outline(ball, 0.01));
  }
  // Fleurs roses lumineuses dans la canopée
  const flowerDefs = [
    [0.1, 1.44, -0.1], [-0.13, 1.36, -0.22], [0.22, 1.26, 0.02],
    [-0.05, 1.42, -0.28], [0.02, 1.32, 0.0],
  ];
  for (const p of flowerDefs) {
    const fl = blob(0.038, 1, 0.85, 1, GLOWTOON(COL.flower, COL.flowerGlow, 0.7), 12);
    fl.position.set(...p);
    g.add(fl, outline(fl, 0.005));
  }

  // Queue épaisse
  const tailGrp = new THREE.Group();
  tailGrp.position.set(0, 0.52, -0.5);
  g.add(tailGrp);
  const tailGeo = loft(
    [[0, 0, 0.06], [0, -0.08, -0.22], [0.02, -0.16, -0.42]],
    [[0, 0.16], [0.5, 0.11], [1, 0.045]]
  );
  const tailM = new THREE.Mesh(tailGeo, TOON(COL.leaf3));
  tailM.castShadow = true;
  tailGrp.add(tailM, new THREE.Mesh(outlinedGeo(tailGeo, 0.01), OUTLINE_MAT));
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 12), TOON(COL.dark3));
  tuft.position.set(0.02, -0.14, -0.5);
  tuft.rotation.x = -1.9;
  tuft.scale.x = 0.5;
  tailGrp.add(tuft, outline(tuft, 0.007));

  setAnim(g, body, { head: headGrp, tailGroup: tailGrp, face });
  g.userData.face = face;
  return g;
}
