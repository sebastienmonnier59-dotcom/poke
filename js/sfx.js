// ═══════════ Effets sonores synthétisés (WebAudio, zéro asset) ═══════════
import { state } from './state.js';

let ctx = null;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Débloque l'audio au premier geste utilisateur (politique navigateur)
export function initAudio() {
  const unlock = () => { ac(); document.removeEventListener('pointerdown', unlock); };
  document.addEventListener('pointerdown', unlock);
}

function tone(freq, dur, type = 'sine', vol = 0.18, when = 0, slideTo = null) {
  const c = ac();
  if (!c || state.muted) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const gn = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  gn.gain.setValueAtTime(vol, t0);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.12, when = 0) {
  const c = ac();
  if (!c || state.muted) return;
  const t0 = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const gn = c.createGain();
  gn.gain.setValueAtTime(vol, t0);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(gn).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  click:   () => tone(660, 0.06, 'square', 0.06),
  hit:     () => { noise(0.12, 0.16); tone(180, 0.12, 'sawtooth', 0.12, 0, 60); },
  crit:    () => { noise(0.18, 0.22); tone(320, 0.18, 'sawtooth', 0.16, 0, 60); tone(90, 0.22, 'square', 0.12, 0.02, 40); },
  super:   () => { noise(0.14, 0.18); tone(500, 0.16, 'sawtooth', 0.14, 0, 120); },
  capture: () => { tone(520, 0.09, 'sine', 0.14); tone(660, 0.09, 'sine', 0.14, 0.1); tone(880, 0.16, 'sine', 0.16, 0.2); },
  fail:    () => { tone(300, 0.14, 'square', 0.1, 0, 180); tone(180, 0.2, 'square', 0.1, 0.12, 90); },
  levelup: () => { tone(523, 0.09, 'triangle', 0.14); tone(659, 0.09, 'triangle', 0.14, 0.09); tone(784, 0.14, 'triangle', 0.16, 0.18); },
  evolve:  () => { [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.16, 'triangle', 0.15, i * 0.11)); },
  win:     () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.15, i * 0.13)); },
  lose:    () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'sine', 0.13, i * 0.16)); },
  coin:    () => { tone(988, 0.06, 'square', 0.08); tone(1319, 0.12, 'square', 0.08, 0.06); },
  ko:      () => { tone(240, 0.4, 'sawtooth', 0.14, 0, 50); noise(0.3, 0.1, 0.05); },
};
