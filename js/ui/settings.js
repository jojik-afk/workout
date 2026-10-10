// Settings: interval durations, feedback toggles, backup (export/import JSON), reset.

import * as audio from '../audio.js';
import { exportData, validateBackup, importData, resetData, getHistory, dateKey } from '../records.js';
import { confirmDialog } from './dialog.js';
import { plural } from './util.js';

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
        <p class="muted small">Všechno je uložené jen v tomhle telefonu. Zálohu si občas stáhni (${getHistory().length} ${plural(getHistory().length, 'trénink', 'tréninky', 'tréninků')} v historii).</p>
        <button class="btn" data-act="export">Stáhnout zálohu (JSON)</button>
        <label class="btn file-btn">Obnovit ze zálohy…<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <p class="data-msg small" role="status" hidden></p>
        <button class="btn btn-danger-ghost" data-act="reset">Smazat všechna data</button>
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
    if (e.target.closest('[data-act="export"]')) {
      downloadBackup();
      return;
    }
    if (e.target.closest('[data-act="reset"]')) {
      confirmDialog({
        title: 'Smazat všechna data?',
        text: 'Smaže historii, úrovně i nastavení. Tohle nejde vrátit – nejdřív si stáhni zálohu.',
        okText: 'Smazat',
        cancelText: 'Zrušit',
      }).then((ok) => {
        if (!ok) return;
        resetData();
        location.reload();
      });
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
    if (e.target.dataset.act === 'import') {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) restoreBackup(file, root);
      return;
    }
    const key = e.target.dataset.key;
    if (key) onChange({ ...settings, [key]: e.target.checked });
  };
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `core-daily-zaloha-${dateKey()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function restoreBackup(file, root) {
  const msg = root.querySelector('.data-msg');
  const fail = (text) => {
    msg.hidden = false;
    msg.textContent = text;
    msg.classList.add('is-error');
  };
  let obj;
  try {
    obj = JSON.parse(await file.text());
  } catch {
    fail('Soubor se nepodařilo přečíst jako JSON.');
    return;
  }
  const err = validateBackup(obj);
  if (err) {
    fail(err);
    return;
  }
  const n = obj.data.history?.length ?? 0;
  const when = obj.exportedAt ? new Date(obj.exportedAt).toLocaleDateString('cs-CZ') : '?';
  const ok = await confirmDialog({
    title: 'Obnovit ze zálohy?',
    text: `Záloha z ${when} (${n} ${plural(n, 'trénink', 'tréninky', 'tréninků')}) nahradí současná data v telefonu.`,
    okText: 'Obnovit',
    cancelText: 'Zrušit',
  });
  if (!ok) return;
  importData(obj);
  location.reload();
}
