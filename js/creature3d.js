// ═══════════ Visualiseur 3D : créatures low-poly procédurales (Three.js) ═══════════
import * as THREE from './vendor/three.module.js';
import { TYPE_COLORS, SPECIES_BY_ID } from './data.js';

let renderer, scene, camera, creatureGroup, animId;

export function initViewer(container) {
  const w = container.clientWidth || 380;
  const h = container.clientHeight || 300;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 1.4, 5);
  camera.lookAt(0, 0.6, 0);

  // Lumières
  scene.add(new THREE.AmbientLight(0x8890c0, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x4f7cff, 0.8);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // Sol : disque style "arène"
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.4, 0.15, 32),
    new THREE.MeshStandardMaterial({ color: 0x222a5c, roughness: 0.8 })
  );
  ground.position.y = -0.85;
  scene.add(ground);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.04, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0x8a6d00, roughness: 0.4 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.76;
  scene.add(ring);

  animate();

  window.addEventListener('resize', () => {
    const w2 = container.clientWidth, h2 = container.clientHeight;
    if (!w2 || !h2) return;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });
}

function animate() {
  animId = requestAnimationFrame(animate);
  if (creatureGroup) {
    creatureGroup.rotation.y += 0.008;
    creatureGroup.position.y = Math.sin(Date.now() * 0.002) * 0.07; // flottement
  }
  renderer.render(scene, camera);
}

/** Affiche l'espèce donnée dans le visualiseur */
export function showSpecies(speciesId) {
  if (!scene) return;
  if (creatureGroup) {
    scene.remove(creatureGroup);
    creatureGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  }
  creatureGroup = buildCreature(SPECIES_BY_ID[speciesId]);
  scene.add(creatureGroup);
}

// ─── Génération procédurale : le corps varie selon le type & le stade ───
function buildCreature(sp) {
  const [bodyC, bellyC, ornC] = TYPE_COLORS[sp.type];
  const g = new THREE.Group();
  const scale = 0.75 + sp.stage * 0.28; // plus évolué = plus grand

  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, flatShading: true, ...opts });

  // Corps
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), mat(bodyC));
  body.scale.set(1, 1.12, 0.95);
  g.add(body);

  // Ventre
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mat(bellyC));
  belly.position.set(0, -0.08, 0.3);
  belly.scale.set(0.85, 0.95, 0.55);
  g.add(belly);

  // Tête
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat(bodyC));
  head.position.set(0, 0.78, 0.12);
  g.add(head);

  // Yeux
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0xffffff, { roughness: 0.2 }));
    eye.position.set(side * 0.18, 0.84, 0.42);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x101020, { roughness: 0.1 }));
    pupil.position.set(side * 0.18, 0.84, 0.5);
    g.add(pupil);
  }

  // Oreilles / cornes selon le stade
  const earGeo = new THREE.ConeGeometry(0.13, 0.35 + sp.stage * 0.08, 6);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat(ornC));
    ear.position.set(side * 0.26, 1.16, 0.05);
    ear.rotation.z = -side * 0.35;
    g.add(ear);
  }

  // Pattes
  const legGeo = new THREE.SphereGeometry(0.16, 8, 6);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, mat(bodyC));
    leg.position.set(side * 0.34, -0.62, 0.12);
    leg.scale.set(1, 0.7, 1.2);
    g.add(leg);
    const arm = new THREE.Mesh(legGeo, mat(bodyC));
    arm.position.set(side * 0.58, 0.05, 0.1);
    arm.scale.set(0.75, 0.75, 0.75);
    g.add(arm);
  }

  // Ornements spécifiques au type
  addTypeOrnaments(g, sp, mat, ornC);

  // Stade 3 : aura de particules
  if (sp.stage === 3) {
    const pGeo = new THREE.BufferGeometry();
    const N = 40;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.9 + Math.random() * 0.5;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 1.6 - 0.4;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: ornC, size: 0.05, transparent: true, opacity: 0.9 }));
    g.add(pts);
  }

  g.scale.setScalar(scale);
  g.position.y = 0.1;
  return g;
}

function addTypeOrnaments(g, sp, mat, ornC) {
  switch (sp.type) {
    case 'feu': { // flamme sur la queue
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), mat(ornC, { emissive: 0xff3d00, emissiveIntensity: 0.6 }));
      flame.position.set(0, 0.15, -0.72);
      flame.rotation.x = -0.9;
      g.add(flame);
      break;
    }
    case 'eau': { // nageoire dorsale
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 4), mat(ornC));
      fin.position.set(0, 0.62, -0.35);
      fin.rotation.x = -0.5;
      g.add(fin);
      break;
    }
    case 'plante': { // feuilles sur la tête
      for (let i = 0; i < 3; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), mat(ornC));
        leaf.position.set((i - 1) * 0.14, 1.22, -0.05);
        leaf.rotation.z = (i - 1) * 0.5;
        leaf.rotation.x = -0.3;
        g.add(leaf);
      }
      break;
    }
    case 'electrik': { // éclair flottant
      const bolt = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), mat(ornC, { emissive: 0xffd23f, emissiveIntensity: 0.7 }));
      bolt.position.set(0.6, 1.05, 0);
      g.add(bolt);
      break;
    }
    case 'roche': { // plaques rocheuses sur le dos
      for (let i = 0; i < 3; i++) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), mat(ornC));
        rock.position.set((i - 1) * 0.25, 0.45 - Math.abs(i - 1) * 0.1, -0.5);
        g.add(rock);
      }
      break;
    }
    case 'psy': { // troisième œil / gemme
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), mat(ornC, { emissive: 0x8e24aa, emissiveIntensity: 0.8 }));
      gem.position.set(0, 1.02, 0.38);
      g.add(gem);
      break;
    }
    case 'vent': { // petites ailes
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 4), mat(ornC));
        wing.position.set(side * 0.55, 0.45, -0.25);
        wing.rotation.z = side * 1.9;
        wing.rotation.y = side * 0.4;
        g.add(wing);
      }
      break;
    }
    case 'ombre': { // brume sombre (anneaux)
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 24), mat(ornC, { transparent: true, opacity: 0.7 }));
      halo.rotation.x = Math.PI / 2.3;
      halo.position.y = 0.2;
      g.add(halo);
      break;
    }
  }
}
