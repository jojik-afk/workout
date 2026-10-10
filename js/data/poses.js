// Keyframe poses for every exercise — tweak by hand, check in dev/poses.html.
//
// Angles in degrees, absolute (not relative to the parent joint):
//   0 = up, 90 = forward (right), 180 = down, -90 = backward (left).
// Side view: the figure faces right. Front view: arm1/leg1 are on the viewer's left.
//
// Pose keys (all optional, defaults = standing):
//   t     torso direction hip → neck          h    head direction (default = t)
//   bend  spine curve (+ rounds the back, − arches it)
//   (standing arms default to ua 172 / fa 162 so they read apart from the torso)
//   ua/fa near upper arm / forearm            ua2/fa2 far arm (default = near)
//   th/sh near thigh / shin                   th2/sh2 far leg (default = near)
//   ft    foot tilt (0 = ⟂ shin, 90 = in line with shin, e.g. kneeling)
//   lift  raise the whole body (jumps)       x    horizontal shift
//
// Animation keys:
//   frames  1–5 poses (1 pose = static hold with a breathing pulse)
//   dur     seconds per loop       w  relative duration of each segment (frame i → i+1)
//   anchor  'floor' (lowest point on the floor) | 'ankle' | 'wrist' (that joint stays put)
//           | 'bar' (hands on the pull-up bar) | 'center' (top view, no floor)
//   view    'side' (default) | 'front' | 'top'
//   box     'ankle2' | 'toe1' | 'toe2' — draws a bed/chair under that point
//   wall    true — draws a wall behind the back
//   ease    'linear' for constant-speed loops (default eases in/out)

const p = (...parts) => Object.assign({}, ...parts);

// --- shared base poses ---
const STAND = {};
const SUPINE = { t: -90, h: -82, ua: 90, fa: 90, th: 90, sh: 90 }; // on the back, head left
const KNEES_UP = { th: 35, sh: 145 }; // supine with feet on the floor
const PLANK_HIGH = { t: 64, ua: 180, fa: 180, th: -110, sh: -110 };
const PLANK_LOW = { t: 80, ua: 180, fa: 90, th: -98, sh: -98 };
const PUSH_DOWN = { t: 86, ua: -90, fa: 130, th: -93, sh: -93 };
const HANG = { t: -8, h: -20, ua: 14, fa: 14, th: 178, sh: 184 };
const PULL_TOP = { t: -6, ua: 160, fa: 15, th: 172, sh: 205 };
const ALL_FOURS = { t: 72, ua: 180, fa: 180, th: 180, sh: -90, ft: 90 };
const SQUAT = { t: 30, ua: 90, fa: 90, th: 85, sh: 195 };
const HANDS_BEHIND_HEAD = { ua: 40, fa: -110 };

const pushUp = { anchor: 'wrist', dur: 2, frames: [PLANK_HIGH, PUSH_DOWN] };
const pullUp = { anchor: 'bar', dur: 2.4, w: [1, 1.4], frames: [HANG, PULL_TOP] };
const scapHang = { anchor: 'bar', dur: 2, frames: [HANG, p(HANG, { t: -6, ua: 20, fa: -20 })] };

export const POSES = {
  // ---------- warm-up ----------
  'arm-circles': { dur: 2.4, ease: 'linear', frames: [{ ua: 180, fa: 180 }, { ua: 90, fa: 90 }, { ua: 0, fa: 0 }, { ua: -90, fa: -90 }] },
  'jumping-jacks': {
    view: 'front',
    dur: 1,
    frames: [
      { ua: -170, fa: -172, ua2: 170, fa2: 172, th: -176, sh: -178, th2: 176, sh2: 178 },
      { ua: -25, fa: -12, ua2: 25, fa2: 12, th: -160, sh: -162, th2: 160, sh2: 162, lift: 3 },
    ],
  },
  'cat-cow': { dur: 4, frames: [p(ALL_FOURS, { bend: -5, h: 55 }), p(ALL_FOURS, { bend: 7, h: 135 })] },
  'scapular-hangs': scapHang,

  // ---------- core: lower ----------
  'reverse-crunches': { dur: 2, frames: [p(SUPINE, { th: 0, sh: 90 }), p(SUPINE, { t: -102, h: -95, th: -40, sh: 40 })] },
  'lying-leg-raises': { dur: 2.4, frames: [p(SUPINE, { th: 84, sh: 84 }), p(SUPINE, { th: 0, sh: 0 })] },
  'hip-raises': { dur: 1.8, frames: [p(SUPINE, { th: 0, sh: 0 }), p(SUPINE, { t: -112, h: -100, th: -15, sh: -15 })] },
  'flutter-kicks': {
    dur: 0.6,
    ease: 'linear',
    frames: [p(SUPINE, { t: -80, h: -60, th: 78, sh: 78, th2: 66, sh2: 66 }), p(SUPINE, { t: -80, h: -60, th: 66, sh: 66, th2: 78, sh2: 78 })],
  },
  'scissor-kicks': {
    dur: 0.9,
    frames: [p(SUPINE, { t: -80, h: -60, th: 55, sh: 55, th2: 84, sh2: 84 }), p(SUPINE, { t: -80, h: -60, th: 84, sh: 84, th2: 55, sh2: 55 })],
  },
  'in-and-outs': {
    dur: 1.6,
    frames: [
      { t: -60, ua: 200, fa: 90, th: 75, sh: 75 },
      { t: -48, ua: 195, fa: 100, th: 5, sh: 115 },
    ],
  },

  // ---------- core: upper ----------
  crunches: {
    dur: 1.6,
    frames: [p(SUPINE, KNEES_UP, { ua: 70, fa: 70 }), p(SUPINE, KNEES_UP, { t: -62, h: -40, bend: 4, ua: 75, fa: 75 })],
  },
  'sit-ups': {
    dur: 2.2,
    frames: [p(SUPINE, KNEES_UP, { ua: -95, fa: -95 }), p(SUPINE, KNEES_UP, { t: 8, h: 20, bend: 3, ua: 75, fa: 75 })],
  },
  'toe-taps': {
    dur: 1.4,
    frames: [p(SUPINE, { th: 0, sh: 0, ua: 5, fa: 5 }), p(SUPINE, { th: 0, sh: 0, t: -60, h: -35, bend: 4, ua: 25, fa: 25 })],
  },
  'tuck-ups': {
    dur: 1.6,
    frames: [p(SUPINE, { t: -95, ua: -85, fa: -85, th: 84, sh: 84 }), { t: -40, bend: 5, ua: 60, fa: 30, th: -12, sh: 70 }],
  },
  'v-ups': {
    dur: 1.6,
    frames: [p(SUPINE, { t: -95, ua: -85, fa: -85, th: 84, sh: 84 }), { t: -45, ua: 45, fa: 45, th: 45, sh: 45 }],
  },
  'star-crunches': {
    dur: 1.6,
    frames: [p(SUPINE, { ua: -95, fa: -95, th: 86, sh: 86 }), { t: -35, bend: 6, ua: 70, fa: 40, th: -25, sh: 80 }],
  },

  // ---------- core: obliques ----------
  'heel-touches': {
    dur: 1,
    frames: [
      p(SUPINE, KNEES_UP, { t: -75, h: -55, bend: 3, ua: 98, fa: 98, ua2: 70, fa2: 45 }),
      p(SUPINE, KNEES_UP, { t: -75, h: -55, bend: 3, ua: 70, fa: 45, ua2: 98, fa2: 98 }),
    ],
  },
  'bicycle-crunches': {
    dur: 1.4,
    frames: [
      p(SUPINE, HANDS_BEHIND_HEAD, { t: -55, h: -40, bend: 4, th: -10, sh: 70, th2: 72, sh2: 72 }),
      p(SUPINE, HANDS_BEHIND_HEAD, { t: -65, h: -45, bend: 4, th: 72, sh: 72, th2: -10, sh2: 70 }),
    ],
  },
  'oblique-v-ups': {
    view: 'front',
    dur: 1.6,
    frames: [
      { t: -95, h: -95, ua: 95, fa: 95, ua2: -40, fa2: -150, th: 95, sh: 95 },
      { t: -50, h: -50, ua: 120, fa: 110, ua2: -10, fa2: -140, th: 50, sh: 50 },
    ],
  },
  // Side view: the reaching arm alternates between the near (bright) and far (dim) side.
  'russian-twists': {
    dur: 1.6,
    frames: [
      { t: -36, th: 40, sh: 110, ua: 135, fa: 135, ua2: 120, fa2: 30 },
      { t: -42, th: 40, sh: 110, ua: 105, fa: 95, ua2: 105, fa2: 95 },
      { t: -36, th: 40, sh: 110, ua: 120, fa: 30, ua2: 135, fa2: 135 },
      { t: -42, th: 40, sh: 110, ua: 105, fa: 95, ua2: 105, fa2: 95 },
    ],
  },
  'side-plank': { view: 'front', dur: 4, frames: [{ t: -77, ua: 180, fa: -90, ua2: 10, fa2: 10, th: 103, sh: 103 }] },
  'side-plank-hip-dips': {
    view: 'front',
    dur: 1.6,
    frames: [
      { t: -77, ua: 180, fa: -90, ua2: 10, fa2: 10, th: 103, sh: 103 },
      { t: -88, ua: 180, fa: -90, ua2: 10, fa2: 10, th: 93, sh: 93 },
    ],
  },

  // ---------- core: anti-extension ----------
  plank: { dur: 4, frames: [PLANK_LOW] },
  'plank-shoulder-taps': {
    dur: 1.2,
    frames: [p(PLANK_HIGH, { ua: 150, fa: -20 }), p(PLANK_HIGH, { ua2: 150, fa2: -20 })],
  },
  'plank-to-push-up': { anchor: 'floor', dur: 2.2, frames: [PLANK_LOW, PLANK_HIGH] },
  'hollow-body-hold': { dur: 4, frames: [{ t: -75, bend: 3, ua: -80, fa: -80, th: 75, sh: 75 }] },
  'hollow-rocks': {
    dur: 1,
    frames: [
      { t: -68, bend: 3, ua: -75, fa: -75, th: 82, sh: 82 },
      { t: -84, bend: 3, ua: -90, fa: -90, th: 66, sh: 66 },
    ],
  },

  // ---------- core: cardio ----------
  'mountain-climbers': {
    anchor: 'wrist',
    dur: 0.6,
    ease: 'linear',
    frames: [p(PLANK_HIGH, { th: 130, sh: -95, ft: 60 }), p(PLANK_HIGH, { th2: 130, sh2: -95, ft2: 60 })],
  },
  'cross-body-mountain-climbers': {
    anchor: 'wrist',
    dur: 0.7,
    frames: [p(PLANK_HIGH, { t: 61, th: 118, sh: -92, ft: 60 }), p(PLANK_HIGH, { t: 61, th2: 118, sh2: -92, ft2: 60 })],
  },
  'plank-jacks': {
    view: 'top',
    anchor: 'center',
    dur: 0.8,
    frames: [
      { t: 90, ua: 80, fa: 90, ua2: 100, fa2: 90, th: -92, sh: -92, th2: -88, sh2: -88 },
      { t: 90, ua: 80, fa: 90, ua2: 100, fa2: 90, th: -72, sh: -72, th2: -108, sh2: -108 },
    ],
  },
  burpees: {
    dur: 3.2,
    frames: [
      STAND,
      { t: 60, ua: 175, fa: 175, th: 75, sh: 200 },
      PLANK_HIGH,
      { t: 60, ua: 175, fa: 175, th: 75, sh: 200 },
      { ua: 10, fa: 10, lift: 10 },
    ],
  },

  // ---------- core: hanging ----------
  'hanging-knee-raises': { anchor: 'bar', dur: 2.4, frames: [HANG, p(HANG, { t: -10, th: 85, sh: 175 })] },
  'bent-knee-leg-raises': { anchor: 'bar', dur: 2.4, frames: [HANG, p(HANG, { t: -16, th: 62, sh: 150 })] },
  'hanging-leg-raises': { anchor: 'bar', dur: 2.6, frames: [HANG, p(HANG, { t: -12, th: 90, sh: 90 })] },
  'toes-to-bar': { anchor: 'bar', dur: 2.8, frames: [HANG, { t: -55, ua: 25, fa: 25, th: 18, sh: 18 }] },
  'windshield-wipers': {
    view: 'front',
    anchor: 'bar',
    dur: 2.6,
    frames: [
      { ua: -10, fa: -6, ua2: 10, fa2: 6, th: -55, sh: -55, th2: -50, sh2: -50 },
      { ua: -10, fa: -6, ua2: 10, fa2: 6, th: 50, sh: 50, th2: 55, sh2: 55 },
    ],
  },
  'hanging-knee-raise-twists': {
    view: 'front',
    anchor: 'bar',
    dur: 4,
    frames: [
      { ua: -10, fa: -6, ua2: 10, fa2: 6, th: -178, sh: -178, th2: 178, sh2: 178 },
      { t: 6, ua: -10, fa: -6, ua2: 10, fa2: 6, th: -95, sh: 175, th2: -80, sh2: 170 },
      { ua: -10, fa: -6, ua2: 10, fa2: 6, th: -178, sh: -178, th2: 178, sh2: 178 },
      { t: -6, ua: -10, fa: -6, ua2: 10, fa2: 6, th: 80, sh: -170, th2: 95, sh2: -175 },
    ],
  },

  // ---------- push ----------
  'wide-push-ups': pushUp,
  'push-ups': pushUp,
  'diamond-push-ups': pushUp,
  'archer-push-ups': {
    anchor: 'wrist',
    dur: 2.2,
    frames: [p(PLANK_HIGH, { ua2: 150, fa2: 140 }), p(PUSH_DOWN, { ua2: 110, fa2: 100 })],
  },
  'decline-push-ups': {
    anchor: 'wrist',
    box: 'toe1',
    dur: 2,
    frames: [
      { t: 81, ua: 180, fa: 180, th: -99, sh: -99 },
      { t: 98, ua: -80, fa: 140, th: -82, sh: -82 },
    ],
  },
  'pike-push-ups': {
    anchor: 'wrist',
    dur: 2,
    frames: [
      { t: 135, ua: 172, fa: 172, th: -135, sh: -135 },
      { t: 150, h: 160, ua: 210, fa: 140, th: -128, sh: -128 },
    ],
  },
  'explosive-push-ups': {
    anchor: 'wrist',
    dur: 1.4,
    w: [1, 0.6, 0.8],
    frames: [PUSH_DOWN, PLANK_HIGH, p(PLANK_HIGH, { lift: 6, ua: 172, fa: 176 })],
  },

  // ---------- pull ----------
  'scapular-pull-ups': scapHang,
  'slow-negatives': { anchor: 'bar', dur: 6, w: [5, 1], frames: [PULL_TOP, HANG] },
  'pull-ups': pullUp,
  'wide-pull-ups': pullUp,
  'chin-ups': pullUp,
  'archer-pull-ups': { anchor: 'bar', dur: 2.6, frames: [HANG, p(PULL_TOP, { ua2: 40, fa2: 40 })] },
  'l-sit-pull-ups': {
    anchor: 'bar',
    dur: 2.6,
    frames: [p(HANG, { th: 85, sh: 175 }), p(PULL_TOP, { th: 85, sh: 175 })],
  },

  // ---------- legs ----------
  squats: { anchor: 'ankle', dur: 2, frames: [STAND, SQUAT] },
  'reverse-lunges': {
    anchor: 'ankle',
    dur: 2.2,
    frames: [STAND, { t: 2, th: 95, sh: 180, th2: 200, sh2: -95, ft2: 90 }],
  },
  'bulgarian-split-squats': {
    anchor: 'ankle',
    box: 'ankle2',
    dur: 2.4,
    frames: [
      { th: 170, sh: 185, th2: 205, sh2: -100, ft2: 90 },
      { t: 10, th: 100, sh: 190, th2: 181, sh2: -42, ft2: 90 },
    ],
  },
  'jump-squats': {
    anchor: 'ankle',
    dur: 1.4,
    w: [1, 0.6, 0.8],
    frames: [SQUAT, { ua: 200, fa: 200, lift: 10, ft: 50 }, SQUAT],
  },
  'glute-bridges': {
    anchor: 'ankle',
    dur: 2,
    frames: [p(SUPINE, KNEES_UP), p(SUPINE, { t: -117, h: -105, th: 70, sh: 160 })],
  },
  'single-leg-glute-bridges': {
    anchor: 'ankle',
    dur: 2,
    frames: [p(SUPINE, KNEES_UP, { th2: 40, sh2: 40 }), p(SUPINE, { t: -117, h: -105, th: 70, sh: 160, th2: 62, sh2: 62 })],
  },
  'wall-sit': { anchor: 'ankle', wall: true, dur: 4, frames: [{ ua: 180, fa: 180, th: 90, sh: 180 }] },
  'calf-raises': { dur: 1.6, frames: [STAND, { ft: 55 }] },

  // ---------- mobility ----------
  'hip-flexor-stretch': {
    anchor: 'ankle',
    dur: 4,
    frames: [
      { t: 0, ua: 180, fa: 180, th: 90, sh: 180, th2: 200, sh2: -90, ft2: 90 },
      { t: -6, ua: 180, fa: 180, th: 80, sh: 170, th2: 212, sh2: -88, ft2: 90 },
    ],
  },
  'hamstring-stretch': {
    dur: 4,
    frames: [
      { t: 0, ua: 120, fa: 120, th: 90, sh: 90 },
      { t: 52, h: 70, ua: 98, fa: 98, th: 90, sh: 90 },
    ],
  },
  'pigeon-stretch': {
    dur: 4,
    frames: [
      { t: 10, ua: 170, fa: 170, th: 95, sh: -95, th2: -95, sh2: -95, ft2: 90 },
      { t: 70, h: 95, ua: 110, fa: 110, th: 95, sh: -95, th2: -95, sh2: -95, ft2: 90 },
    ],
  },
  'deep-squat-hold': { anchor: 'ankle', dur: 4, frames: [{ t: 25, ua: 140, fa: 30, th: 70, sh: 200 }] },
  'cobra-stretch': {
    dur: 4,
    frames: [
      { t: 72, ua: 240, fa: 150, th: -90, sh: -90, ft: 90 },
      { t: 30, h: 20, bend: -6, ua: 200, fa: 160, th: -90, sh: -90, ft: 90 },
    ],
  },
  'childs-pose': { dur: 4, frames: [{ t: 98, h: 102, bend: 3, ua: 104, fa: 100, th: 115, sh: -90, ft: 90 }] },
  'thoracic-rotations': {
    dur: 3,
    frames: [p(ALL_FOURS, { ua: 200, fa: 200 }), p(ALL_FOURS, { ua: 10, fa: 10, h: 40 })],
  },
  'shoulder-stretch': { view: 'front', dur: 4, frames: [{ ua: 95, fa: 95, ua2: 170, fa2: -60 }] },
  'dead-hang': { anchor: 'bar', dur: 4, frames: [HANG] },
};
