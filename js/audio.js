// Feedback: Web Audio beeps, vibration and English voice announcements.
// All generated in code — no audio files.

let ctx = null;
let settings = { sound: true, voice: true, vibration: true };
let voice = null;

export function configure(s) {
  settings = { ...settings, ...s };
}

// Must be called from a user gesture (the Start tap) so Chrome lets audio play.
export function unlock() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch {
    ctx = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ctx?.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
});

function tone(freq, dur, when = 0, { type = 'sine', vol = 0.35 } = {}) {
  if (!ctx || !settings.sound) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    /* ignore */
  }
}

// 3-2-1 ticks: high pitch before work, low before rest.
export function countdown(n, nextKind) {
  const f = nextKind === 'rest' ? 520 : 880;
  tone(f, 0.12, 0, { type: 'square', vol: 0.12 });
}

export function phaseStart(kind) {
  if (kind === 'rest' || kind === 'prep') {
    tone(660, 0.15, 0); // falling = relax
    tone(440, 0.4, 0.16);
  } else {
    tone(1320, 0.12, 0); // rising = go
    tone(1760, 0.3, 0.13);
  }
}

export function finish() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.6 : 0.16, i * 0.17));
}

// --- vibration ---

function vibrate(pattern) {
  if (!settings.vibration) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

export function vibratePhase(kind) {
  vibrate(kind === 'rest' || kind === 'prep' ? [80, 60, 80] : 180);
}

export function vibrateEnd() {
  vibrate([400, 150, 400, 150, 800]);
}

// --- voice ---

function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    voice =
      vs.find((v) => v.lang === 'en-US' || v.lang === 'en_US') ||
      vs.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
      null;
  } catch {
    voice = null;
  }
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function speak(text) {
  if (!settings.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
