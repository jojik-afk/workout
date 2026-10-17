// Settings: interval durations, feedback toggles, backup (export/import JSON), reset.

import * as audio from '../audio.js';
import { exportData, validateBackup, importData, resetData, getHistory, dateKey } from '../records.js';
import { confirmDialog } from './dialog.js';
import { plural } from './util.js';
import { canInstall, promptInstall, onInstallChange, isStandalone } from '../pwa.js';

const STEPPERS = [
  { key: 'work', label: 'Circuit work', min: 30, max: 50, step: 5, unit: 's' },
  { key: 'rest', label: 'Circuit rest', min: 10, max: 30, step: 5, unit: 's' },
  { key: 'setRest', label: 'Rest between sets', min: 60, max: 120, step: 15, unit: 's' },
];

const TOGGLES = [
  ['sound', 'Sound (beeps)'],
  ['voice', 'Voice (exercise announcements)'],
  ['vibration', 'Vibration'],
  ['testMode', 'Test mode (shortened times)'],
];

export function renderSettings(root, { settings, onChange }) {
  root.innerHTML = `
    <div class="screen">
      <p class="eyebrow">Settings</p>
      <h1 class="title">Settings</h1>

      <div class="card">
        <h2>Intervals</h2>
        ${STEPPERS.map(
          (s) => `
          <div class="setting-step">
            <span>${s.label}</span>
            <div class="mini-stepper">
              <button class="btn" data-step="${s.key}" data-dir="-1" aria-label="Less">−</button>
              <output>${settings[s.key]} ${s.unit}</output>
              <button class="btn" data-step="${s.key}" data-dir="1" aria-label="More">+</button>
            </div>
          </div>`,
        ).join('')}
        <p class="muted small">Ab circuit at most 50/10 s.</p>
      </div>

      <div class="card">
        <h2>Sound and vibration</h2>
        ${TOGGLES.map(
          ([key, label]) => `
          <label class="toggle">
            <span>${label}</span>
            <input type="checkbox" data-key="${key}" ${settings[key] ? 'checked' : ''}>
            <span class="switch" aria-hidden="true"></span>
          </label>`,
        ).join('')}
        <button class="btn" data-act="test">Test sound, voice and vibration</button>
      </div>

      <div class="card">
        <h2>App</h2>
        ${
          isStandalone()
            ? '<p class="muted small">Running as an installed app and works offline too.</p>'
            : `<button class="btn btn-primary" data-act="install" ${canInstall() ? '' : 'hidden'}>Install to home screen</button>
               <p class="muted small install-hint" ${canInstall() ? 'hidden' : ''}>To install: in Chrome, menu ⋮ → <b>Add to Home screen</b> / <b>Install app</b>.</p>`
        }
      </div>

      <div class="card">
        <h2>Data</h2>
        <p class="muted small">Everything is stored only on this phone. Download a backup now and then (${getHistory().length} ${plural(getHistory().length, 'workout', 'workouts')} in history).</p>
        <button class="btn" data-act="export">Download backup (JSON)</button>
        <label class="btn file-btn">Restore from backup…<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <p class="data-msg small" role="status" hidden></p>
        <button class="btn btn-danger-ghost" data-act="reset">Delete all data</button>
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
    if (e.target.closest('[data-act="install"]')) {
      promptInstall();
      return;
    }
    if (e.target.closest('[data-act="export"]')) {
      downloadBackup();
      return;
    }
    if (e.target.closest('[data-act="reset"]')) {
      confirmDialog({
        title: 'Delete all data?',
        text: 'Deletes history, levels and settings. This can’t be undone – download a backup first.',
        okText: 'Delete',
        cancelText: 'Cancel',
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
      audio.speak('Next: Hanging knee raises');
    }
  };
  const stop = onInstallChange((available) => {
    if (!root.isConnected) return stop();
    root.querySelector('[data-act="install"]')?.toggleAttribute('hidden', !available);
    root.querySelector('.install-hint')?.toggleAttribute('hidden', available);
  });

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
  a.download = `core-daily-backup-${dateKey()}.json`;
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
    fail('The file could not be read as JSON.');
    return;
  }
  const err = validateBackup(obj);
  if (err) {
    fail(err);
    return;
  }
  const n = obj.data.history?.length ?? 0;
  const when = obj.exportedAt ? new Date(obj.exportedAt).toLocaleDateString('en-GB') : '?';
  const ok = await confirmDialog({
    title: 'Restore from backup?',
    text: `The backup from ${when} (${n} ${plural(n, 'workout', 'workouts')}) will replace the current data on this phone.`,
    okText: 'Restore',
    cancelText: 'Cancel',
  });
  if (!ok) return;
  importData(obj);
  location.reload();
}
