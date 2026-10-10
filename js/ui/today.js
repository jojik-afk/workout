// Today screen: today's session (or a previewed weekday), Start button.

import { buildSession, dayKeyOf } from '../session.js';
import { WEEK_ORDER, DAY_SHORT, DAY_NAMES } from '../data/plan.js';
import { esc, plural } from './util.js';
import { streaks } from '../records.js';

// Date of the given weekday in the current Mon–Sun week.
function dateForDay(key, today = new Date()) {
  const d = new Date(today);
  const offset = WEEK_ORDER.indexOf(key) - WEEK_ORDER.indexOf(dayKeyOf(today));
  d.setDate(d.getDate() + offset);
  return d;
}

export function renderToday(root, { settings, active, previewDay, onPreview, onStart, onResume, onDiscard }) {
  const todayKey = dayKeyOf(new Date());
  const key = previewDay ?? todayKey;
  const date = dateForDay(key);
  const session = buildSession(date, settings);
  const absOnly = buildSession(date, settings, { absOnly: true });
  const isToday = key === todayKey;
  const s = streaks();

  root.innerHTML = `
    <div class="screen">
      <p class="eyebrow">${isToday ? 'Dnes' : 'Náhled'}</p>
      <h1 class="title">${DAY_NAMES[key]}</h1>
      <p class="subtitle">${esc(session.subtitle)}</p>

      <div class="streak ${s.doneToday ? 'is-done' : ''}">
        <span class="streak-num">${s.current}</span>
        <span>${s.current ? `${plural(s.current, 'den', 'dny', 'dní')} v řadě` : 'Začni streak ještě dnes'}${
          s.doneToday ? ' · dnes hotovo ✓' : s.current ? ' · dnes ještě ne' : ''
        }</span>
      </div>

      <div class="day-chips" role="tablist">
        ${WEEK_ORDER.map(
          (k) => `<button role="tab" data-day="${k}" aria-selected="${k === key}" class="${k === todayKey ? 'is-today' : ''}">${DAY_SHORT[k]}</button>`,
        ).join('')}
      </div>

      ${
        active
          ? `<div class="card card-accent">
              <h2>Rozpracovaný trénink</h2>
              <p class="muted">${esc(active.session.title)}</p>
              <div class="row">
                <button class="btn" data-act="discard">Zahodit</button>
                <button class="btn btn-primary" data-act="resume">Pokračovat</button>
              </div>
            </div>`
          : ''
      }

      <div class="card blocks">
        ${session.blocks
          .map(
            (b) => `
          <div class="block block-${b.id}">
            <div class="block-head">
              <span class="block-label">${b.label}</span>
              <span class="block-min">~${b.minutes} min</span>
            </div>
            <div class="block-detail">${esc(b.detail)}</div>
            ${b.items.length ? `<div class="block-items">${b.items.map(esc).join(' · ')}</div>` : ''}
          </div>`,
          )
          .join('')}
      </div>

      ${settings.testMode ? '<p class="note">Testovací režim je zapnutý – časy jsou zkrácené (Nastavení).</p>' : ''}

      <button class="btn btn-primary btn-start" data-act="start">Start · ~${session.minutes} min</button>
      <button class="btn btn-ghost" data-act="abs">Jen ${absOnly.blocks[0].label.toLowerCase()} · ~${absOnly.minutes} min</button>
    </div>`;

  root.onclick = (e) => {
    const dayBtn = e.target.closest('[data-day]');
    if (dayBtn) {
      onPreview(dayBtn.dataset.day === todayKey ? null : dayBtn.dataset.day);
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    // Rebuild at tap time so the session id/timestamps are fresh.
    if (act === 'start') onStart(buildSession(date, settings));
    else if (act === 'abs') onStart(buildSession(date, settings, { absOnly: true }));
    else if (act === 'resume') onResume();
    else if (act === 'discard') onDiscard();
  };
}
