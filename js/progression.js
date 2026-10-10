// Current levels in each progression ladder (+ core level for ab circuits).
// Automatic progression suggestions are added in milestone 4.

import { get, set } from './storage.js';
import { byId } from './data/exercises.js';
import { LADDERS, DEFAULT_CORE_LEVEL } from './data/plan.js';

export function ladderSteps(ladderId) {
  const steps = [];
  const seen = new Set();
  let id = LADDERS[ladderId]?.root;
  while (id && byId[id] && !seen.has(id)) {
    seen.add(id);
    steps.push(id);
    id = byId[id].progressesTo;
  }
  return steps;
}

export function getLevels() {
  const saved = get('levels', {}) || {};
  const levels = { core: DEFAULT_CORE_LEVEL };
  for (const [key, ladder] of Object.entries(LADDERS)) {
    levels[key] = ladderSteps(key).includes(saved[key]) ? saved[key] : ladder.start;
  }
  const core = Number(saved.core);
  if (Number.isInteger(core) && core >= 1 && core <= 5) levels.core = core;
  return levels;
}

export function setLevel(key, value) {
  const levels = getLevels();
  levels[key] = value;
  set('levels', levels);
}
