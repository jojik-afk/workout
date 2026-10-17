// Summary after a workout: stats, "How did it go?" feedback, progression suggestions.
// Test-mode sessions are not saved, so they get neither feedback nor suggestions.

import { esc, plural } from './util.js';
import { updateSession, getHistory } from '../records.js';
import { evaluate, apply, decline } from '../progression.js';

const FEEDBACK = [
  ['easy', 'Easy'],
  ['ok', 'Just right'],
  ['hard', 'Hard'],
];

function fmtDuration(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// result: player result + { title, entry (saved history entry or null), streak }
export function renderSummary(root, result, { settings, onSettingsPatch, onBack }) {
  const sets = result.done.filter((d) => d.kind === 'reps');
  const totalReps = sets.reduce((s, d) => s + d.reps, 0);
  const entry = result.entry;
  let feedback = entry?.feedback ?? null;
  let evaluation = null;
  const decided = new Map(); // suggestion index → 'applied' | 'declined'

  function suggestionsHtml() {
    if (!feedback || !evaluation) return '';
    const { suggestions, hold, early } = evaluation;
    const note = hold
      ? '<p class="muted small">Two “Hard” in a row – progression is on hold for now. Take your time.</p>'
      : early
        ? '<p class="muted small">Two “Easy” in a row – the next step may come sooner.</p>'
        : '';
    if (!suggestions.length) {
      return `<div class="card"><h2>Progression</h2>${note}<p class="muted small">No changes – keep following the plan.</p></div>`;
    }
    return `
      <div class="card">
        <h2>Suggested progression</h2>
        ${note}
        ${suggestions
          .map((sg, i) => {
            const state = decided.get(i);
            return `
            <div class="suggestion ${state ? `is-${state}` : ''}">
              <b>${esc(sg.title)}</b>
              <p class="muted small">${esc(sg.detail)}</p>
              ${
                state
                  ? `<p class="small sg-state">${state === 'applied' ? '✓ Saved – takes effect in your next workout.' : 'OK, no change for now.'}</p>`
                  : `<div class="row">
                      <button class="btn" data-decline="${i}">Not now</button>
                      <button class="btn btn-primary" data-apply="${i}">Accept</button>
                    </div>`
              }
            </div>`;
          })
          .join('')}
      </div>`;
  }

  function render() {
    root.innerHTML = `
      <div class="screen">
        <p class="eyebrow">${esc(result.title)}</p>
        <h1 class="title">${result.early ? 'Workout ended' : 'Done!'}</h1>

        <div class="stats">
          <div class="stat"><span class="stat-num">${fmtDuration(result.activeMs)}</span><span class="stat-label">time</span></div>
          <div class="stat"><span class="stat-num">${result.done.length}</span><span class="stat-label">${plural(result.done.length, 'exercise', 'exercises')}</span></div>
          <div class="stat"><span class="stat-num">${totalReps}</span><span class="stat-label">reps</span></div>
        </div>

        ${
          sets.length
            ? `<div class="card"><h2>Sets</h2><ul class="list">
                ${sets
                  .map(
                    (d) =>
                      `<li><span>${esc(d.name)} · set ${d.set[0]}${d.target ? ` <span class="muted">(${d.target[0]}–${d.target[1]})</span>` : ''}</span><b>${d.reps}</b></li>`,
                  )
                  .join('')}
              </ul></div>`
            : ''
        }

        ${
          entry
            ? `<div class="card">
                <h2>How did it go?</h2>
                <div class="segmented seg-3" role="radiogroup">
                  ${FEEDBACK.map(([k, label]) => `<button role="radio" data-feedback="${k}" aria-checked="${feedback === k}">${label}</button>`).join('')}
                </div>
              </div>`
            : ''
        }

        ${suggestionsHtml()}

        ${
          entry
            ? `<p class="muted small center">Saved to history${result.streak ? ` · streak ${result.streak} ${plural(result.streak, 'day', 'days')} 🔥` : ''}</p>`
            : `<p class="muted small center">${result.test ? 'Test mode – not saved to history.' : 'Nothing was completed, not saved to history.'}</p>`
        }

        <button class="btn btn-primary btn-start" data-act="back">Back</button>
      </div>`;
  }

  render();

  root.onclick = (e) => {
    if (e.target.closest('[data-act="back"]')) {
      onBack();
      return;
    }
    const fb = e.target.closest('[data-feedback]');
    if (fb && entry) {
      feedback = fb.dataset.feedback;
      updateSession(entry.id, { feedback });
      // Re-evaluate while nothing has been accepted/declined yet.
      if (!decided.size) evaluation = evaluate({ ...entry, feedback }, settings(), getHistory());
      render();
      return;
    }
    const ap = e.target.closest('[data-apply]');
    if (ap && evaluation) {
      const i = Number(ap.dataset.apply);
      const patch = apply(evaluation.suggestions[i]);
      if (patch) onSettingsPatch(patch);
      decided.set(i, 'applied');
      render();
      return;
    }
    const de = e.target.closest('[data-decline]');
    if (de && evaluation) {
      const i = Number(de.dataset.decline);
      decline(evaluation.suggestions[i]);
      decided.set(i, 'declined');
      render();
    }
  };
}
