// ═══════════ Moteur 3D : créatures organiques procédurales (Three.js) ═══════════
// Formes lissées + bruit organique, matériaux PBR (sheen fourrure / clearcoat écailles),
// éclairage studio (PMREM), tone mapping filmique, ombres douces, animations d'idle,
// scène de combat à deux créatures, portraits rendus pour les cartes de l'UI.

import * as THREE from './vendor/three.module.js';
import { SPECIES_BY_ID, TYPE_FX } from './data.js';

let renderer, scene, camera, envTex, clock;
let container = null;
let idleGroup = null;               // créature seule (onglet Équipe)
const battlers = { p: null, e: null }; // créatures en combat
let mode = 'idle';
let shake = 0;
const tweens = [];
let dust = null;

// ───────────────────────── Scène principale ─────────────────────────
export function initStage(el) {
  container = el;
  const w = el.clientWidth || 800, h = el.clientHeight || 420;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b14, 0.045);

  camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
  setCameraIdle();

  envTex = makeStudioEnv(renderer);
  scene.environment = envTex;

  // Éclairage clé + contre + douche froide arrière
  const key = new THREE.DirectionalLight(0xfff2e0, 2.4);
  key.position.set(3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x25d9ff, 1.4);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  const fill = new THREE.AmbientLight(0x2a3558, 1.6);
  scene.add(fill);

  buildArena();
  buildDust();

  clock = new THREE.Clock();
  animate();

  const ro = new ResizeObserver(() => resize());
  ro.observe(el);
}

export function resize() {
  if (!container || !renderer) return;
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

/** Déplace le canvas dans un autre conteneur (changement d'onglet) */
export function moveStageTo(el) {
  if (!renderer || el === container) return;
  container = el;
  el.appendChild(renderer.domElement);
  resize();
}

function setCameraIdle() { camera.position.set(0, 1.15, 3.8); camera.lookAt(0, 0.8, 0); }
function setCameraBattle() { camera.position.set(0, 1.7, 6.4); camera.lookAt(0, 0.95, 0); }

// Environnement studio pour reflets PBR : "softboxes" autour d'une pièce sombre
function makeStudioEnv(r) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(
    new THREE.SphereGeometry(12, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x141c33, side: THREE.BackSide })
  ));
  const box = (c, x, y, z, sx, sy) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), new THREE.MeshBasicMaterial({ color: c }));
    p.position.set(x, y, z); p.lookAt(0, 0, 0); s.add(p);
  };
  box(0xfff4e0, 4, 7, 5, 5, 4);      // clé chaude
  box(0x86d8ff, -6, 4, -2, 4, 5);    // froid gauche
  box(0xff9ecf, 6, 2, -5, 3, 3);     // rose arrière
  box(0xffffff, 0, 8, 0, 6, 6);      // plafond
  const pm = new THREE.PMREMGenerator(r);
  const tex = pm.fromScene(s, 0.05).texture;
  pm.dispose();
  return tex;
}

function buildArena() {
  // Plateforme circulaire avec dégradé radial + ombre de contact
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, '#1d2748'); g.addColorStop(0.75, '#121a33'); g.addColorStop(1, '#070b14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 48),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  // Anneaux lumineux
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.022, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0x25d9ff, emissive: 0x1590b8, emissiveIntensity: 2, roughness: 0.3 })
  );
  ring1.rotation.x = Math.PI / 2; ring1.position.y = 0.012;
  scene.add(ring1);
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(4.4, 0.014, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0x2a3866, emissive: 0x1a2547, emissiveIntensity: 1.4, roughness: 0.4 })
  );
  ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.012;
  scene.add(ring2);
}

function buildDust() {
  const N = 130;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 1] = Math.random() * 5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x6f8ac9, size: 0.025, transparent: true, opacity: 0.55, depthWrite: false,
  }));
  scene.add(dust);
}

// ───────────────────────── Boucle d'animation ─────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05) || 0.016;
  const t = clock.elapsedTime;

  // Tweens actifs
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const k = Math.min(1, (performance.now() - tw.t0) / tw.dur);
    tw.fn(tw.ease ? tw.ease(k) : k);
    if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
  }

  // Idle : la créature respire, la caméra ondule légèrement
  if (mode === 'idle' && idleGroup) {
    animateCreature(idleGroup, t);
    idleGroup.rotation.y = Math.sin(t * 0.25) * 0.3 + 0.12;
    camera.position.x = Math.sin(t * 0.12) * 0.2;
    camera.lookAt(0, 0.8, 0);
  }
  if (mode === 'battle') {
    for (const side of ['p', 'e']) {
      if (battlers[side]) animateCreature(battlers[side], t + (side === 'e' ? 3.1 : 0));
    }
  }

  // Poussières flottantes
  if (dust) {
    const p = dust.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setY(i, p.getY(i) + dt * 0.12);
      if (p.getY(i) > 5) p.setY(i, 0);
    }
    p.needsUpdate = true;
  }

  // Secousse d'écran
  if (shake > 0.002) {
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake;
    shake *= 0.86;
  }

  renderer.render(scene, camera);
}

/** Animation d'idle : respiration, queue, ailes, flottement */
function animateCreature(g, t) {
  const a = g.userData.anim || {};
  const breathe = 1 + Math.sin(t * 2.1) * 0.018;
  if (a.body) a.body.scale.set(a.bodyScale.x * breathe, a.bodyScale.y * (2 - breathe), a.bodyScale.z * breathe);
  if (a.head) a.head.rotation.x = Math.sin(t * 0.9) * 0.06;
  if (a.tail) a.tail.forEach((seg, i) => { seg.position.x = seg.userData.bx + Math.sin(t * 2.4 + i * 0.55) * 0.035 * (i + 1); });
  if (a.wings) a.wings.forEach((w, i) => { w.rotation.z = w.userData.bz + Math.sin(t * (a.flap || 2.6) + i) * (a.flapAmp || 0.22) * (i % 2 ? -1 : 1); });
  if (a.float) g.position.y = g.userData.baseY + Math.sin(t * 1.6) * 0.09;
  if (a.orbit) a.orbit.rotation.y = t * 0.8;
}

function tween(dur, fn, done, ease) { tweens.push({ t0: performance.now(), dur, fn, done, ease }); }
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

// ───────────────────────── Modes d'affichage ─────────────────────────
export function showSpecies(speciesId, shiny = false) {
  mode = 'idle';
  setCameraIdle();
  clearBattlers();
  if (idleGroup) disposeGroup(idleGroup);
  idleGroup = buildCreature(SPECIES_BY_ID[speciesId], shiny);
  idleGroup.userData.baseY = idleGroup.position.y;
  scene.add(idleGroup);
  // Apparition : pop élastique
  const target = idleGroup.scale.x;
  idleGroup.scale.setScalar(0.01);
  tween(420, (k) => idleGroup && idleGroup.scale.setScalar(0.01 + (target - 0.01) * k), null, easeOut);
}

export function setupBattle(pId, pShiny, eId, eShiny = false) {
  mode = 'battle';
  setCameraBattle();
  if (idleGroup) { disposeGroup(idleGroup); idleGroup = null; }
  clearBattlers();
  spawnBattler('p', pId, pShiny);
  spawnBattler('e', eId, eShiny);
}

export function switchBattler(side, speciesId, shiny = false) {
  if (battlers[side]) disposeGroup(battlers[side]);
  battlers[side] = null;
  spawnBattler(side, speciesId, shiny);
}

function spawnBattler(side, speciesId, shiny) {
  const g = buildCreature(SPECIES_BY_ID[speciesId], shiny);
  const x = side === 'p' ? -2.0 : 2.0;
  g.position.x = x;
  g.rotation.y = side === 'p' ? Math.PI / 2.2 : -Math.PI / 2.2;
  g.userData.baseY = g.position.y;
  g.userData.baseX = x;
  scene.add(g);
  battlers[side] = g;
  const target = g.scale.x;
  g.scale.setScalar(0.01);
  tween(380, (k) => g.scale.setScalar(0.01 + (target - 0.01) * k), null, easeOut);
}

function clearBattlers() {
  for (const side of ['p', 'e']) {
    if (battlers[side]) { disposeGroup(battlers[side]); battlers[side] = null; }
  }
}

export function endBattleScene() {
  clearBattlers();
  mode = 'idle';
  setCameraIdle();
}

/** Animation d'attaque : ruée vers la cible + impact (particules, flash, secousse) */
export function playAttack(side, moveType, onImpact) {
  return new Promise((resolve) => {
    const actor = battlers[side];
    const target = battlers[side === 'p' ? 'e' : 'p'];
    if (!actor) { onImpact && onImpact(); resolve(); return; }
    const dir = side === 'p' ? 1 : -1;
    const bx = actor.userData.baseX;
    tween(190, (k) => { actor.position.x = bx + dir * 1.8 * k; }, () => {
      // Impact
      shake = 0.16;
      if (target) {
        impactBurst(target.position.clone().add(new THREE.Vector3(0, 0.9, 0)), TYPE_FX[moveType] || 0xffffff);
        flash(target);
      }
      onImpact && onImpact();
      tween(300, (k) => { actor.position.x = bx + dir * 2.1 * (1 - k); }, resolve, easeOut);
    }, easeInOut);
  });
}

export function playKO(side) {
  return new Promise((resolve) => {
    const g = battlers[side];
    if (!g) return resolve();
    const rz = side === 'p' ? -Math.PI / 2 : Math.PI / 2;
    tween(550, (k) => {
      g.rotation.z = rz * k;
      g.position.y = g.userData.baseY - 0.35 * k;
      g.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 1 - k * 0.9; } });
    }, () => { disposeGroup(g); battlers[side] = null; resolve(); }, easeInOut);
  });
}

function flash(g) {
  const mats = [];
  g.traverse((o) => { if (o.material && o.material.emissive) mats.push(o.material); });
  const before = mats.map((m) => m.emissiveIntensity || 0);
  mats.forEach((m) => { m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 0.65; });
  setTimeout(() => mats.forEach((m, i) => { m.emissiveIntensity = before[i]; }), 130);
}

function impactBurst(pos, color) {
  const N = 26;
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(N * 3);
  const vel = [];
  for (let i = 0; i < N; i++) {
    p[i * 3] = pos.x; p[i * 3 + 1] = pos.y; p[i * 3 + 2] = pos.z;
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI;
    const s = 2 + Math.random() * 3.5;
    vel.push(new THREE.Vector3(Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s * 0.8 + 1, Math.sin(b) * Math.sin(a) * s));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  tween(620, (k) => {
    const attr = pts.geometry.attributes.position;
    for (let i = 0; i < N; i++) {
      attr.setXYZ(i,
        pos.x + vel[i].x * k * 0.62,
        pos.y + vel[i].y * k * 0.62 - 2.4 * k * k,
        pos.z + vel[i].z * k * 0.62);
    }
    attr.needsUpdate = true;
    mat.opacity = 1 - k;
  }, () => { scene.remove(pts); geo.dispose(); mat.dispose(); });
}

/** Coordonnées écran (px, relatives au conteneur) d'un combattant — pour les dégâts flottants */
export function screenPosOf(side) {
  const g = battlers[side];
  if (!g || !container) return { x: 0, y: 0 };
  const v = g.position.clone().add(new THREE.Vector3(0, 1.7, 0)).project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * container.clientWidth,
    y: (-v.y * 0.5 + 0.5) * container.clientHeight,
  };
}

// ───────────────────────── Portraits (cartes UI) ─────────────────────────
let thumbRenderer = null, thumbScene = null, thumbCam = null;
const thumbCache = new Map();

export function getThumb(speciesId, shiny = false) {
  const key = speciesId + (shiny ? '*' : '');
  if (thumbCache.has(key)) return thumbCache.get(key);
  if (!thumbRenderer) {
    thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbRenderer.setSize(160, 160);
    thumbRenderer.outputColorSpace = THREE.SRGBColorSpace;
    thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    thumbRenderer.toneMappingExposure = 1.25;
    thumbScene = new THREE.Scene();
    thumbScene.environment = makeStudioEnv(thumbRenderer);
    const key1 = new THREE.DirectionalLight(0xfff2e0, 2.6); key1.position.set(3, 5, 4); thumbScene.add(key1);
    const rim1 = new THREE.DirectionalLight(0x25d9ff, 1.6); rim1.position.set(-4, 2, -3); thumbScene.add(rim1);
    thumbScene.add(new THREE.AmbientLight(0x2a3558, 1.8));
    thumbCam = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  }
  const sp = SPECIES_BY_ID[speciesId];
  const g = buildCreature(sp, shiny);
  thumbScene.add(g);
  // Cadre : centre la créature selon sa taille
  const bb = new THREE.Box3().setFromObject(g);
  const center = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3()).length();
  thumbCam.position.set(center.x + size * 0.42, center.y + size * 0.3, center.z + size * 0.78);
  thumbCam.lookAt(center);
  thumbRenderer.render(thumbScene, thumbCam);
  const url = thumbRenderer.domElement.toDataURL('image/png');
  thumbScene.remove(g);
  disposeGroupOnly(g);
  thumbCache.set(key, url);
  return url;
}

// ───────────────────────── Construction des créatures ─────────────────────────
const noiseBumpTex = (() => {
  let tex = null;
  return () => {
    if (tex) return tex;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 118 + Math.random() * 20;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  };
})();

function shinyPalette(pal) {
  const shift = (hex, h) => { const c = new THREE.Color(hex); c.offsetHSL(h, 0.05, 0.06); return c.getHex(); };
  return { body: shift(pal.body, 0.11), belly: shift(pal.belly, 0.06), accent: 0xffd23f, eye: 0x00ffe1 };
}

function buildCreature(sp, shiny = false) {
  const pal = shiny ? shinyPalette(sp.palette) : sp.palette;
  const P = {
    // Fourrure : sheen doux / Écailles & carapaces : clearcoat
    fur: (c, o = {}) => new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.78, metalness: 0, sheen: 0.65, sheenRoughness: 0.6,
      sheenColor: new THREE.Color(c).multiplyScalar(1.4), bumpMap: noiseBumpTex(), bumpScale: 0.9, ...o,
    }),
    scale: (c, o = {}) => new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.42, metalness: 0.08, clearcoat: 0.55, clearcoatRoughness: 0.35,
      bumpMap: noiseBumpTex(), bumpScale: 1.4, ...o,
    }),
    rock: (c, o = {}) => new THREE.MeshStandardMaterial({
      color: c, roughness: 0.95, metalness: 0.04, flatShading: true, ...o,
    }),
    glow: (c, i = 1.6) => new THREE.MeshStandardMaterial({
      color: c, emissive: c, emissiveIntensity: i, roughness: 0.4,
    }),
    glass: (c) => new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.15, transmission: 0.35, thickness: 0.6, transparent: true, opacity: 0.92,
    }),
  };

  const g = new THREE.Group();
  const builders = {
    quadruped: buildQuadruped, feline: buildFeline, aquatic: buildAquatic,
    saurian: buildSaurian, avian: buildAvian, golem: buildGolem,
    mystic: buildMystic, grub: buildGrub, bat: buildBat,
  };
  (builders[sp.plan] || buildQuadruped)(g, sp, pal, P);

  // Aura du stade 3 + étincelles shiny
  if (sp.stage === 3) addAura(g, pal.accent, 34);
  if (shiny) addAura(g, 0xffd23f, 22);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  g.scale.setScalar(sp.size);

  // Enveloppe : l'orientation de pose (idle/combat) se fait sur le wrapper,
  // sans écraser l'orientation de base du modèle (tous les plans font face à +z)
  const wrapper = new THREE.Group();
  wrapper.add(g);
  wrapper.userData.anim = g.userData.anim;
  return wrapper;
}

// ─── Primitives organiques ───
function blob(r, sx, sy, sz, mat, noise = 0.045) {
  const geo = new THREE.SphereGeometry(r, 42, 30);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 7.3 + y * 5.1) * Math.cos(z * 6.7 - y * 3.9);
    const d = 1 + n * noise;
    p.setXYZ(i, x * d * sx, y * d * sy, z * d * sz);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

/** Chaîne effilée de sphères le long d'une courbe : queues, cous, tentacules */
function chain(points, r0, r1, mat, n = 14) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const group = new THREE.Group();
  const segs = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const r = r0 + (r1 - r0) * k;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat);
    const pos = curve.getPoint(k);
    m.position.copy(pos);
    m.userData.bx = pos.x;
    group.add(m);
    segs.push(m);
  }
  return { group, segs };
}

function limb(x1, y1, z1, x2, y2, z2, r, mat) {
  const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
  m.position.copy(a).lerp(b, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

/**
 * Œil directionnel : le groupe est tourné de `yaw` (0 = regarde +z).
 * Pour une tête orientée +x, passer yaw ≈ ±Math.PI/2 (légèrement ouvert vers l'extérieur).
 */
function addEye(g, x, y, z, s, irisColor, yaw = 0) {
  const eye = new THREE.Group();
  eye.position.set(x, y, z);
  eye.rotation.y = yaw;
  const white = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 16),
    new THREE.MeshPhysicalMaterial({ color: 0xf8f8f4, roughness: 0.1, clearcoat: 1 }));
  white.scale.z = 0.72;
  eye.add(white);
  const iris = new THREE.Mesh(new THREE.SphereGeometry(s * 0.62, 16, 12),
    new THREE.MeshPhysicalMaterial({ color: irisColor, roughness: 0.15, clearcoat: 1, emissive: irisColor, emissiveIntensity: 0.25 }));
  iris.position.z = s * 0.42;
  eye.add(iris);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.05 }));
  pupil.position.z = s * 0.62;
  eye.add(pupil);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glint.position.set(s * 0.2, s * 0.25, s * 0.68);
  eye.add(glint);
  g.add(eye);
}

function addAura(g, color, count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.95 + Math.random() * 0.55;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 1.9 - 0.3;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const orbit = new THREE.Points(geo, new THREE.PointsMaterial({
    color, size: 0.045, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  g.add(orbit);
  g.userData.anim = g.userData.anim || {};
  g.userData.anim.orbit = orbit;
}

function setAnim(g, body, extra = {}) {
  g.userData.anim = { ...(g.userData.anim || {}), body, bodyScale: body.scale.clone(), ...extra };
}

// ─── Plans corporels ───

// Renard / loup / souris — corps horizontal, 4 pattes, museau, queue touffue
function buildQuadruped(g, sp, pal, P) {
  const fur = P.fur(pal.body);
  const body = blob(0.52, 1.35, 0.95, 0.9, fur);
  body.position.y = 0.62;
  g.add(body);
  const chest = blob(0.4, 0.9, 0.85, 0.8, P.fur(pal.belly, { bumpScale: 0.5 }));
  chest.position.set(0.35, 0.56, 0);
  g.add(chest);

  const head = new THREE.Group();
  head.position.set(0.72, 1.05, 0);
  const skull = blob(0.34, 1, 0.95, 0.9, fur);
  head.add(skull);
  const muzzle = blob(0.16, 1.3, 0.75, 0.8, P.fur(pal.belly, { bumpScale: 0.4 }));
  muzzle.position.set(0.26, -0.08, 0);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), P.scale(0x1a1017));
  nose.position.set(0.44, -0.05, 0);
  head.add(nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.36, 14), fur);
    ear.position.set(-0.08, 0.36, s * 0.19);
    ear.rotation.x = s * 0.28; ear.rotation.z = -0.25;
    head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 10), P.fur(pal.belly));
    inner.position.set(-0.055, 0.33, s * 0.19);
    inner.rotation.x = s * 0.28; inner.rotation.z = -0.25;
    head.add(inner);
  }
  addEye(head, 0.24, 0.11, 0.16, 0.08, pal.eye, Math.PI / 2 - 0.55);
  addEye(head, 0.24, 0.11, -0.16, 0.08, pal.eye, Math.PI / 2 + 0.55);
  // Recompose les yeux vers l'avant du museau
  head.rotation.y = -Math.PI / 2 * 0; // la tête regarde +x
  g.add(head);

  // Pattes
  const legMat = P.fur(new THREE.Color(pal.body).multiplyScalar(0.85).getHex());
  g.add(limb(0.45, 0.55, 0.22, 0.5, 0.05, 0.24, 0.085, legMat));
  g.add(limb(0.45, 0.55, -0.22, 0.5, 0.05, -0.24, 0.085, legMat));
  g.add(limb(-0.42, 0.5, 0.22, -0.45, 0.05, 0.26, 0.095, legMat));
  g.add(limb(-0.42, 0.5, -0.22, -0.45, 0.05, -0.26, 0.095, legMat));

  // Queue touffue, pointe accent (braise pour le type feu)
  const tail = chain([[-0.62, 0.7, 0], [-1.0, 0.85, 0.05], [-1.3, 1.05, 0]], 0.16, 0.06, fur, 10);
  g.add(tail.group);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), P.glow(pal.accent, 1.8));
  tip.position.set(-1.32, 1.08, 0);
  g.add(tip);

  // Le corps fait face à +x → on le tourne pour faire face caméra (+z)
  g.rotation.y = -Math.PI / 2;
  setAnim(g, body, { head, tail: tail.segs });
}

// Félin — silhouette étirée, oreilles pointues, longue queue
function buildFeline(g, sp, pal, P) {
  const fur = P.fur(pal.body);
  const body = blob(0.46, 1.55, 0.82, 0.78, fur);
  body.position.y = 0.68;
  g.add(body);
  const chest = blob(0.34, 0.8, 0.8, 0.72, P.fur(pal.belly, { bumpScale: 0.4 }));
  chest.position.set(0.42, 0.62, 0);
  g.add(chest);

  const head = new THREE.Group();
  head.position.set(0.85, 1.12, 0);
  head.add(blob(0.28, 1, 0.92, 0.9, fur));
  const muzzle = blob(0.12, 1.15, 0.7, 0.85, P.fur(pal.belly));
  muzzle.position.set(0.2, -0.07, 0);
  head.add(muzzle);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 12), fur);
    ear.position.set(-0.04, 0.3, s * 0.15);
    ear.rotation.z = -0.2;
    head.add(ear);
  }
  addEye(head, 0.2, 0.08, 0.13, 0.07, pal.eye, Math.PI / 2 - 0.55);
  addEye(head, 0.2, 0.08, -0.13, 0.07, pal.eye, Math.PI / 2 + 0.55);
  g.add(head);

  const legMat = P.fur(new THREE.Color(pal.body).multiplyScalar(0.82).getHex());
  g.add(limb(0.55, 0.6, 0.18, 0.62, 0.04, 0.2, 0.07, legMat));
  g.add(limb(0.55, 0.6, -0.18, 0.62, 0.04, -0.2, 0.07, legMat));
  g.add(limb(-0.5, 0.55, 0.18, -0.55, 0.04, 0.22, 0.08, legMat));
  g.add(limb(-0.5, 0.55, -0.18, -0.55, 0.04, -0.22, 0.08, legMat));

  const tail = chain([[-0.65, 0.75, 0], [-1.1, 0.95, 0.12], [-1.45, 1.35, 0]], 0.09, 0.035, fur, 12);
  g.add(tail.group);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), P.glow(pal.accent, 1.5));
  tip.position.set(-1.46, 1.38, 0);
  g.add(tip);

  // Marques accent sur le dos
  for (let i = 0; i < 3; i++) {
    const stripe = blob(0.09, 1.6, 0.35, 0.9, P.fur(pal.accent));
    stripe.position.set(0.2 - i * 0.32, 1.06, 0);
    g.add(stripe);
  }

  g.rotation.y = -Math.PI / 2;
  setAnim(g, body, { head, tail: tail.segs });
}

// Poisson / cétacé — corps goutte, nageoires, flotte au-dessus du sol
function buildAquatic(g, sp, pal, P) {
  const skin = P.scale(pal.body);
  const body = blob(0.55, 1.5, 0.95, 0.82, skin, 0.03);
  body.position.y = 1.0;
  g.add(body);
  const belly = blob(0.42, 1.25, 0.75, 0.72, P.scale(pal.belly, { bumpScale: 0.5 }));
  belly.position.set(0.1, 0.86, 0);
  g.add(belly);

  // Queue : pédoncule + nageoire caudale en double lobe
  const tail = chain([[-0.7, 1.0, 0], [-1.05, 1.02, 0]], 0.2, 0.09, skin, 6);
  g.add(tail.group);
  for (const s of [-1, 1]) {
    const fluke = blob(0.2, 1.6, 0.5, 0.16, P.scale(pal.accent));
    fluke.position.set(-1.3, 1.05 + s * 0.14, 0);
    fluke.rotation.z = s * 0.7;
    g.add(fluke);
  }
  // Nageoire dorsale + latérales
  const dorsal = blob(0.18, 1.1, 1.4, 0.14, P.scale(pal.accent));
  dorsal.position.set(0.05, 1.55, 0);
  dorsal.rotation.z = -0.35;
  g.add(dorsal);
  const finL = blob(0.14, 1.5, 0.5, 0.12, P.scale(pal.accent));
  finL.position.set(0.25, 0.85, 0.42); finL.rotation.y = 0.5; finL.rotation.z = -0.4;
  g.add(finL);
  const finR = finL.clone(); finR.position.z = -0.42; finR.rotation.y = -0.5;
  g.add(finR);

  addEye(g, 0.62, 1.16, 0.24, 0.09, pal.eye, Math.PI / 2 - 0.65);
  addEye(g, 0.62, 1.16, -0.24, 0.09, pal.eye, Math.PI / 2 + 0.65);

  // Bouche souriante discrète
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 20, Math.PI * 0.8), P.scale(0x0a1a30));
  mouth.position.set(0.78, 0.95, 0);
  mouth.rotation.set(0, Math.PI / 2, Math.PI + 0.4);
  g.add(mouth);

  g.rotation.y = -Math.PI / 2;
  setAnim(g, body, { tail: tail.segs, float: true });
  g.position.y = 0.18;
}

// Dino / dragon — bipède, grosse queue, plaques dorsales, ailes au stade 3 feu
function buildSaurian(g, sp, pal, P) {
  const skin = P.scale(pal.body);
  const body = blob(0.5, 0.95, 1.25, 0.85, skin, 0.05);
  body.position.y = 0.85;
  body.rotation.x = 0.25;
  g.add(body);
  const belly = blob(0.36, 0.75, 1.0, 0.6, P.scale(pal.belly, { bumpScale: 0.6 }));
  belly.position.set(0, 0.75, 0.22);
  belly.rotation.x = 0.25;
  g.add(belly);

  const head = new THREE.Group();
  head.position.set(0, 1.62, 0.28);
  head.add(blob(0.3, 1.05, 0.9, 1.0, skin));
  const jaw = blob(0.14, 0.9, 0.55, 1.25, P.scale(pal.belly));
  jaw.position.set(0, -0.14, 0.2);
  head.add(jaw);
  // Cornes
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 10), P.scale(pal.accent));
    horn.position.set(s * 0.16, 0.26, -0.08);
    horn.rotation.z = -s * 0.45; horn.rotation.x = -0.3;
    head.add(horn);
  }
  addEye(head, 0.15, 0.05, 0.24, 0.075, pal.eye, 0.4);
  addEye(head, -0.15, 0.05, 0.24, 0.075, pal.eye, -0.4);
  g.add(head);

  // Jambes massives + petits bras
  const legMat = P.scale(new THREE.Color(pal.body).multiplyScalar(0.85).getHex());
  for (const s of [-1, 1]) {
    const thigh = blob(0.2, 0.8, 1.1, 0.8, legMat);
    thigh.position.set(s * 0.34, 0.42, 0);
    g.add(thigh);
    g.add(limb(s * 0.36, 0.3, 0.05, s * 0.4, 0.03, 0.12, 0.09, legMat));
    g.add(limb(s * 0.42, 1.05, 0.28, s * 0.55, 0.78, 0.42, 0.06, legMat));
  }

  // Queue épaisse
  const tail = chain([[0, 0.55, -0.35], [0, 0.42, -0.85], [0.08, 0.35, -1.3]], 0.2, 0.05, skin, 12);
  g.add(tail.group);

  // Plaques dorsales (feuilles pour plante, flammes pour feu)
  const plateMat = sp.type === 'feu' ? P.glow(pal.accent, 1.2) : P.scale(pal.accent);
  for (let i = 0; i < 4; i++) {
    const plate = blob(0.1, 0.5, 1.3, 0.16, plateMat);
    plate.position.set(0, 1.45 - i * 0.28, -0.18 - i * 0.16);
    plate.rotation.x = -0.5 - i * 0.12;
    g.add(plate);
  }

  // Ailes membraneuses pour le dragon final
  const wings = [];
  if (sp.stage === 3 && sp.type === 'feu') {
    for (const s of [-1, 1]) {
      const wing = new THREE.Group();
      wing.position.set(s * 0.3, 1.3, -0.15);
      const membrane = blob(0.34, 2.1, 1.0, 0.08, P.glass(pal.accent));
      membrane.position.set(s * 0.62, 0.12, 0);
      membrane.rotation.z = s * 0.35;
      wing.add(membrane);
      wing.userData.bz = s * 0.25;
      wing.rotation.z = s * 0.25;
      g.add(wing);
      wings.push(wing);
    }
  }

  setAnim(g, body, { head, tail: tail.segs, wings, flap: 1.8, flapAmp: 0.28 });
}

// Oiseau — corps rond, ailes, bec, plumes de queue
function buildAvian(g, sp, pal, P) {
  const feather = P.fur(pal.body, { sheen: 0.9, sheenRoughness: 0.4 });
  const body = blob(0.48, 0.92, 1.1, 0.88, feather, 0.05);
  body.position.y = 0.95;
  g.add(body);
  const belly = blob(0.36, 0.78, 0.95, 0.66, P.fur(pal.belly, { bumpScale: 0.4 }));
  belly.position.set(0, 0.85, 0.2);
  g.add(belly);

  const head = new THREE.Group();
  head.position.set(0, 1.62, 0.1);
  head.add(blob(0.27, 1, 0.95, 0.95, feather));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 12), P.scale(0xe8a23d));
  beak.position.set(0, -0.02, 0.32);
  beak.rotation.x = Math.PI / 2;
  head.add(beak);
  // Huppe accent
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 10), P.fur(pal.accent));
  crest.position.set(0, 0.3, -0.02);
  crest.rotation.x = -0.5;
  head.add(crest);
  addEye(head, 0.12, 0.06, 0.22, 0.07, pal.eye, 0.35);
  addEye(head, -0.12, 0.06, 0.22, 0.07, pal.eye, -0.35);
  g.add(head);

  // Ailes : masses de plumes superposées
  const wings = [];
  for (const s of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(s * 0.4, 1.1, 0);
    for (let i = 0; i < 3; i++) {
      const fm = blob(0.22 - i * 0.045, 1.9 - i * 0.3, 0.55, 0.2, i === 2 ? P.fur(pal.accent) : feather);
      fm.position.set(s * (0.3 + i * 0.22), -i * 0.1, -0.05 - i * 0.05);
      fm.rotation.z = s * (0.15 + i * 0.12);
      wing.add(fm);
    }
    wing.userData.bz = s * 0.12;
    wing.rotation.z = s * 0.12;
    g.add(wing);
    wings.push(wing);
  }

  // Plumes de queue
  for (let i = -1; i <= 1; i++) {
    const tf = blob(0.1, 0.4, 1.5, 0.12, i === 0 ? P.fur(pal.accent) : feather);
    tf.position.set(i * 0.14, 0.75, -0.55);
    tf.rotation.x = 1.1; tf.rotation.z = i * 0.25;
    g.add(tf);
  }

  // Pattes fines
  const legMat = P.scale(0xd9a23d);
  g.add(limb(0.14, 0.55, 0.05, 0.16, 0.02, 0.1, 0.035, legMat));
  g.add(limb(-0.14, 0.55, 0.05, -0.16, 0.02, 0.1, 0.035, legMat));

  setAnim(g, body, { head, wings, flap: 2.4, flapAmp: 0.2, float: sp.stage === 3 });
  if (sp.stage === 3) g.position.y = 0.12;
}

// Golem — roche facettée, cristaux, yeux lumineux
function buildGolem(g, sp, pal, P) {
  const rock = P.rock(pal.body);
  const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), rock);
  body.position.y = 0.78;
  body.scale.set(1, 1.05, 0.9);
  g.add(body);
  const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 1), P.rock(pal.belly));
  chest.position.set(0, 0.68, 0.28);
  chest.scale.set(0.9, 0.85, 0.5);
  g.add(chest);

  const head = new THREE.Group();
  head.position.set(0, 1.55, 0.08);
  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), rock);
  skull.scale.set(1, 0.85, 0.95);
  head.add(skull);
  // Yeux = gemmes lumineuses
  for (const s of [-1, 1]) {
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), P.glow(pal.eye, 2.2));
    gem.position.set(s * 0.14, 0.02, 0.26);
    head.add(gem);
  }
  g.add(head);

  // Bras et jambes trapus
  const dark = P.rock(new THREE.Color(pal.body).multiplyScalar(0.8).getHex());
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), dark);
    shoulder.position.set(s * 0.68, 1.05, 0);
    g.add(shoulder);
    g.add(limb(s * 0.72, 0.95, 0, s * 0.85, 0.35, 0.1, 0.13, dark));
    const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.19, 0), rock);
    fist.position.set(s * 0.87, 0.28, 0.12);
    g.add(fist);
    g.add(limb(s * 0.3, 0.35, 0, s * 0.36, 0.02, 0.08, 0.15, dark));
  }

  // Cristaux dorsaux (accent — turquoise pour le stade final)
  const n = 2 + sp.stage;
  for (let i = 0; i < n; i++) {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 + Math.random() * 0.07, 0), P.glow(pal.accent, sp.stage === 3 ? 1.8 : 0.7));
    crystal.position.set((Math.random() - 0.5) * 0.6, 1.1 + Math.random() * 0.4, -0.42);
    crystal.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(crystal);
  }
  // Fissures lumineuses au stade 3
  if (sp.stage === 3) {
    for (let i = 0; i < 4; i++) {
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3 + Math.random() * 0.25, 0.03), P.glow(pal.accent, 2.4));
      crack.position.set((Math.random() - 0.5) * 0.7, 0.6 + Math.random() * 0.5, 0.42);
      crack.rotation.z = (Math.random() - 0.5) * 1.2;
      g.add(crack);
    }
  }

  setAnim(g, body, { head });
}

// Mystique — orbe flottant, tentacules/voiles, anneaux en orbite
function buildMystic(g, sp, pal, P) {
  const skin = P.glass(pal.body);
  const body = blob(0.52, 1, 1.08, 1, skin, 0.03);
  body.position.y = 1.25;
  g.add(body);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), P.glow(pal.accent, 2.2));
  core.position.y = 1.25;
  g.add(core);

  // Grand œil central (Abyssum) ou deux yeux
  if (sp.id === 'abyssum') {
    addEye(g, 0, 1.32, 0.46, 0.17, pal.eye, 0);
  } else {
    addEye(g, 0.17, 1.35, 0.44, 0.09, pal.eye, 0.3);
    addEye(g, -0.17, 1.35, 0.44, 0.09, pal.eye, -0.3);
  }

  // Tentacules suspendus
  const tentMat = P.scale(pal.body, { transparent: true, opacity: 0.95 });
  const tails = [];
  const nT = sp.stage === 1 ? 6 : 8;
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2;
    const r0 = 0.3;
    const t = chain(
      [[Math.cos(a) * r0, 0.9, Math.sin(a) * r0],
       [Math.cos(a) * (r0 + 0.15), 0.55, Math.sin(a) * (r0 + 0.15)],
       [Math.cos(a) * (r0 + 0.05), 0.22, Math.sin(a) * (r0 + 0.28)]],
      0.07, 0.02, tentMat, 8);
    g.add(t.group);
    tails.push(...t.segs);
  }

  // Anneaux mystiques en orbite (stade ≥ 2)
  if (sp.stage >= 2) {
    const ringHolder = new THREE.Group();
    ringHolder.position.y = 1.25;
    for (let i = 0; i < sp.stage - 1 + 1; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75 + i * 0.2, 0.02, 8, 48), P.glow(pal.accent, 1.6));
      ring.rotation.x = Math.PI / 2 + (i - 0.5) * 0.5;
      ringHolder.add(ring);
    }
    g.add(ringHolder);
    g.userData.anim = g.userData.anim || {};
    g.userData.anim.orbit = ringHolder;
  }

  setAnim(g, body, { tail: tails, float: true });
  g.position.y = 0.15;
}

// Chenille — segments, feuille sur la tête
function buildGrub(g, sp, pal, P) {
  const skin = P.scale(pal.body);
  const segs = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const r = 0.3 - i * 0.035;
    const seg = blob(r, 1, 0.95, 1, i % 2 ? P.scale(pal.belly) : skin, 0.03);
    seg.position.set(0.35 - i * 0.34, 0.32 + Math.sin(i * 0.9) * 0.05, 0);
    seg.userData.bx = seg.position.x;
    g.add(seg);
    segs.push(seg);
  }
  // Tête
  const head = new THREE.Group();
  head.position.set(0.62, 0.48, 0);
  head.add(blob(0.3, 1, 1, 0.95, skin));
  addEye(head, 0.2, 0.09, 0.14, 0.08, pal.eye, Math.PI / 2 - 0.55);
  addEye(head, 0.2, 0.09, -0.14, 0.08, pal.eye, Math.PI / 2 + 0.55);
  // Feuille sur la tête
  const leaf = blob(0.16, 1.7, 0.5, 0.1, P.scale(pal.accent));
  leaf.position.set(-0.02, 0.38, 0);
  leaf.rotation.z = 0.5;
  head.add(leaf);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.16, 8), P.scale(pal.accent));
  stem.position.set(0, 0.28, 0);
  head.add(stem);
  g.add(head);

  // Petites pattes
  for (let i = 0; i < n; i++) {
    for (const s of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), P.scale(pal.belly));
      foot.position.set(0.35 - i * 0.34, 0.06, s * (0.24 - i * 0.02));
      g.add(foot);
    }
  }

  g.rotation.y = -Math.PI / 2;
  setAnim(g, segs[0], { head, tail: segs.slice(1) });
}

// Chauve-souris — corps compact, grandes ailes membraneuses, flotte
function buildBat(g, sp, pal, P) {
  const fur = P.fur(pal.body);
  const body = blob(0.4, 0.95, 1.05, 0.9, fur, 0.05);
  body.position.y = 1.1;
  g.add(body);
  const belly = blob(0.28, 0.85, 0.85, 0.6, P.fur(pal.belly));
  belly.position.set(0, 1.0, 0.18);
  g.add(belly);

  const head = new THREE.Group();
  head.position.set(0, 1.58, 0.06);
  head.add(blob(0.26, 1, 0.9, 0.9, fur));
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 12), fur);
    ear.position.set(s * 0.14, 0.3, 0);
    ear.rotation.z = -s * 0.3;
    head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), P.fur(pal.accent));
    inner.position.set(s * 0.13, 0.27, 0.03);
    inner.rotation.z = -s * 0.3;
    head.add(inner);
  }
  addEye(head, 0.1, 0.04, 0.22, 0.075, pal.eye, 0.3);
  addEye(head, -0.1, 0.04, 0.22, 0.075, pal.eye, -0.3);
  // Petits crocs
  for (const s of [-1, 1]) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 6), P.scale(0xffffff));
    fang.position.set(s * 0.07, -0.16, 0.2);
    fang.rotation.x = Math.PI;
    head.add(fang);
  }
  g.add(head);

  // Ailes membraneuses : bras + membrane translucide
  const wings = [];
  for (const s of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(s * 0.3, 1.25, -0.05);
    const armMat = P.fur(new THREE.Color(pal.body).multiplyScalar(0.8).getHex());
    wing.add(limb(0, 0, 0, s * 0.55, 0.25, -0.05, 0.045, armMat));
    wing.add(limb(s * 0.55, 0.25, -0.05, s * 1.0, 0.05, -0.1, 0.035, armMat));
    const membrane = blob(0.3, 1.9, 0.9, 0.06, P.glass(pal.accent));
    membrane.position.set(s * 0.55, -0.05, -0.08);
    membrane.rotation.z = s * 0.15;
    wing.add(membrane);
    wing.userData.bz = s * 0.18;
    wing.rotation.z = s * 0.18;
    g.add(wing);
    wings.push(wing);
  }

  // Petites pattes repliées
  for (const s of [-1, 1]) {
    g.add(limb(s * 0.12, 0.78, 0.05, s * 0.16, 0.62, 0.1, 0.04, fur));
  }

  setAnim(g, body, { head, wings, flap: 3.4, flapAmp: 0.3, float: true });
  g.position.y = 0.2;
}

// ─── Nettoyage mémoire ───
function disposeGroup(g) {
  scene.remove(g);
  disposeGroupOnly(g);
}
function disposeGroupOnly(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material.dispose();
    }
  });
}
