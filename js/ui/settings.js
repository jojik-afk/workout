// Settings: interval durations, feedback toggles. Backup/export comes in milestone 3.

import * as audio from '../audio.js';

const STEPPERS = [
  { key: 'work', label: 'Práce v kruhu', min: 30, max: 50, step: 5, unit: 's' },
  { key: 'rest', label: 'Odpočinek v kruhu', min: 10, max: 30, step: 5, unit: 's' },
  { key: 'setRest', label: 'Pauza mezi sériemi', min: 60, max: 120, step: 15, unit: 's' },
];

const TOGGLES = [
  ['sound', 'Zvuk (pípání)'],
  ['voice', 'Hlas (ohlášení cviků)'],
  ['vibration', 'Vibrace'],
  ['testMode', 'Testovací režim (zkrácené časy)'],
];

export function renderSettings(root, { settings, onChange }) {
  root.innerHTML = `
    <div class="screen">
      <p class="eyebrow">Nastavení</p>
      <h1 class="title">Nastavení</h1>

      <div class="card">
        <h2>Intervaly</h2>
        ${STEPPERS.map(
          (s) => `
          <div class="setting-step">
            <span>${s.label}</span>
            <div class="mini-stepper">
              <button class="btn" data-step="${s.key}" data-dir="-1" aria-label="Méně">−</button>
              <output>${settings[s.key]} ${s.unit}</output>
              <button class="btn" data-step="${s.key}" data-dir="1" aria-label="Více">+</button>
            </div>
          </div>`,
        ).join('')}
        <p class="muted small">Kruh na břicho nejvýš 50/10 s.</p>
      </div>

      <div class="card">
        <h2>Zvuk a vibrace</h2>
        ${TOGGLES.map(
          ([key, label]) => `
          <label class="toggle">
            <span>${label}</span>
            <input type="checkbox" data-key="${key}" ${settings[key] ? 'checked' : ''}>
            <span class="switch" aria-hidden="true"></span>
          </label>`,
        ).join('')}
        <button class="btn" data-act="test">Vyzkoušet zvuk, hlas a vibrace</button>
      </div>

      <div class="card">
        <h2>Data</h2>
        <p class="muted small">Export a import zálohy přibude v milníku 3.</p>
      </div>
    </div>`;

  root.onclick = (e) => {
    const stepBtn = e.target.closest('[data-step]');
    if (stepBtn) {
      const s = STEPPERS.find((x) => x.key === stepBtn.dataset.step);
      const next = settings[s.key] + s.step * Number(stepBtn.dataset.dir);
      let value = Math.min(s.max, Math.max(s.min, next));
      const patch = { [s.key]: value };
      // Keep work + rest within one minute-ish and never beyond 50/10.
      if (s.key === 'work' && value + settings.rest > 60) patch.rest = Math.max(10, 60 - value);
      if (s.key === 'rest' && settings.work + value > 60) value = patch.rest = Math.max(10, 60 - settings.work);
      onChange({ ...settings, ...patch });
      return;
    }
    if (e.target.closest('[data-act="test"]')) {
      audio.unlock();
      audio.countdown(3, 'work');
      setTimeout(() => audio.phaseStart('work'), 500);
      setTimeout(() => audio.phaseStart('rest'), 1200);
      audio.vibratePhase('work');
      audio.speak('Další: Hanging knee raises');
    }
  };
  root.onchange = (e) => {
    const key = e.target.dataset.key;
    if (key) onChange({ ...settings, [key]: e.target.checked });
  };
}
