// Progression: current levels in each ladder, plus the rules that suggest
// moving up/down after a session. Suggestions are only applied when confirmed.
//
// Rep exercises (double progression): top of the rep range on all sets in two
// sessions in a row → harder variation (or +2 reps when there is none).
// At least 2 sets below the range in two sessions in a row → easier variation.
// Ab circuits: after ≥ 10 sessions and ≥ 14 days → swap one exercise for its
// harder version, or extend intervals by 5 s (never beyond 50/10).
// Feedback: two "Hard" in a row hold all progression; two "Easy" in a row
// let it come sooner (one top session; 7 sessions / 10 days for ab circuits).

import { get, set } from './storage.js';
import { byId } from './data/exercises.js';
import { LADDERS, DEFAULT_CORE_LEVEL, SETS } from './data/plan.js';
import { getHistory, counts } from './records.js';

const DAY = 864e5;
const CORE = new Set(['lower', 'upper', 'obliques', 'antiext', 'cardio', 'hanging']);
const REP_STEP = 2;

// --- levels ---

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

// Ladder in which this exercise is the current level (if any).
function ladderOf(exId, levels = getLevels()) {
  return Object.keys(LADDERS).find((k) => levels[k] === exId) ?? null;
}

// --- progress state: rep boosts, ab-circuit swaps, decline/apply timestamps ---

export function getProgress() {
  const p = get('progress', {}) || {};
  return {
    repBoost: p.repBoost && typeof p.repBoost === 'object' ? p.repBoost : {},
    swaps: p.swaps && typeof p.swaps === 'object' ? p.swaps : {},
    resetAt: p.resetAt && typeof p.resetAt === 'object' ? p.resetAt : {},
    absSince: Number.isFinite(p.absSince) ? p.absSince : null,
    lastAbs: p.lastAbs ?? null,
  };
}

function saveProgress(p) {
  set('progress', p);
}

// Rep range for an exercise including any +reps boost.
export function targetFor(exId) {
  const base = byId[exId]?.reps ?? [8, 12];
  const boost = getProgress().repBoost[exId] ?? 0;
  return [base[0] + boost, base[1] + boost];
}

// Follows ab-circuit swaps (A → harder B → …).
export function swapped(exId, swaps = getProgress().swaps) {
  let id = exId;
  const seen = new Set();
  while (swaps[id] && byId[swaps[id]] && !seen.has(id)) {
    seen.add(id);
    id = swaps[id];
  }
  return id;
}

export function removeSwap(exId) {
  const p = getProgress();
  delete p.swaps[exId];
  saveProgress(p);
}

// --- evaluation ---

function feedbackStreak(history) {
  const fb = history.filter((e) => e.feedback).map((e) => e.feedback);
  const last2 = fb.slice(-2);
  return {
    hold: last2.length === 2 && last2.every((f) => f === 'hard'),
    early: last2.length === 2 && last2.every((f) => f === 'easy'),
  };
}

function strengthSuggestion(exId, history, progress, mood, levels) {
  const since = progress.resetAt[exId] ?? 0;
  const sessions = history
    .filter((e) => e.endedAt > since)
    .map((e) => e.sets.filter((s) => s.exId === exId && Array.isArray(s.target)))
    .filter((sets) => sets.length >= SETS);
  if (!sessions.length) return null;
  const top = (sets) => sets.every((s) => s.reps >= s.target[1]);
  const below = (sets) => sets.filter((s) => s.reps < s.target[0]).length >= 2;
  const ex = byId[exId];
  const ladder = ladderOf(exId, levels);
  const need = mood.early ? 1 : 2;
  const recent = sessions.slice(-need);

  if (!mood.hold && recent.length === need && recent.every(top)) {
    if (ladder && ex.progressesTo) {
      const next = byId[ex.progressesTo];
      return {
        type: 'up',
        exId,
        ladder,
        toId: next.id,
        title: `Move up to ${next.name}`,
        detail: `${ex.name}: top of the rep range on all sets ${need === 1 ? 'in the last workout' : 'twice in a row'}.`,
      };
    }
    const [lo, hi] = targetFor(exId);
    return {
      type: 'reps',
      exId,
      delta: REP_STEP,
      title: `Raise target to ${lo + REP_STEP}–${hi + REP_STEP} reps`,
      detail: `${ex.name}: top of the range on all sets${ex.progressesTo ? '' : ' and there is no harder variation'}.`,
    };
  }

  const last2 = sessions.slice(-2);
  if (last2.length === 2 && last2.every(below)) {
    const steps = ladder ? ladderSteps(ladder) : [];
    const i = steps.indexOf(exId);
    if (i > 0) {
      const prev = byId[steps[i - 1]];
      return {
        type: 'down',
        exId,
        ladder,
        toId: prev.id,
        title: `Step down to ${prev.name}`,
        detail: `${ex.name}: below the bottom of the rep range twice in a row.`,
      };
    }
    if ((progress.repBoost[exId] ?? 0) > 0) {
      const [lo, hi] = targetFor(exId);
      return {
        type: 'reps',
        exId,
        delta: -REP_STEP,
        title: `Lower target to ${lo - REP_STEP}–${hi - REP_STEP} reps`,
        detail: `${ex.name}: below the bottom of the rep range twice in a row.`,
      };
    }
  }
  return null;
}

// Most frequent recent circuit exercise that has a harder version available.
function swapCandidate(history, progress, levels) {
  const freq = new Map();
  const cutoff = Date.now() - 14 * DAY;
  for (const e of history) {
    if (e.endedAt < cutoff) continue;
    for (const t of e.timed) {
      const x = byId[t.exId];
      if (x && CORE.has(x.category)) freq.set(x.id, (freq.get(x.id) ?? 0) + 1);
    }
  }
  const hangSteps = ladderSteps('hanging');
  const ranked = [...freq].sort((a, b) => b[1] - a[1]).map(([id]) => byId[id]);
  for (const x of ranked) {
    if (!x.progressesTo || progress.swaps[x.id]) continue;
    if (hangSteps.includes(x.id)) {
      if (levels.hanging !== x.id) continue; // only the current hanging step moves up
      return { exId: x.id, toId: x.progressesTo, ladder: 'hanging' };
    }
    return { exId: x.id, toId: x.progressesTo };
  }
  return null;
}

function absSuggestion(history, progress, mood, settings, levels) {
  if (mood.hold) return null;
  const counted = history.filter(counts);
  if (!counted.length) return null;
  const since = progress.absSince ?? counted[0].endedAt;
  const n = counted.filter((e) => e.endedAt >= since).length;
  const days = (Date.now() - since) / DAY;
  const [needN, needDays] = mood.early ? [7, 10] : [10, 14];
  if (n < needN || days < needDays) return null;

  const canExtend = settings.work < 50;
  const swap = swapCandidate(history, progress, levels);
  // Alternate: interval first, then a swap, … Once at 50/10 only swaps remain.
  const kind = !canExtend || (progress.lastAbs === 'interval' && swap) ? 'swap' : 'interval';
  if (kind === 'swap' && swap) {
    return {
      type: 'abs-swap',
      ...swap,
      title: `Swap ${byId[swap.exId].name} → ${byId[swap.toId].name}`,
      detail: `Ab circuits: ${n} workouts in the last ${Math.round(days)} days.`,
    };
  }
  if (canExtend) {
    const work = Math.min(50, settings.work + 5);
    const rest = Math.max(10, 60 - work);
    return {
      type: 'abs-interval',
      work,
      rest,
      title: `Extend circuits to ${work}/${rest} s`,
      detail: `Ab circuits: ${n} workouts in the last ${Math.round(days)} days.`,
    };
  }
  return null;
}

// Suggestions after the given (already saved) session.
export function evaluate(entry, settings, history = getHistory()) {
  const progress = getProgress();
  const levels = getLevels();
  const mood = feedbackStreak(history.filter((e) => e.endedAt <= entry.endedAt));
  const out = [];
  for (const exId of new Set(entry.sets.map((s) => s.exId))) {
    const s = strengthSuggestion(exId, history, progress, mood, levels);
    if (s) out.push(s);
  }
  const a = absSuggestion(history, progress, mood, settings, levels);
  if (a) out.push(a);
  return { suggestions: out, hold: mood.hold, early: mood.early };
}

// Applies a confirmed suggestion. Returns a settings patch if intervals change.
export function apply(sg) {
  const p = getProgress();
  const now = Date.now();
  let settingsPatch = null;
  switch (sg.type) {
    case 'up':
    case 'down':
      setLevel(sg.ladder, sg.toId);
      p.resetAt[sg.exId] = now;
      p.resetAt[sg.toId] = now;
      break;
    case 'reps':
      p.repBoost[sg.exId] = Math.max(0, (p.repBoost[sg.exId] ?? 0) + sg.delta);
      p.resetAt[sg.exId] = now;
      break;
    case 'abs-swap':
      if (sg.ladder) setLevel(sg.ladder, sg.toId);
      else p.swaps[sg.exId] = sg.toId;
      p.absSince = now;
      p.lastAbs = 'swap';
      break;
    case 'abs-interval':
      settingsPatch = { work: sg.work, rest: sg.rest };
      p.absSince = now;
      p.lastAbs = 'interval';
      break;
  }
  saveProgress(p);
  return settingsPatch;
}

// Declined: wait for fresh evidence before suggesting the same thing again.
export function decline(sg) {
  const p = getProgress();
  const now = Date.now();
  if (sg.type.startsWith('abs-')) p.absSince = now - 7 * DAY; // ask again in about a week
  else p.resetAt[sg.exId] = now;
  saveProgress(p);
}
