// Visionneuse de dev : http://localhost:8931/dev/viewer.html?species=braisou&angle=0.6
// window.__ready passe à true quand la créature est affichée (pour les captures).
import * as THREE from '../js/vendor/three.module.js';
import { BUILDERS } from '../js/toon/index.js';

const params = new URLSearchParams(location.search);
const speciesId = params.get('species') || 'braisou';
const startAngle = parseFloat(params.get('angle') || '0.35');
document.getElementById('label').textContent = speciesId.toUpperCase();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.05, 60);

const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(2.5, 5, 3.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
scene.add(new THREE.AmbientLight(0xcfe0ff, 1.5));
const warm = new THREE.DirectionalLight(0xffd9a8, 0.6);
warm.position.set(-3, 2, -2);
scene.add(warm);

// Sol simple
{
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 30, 128, 128, 128);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.7, '#dceafc'); grad.addColorStop(1, 'rgba(220,234,252,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 40),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
}

const builder = BUILDERS[speciesId];
if (!builder) {
  document.getElementById('label').textContent = 'ESPÈCE INCONNUE : ' + speciesId;
  window.__ready = 'error';
  throw new Error('unknown species');
}
const creature = builder();
scene.add(creature);

// Cadrage automatique selon la taille du modèle
const bb = new THREE.Box3().setFromObject(creature);
const center = bb.getCenter(new THREE.Vector3());
const size = bb.getSize(new THREE.Vector3());
const dist = Math.max(size.y, size.x) * 2.35 + 0.6;
let theta = startAngle;
function placeCam() {
  camera.position.set(center.x + Math.sin(theta) * dist, center.y + size.y * 0.28, center.z + Math.cos(theta) * dist);
  camera.lookAt(center.x, center.y - size.y * 0.05, center.z);
}
placeCam();

// Drag pour tourner
let dragging = false, px = 0;
addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; });
addEventListener('pointermove', (e) => { if (dragging) { theta -= (e.clientX - px) * 0.007; px = e.clientX; } });
addEventListener('pointerup', () => { dragging = false; });

// Boutons expressions
const face = creature.userData.face;
const exprWrap = document.getElementById('exprs');
for (const e of ['normal', 'happy', 'surprised', 'angry', 'wink', 'ko']) {
  const b = document.createElement('button');
  b.textContent = e;
  b.onclick = () => face && face.setExpression(e);
  exprWrap.appendChild(b);
}
// ?expr=happy force une expression (pour les captures)
const forced = params.get('expr');
if (forced && face) face.setExpression(forced);

// Animation identique à l'engin du jeu
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05) || 0.016;
  const t = clock.elapsedTime;
  const a = creature.userData.anim || {};
  const bounce = Math.sin(t * 2.6);
  creature.scale.set(1 - bounce * 0.012, 1 + bounce * 0.025, 1 - bounce * 0.012);
  if (a.body && a.bodyScale) {
    const breathe = 1 + Math.sin(t * 2.1) * 0.015;
    a.body.scale.set(a.bodyScale.x * breathe, a.bodyScale.y * (2 - breathe), a.bodyScale.z * breathe);
  }
  if (a.head) { a.head.rotation.y = Math.sin(t * 0.5) * 0.09; a.head.rotation.z = Math.sin(t * 0.9) * 0.035; }
  if (a.tailGroup) { a.tailGroup.rotation.y = Math.sin(t * 3.0) * 0.15; a.tailGroup.rotation.x = Math.sin(t * 2.1) * 0.05; }
  if (a.tail) a.tail.forEach((seg, i) => {
    if (seg.userData.bx !== undefined) seg.position.x = seg.userData.bx + Math.sin(t * 2.4 + i * 0.55) * 0.03 * (i + 1);
  });
  if (a.wings) a.wings.forEach((w, i) => {
    w.rotation.z = (w.userData.bz || 0) + Math.sin(t * (a.flap || 2.6) + i) * (a.flapAmp || 0.22) * (i % 2 ? -1 : 1);
  });
  if (a.float) creature.position.y = Math.sin(t * 1.6) * 0.06 + 0.04;
  if (a.orbit) a.orbit.rotation.y = t * 0.8;
  if (a.face && a.face.update) a.face.update(dt);
  creature.traverse((o) => {
    if (o.userData && o.userData.isFlame) {
      const fl = 1 + Math.sin(t * 9 + o.id) * 0.12;
      o.scale.set(1, fl, 1);
      o.rotation.y = t * 1.4;
    }
  });
  if (!dragging && params.get('spin') !== '0') { theta += dt * 0.15; }
  placeCam();
  renderer.render(scene, camera);
}
animate();
setTimeout(() => { window.__ready = true; }, 600);
