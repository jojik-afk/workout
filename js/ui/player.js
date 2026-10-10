// Workout player: the full-screen timer view.

import { Timer } from '../timer.js';
import * as audio from '../audio.js';
import * as wakeLock from '../wakelock.js';
import { get, set, remove } from '../storage.js';
import { confirmDialog } from './dialog.js';

const LABELS = { prep: 'Připrav se', warmup: 'Rozcvička', work: 'Cvičení', rest: 'Odpočinek', reps: 'Série' };
const RING_C = 2 * Math.PI * 92;
const HANGING_NOTE =
  'Na hrazdě: přestaň, jakmile ti začne povolovat úchop. Nikdy se nepouštěj nekontrolovaně.';

const ICON = {
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path class="fill" d="M18 5v14L8 12z"/><path d="M6 5v14"/></svg>',
  skip: '<svg viewBox="0 0 24 24"><path class="fill" d="M6 5v14l10-7z"/><path d="M18 5v14"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path class="fill" d="M7 4.5v15l12.5-7.5z"/></svg>',
};

const TEMPLATE = `
<div class="player" data-kind="prep">
  <header class="p-top">
    <button class="icon-btn" data-act="end" aria-label="Ukončit trénink">${ICON.close}</button>
    <div class="p-phase"></div>
    <div class="p-count"></div>
  </header>
  <div class="p-progress"><div class="p-progress-fill"></div></div>
  <p class="p-wl" hidden>Displej může zhasnout (wake lock potřebuje HTTPS nebo localhost).</p>
  <main class="p-main" data-act="tap">
    <div class="p-ring">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle class="ring-bg" cx="100" cy="100" r="92"/>
        <circle class="ring-fg" cx="100" cy="100" r="92"/>
      </svg>
      <div class="p-time" aria-live="off"></div>
      <div class="p-paused">Pauza</div>
    </div>
    <div class="p-reps" hidden>
      <div class="p-target"></div>
      <div class="stepper">
        <button class="step-btn" data-act="minus" aria-label="Méně">−</button>
        <output class="p-repval">0</output>
        <button class="step-btn" data-act="plus" aria-label="Více">+</button>
      </div>
      <button class="btn btn-primary btn-big" data-act="done">Hotovo</button>
    </div>
    <div class="p-info">
      <div class="p-next-label" hidden>Další:</div>
      <h1 class="p-name"></h1>
      <p class="p-cue"></p>
      <p class="p-safety" hidden></p>
    </div>
  </main>
  <footer class="p-controls">
    <button class="ctrl-btn" data-act="back" aria-label="Zpět">${ICON.back}</button>
    <button class="ctrl-btn ctrl-main" data-act="pause" aria-label="Pauza">${ICON.pause}</button>
    <button class="ctrl-btn" data-act="skip" aria-label="Přeskočit">${ICON.skip}</button>
  </footer>
</div>`;

function fmt(sec) {
  if (sec < 60) return String(sec);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function counterText(p) {
  if (p.block === 'strength' && p.set) return `Série ${p.set[0]} / ${p.set[1]}`;
  if (p.counter) {
    const round = p.round && p.round[1] > 1 ? `Kolo ${p.round[0]}/${p.round[1]} · ` : '';
    return `${round}${p.counter[0]} / ${p.counter[1]}`;
  }
  return '';
}

export function startPlayer(root, session, { restore = null, onFinish }) {
  root.innerHTML = TEMPLATE;
  const el = root.querySelector('.player');
  const $ = (s) => el.querySelector(s);
  const ui = {
    phase: $('.p-phase'),
    count: $('.p-count'),
    fill: $('.p-progress-fill'),
    wl: $('.p-wl'),
    ring: $('.p-ring'),
    ringFg: $('.ring-fg'),
    time: $('.p-time'),
    reps: $('.p-reps'),
    target: $('.p-target'),
    repVal: $('.p-repval'),
    nextLabel: $('.p-next-label'),
    name: $('.p-name'),
    cue: $('.p-cue'),
    safety: $('.p-safety'),
    pauseBtn: $('[data-act="pause"]'),
  };
  ui.ringFg.style.strokeDasharray = RING_C;
  ui.safety.textContent = HANGING_NOTE;

  let stopped = false;
  let raf = 0;
  let lastText = '';
  let lastPaused = null;
  let repValue = 0;
  let ending = false;
  let sideSwitched = true;

  const timer = new Timer(session.phases, { onPhase, onCountdown, onDone, onState: persist });

  function persist() {
    if (timer.status === 'done' || timer.status === 'idle') return;
    set('active', { session, timer: timer.serialize(), savedAt: Date.now() });
  }

  function announce(p) {
    const name = p.exercise.name;
    if (p.kind === 'prep') audio.speak(`Připrav se. První: ${name}`);
    else if (p.kind === 'rest' && p.block === 'strength' && p.set) audio.speak(`Pauza. Další série: ${name}`);
    else if (p.kind === 'rest') audio.speak(`Další: ${name}`);
    else if (p.kind === 'reps') audio.speak(`${name}. Série ${p.set[0]} ze ${p.set[1]}`);
    else if (p.kind === 'warmup') audio.speak(name);
  }

  function prefill(p, index) {
    for (let i = index - 1; i >= 0; i--) {
      const d = timer.done[i];
      if (d?.kind === 'reps' && d.exId === p.exercise.id) return d.reps;
    }
    const last = get('lastReps', {})?.[p.exercise.id];
    if (Number.isFinite(last)) return last;
    return p.target?.[0] ?? 10;
  }

  function onPhase(p, index, { caughtUp }) {
    el.dataset.kind = p.kind;
    ui.phase.textContent = p.label ?? LABELS[p.kind];
    ui.count.textContent = counterText(p);
    ui.nextLabel.hidden = !(p.kind === 'rest' || p.kind === 'prep');
    ui.name.textContent = p.exercise.name;
    ui.cue.textContent = p.exercise.czCue;
    ui.safety.hidden = !p.exercise.hanging;

    const isReps = p.kind === 'reps';
    ui.ring.hidden = isReps;
    ui.reps.hidden = !isReps;
    if (isReps) {
      const per = p.exercise.perSide ? ' na každou stranu' : '';
      ui.target.textContent = `Cíl: ${p.target[0]}–${p.target[1]} opakování${per}`;
      setReps(prefill(p, index));
    }
    lastText = '';
    sideSwitched = !p.exercise.switchSides;
    persist();
    if (!caughtUp) {
      audio.phaseStart(p.kind);
      audio.vibratePhase(p.kind);
      announce(p);
    }
  }

  function onCountdown(n, next) {
    audio.countdown(n, next?.kind);
  }

  function onDone(result) {
    stop();
    remove('active');
    audio.finish();
    audio.vibrateEnd();
    if (!result.early) audio.speak('Hotovo. Skvělá práce!');
    onFinish({ ...result, title: session.title });
  }

  function setReps(v) {
    repValue = Math.max(0, Math.min(999, v));
    ui.repVal.textContent = repValue;
  }

  function completeReps() {
    const id = timer.phase?.exercise.id;
    if (id) {
      const last = get('lastReps', {}) || {};
      last[id] = repValue;
      set('lastReps', last);
    }
    timer.completeReps(repValue);
  }

  function togglePause() {
    if (timer.status === 'paused') timer.resume();
    else timer.pause();
    render();
  }

  async function requestEnd() {
    if (ending || stopped) return;
    ending = true;
    const wasPaused = timer.status === 'paused';
    timer.pause();
    const ok = await confirmDialog({
      title: 'Ukončit trénink?',
      text: 'Uvidíš souhrn odcvičené části.',
      okText: 'Ukončit',
      cancelText: 'Pokračovat',
    });
    ending = false;
    if (ok) timer.finish(true);
    else if (!wasPaused) timer.resume();
  }

  function render() {
    const p = timer.phase;
    if (!p || stopped) return;
    ui.fill.style.transform = `scaleX(${timer.progress()})`;

    const paused = timer.status === 'paused';
    if (paused !== lastPaused) {
      lastPaused = paused;
      el.classList.toggle('is-paused', paused);
      ui.pauseBtn.innerHTML = paused ? ICON.play : ICON.pause;
      ui.pauseBtn.setAttribute('aria-label', paused ? 'Pokračovat' : 'Pauza');
    }

    if (p.duration != null) {
      const rem = timer.remaining();
      // Timed one-sided holds: cue the side switch halfway through.
      if (!sideSwitched && !paused && rem <= p.duration / 2) {
        sideSwitched = true;
        if (p.duration / 2 - rem < 1) {
          audio.phaseStart('work');
          audio.vibratePhase('work');
          audio.speak('Druhá strana');
        }
      }
      ui.ringFg.style.strokeDashoffset = RING_C * (1 - rem / p.duration);
      const txt = fmt(Math.ceil(rem));
      if (txt !== lastText) {
        lastText = txt;
        ui.time.textContent = txt;
        ui.time.classList.toggle('long', txt.length > 2);
      }
    }
  }

  function frame() {
    if (stopped) return;
    timer.tick();
    render();
    if (!stopped) raf = requestAnimationFrame(frame);
  }

  // rAF drives the display; the interval keeps beeps on time even if rAF is throttled.
  const interval = setInterval(() => !stopped && timer.tick(), 200);

  function onVisibility() {
    if (document.visibilityState === 'visible') {
      timer.tick();
      render();
    } else {
      persist();
    }
  }

  function onClick(e) {
    const act = e.target.closest('[data-act]')?.dataset.act;
    switch (act) {
      case 'end': requestEnd(); break;
      case 'pause': togglePause(); break;
      case 'skip': timer.skip(); break;
      case 'back': timer.back(); break;
      case 'minus': setReps(repValue - 1); break;
      case 'plus': setReps(repValue + 1); break;
      case 'done': completeReps(); break;
      case 'tap': if (timer.phase?.kind !== 'reps') togglePause(); break;
    }
  }

  function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', persist);
    wakeLock.release();
  }

  el.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', persist);
  wakeLock.acquire().then((ok) => {
    ui.wl.hidden = ok;
  });

  if (restore) timer.restore(restore);
  else timer.start();
  if (!stopped) raf = requestAnimationFrame(frame);

  return { requestEnd };
}
