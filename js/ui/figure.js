// Stick-figure pose engine: renders data/poses.js as animated SVG.
//
// A pose is a set of absolute joint angles in degrees:
//   0 = pointing up, 90 = forward (right), 180 = down, -90 = backward (left).
// Side view: the figure faces right; "near" limbs are bright, "far" limbs dim.
// Keyframes are interpolated along the shortest angular path with easing.

import { POSES } from '../data/poses.js';
import { byId } from '../data/exercises.js';
import { PHOTOS } from '../data/photoMap.js';
import { get, set } from '../storage.js';

export const W = 200;
export const H = 160;
export const FLOOR = 150;
export const BAR = 16;
const S = 6.5; // stroke width
const L = { torso: 30, neck: 10, head: 6.5, ua: 16, fa: 16, th: 22, sh: 22, foot: 6 };
const FRONT = { shoulder: 7, hip: 4.5 };
const CORE = new Set(['lower', 'upper', 'obliques', 'antiext', 'cardio', 'hanging']);

export const DEFAULTS = { x: 0, lift: 0, t: 0, bend: 0, ua: 172, fa: 162, th: 180, sh: 180, ft: 0 };
const PAIRS = [
  ['ua', 'ua2'],
  ['fa', 'fa2'],
  ['th', 'th2'],
  ['sh', 'sh2'],
  ['ft', 'ft2'],
];
const ANGLES = new Set(['t', 'h', 'ua', 'fa', 'ua2', 'fa2', 'th', 'sh', 'th2', 'sh2', 'ft', 'ft2']);

const rad = (d) => (d * Math.PI) / 180;
const dir = (a, len) => [Math.sin(rad(a)) * len, -Math.cos(rad(a)) * len];
const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
const ease = (k) => 0.5 - Math.cos(Math.PI * k) / 2;

// --- pose math ---

export function resolve(frame) {
  const p = { ...DEFAULTS, ...frame };
  for (const [a, b] of PAIRS) if (frame[b] == null) p[b] = p[a];
  if (frame.h == null) p.h = p.t;
  return p;
}

function lerp(a, b, k) {
  const out = {};
  for (const key in a) {
    if (ANGLES.has(key)) {
      const d = ((((b[key] - a[key]) % 360) + 540) % 360) - 180; // shortest path
      out[key] = a[key] + d * k;
    } else {
      out[key] = a[key] + (b[key] - a[key]) * k;
    }
  }
  return out;
}

function skeleton(p, view) {
  const front = view !== 'side';
  const hip = [0, 0];
  const neck = add(hip, dir(p.t, L.torso));
  const head = add(neck, dir(p.h, L.neck));
  const so = front ? FRONT.shoulder : 0;
  const ho = front ? FRONT.hip : 0;
  const s1 = add(add(neck, dir(p.t + 180, front ? 3 : 0)), dir(p.t - 90, so));
  const s2 = add(add(neck, dir(p.t + 180, front ? 3 : 0)), dir(p.t + 90, so));
  const h1 = add(hip, dir(p.t - 90, ho));
  const h2 = add(hip, dir(p.t + 90, ho));
  const arm = (s, u, f) => {
    const e = add(s, dir(u, L.ua));
    return [s, e, add(e, dir(f, L.fa))];
  };
  const leg = (h, u, sh, ft, side) => {
    const k = add(h, dir(u, L.th));
    const a = add(k, dir(sh, L.sh));
    // Side view: foot ⟂ shin pointing forward. Front view: short foot pointing outward.
    const footDir = front ? sh + (side === 1 ? 90 : -90) : sh - 90 + ft;
    return [h, k, a, add(a, dir(footDir, front ? 4 : L.foot))];
  };
  return {
    hip,
    neck,
    head,
    shoulders: front ? [s1, s2] : null,
    hips: front ? [h1, h2] : null,
    arm1: arm(s1, p.ua, p.fa),
    arm2: arm(s2, p.ua2, p.fa2),
    leg1: leg(h1, p.th, p.sh, p.ft, 1),
    leg2: leg(h2, p.th2, p.sh2, p.ft2, 2),
    t: p.t,
    bend: p.bend,
  };
}

function linePoints(sk) {
  return [sk.hip, sk.neck, ...sk.arm1, ...sk.arm2, ...sk.leg1, ...sk.leg2];
}

function shift(sk, dx, dy) {
  const m = (pt) => [pt[0] + dx, pt[1] + dy];
  return {
    ...sk,
    hip: m(sk.hip),
    neck: m(sk.neck),
    head: m(sk.head),
    shoulders: sk.shoulders?.map(m) ?? null,
    hips: sk.hips?.map(m) ?? null,
    arm1: sk.arm1.map(m),
    arm2: sk.arm2.map(m),
    leg1: sk.leg1.map(m),
    leg2: sk.leg2.map(m),
  };
}

// Positions the skeleton according to the animation's anchor.
function place(sk, anim, p) {
  const bottom = FLOOR - S / 2;
  let dx = 0;
  let dy = 0;
  switch (anim.anchor ?? 'floor') {
    case 'ankle': {
      const [, , ankle, toe] = sk.leg1;
      dx = -ankle[0];
      dy = bottom - Math.max(ankle[1], toe[1]);
      break;
    }
    case 'wrist': {
      const w = sk.arm1[2];
      dx = -w[0];
      dy = bottom - w[1];
      break;
    }
    case 'bar': {
      const w = anim.view === 'front' ? [(sk.arm1[2][0] + sk.arm2[2][0]) / 2, Math.min(sk.arm1[2][1], sk.arm2[2][1])] : sk.arm1[2];
      dx = -w[0];
      dy = BAR - w[1];
      break;
    }
    case 'center':
      dy = H / 2;
      break;
    default: // floor: hip x fixed, lowest point on the floor
      dy = bottom - Math.max(...linePoints(sk).map((q) => q[1]));
  }
  return shift(sk, dx + p.x, dy - p.lift);
}

// --- animation sampling ---

const prepared = new Map();

function prepare(id) {
  if (prepared.has(id)) return prepared.get(id);
  const anim = POSES[id];
  if (!anim) return null;
  const frames = anim.frames.map(resolve);
  const n = frames.length;
  const w = anim.w ?? frames.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  const prep = { id, anim, frames, w, total, offsetX: 0 };
  // Centre the union of all sampled frames horizontally (constant per exercise).
  let minX = Infinity;
  let maxX = -Infinity;
  const steps = n === 1 ? 1 : 24;
  for (let i = 0; i < steps; i++) {
    const sk = poseAt(prep, i / steps);
    for (const q of [...linePoints(sk), sk.head]) {
      minX = Math.min(minX, q[0]);
      maxX = Math.max(maxX, q[0]);
    }
  }
  prep.offsetX = W / 2 - (minX + maxX) / 2;
  // Fit the viewBox to everything the animation touches (+ props), so each
  // figure is drawn as large as its container allows.
  let top = Infinity;
  let low = -Infinity;
  for (let i = 0; i < steps; i++) {
    const sk = poseAt(prep, i / steps);
    const ys = linePoints(sk).map((q) => q[1]);
    top = Math.min(top, sk.head[1] - L.head, ...ys.map((y) => y - S / 2));
    low = Math.max(low, ...ys.map((y) => y + S / 2));
  }
  const pad = 8;
  let bottom = FLOOR + 4;
  if (anim.anchor === 'bar') {
    top = Math.min(top, BAR - 4);
    bottom = low + pad; // no floor under the bar: crop below the feet
  } else if (anim.anchor === 'center') {
    bottom = H / 2 + (H / 2 - top);
  }
  const width = Math.max(maxX - minX + 2 * pad, 150);
  const height = Math.max(bottom - top + pad, 112);
  prep.vb = [W / 2 - width / 2, bottom - height, width, height];
  prepared.set(id, prep);
  return prep;
}

// phase in [0, 1) over one loop
function poseAt(prep, phase) {
  const { frames, w, total, anim } = prep;
  let p;
  if (frames.length === 1) {
    // Static hold: subtle breathing pulse.
    const b = Math.sin(phase * Math.PI * 2);
    p = { ...frames[0], t: frames[0].t + b * 1.2, h: frames[0].h + b * 1.2, bend: frames[0].bend + b * 0.8 };
  } else {
    let acc = phase * total;
    let i = 0;
    while (i < w.length - 1 && acc >= w[i]) acc -= w[i++];
    const k = Math.min(1, acc / w[i]);
    p = lerp(frames[i], frames[(i + 1) % frames.length], anim.ease === 'linear' ? k : ease(k));
  }
  return place(skeleton(p, anim.view ?? 'side'), anim, p);
}

export function sample(id, phase) {
  const prep = prepare(id);
  if (!prep) return null;
  return shift(poseAt(prep, phase), prep.offsetX, 0);
}

export function frameCount(id) {
  return POSES[id]?.frames.length ?? 0;
}

// Phase at which keyframe i is reached.
export function framePhase(id, i) {
  const prep = prepare(id);
  if (!prep) return 0;
  return prep.w.slice(0, i).reduce((a, b) => a + b, 0) / prep.total;
}

// --- SVG rendering ---

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};
const poly = (pts) => 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L');

function torsoPath(sk) {
  const [hx, hy] = sk.hip;
  const [nx, ny] = sk.neck;
  const [cx, cy] = add([(hx + nx) / 2, (hy + ny) / 2], dir(sk.t - 90, sk.bend * 2));
  return `M${hx.toFixed(1)} ${hy.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
}

function glowPath(sk) {
  // Lower ~60 % of the torso curve (abs).
  const [hx, hy] = sk.hip;
  const [nx, ny] = sk.neck;
  const [cx, cy] = add([(hx + nx) / 2, (hy + ny) / 2], dir(sk.t - 90, sk.bend * 2));
  const q = (k) => [
    (1 - k) ** 2 * hx + 2 * (1 - k) * k * cx + k * k * nx,
    (1 - k) ** 2 * hy + 2 * (1 - k) * k * cy + k * k * ny,
  ];
  return poly([0, 0.2, 0.4, 0.6].map(q));
}

// Builds a static SVG for one exercise at a given phase (used by the dev page).
export function viewBox(id) {
  return (prepare(id)?.vb ?? [0, 0, W, H]).map((v) => v.toFixed(1)).join(' ');
}

export function renderSVG(id, phase = 0, { glow = true } = {}) {
  const svg = el('svg', { viewBox: viewBox(id), class: 'fig' });
  const parts = buildParts(svg, id, glow);
  drawFrame(parts, sample(id, phase));
  return svg;
}

function buildParts(svg, id, glow) {
  const anim = POSES[id];
  const props = el('g', { class: 'fig-props' }, svg);
  const far = el('g', { class: 'fig-far' }, svg);
  const glowEl = glow && CORE.has(byId[id]?.category) ? el('path', { class: 'fig-glow' }, svg) : null;
  const body = el('g', { class: 'fig-body' }, svg);
  const near = el('g', { class: 'fig-near' }, svg);
  const front = anim?.view && anim.view !== 'side';
  const parts = {
    id,
    anim,
    props,
    glow: glowEl,
    arm2: el('path', {}, front ? near : far),
    leg2: el('path', {}, front ? near : far),
    torso: el('path', {}, body),
    girdle: front ? el('path', {}, body) : null,
    head: el('circle', { r: L.head }, body),
    leg1: el('path', {}, near),
    arm1: el('path', {}, near),
  };
  if (anim) drawProps(parts);
  return parts;
}

function drawProps(parts) {
  const { anim, props, id } = parts;
  const first = sample(id, 0);
  const [vx, , vw] = prepare(id).vb;
  if (anim.anchor !== 'center' && anim.anchor !== 'bar') el('line', { x1: vx + 4, y1: FLOOR, x2: vx + vw - 4, y2: FLOOR, class: 'prop-floor' }, props);
  if (anim.anchor === 'bar') {
    el('line', { x1: W / 2 - 46, y1: BAR, x2: W / 2 + 46, y2: BAR, class: 'prop-bar' }, props);
  }
  if (anim.box) {
    // Box under the given joint in the first keyframe (e.g. rear foot).
    const [limb, idx] = { ankle2: ['leg2', 2], toe1: ['leg1', 3], toe2: ['leg2', 3] }[anim.box];
    const pt = first[limb][idx];
    const top = pt[1] + S / 2;
    el('rect', { x: pt[0] - 14, y: top, width: 26, height: FLOOR - top, rx: 3, class: 'prop-box' }, props);
  }
  if (anim.wall) {
    const x = Math.min(first.hip[0], first.neck[0]) - S / 2 - 2;
    el('line', { x1: x, y1: 30, x2: x, y2: FLOOR, class: 'prop-wall' }, props);
  }
}

function drawFrame(parts, sk) {
  if (!sk) return;
  parts.arm1.setAttribute('d', poly(sk.arm1));
  parts.arm2.setAttribute('d', poly(sk.arm2));
  parts.leg1.setAttribute('d', poly(sk.leg1));
  parts.leg2.setAttribute('d', poly(sk.leg2));
  parts.torso.setAttribute('d', torsoPath(sk));
  parts.head.setAttribute('cx', sk.head[0].toFixed(1));
  parts.head.setAttribute('cy', sk.head[1].toFixed(1));
  if (parts.girdle) parts.girdle.setAttribute('d', `${poly(sk.shoulders)}${poly(sk.hips)}`);
  parts.glow?.setAttribute('d', glowPath(sk));
}

// --- shared ticker for all live figures ---

const live = new Set();
let rafId = 0;

function tick(now) {
  for (const f of live) f.update(now);
  rafId = live.size ? requestAnimationFrame(tick) : 0;
}

function track(f, on) {
  if (on) live.add(f);
  else live.delete(f);
  if (live.size && !rafId) rafId = requestAnimationFrame(tick);
}

const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const photoUrl = (file) => new URL(`../../assets/photos/${file}`, import.meta.url).href;

// Live figure with optional "Foto" toggle and reduced-motion play button.
export function createFigure(container, { id = null, controls = true } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'figure';
  wrap.innerHTML = `
    <img class="figure-photo" alt="" hidden>
    <button class="figure-play" type="button" hidden aria-label="Play animation">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </button>
    <button class="figure-toggle" type="button" hidden>Foto</button>`;
  container.append(wrap);
  const img = wrap.querySelector('.figure-photo');
  const playBtn = wrap.querySelector('.figure-play');
  const toggle = wrap.querySelector('.figure-toggle');

  let svg = null;
  let parts = null;
  let curId = null;
  let playing = !reducedMotion();
  let wanted = true; // external play/pause (e.g. workout paused)
  let showPhoto = false;
  let t0 = performance.now();
  let lastPhotoIdx = -1;

  const f = {
    update(now) {
      if (!wrap.isConnected) {
        track(f, false); // container was re-rendered away
        return;
      }
      if (!curId) return;
      const anim = POSES[curId];
      const secs = (now - t0) / 1000;
      if (showPhoto && PHOTOS[curId]) {
        const idx = Math.floor(secs / 1.1) % 2;
        if (idx !== lastPhotoIdx) {
          lastPhotoIdx = idx;
          img.src = photoUrl(PHOTOS[curId][idx]);
        }
        return;
      }
      if (anim && parts) drawFrame(parts, sample(curId, (secs / (anim.dur ?? 2)) % 1));
    },
  };

  function sync() {
    const hasPhoto = !!(curId && PHOTOS[curId]);
    toggle.hidden = !controls || !hasPhoto;
    toggle.textContent = showPhoto && hasPhoto ? 'Animation' : 'Photo';
    const photoMode = showPhoto && hasPhoto;
    img.hidden = !photoMode;
    if (svg) svg.style.display = photoMode ? 'none' : '';
    playBtn.hidden = playing || photoMode || !POSES[curId];
    track(f, wanted && (playing || photoMode) && !!curId);
    if (!(wanted && playing) && parts && !photoMode) drawFrame(parts, sample(curId, 0));
  }

  function setExercise(id) {
    if (id === curId) return;
    curId = id;
    svg?.remove();
    svg = el('svg', { viewBox: viewBox(id), class: 'fig', 'aria-hidden': 'true' });
    wrap.prepend(svg);
    parts = buildParts(svg, id, true);
    t0 = performance.now();
    lastPhotoIdx = -1;
    showPhoto = !!get('photoPref', false) && !!PHOTOS[id];
    drawFrame(parts, sample(id, 0));
    sync();
  }

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playing = true;
    t0 = performance.now();
    sync();
  });
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    showPhoto = !showPhoto;
    set('photoPref', showPhoto);
    lastPhotoIdx = -1;
    sync();
  });

  if (id) setExercise(id);

  return {
    el: wrap,
    setExercise,
    setPlaying(on) {
      wanted = on;
      sync();
    },
    destroy() {
      track(f, false);
      wrap.remove();
    },
  };
}
