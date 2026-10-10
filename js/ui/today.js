// Today screen. Milestone 1: start the hard-coded test session + quick toggles.
// Milestone 2 replaces the content with the real weekly plan.

import { buildDemoSession, estimateMinutes } from '../data/demoSession.js';

const dayName = () => {
  const d = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long' }).format(new Date());
  return d.charAt(0).toUpperCase() + d.slice(1);
};

const TOGGLES = [
  ['sound', 'Zvuk'],
  ['voice', 'Hlas'],
  ['vibration', 'Vibrace'],
  ['testMode', 'Testovací režim (zkrácené časy)'],
];

export function renderToday(root, { settings, active, onChange, onStart, onResume, onDiscard }) {
  const minutes = (type) => estimateMinutes(buildDemoSession({ type, test: settings.testMode }));

  root.innerHTML = `
    <div class="screen">
      <p class="eyebrow">Core Daily</p>
      <h1 class="title">${dayName()}</h1>

      ${
        active
          ? `<div class="card card-accent">
              <h2>Rozpracovaný trénink</h2>
              <p class="muted">${active.session.title}</p>
              <div class="row">
                <button class="btn" data-act="discard">Zahodit</button>
                <button class="btn btn-primary" data-act="resume">Pokračovat</button>
              </div>
            </div>`
          : ''
      }

      <div class="card">
        <h2>Trénink</h2>
        <div class="segmented" role="radiogroup">
          <button role="radio" data-type="full" aria-checked="${settings.sessionType === 'full'}">
            Celý trénink<small>~${minutes('full')} min</small>
          </button>
          <button role="radio" data-type="abs" aria-checked="${settings.sessionType === 'abs'}">
            Jen břicho<small>~${minutes('abs')} min</small>
          </button>
        </div>
        <p class="muted small">Milník 1: napevno daný testovací trénink (rozcvička, diamond push-ups 3 série, kruh na břicho 8 × 40/20).</p>
      </div>

      <div class="card">
        ${TOGGLES.map(
          ([key, label]) => `
          <label class="toggle">
            <span>${label}</span>
            <input type="checkbox" data-key="${key}" ${settings[key] ? 'checked' : ''}>
            <span class="switch" aria-hidden="true"></span>
          </label>`,
        ).join('')}
      </div>

      <button class="btn btn-primary btn-start" data-act="start">Start</button>
    </div>`;

  root.onclick = (e) => {
    const typeBtn = e.target.closest('[data-type]');
    if (typeBtn) {
      onChange({ ...settings, sessionType: typeBtn.dataset.type }, true);
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'start') onStart();
    else if (act === 'resume') onResume();
    else if (act === 'discard') onDiscard();
  };
  root.onchange = (e) => {
    const key = e.target.dataset.key;
    if (key) onChange({ ...settings, [key]: e.target.checked }, key === 'testMode');
  };
}
