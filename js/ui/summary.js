// Summary screen after a workout. Feedback + progression come in milestone 4.

import { esc, plural } from './util.js';

function fmtDuration(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function renderSummary(root, result, onBack) {
  const sets = result.done.filter((d) => d.kind === 'reps');
  const totalReps = sets.reduce((s, d) => s + d.reps, 0);

  root.innerHTML = `
    <div class="screen">
      <p class="eyebrow">${esc(result.title)}</p>
      <h1 class="title">${result.early ? 'Trénink ukončen' : 'Hotovo!'}</h1>

      <div class="stats">
        <div class="stat"><span class="stat-num">${fmtDuration(result.activeMs)}</span><span class="stat-label">čas</span></div>
        <div class="stat"><span class="stat-num">${result.done.length}</span><span class="stat-label">${plural(result.done.length, 'cvik', 'cviky', 'cviků')}</span></div>
        <div class="stat"><span class="stat-num">${totalReps}</span><span class="stat-label">opakování</span></div>
      </div>

      ${
        sets.length
          ? `<div class="card"><h2>Série</h2><ul class="list">
              ${sets.map((d) => `<li><span>${esc(d.name)} · ${d.set[0]}. série</span><b>${d.reps}</b></li>`).join('')}
            </ul></div>`
          : ''
      }

      ${
        result.saved
          ? `<p class="muted small center">Uloženo do historie${result.streak ? ` · streak ${result.streak} ${plural(result.streak, 'den', 'dny', 'dní')} 🔥` : ''}</p>`
          : '<p class="muted small center">Nic nebylo odcvičeno, do historie se neukládá.</p>'
      }

      <button class="btn btn-primary btn-start" data-act="back">Zpět</button>
    </div>`;

  root.onclick = (e) => {
    if (e.target.closest('[data-act="back"]')) onBack();
  };
}
