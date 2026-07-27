// ═══════════ KIT TOON — boîte à outils partagée pour les créatures ═══════════
// Style "Pokémon 3D" : cel-shading, contours d'anime, visage 2D expressif
// dessiné sur la tête 3D, formes chibi.
//
// ┌─────────────────────── CONTRAT DES BUILDERS ───────────────────────┐
// │ Chaque espèce exporte  build<Nom>() → THREE.Group  avec :          │
// │  • la créature FACE À +Z, posée sur y=0                            │
// │  • hauteur totale ≈ 0.9 (stade 1) / 1.15 (stade 2) / 1.45 (stade 3)│
// │  • g.userData.anim = { body, bodyScale, head?, tail?:[], wings?:[],│
// │       float?:bool, flap?:num, flapAmp?:num, orbit?:Object3D }      │
// │  • g.userData.face = contrôleur retourné par addFace() (si visage) │
// │ L'engin anime : respiration (body), balancement (tail), battement  │
// │ (wings), flottement (float), rotation (orbit), clignement (face).  │
// └─────────────────────────────────────────────────────────────────────┘

import * as THREE from '../vendor/three.module.js';
export { THREE };

// ───────── Cel-shading ─────────
export const gradientMap = (() => {
  const data = new Uint8Array([110, 180, 235, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

/** Matériau toon standard */
export const TOON = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...opts });
/** Matériau toon lumineux (flammes, cristaux, yeux magiques…) */
export const GLOWTOON = (color, emissive, intensity = 0.6) =>
  new THREE.MeshToonMaterial({ color, gradientMap, emissive, emissiveIntensity: intensity });

export const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x2a1a12, side: THREE.BackSide });

/** Contour d'anime : coque inversée gonflée le long des normales. */
export function outline(mesh, thickness = 0.012) {
  const geo = outlinedGeo(mesh.geometry, thickness);
  const o = new THREE.Mesh(geo, OUTLINE_MAT);
  o.position.copy(mesh.position);
  o.rotation.copy(mesh.rotation);
  o.scale.copy(mesh.scale);
  return o;
}
export function outlinedGeo(geometry, thickness = 0.012) {
  const geo = geometry.clone();
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) + nor.getX(i) * thickness,
      pos.getY(i) + nor.getY(i) * thickness,
      pos.getZ(i) + nor.getZ(i) * thickness);
  }
  return geo;
}

// ───────── Primitives ─────────
/** Sphère écrasable (le classique du chibi) */
export function blobGeo(r, sx = 1, sy = 1, sz = 1, seg = 42) {
  const geo = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.8));
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * sx, p.getY(i) * sy, p.getZ(i) * sz);
  geo.computeVertexNormals();
  return geo;
}
export function blob(r, sx, sy, sz, mat, seg) {
  const m = new THREE.Mesh(blobGeo(r, sx, sy, sz, seg), mat);
  m.castShadow = true;
  return m;
}

/** Goutte / flamme : sphère étirée vers le haut */
export function teardropGeo(r, stretch = 2) {
  const geo = new THREE.SphereGeometry(r, 20, 16);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > 0) p.setY(i, y * (1 + (y / r) * stretch));
  }
  geo.computeVertexNormals();
  return geo;
}
export function teardrop(r, stretch, color, emissive) {
  return new THREE.Mesh(teardropGeo(r, stretch),
    emissive ? GLOWTOON(color, emissive) : TOON(color));
}

/** Membre : capsule orientée entre deux points */
export function limb(a, b, r1, r2, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 16, 4), mat);
  m.position.copy(A).lerp(B, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true;
  return m;
}

/**
 * Loft : surface continue le long d'une courbe (queues, corps de poisson,
 * tentacules, cous…). prof = [[t, rayon], …] lissé automatiquement.
 * Renvoie la GÉOMÉTRIE (à mettre dans un Mesh + outlinedGeo pour le contour).
 */
export function loft(pts, prof, { steps = 48, ring = 24 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const frames = curve.computeFrenetFrames(steps, false);
  const rad = (t) => {
    t = Math.max(0, Math.min(1, t));
    let i = 0;
    while (i < prof.length - 1 && prof[i + 1][0] < t) i++;
    const a = prof[i], b = prof[Math.min(i + 1, prof.length - 1)];
    if (a === b || b[0] === a[0]) return a[1];
    const k = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
    return a[1] + (b[1] - a[1]) * (k * k * (3 - 2 * k));
  };
  const smooth = (t) => rad(t - 0.06) * 0.25 + rad(t) * 0.5 + rad(t + 0.06) * 0.25;
  const UP = new THREE.Vector3(0, 1, 0);
  const posA = [], uvA = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curve.getPoint(t);
    const T = frames.tangents[i];
    let side = UP.clone().cross(T);
    if (side.lengthSq() < 1e-4) side = new THREE.Vector3(1, 0, 0);
    side.normalize();
    const up = T.clone().cross(side).normalize();
    const r = smooth(t);
    for (let j = 0; j <= ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      const dir = up.clone().multiplyScalar(Math.cos(a) * r).add(side.clone().multiplyScalar(Math.sin(a) * r));
      posA.push(p.x + dir.x, p.y + dir.y, p.z + dir.z);
      uvA.push(j / ring, t * 3);
    }
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < ring; j++) {
    const a = i * (ring + 1) + j, b = a + ring + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2));
  geo.computeVertexNormals();
  return geo;
}

// ───────── Visage 2D expressif (technique Pokémon/Zelda) ─────────
/**
 * Colle un visage dessiné (canvas) sur une sphère-tête.
 * headGroup : le Group de la tête (le visage suivra ses rotations)
 * opts :
 *   r        rayon de la sphère overlay (≈ rayon tête + 0.004)
 *   sx, sy   écrasement identique à la tête
 *   pos      [x,y,z] centre (défaut [0,0,0] = centre du groupe)
 *   eye      couleur d'iris CSS ('#d97a1c' ambre, '#2e86e0' bleu…)
 *   blush    couleur des joues (CSS rgba) ou null
 *   mouth    'cat' | 'smile' | 'beak' | 'fang' | 'flat'
 *   eyeSpread  écart des yeux en px canvas-1024 (défaut 88)
 *   eyeY / eyeSize  position verticale / taille (défauts 445 / 46)
 * Renvoie { setExpression(expr, revertMs?), update(dt), dispose() }
 * Expressions : normal · happy · surprised · angry · wink · ko
 */
export function addFace(headGroup, {
  r = 0.304, sx = 1.06, sy = 0.96, pos = [0, 0, 0],
  eye = '#d97a1c', blush = 'rgba(255,120,70,0.55)', mouth = 'cat',
  eyeSpread = 88, eyeY = 445, eyeSize = 46,
} = {}) {
  const S = 512, K = S / 1024; // dessin pensé en 1024, rendu en 512
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const overlay = new THREE.Mesh(
    new THREE.SphereGeometry(r, 48, 36),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  overlay.scale.set(sx, sy, 1);
  overlay.position.set(...pos);
  overlay.rotation.y = -Math.PI / 2; // centre du canvas (u=0.5) → +z
  overlay.renderOrder = 2;
  headGroup.add(overlay);

  // Palette dérivée de la couleur d'iris
  const eyeC = new THREE.Color(eye);
  const eyeDark = '#' + eyeC.clone().multiplyScalar(0.35).getHexString();
  const eyeLight = '#' + eyeC.clone().lerp(new THREE.Color(0xffffff), 0.35).getHexString();
  const lineC = '#2a1408';

  function draw(expr = 'normal', blink = false) {
    const g = ctx;
    g.clearRect(0, 0, S, S);
    g.save();
    g.scale(K, K);
    g.lineCap = 'round';
    const EX = eyeSpread, EY = eyeY, ES = eyeSize, CX = 512;

    const eyeOpen = (x, big = 1) => {
      g.fillStyle = lineC;
      g.beginPath(); g.ellipse(x, EY, ES * 0.78 * big, ES * big, 0, 0, 7); g.fill();
      const grad = g.createRadialGradient(x, EY + 14, 4, x, EY + 10, ES * 0.8);
      grad.addColorStop(0, eyeLight); grad.addColorStop(0.55, eye); grad.addColorStop(1, eyeDark);
      g.fillStyle = grad;
      g.beginPath(); g.ellipse(x, EY + 6, ES * 0.62 * big, ES * 0.8 * big, 0, 0, 7); g.fill();
      g.fillStyle = '#0d0603';
      g.beginPath(); g.ellipse(x, EY + 10, ES * 0.34 * big, ES * 0.46 * big, 0, 0, 7); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(x - ES * 0.22, EY - ES * 0.32, ES * 0.26, ES * 0.3, -0.3, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x + ES * 0.26, EY + ES * 0.34, ES * 0.11, ES * 0.12, 0, 0, 7); g.fill();
    };
    const eyeHappy = (x) => {
      g.strokeStyle = lineC; g.lineWidth = 22;
      g.beginPath(); g.arc(x, EY + 18, ES * 0.72, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    };
    const eyeClosed = (x) => {
      g.strokeStyle = lineC; g.lineWidth = 18;
      g.beginPath(); g.moveTo(x - ES * 0.6, EY + 8); g.quadraticCurveTo(x, EY + 26, x + ES * 0.6, EY + 8); g.stroke();
    };
    const eyeAngry = (x, s) => {
      eyeOpen(x, 0.82);
      g.strokeStyle = lineC; g.lineWidth = 20;
      g.beginPath();
      g.moveTo(x - s * ES * 0.75, EY - ES * 1.05 - s * 8);
      g.lineTo(x + s * ES * 0.75, EY - ES * 0.68);
      g.stroke();
    };
    const eyeKO = (x) => {
      g.strokeStyle = lineC; g.lineWidth = 18;
      const d = ES * 0.55;
      g.beginPath(); g.moveTo(x - d, EY - d); g.lineTo(x + d, EY + d); g.stroke();
      g.beginPath(); g.moveTo(x + d, EY - d); g.lineTo(x - d, EY + d); g.stroke();
    };

    const L = CX - EX, R = CX + EX;
    if (expr === 'ko') { eyeKO(L); eyeKO(R); }
    else if (blink) { eyeClosed(L); eyeClosed(R); }
    else if (expr === 'happy') { eyeHappy(L); eyeHappy(R); }
    else if (expr === 'angry') { eyeAngry(L, -1); eyeAngry(R, 1); }
    else if (expr === 'wink') { eyeHappy(L); eyeOpen(R); }
    else if (expr === 'surprised') { eyeOpen(L, 1.22); eyeOpen(R, 1.22); }
    else { eyeOpen(L); eyeOpen(R); }

    if (blush) {
      g.fillStyle = blush;
      g.beginPath(); g.ellipse(CX - 165, EY + 128, 46, 34, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(CX + 165, EY + 128, 46, 34, 0, 0, 7); g.fill();
    }

    // Nez (sauf bec)
    if (mouth !== 'beak') {
      g.fillStyle = '#3d1d0a';
      g.beginPath();
      g.moveTo(CX - 14, EY + 96); g.lineTo(CX + 14, EY + 96); g.lineTo(CX, EY + 116);
      g.closePath(); g.fill();
    }

    // Bouche
    g.strokeStyle = '#3d1d0a'; g.lineWidth = 12;
    const MY = EY + 138;
    if (expr === 'ko') {
      g.beginPath(); g.ellipse(CX, MY + 20, 20, 26, 0, 0, 7);
      g.fillStyle = '#5a2412'; g.fill();
    } else if (expr === 'happy' || expr === 'wink') {
      g.fillStyle = '#7a2618';
      g.beginPath(); g.moveTo(CX - 70, MY); g.quadraticCurveTo(CX, MY + 105, CX + 70, MY);
      g.closePath(); g.fill();
      g.fillStyle = '#ff8a75';
      g.beginPath(); g.ellipse(CX, MY + 52, 40, 26, 0, 0, 7); g.fill();
      g.stroke();
    } else if (expr === 'surprised') {
      g.fillStyle = '#5a2412';
      g.beginPath(); g.ellipse(CX, MY + 25, 26, 34, 0, 0, 7); g.fill();
    } else if (expr === 'angry') {
      g.beginPath(); g.moveTo(CX - 55, MY + 40); g.quadraticCurveTo(CX, MY + 6, CX + 55, MY + 40); g.stroke();
      if (mouth === 'fang') {
        g.fillStyle = '#ffffff';
        g.beginPath(); g.moveTo(CX - 30, MY + 24); g.lineTo(CX - 14, MY + 24); g.lineTo(CX - 22, MY + 46); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(CX + 14, MY + 24); g.lineTo(CX + 30, MY + 24); g.lineTo(CX + 22, MY + 46); g.closePath(); g.fill();
      }
    } else if (mouth === 'beak') {
      g.fillStyle = '#e8a23d';
      g.beginPath(); g.moveTo(CX - 34, EY + 92); g.lineTo(CX + 34, EY + 92); g.lineTo(CX, EY + 150); g.closePath(); g.fill();
      g.strokeStyle = '#8a5a12'; g.lineWidth = 8; g.stroke();
    } else if (mouth === 'flat') {
      g.beginPath(); g.moveTo(CX - 34, MY + 14); g.lineTo(CX + 34, MY + 14); g.stroke();
    } else if (mouth === 'fang') {
      g.beginPath(); g.moveTo(CX - 55, MY); g.quadraticCurveTo(CX, MY + 40, CX + 55, MY); g.stroke();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.moveTo(CX - 36, MY + 12); g.lineTo(CX - 20, MY + 12); g.lineTo(CX - 28, MY + 34); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(CX + 20, MY + 12); g.lineTo(CX + 36, MY + 12); g.lineTo(CX + 28, MY + 34); g.closePath(); g.fill();
    } else if (mouth === 'smile') {
      g.beginPath(); g.moveTo(CX - 50, MY + 4); g.quadraticCurveTo(CX, MY + 44, CX + 50, MY + 4); g.stroke();
    } else { // 'cat'
      g.beginPath(); g.arc(CX - 26, MY + 8, 26, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
      g.beginPath(); g.arc(CX + 26, MY + 8, 26, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    }
    g.restore();
    tex.needsUpdate = true;
  }

  let expr = 'normal';
  let revertTimer = 0;
  let blinkClock = 2 + Math.random() * 3, blinkPhase = -1;
  draw(expr);

  const ctl = {
    overlay,
    get expression() { return expr; },
    setExpression(e, revertMs = 0) {
      expr = e;
      draw(expr);
      revertTimer = revertMs > 0 ? revertMs / 1000 : 0;
    },
    update(dt) {
      if (revertTimer > 0) {
        revertTimer -= dt;
        if (revertTimer <= 0) { expr = 'normal'; draw(expr); }
      }
      if (expr === 'normal' || expr === 'surprised') {
        blinkClock -= dt;
        if (blinkClock <= 0 && blinkPhase < 0) blinkPhase = 0;
        if (blinkPhase >= 0) {
          blinkPhase += dt * 10;
          if (blinkPhase < 1) draw(expr, true);
          else { draw(expr, false); blinkPhase = -1; blinkClock = 2 + Math.random() * 3.5; }
        }
      }
    },
    dispose() { tex.dispose(); overlay.material.dispose(); overlay.geometry.dispose(); },
  };
  headGroup.userData.faceCtl = ctl;
  return ctl;
}

// ───────── Petits helpers d'assemblage ─────────
/** Ajoute mesh + son contour au groupe, renvoie le mesh */
export function addOutlined(group, mesh, thickness = 0.012) {
  group.add(mesh);
  group.add(outline(mesh, thickness));
  return mesh;
}

/** Déclare les paramètres d'animation standard sur le groupe */
export function setAnim(group, body, extra = {}) {
  group.userData.anim = {
    ...(group.userData.anim || {}),
    body, bodyScale: body.scale.clone(), ...extra,
  };
}
