// ═══════════ Moteur de scène TOON : style "Pokémon 3D" ═══════════
// Cel-shading, contours d'anime, arène lumineuse, expressions de visage,
// scène de combat à deux créatures, portraits rendus pour l'UI.
// Les modèles viennent du registre js/toon/index.js (un fichier par lignée).

import * as THREE from './vendor/three.module.js';
import { SPECIES_BY_ID, TYPE_FX } from './data.js';
import { BUILDERS } from './toon/index.js';

let renderer, scene, camera, clock;
let container = null;
let resizeObserver = null;
let idleGroup = null;
const battlers = { p: null, e: null };
let mode = 'idle';
let shake = 0;
const tweens = [];

// ───────────────────────── Scène principale ─────────────────────────
export function initStage(el) {
  container = el;
  const w = el.clientWidth || 800, h = el.clientHeight || 420;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(36, w / h, 0.05, 80);
  setCameraIdle();

  // Éclairage toon : clair et net
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(2.5, 5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  key.shadow.radius = 8;
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xcfe0ff, 1.5));
  const warm = new THREE.DirectionalLight(0xffd9a8, 0.6);
  warm.position.set(-3, 2, -2);
  scene.add(warm);

  buildArena();

  clock = new THREE.Clock();
  animate();

  resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(el);
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
  if (resizeObserver && container) resizeObserver.unobserve(container);
  container = el;
  el.appendChild(renderer.domElement);
  if (resizeObserver) resizeObserver.observe(el);
  resize();
}

function setCameraIdle() { camera.position.set(0, 0.72, 2.9); camera.lookAt(0, 0.55, 0); }
function setCameraBattle() { camera.position.set(0, 1.35, 4.9); camera.lookAt(0, 0.6, 0); }

function buildArena() {
  // Ciel doux en fond
  const skyC = document.createElement('canvas'); skyC.width = 2; skyC.height = 256;
  const sg = skyC.getContext('2d');
  const grad = sg.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#8ec9f5'); grad.addColorStop(0.6, '#cfe8fc'); grad.addColorStop(1, '#eef7ff');
  sg.fillStyle = grad; sg.fillRect(0, 0, 2, 256);
  const skyTex = new THREE.CanvasTexture(skyC);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;

  // Terrain : herbe stylisée claire
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const rad = g.createRadialGradient(256, 256, 60, 256, 256, 256);
  rad.addColorStop(0, '#bfe8a8'); rad.addColorStop(0.65, '#9ed489'); rad.addColorStop(1, '#7abf6e');
  g.fillStyle = rad; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { // brins stylisés
    g.strokeStyle = `rgba(60,130,60,${0.05 + Math.random() * 0.1})`;
    g.lineWidth = 1.5;
    const x = Math.random() * 512, y = Math.random() * 512;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 5, y - 4 - Math.random() * 5); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 48),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Anneau d'arène blanc
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.03, 8, 80),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.005;
  scene.add(ring);

  // Petits nuages toon qui flottent
  for (let i = 0; i < 5; i++) {
    const cloud = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.25 + Math.random() * 0.2, 14, 10), m);
      puff.position.set(j * 0.32 - 0.3, Math.random() * 0.08, 0);
      puff.scale.y = 0.6;
      cloud.add(puff);
    }
    const a = (i / 5) * Math.PI * 2;
    cloud.position.set(Math.cos(a) * 7, 2.4 + Math.random() * 1.6, Math.sin(a) * 7 - 2);
    cloud.userData.speed = 0.03 + Math.random() * 0.04;
    scene.add(cloud);
    clouds.push(cloud);
  }
}
const clouds = [];

// ───────────────────────── Boucle d'animation ─────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05) || 0.016;
  const t = clock.elapsedTime;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const k = Math.min(1, (performance.now() - tw.t0) / tw.dur);
    tw.fn(tw.ease ? tw.ease(k) : k);
    if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
  }

  if (mode === 'idle' && idleGroup) {
    animateCreature(idleGroup, t, dt);
    idleGroup.rotation.y = Math.sin(t * 0.25) * 0.28 + 0.1;
    camera.position.x = Math.sin(t * 0.12) * 0.15;
    camera.lookAt(0, 0.55, 0);
  }
  if (mode === 'battle') {
    for (const side of ['p', 'e']) {
      if (battlers[side]) animateCreature(battlers[side], t + (side === 'e' ? 3.1 : 0), dt);
    }
  }

  for (const cloud of clouds) {
    cloud.position.x += cloud.userData.speed * dt;
    if (cloud.position.x > 9) cloud.position.x = -9;
  }

  if (shake > 0.002) {
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake;
    shake *= 0.86;
  }

  renderer.render(scene, camera);
}

/** Vie permanente : respiration, rebond, queue, ailes, flottement, visage */
function animateCreature(wrapper, t, dt) {
  const g = wrapper.userData.inner || wrapper;
  const a = g.userData.anim || {};
  const face = g.userData.face;

  // Squash & stretch de dessin animé
  const bounce = Math.sin(t * 2.6);
  const base = wrapper.userData.baseScale || 1;
  wrapper.scale.set(base * (1 - bounce * 0.012), base * (1 + bounce * 0.025), base * (1 - bounce * 0.012));

  if (a.body && a.bodyScale) {
    const breathe = 1 + Math.sin(t * 2.1) * 0.015;
    a.body.scale.set(a.bodyScale.x * breathe, a.bodyScale.y * (2 - breathe), a.bodyScale.z * breathe);
  }
  if (a.head) {
    a.head.rotation.y = Math.sin(t * 0.5) * 0.09;
    a.head.rotation.z = Math.sin(t * 0.9) * 0.035;
  }
  if (a.tailGroup) {
    a.tailGroup.rotation.y = Math.sin(t * 3.0) * 0.15;
    a.tailGroup.rotation.x = Math.sin(t * 2.1) * 0.05;
  }
  if (a.tail) a.tail.forEach((seg, i) => {
    if (seg.userData.bx !== undefined) seg.position.x = seg.userData.bx + Math.sin(t * 2.4 + i * 0.55) * 0.03 * (i + 1);
  });
  if (a.wings) a.wings.forEach((w, i) => {
    w.rotation.z = (w.userData.bz || 0) + Math.sin(t * (a.flap || 2.6) + i) * (a.flapAmp || 0.22) * (i % 2 ? -1 : 1);
  });
  if (a.float) wrapper.position.y = (wrapper.userData.baseY || 0) + Math.sin(t * 1.6) * 0.06 + 0.04;
  if (a.orbit) a.orbit.rotation.y = t * 0.8;
  if (face && face.update) face.update(dt);

  // Flammes toon : scintillement
  g.traverse((o) => {
    if (o.userData && o.userData.isFlame) {
      const fl = 1 + Math.sin(t * 9 + o.id) * 0.12 + Math.sin(t * 23) * 0.06;
      o.scale.set(1, fl, 1);
      o.rotation.y = t * 1.4;
    }
  });
}

function tween(dur, fn, done, ease) { tweens.push({ t0: performance.now(), dur, fn, done, ease }); }
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

// ───────────────────────── Construction ─────────────────────────
function buildCreature(sp, shiny = false) {
  const builder = BUILDERS[sp.id];
  const inner = builder ? builder() : new THREE.Group();

  if (shiny) {
    // Variante chromatique : teinte dorée + étoiles
    inner.traverse((o) => {
      if (o.isMesh && o.material && o.material.color && o.material !== undefined && !o.material.map) {
        if (o.material.side !== THREE.BackSide) o.material.color.offsetHSL(0.1, 0.06, 0.05);
      }
    });
    const N = 16;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.random() * 0.35;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 0.2 + Math.random() * 0.9;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffd23f, size: 0.05, transparent: true, opacity: 0.95, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    inner.add(stars);
  }

  const wrapper = new THREE.Group();
  wrapper.add(inner);
  wrapper.userData.inner = inner;
  return wrapper;
}

// ───────────────────────── Modes ─────────────────────────
export function showSpecies(speciesId, shiny = false) {
  mode = 'idle';
  setCameraIdle();
  clearBattlers();
  if (idleGroup) disposeGroup(idleGroup);
  idleGroup = buildCreature(SPECIES_BY_ID[speciesId], shiny);
  idleGroup.userData.baseY = 0;
  idleGroup.userData.baseScale = 1;
  scene.add(idleGroup);
  idleGroup.scale.setScalar(0.01);
  tween(420, (k) => idleGroup && idleGroup.scale.setScalar(0.01 + 0.99 * k), null, easeOut);
}

/** Petit saut joyeux de la créature d'équipe (clic sur la scène) */
export function pokeIdle() {
  if (mode !== 'idle' || !idleGroup) return;
  const g = idleGroup;
  const face = g.userData.inner?.userData.face;
  if (face) face.setExpression('happy', 1500);
  tween(600, (k) => {
    if (!idleGroup) return;
    g.position.y = Math.sin(k * Math.PI) * 0.3;
  }, null, easeInOut);
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
  const x = side === 'p' ? -1.55 : 1.55;
  g.position.x = x;
  g.rotation.y = side === 'p' ? Math.PI / 2.3 : -Math.PI / 2.3;
  g.userData.baseY = 0;
  g.userData.baseX = x;
  g.userData.baseScale = 1;
  scene.add(g);
  battlers[side] = g;
  g.scale.setScalar(0.01);
  tween(380, (k) => g.scale.setScalar(0.01 + 0.99 * k), null, easeOut);
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

/** Expression d'un combattant ('p'|'e') : happy, angry, surprised, ko… */
export function setBattlerExpression(side, expr, revertMs = 1200) {
  const g = battlers[side];
  const face = g?.userData.inner?.userData.face;
  if (face) face.setExpression(expr, revertMs);
}

export function playAttack(side, moveType, onImpact) {
  return new Promise((resolve) => {
    const actor = battlers[side];
    const target = battlers[side === 'p' ? 'e' : 'p'];
    if (!actor) { onImpact && onImpact(); resolve(); return; }
    const dir = side === 'p' ? 1 : -1;
    const bx = actor.userData.baseX;
    setBattlerExpression(side, 'angry', 900);
    tween(190, (k) => { actor.position.x = bx + dir * 1.4 * k; }, () => {
      shake = 0.13;
      if (target) {
        impactBurst(target.position.clone().add(new THREE.Vector3(0, 0.6, 0)), TYPE_FX[moveType] || 0xffffff);
        flash(target);
        setBattlerExpression(side === 'p' ? 'e' : 'p', 'surprised', 900);
      }
      onImpact && onImpact();
      tween(300, (k) => { actor.position.x = bx + dir * 1.4 * (1 - k); }, resolve, easeOut);
    }, easeInOut);
  });
}

export function playKO(side) {
  return new Promise((resolve) => {
    const g = battlers[side];
    if (!g) return resolve();
    setBattlerExpression(side, 'ko', 4000);
    const rz = side === 'p' ? -Math.PI / 2 : Math.PI / 2;
    tween(550, (k) => {
      g.rotation.z = rz * k;
      g.position.y = -0.25 * k;
      g.traverse((o) => { if (o.material && o.material.opacity !== undefined) { o.material.transparent = true; o.material.opacity = 1 - k * 0.85; } });
    }, () => { disposeGroup(g); battlers[side] = null; resolve(); }, easeInOut);
  });
}

function flash(g) {
  const mats = [];
  g.traverse((o) => { if (o.material && o.material.emissive) mats.push(o.material); });
  // Sauvegarde couleur ET intensité : les restaurer à moitié laissait tout blanc (bug d'affichage en combat)
  const before = mats.map((m) => ({ e: m.emissive.clone(), i: m.emissiveIntensity }));
  mats.forEach((m) => { m.emissive.set(0xffffff); m.emissiveIntensity = 0.45; });
  setTimeout(() => mats.forEach((m, i) => { m.emissive.copy(before[i].e); m.emissiveIntensity = before[i].i; }), 130);
}

function impactBurst(pos, color) {
  const N = 22;
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(N * 3);
  const vel = [];
  for (let i = 0; i < N; i++) {
    p[i * 3] = pos.x; p[i * 3 + 1] = pos.y; p[i * 3 + 2] = pos.z;
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI;
    const s = 1.6 + Math.random() * 2.6;
    vel.push(new THREE.Vector3(Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s * 0.8 + 1, Math.sin(b) * Math.sin(a) * s));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.08, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  tween(620, (k) => {
    const attr = pts.geometry.attributes.position;
    for (let i = 0; i < N; i++) {
      attr.setXYZ(i,
        pos.x + vel[i].x * k * 0.55,
        pos.y + vel[i].y * k * 0.55 - 2.0 * k * k,
        pos.z + vel[i].z * k * 0.55);
    }
    attr.needsUpdate = true;
    mat.opacity = 1 - k;
  }, () => { scene.remove(pts); geo.dispose(); mat.dispose(); });
}

export function screenPosOf(side) {
  const g = battlers[side];
  if (!g || !container) return { x: 0, y: 0 };
  const v = g.position.clone().add(new THREE.Vector3(0, 1.3, 0)).project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * container.clientWidth,
    y: (-v.y * 0.5 + 0.5) * container.clientHeight,
  };
}

// ───────────────────────── Portraits ─────────────────────────
let thumbRenderer = null, thumbScene = null, thumbCam = null;
const thumbCache = new Map();

export function getThumb(speciesId, shiny = false) {
  const key = speciesId + (shiny ? '*' : '');
  if (thumbCache.has(key)) return thumbCache.get(key);
  if (!thumbRenderer) {
    thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbRenderer.setSize(160, 160);
    thumbRenderer.outputColorSpace = THREE.SRGBColorSpace;
    thumbScene = new THREE.Scene();
    const k1 = new THREE.DirectionalLight(0xffffff, 2.6); k1.position.set(3, 5, 4); thumbScene.add(k1);
    thumbScene.add(new THREE.AmbientLight(0xcfe0ff, 1.7));
    thumbCam = new THREE.PerspectiveCamera(35, 1, 0.05, 40);
  }
  const sp = SPECIES_BY_ID[speciesId];
  const g = buildCreature(sp, shiny);
  thumbScene.add(g);
  const bb = new THREE.Box3().setFromObject(g);
  const center = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3()).length();
  thumbCam.position.set(center.x + size * 0.3, center.y + size * 0.22, center.z + size * 0.85);
  thumbCam.lookAt(center);
  thumbRenderer.render(thumbScene, thumbCam);
  const url = thumbRenderer.domElement.toDataURL('image/png');
  thumbScene.remove(g);
  disposeGroupOnly(g);
  thumbCache.set(key, url);
  return url;
}

// ───────────────────────── Nettoyage ─────────────────────────
function disposeGroup(g) {
  scene.remove(g);
  disposeGroupOnly(g);
}
function disposeGroupOnly(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.map && m.map.isCanvasTexture) m.map.dispose();
        m.dispose();
      }
    }
  });
}
