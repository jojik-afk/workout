// Library: my levels in each progression ladder + all exercises by category.

import { EXERCISES, CATEGORIES, byId } from '../data/exercises.js';
import { LADDERS } from '../data/plan.js';
import { getLevels, setLevel, ladderSteps, getProgress, removeSwap, targetFor } from '../progression.js';
import { set } from '../storage.js';
import { esc } from './util.js';
import { createFigure, renderSVG } from './figure.js';

const dots = (level) =>
  `<span class="dots" aria-label="Úroveň ${level} z 5">${[1, 2, 3, 4, 5]
    .map((i) => `<i class="${i <= level ? 'on' : ''}"></i>`)
    .join('')}</span>`;

const videoUrl = (x) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${x.name} exercise`)}`;

function exerciseRow(x, currentIds) {
  const meta = [
    x.type === 'reps' && x.reps ? `${targetFor(x.id).join('–')} opak.${x.perSide ? ' / strana' : ''}` : 'na čas',
    x.hanging ? 'hrazda' : '',
    x.progressesTo ? `→ ${byId[x.progressesTo].name}` : '',
  ].filter(Boolean);
  return `
    <li class="ex ${currentIds.has(x.id) ? 'is-current' : ''}">
      <details data-id="${x.id}">
        <summary>
          <span class="ex-thumb" data-thumb="${x.id}"></span>
          <span class="ex-text">
            <span class="ex-head">
              <span class="ex-name">${esc(x.name)}</span>
              ${dots(x.level)}
            </span>
            <span class="ex-cue">${esc(x.czCue)}</span>
            <span class="ex-meta">${meta.map(esc).join(' · ')}</span>
          </span>
        </summary>
        <div class="ex-demo">
          <div class="ex-figure"></div>
          ${x.hanging ? '<p class="p-safety">Na hrazdě: přestaň, jakmile ti začne povolovat úchop. Nikdy se nepouštěj nekontrolovaně.</p>' : ''}
          <a class="btn btn-ghost ex-video" href="${videoUrl(x)}" target="_blank" rel="noopener">Video na YouTube ↗</a>
        </div>
      </details>
    </li>`;
}

// Accepted progression changes that live outside the ladders (can be undone here).
function adjustments() {
  const { swaps, repBoost } = getProgress();
  const rows = [
    ...Object.entries(swaps)
      .filter(([a, b]) => byId[a] && byId[b])
      .map(([a, b]) => `<div class="adjust-row"><span>Kruhy: ${esc(byId[a].name)} → ${esc(byId[b].name)}</span><button class="btn" data-unswap="${a}">Zrušit</button></div>`),
    ...Object.entries(repBoost)
      .filter(([id, n]) => byId[id] && n > 0)
      .map(([id]) => {
        const [lo, hi] = targetFor(id);
        return `<div class="adjust-row"><span>${esc(byId[id].name)}: cíl ${lo}–${hi}</span><button class="btn" data-unboost="${id}">Zrušit</button></div>`;
      }),
  ];
  return rows.length ? `<div class="card"><h2>Úpravy z progrese</h2>${rows.join('')}</div>` : '';
}

export function renderLibrary(root) {
  const levels = getLevels();
  const currentIds = new Set(Object.keys(LADDERS).map((k) => levels[k]));

  root.innerHTML = `
    <div class="screen">
      <p class="eyebrow">Cviky</p>
      <h1 class="title">Knihovna</h1>

      <div class="card">
        <h2>Moje úrovně</h2>
        ${Object.entries(LADDERS)
          .map(
            ([key, ladder]) => `
          <label class="field">
            <span>${esc(ladder.name)}</span>
            <select data-ladder="${key}">
              ${ladderSteps(key)
                .map((id) => `<option value="${id}" ${levels[key] === id ? 'selected' : ''}>${esc(byId[id].name)} (úr. ${byId[id].level})</option>`)
                .join('')}
            </select>
          </label>`,
          )
          .join('')}
        <div class="field">
          <span>Kruhy na břicho – cviky do úrovně</span>
          <div class="segmented seg-5" role="radiogroup">
            ${[1, 2, 3, 4, 5].map((n) => `<button role="radio" data-core="${n}" aria-checked="${levels.core === n}">${n}</button>`).join('')}
          </div>
        </div>
      </div>

      ${adjustments()}

      ${Object.entries(CATEGORIES)
        .map(([cat, label]) => {
          const list = EXERCISES.filter((x) => x.category === cat);
          return `
          <section class="card">
            <h2>${esc(label)} <span class="count">${list.length}</span></h2>
            <ul class="ex-list">${list.map((x) => exerciseRow(x, currentIds)).join('')}</ul>
          </section>`;
        })
        .join('')}
    </div>`;

  for (const t of root.querySelectorAll('[data-thumb]')) t.append(renderSVG(t.dataset.thumb, 0, { glow: false }));

  // Live animation only while a row is expanded.
  const live = new Map();
  for (const d of root.querySelectorAll('details[data-id]')) {
    d.addEventListener('toggle', () => {
      if (d.open && !live.has(d)) live.set(d, createFigure(d.querySelector('.ex-figure'), { id: d.dataset.id }));
      else if (!d.open && live.has(d)) {
        live.get(d).destroy();
        live.delete(d);
      }
    });
  }

  root.onchange = (e) => {
    const ladder = e.target.dataset.ladder;
    if (ladder) {
      setLevel(ladder, e.target.value);
      renderLibrary(root);
    }
  };
  root.onclick = (e) => {
    const unswap = e.target.closest('[data-unswap]')?.dataset.unswap;
    if (unswap) {
      removeSwap(unswap);
      renderLibrary(root);
      return;
    }
    const unboost = e.target.closest('[data-unboost]')?.dataset.unboost;
    if (unboost) {
      const p = getProgress();
      delete p.repBoost[unboost];
      set('progress', p);
      renderLibrary(root);
      return;
    }
    const core = e.target.closest('[data-core]')?.dataset.core;
    if (core) {
      setLevel('core', Number(core));
      renderLibrary(root);
    }
  };
}
