// Library: my levels in each progression ladder + all exercises by category.

import { EXERCISES, CATEGORIES, byId } from '../data/exercises.js';
import { LADDERS } from '../data/plan.js';
import { getLevels, setLevel, ladderSteps } from '../progression.js';
import { esc } from './util.js';

const dots = (level) =>
  `<span class="dots" aria-label="Úroveň ${level} z 5">${[1, 2, 3, 4, 5]
    .map((i) => `<i class="${i <= level ? 'on' : ''}"></i>`)
    .join('')}</span>`;

function exerciseRow(x, currentIds) {
  const meta = [
    x.type === 'reps' && x.reps ? `${x.reps[0]}–${x.reps[1]} opak.${x.perSide ? ' / strana' : ''}` : 'na čas',
    x.hanging ? 'hrazda' : '',
    x.progressesTo ? `→ ${byId[x.progressesTo].name}` : '',
  ].filter(Boolean);
  return `
    <li class="ex ${currentIds.has(x.id) ? 'is-current' : ''}">
      <div class="ex-head">
        <span class="ex-name">${esc(x.name)}</span>
        ${dots(x.level)}
      </div>
      <p class="ex-cue">${esc(x.czCue)}</p>
      <p class="ex-meta">${meta.map(esc).join(' · ')}</p>
    </li>`;
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

  root.onchange = (e) => {
    const ladder = e.target.dataset.ladder;
    if (ladder) {
      setLevel(ladder, e.target.value);
      renderLibrary(root);
    }
  };
  root.onclick = (e) => {
    const core = e.target.closest('[data-core]')?.dataset.core;
    if (core) {
      setLevel('core', Number(core));
      renderLibrary(root);
    }
  };
}
