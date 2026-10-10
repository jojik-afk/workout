// History: streak stats, month calendar, per-exercise progress charts, session list.

import { getHistory, streaks, doneDays, dateKey, bestRepsSeries, loggedExercises, counts } from '../records.js';
import { EXERCISES, byId } from '../data/exercises.js';
import { esc, plural } from './util.js';
import { lineChart } from './chart.js';

const MONTHS = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const GROUPS = [
  ['pull', 'Shyby'],
  ['push', 'Kliky'],
  ['hanging', 'Visy'],
  ['legs', 'Nohy'],
];

let monthOffset = 0; // 0 = current month
let group = 'pull';

function calendar(history) {
  const done = doneDays(history);
  const partial = new Set(history.filter((e) => !counts(e)).map((e) => e.date));
  const today = dateKey();
  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span></span>');
  let count = 0;
  for (let d = 1; d <= daysIn; d++) {
    const k = dateKey(new Date(first.getFullYear(), first.getMonth(), d));
    const cls = [done.has(k) ? 'is-done' : partial.has(k) ? 'is-partial' : '', k === today ? 'is-today' : ''].join(' ');
    if (done.has(k)) count++;
    cells.push(`<span class="cal-day ${cls}" aria-label="${d}.${done.has(k) ? ' – odcvičeno' : ''}">${d}</span>`);
  }
  return `
    <div class="cal-head">
      <button class="icon-btn" data-month="-1" aria-label="Předchozí měsíc">‹</button>
      <div><b>${MONTHS[first.getMonth()]} ${first.getFullYear()}</b><span class="muted small"> · ${count} ${plural(count, 'den', 'dny', 'dní')}</span></div>
      <button class="icon-btn" data-month="1" aria-label="Další měsíc" ${monthOffset >= 0 ? 'disabled' : ''}>›</button>
    </div>
    <div class="cal-grid">
      ${WEEKDAYS.map((w) => `<span class="cal-wd">${w}</span>`).join('')}
      ${cells.join('')}
    </div>`;
}

const fmtDate = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
};
const fmtMin = (ms) => `${Math.max(1, Math.round(ms / 60000))} min`;

function sessionRow(e) {
  const sets = e.sets.length
    ? `${esc(e.sets[0].name)}: ${e.sets.map((s) => s.reps).join(' / ')}`
    : `${e.timed.length} ${plural(e.timed.length, 'cvik', 'cviky', 'cviků')}`;
  return `
    <li class="session-row">
      <div><b>${fmtDate(e.date)}</b> · ${esc(e.title.split(' · ').slice(1).join(' · ') || e.title)}${e.early ? ' <span class="tag">ukončeno</span>' : ''}</div>
      <div class="muted small">${fmtMin(e.activeMs)} · ${sets}</div>
    </li>`;
}

export function renderHistory(root) {
  const history = getHistory();
  const s = streaks(history);
  const logged = loggedExercises(history);
  const charts = EXERCISES.filter((x) => x.category === group && logged.has(x.id));

  root.innerHTML = `
    <div class="screen">
      <p class="eyebrow">Historie</p>
      <h1 class="title">Historie</h1>

      <div class="stats">
        <div class="stat"><span class="stat-num">${s.current}</span><span class="stat-label">streak (${plural(s.current, 'den', 'dny', 'dní')})</span></div>
        <div class="stat"><span class="stat-num">${s.longest}</span><span class="stat-label">nejdelší</span></div>
        <div class="stat"><span class="stat-num">${s.total}</span><span class="stat-label">${plural(s.total, 'trénink', 'tréninky', 'tréninků')}</span></div>
      </div>

      <div class="card">${calendar(history)}</div>

      <div class="card">
        <h2>Nejlepší série</h2>
        <div class="segmented seg-4" role="tablist">
          ${GROUPS.map(([k, label]) => `<button role="tab" data-group="${k}" aria-checked="${k === group}">${label}</button>`).join('')}
        </div>
        ${
          charts.length
            ? charts.map((x) => `<div class="chart-card"><h3>${esc(x.name)}</h3><div class="chart-wrap" data-chart="${x.id}"></div></div>`).join('')
            : `<p class="muted small">${
                group === 'hanging'
                  ? 'Počet opakování na hrazdě zapíšeš v odpočinku po cviku na hrazdě.'
                  : 'Zatím žádná data – po prvním tréninku se tu objeví graf.'
              }</p>`
        }
      </div>

      <div class="card">
        <h2>Poslední tréninky</h2>
        ${
          history.length
            ? `<ul class="list sessions">${history.slice(-15).reverse().map(sessionRow).join('')}</ul>`
            : '<p class="muted small">Zatím žádný trénink.</p>'
        }
      </div>
    </div>`;

  for (const el of root.querySelectorAll('[data-chart]')) {
    lineChart(el, bestRepsSeries(el.dataset.chart, history), { unit: byId[el.dataset.chart].perSide ? 'opak./strana' : 'opak.' });
  }

  root.onclick = (e) => {
    const m = e.target.closest('[data-month]');
    if (m && !m.disabled) {
      monthOffset = Math.min(0, monthOffset + Number(m.dataset.month));
      renderHistory(root);
      return;
    }
    const g = e.target.closest('[data-group]');
    if (g) {
      group = g.dataset.group;
      renderHistory(root);
    }
  };
}
