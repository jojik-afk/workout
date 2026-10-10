// Session generator: date + settings + levels → flat list of timer phases.

import { EXERCISES, byId } from './data/exercises.js';
import { DAY_KEYS, DAY_NAMES, WEEK, FOCUS, WARMUP, HIIT, MOBILITY, SETS } from './data/plan.js';
import { getLevels, ladderSteps, getProgress, swapped, targetFor } from './progression.js';

const EST_SET = 40; // estimated seconds per rep set, for duration estimates
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || lo));

export const dayKeyOf = (date) => DAY_KEYS[date.getDay()];

// Weeks since Monday 1970-01-05, using local calendar dates (DST-safe).
export function weekIndex(date) {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((utc - Date.UTC(1970, 0, 5)) / (7 * 864e5));
}

function durations(s) {
  if (s.testMode) {
    return { prep: 5, warm: 6, work: 8, rest: 4, setRest: 8, transition: 6, roundRest: 6, hiitWork: 6, hiitRest: 3, mob: 6, mobRest: 3, lightWork: 6, lightRest: 3 };
  }
  return {
    prep: 10,
    warm: 30,
    work: clamp(s.work, 20, 50),
    rest: clamp(s.rest, 10, 30),
    setRest: clamp(s.setRest, 30, 180),
    transition: 20,
    roundRest: 40,
    hiitWork: 30,
    hiitRest: 15,
    mob: 45,
    mobRest: 5,
    lightWork: 30,
    lightRest: 15,
  };
}

// --- exercise selection ---

export function strengthExercise(dayKey, levels, week) {
  const s = WEEK[dayKey].strength;
  if (!s) return null;
  if (s.alt && week % 2 === 1) return byId[s.alt];
  return byId[levels[s.ladder]];
}

function candidates(category, levels, maxLevel, swaps) {
  if (category === 'hanging') {
    // Current ladder step first, then one easier step, then side variations.
    const steps = ladderSteps('hanging');
    const cur = Math.max(0, steps.indexOf(levels.hanging));
    const curLevel = byId[steps[cur]].level;
    const extras = EXERCISES.filter((x) => x.category === 'hanging' && !steps.includes(x.id) && x.level <= curLevel + 1);
    return [steps[cur], ...(cur > 0 ? [steps[cur - 1]] : []), ...extras.map((x) => x.id)].map((id) => byId[id]);
  }
  const all = EXERCISES.filter((x) => x.category === category).sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
  const allowed = all.filter((x) => x.level <= maxLevel);
  const pool = allowed.length ? allowed : all.slice(0, 1);
  // Accepted ab-circuit swaps replace an exercise with its harder version.
  return [...new Map(pool.map((x) => byId[swapped(x.id, swaps)]).map((x) => [x.id, x])).values()];
}

// Deterministic rotation: each week shifts the pick within every category, so
// the same circuit never repeats two weeks in a row. The day offset keeps
// different days of the same week apart.
export function buildCircuit(focusKey, levels, week, dayKey, swaps = getProgress().swaps) {
  const focus = FOCUS[focusKey];
  const maxLevel = Math.min(levels.core, focus.maxLevel ?? 5);
  const dayOff = DAY_KEYS.indexOf(dayKey);
  const used = new Set();
  const seen = {};
  const out = [];
  for (const cat of focus.slots) {
    const pool = candidates(cat, levels, maxLevel, swaps);
    const j = (seen[cat] = (seen[cat] ?? -1) + 1);
    let pick = null;
    if (cat === 'hanging' && j === 0) {
      pick = pool[0];
    } else {
      const start = (week + dayOff + j) % pool.length;
      for (let k = 0; k < pool.length && !pick; k++) {
        const c = pool[(start + k) % pool.length];
        if (!used.has(c.id)) pick = c;
      }
      pick ??= pool[start];
    }
    used.add(pick.id);
    out.push(pick);
  }
  return out;
}

// --- session ---

export function buildSession(date, settings, { absOnly = false } = {}) {
  const dayKey = dayKeyOf(date);
  const day = WEEK[dayKey];
  const levels = getLevels();
  const week = weekIndex(date);
  const T = durations(settings);
  const focus = FOCUS[day.abs.focus];
  const circuit = buildCircuit(day.abs.focus, levels, week, dayKey);
  const rounds = day.abs.rounds ?? 1;
  const light = !!day.abs.light;

  const phases = [];
  const blocks = [];
  let blockStart = 0;
  const endBlock = (id, label, detail, items) => {
    const seconds = phases.slice(blockStart).reduce((s, p) => s + (p.duration ?? EST_SET), 0);
    blocks.push({ id, label, detail, items, minutes: Math.max(1, Math.round(seconds / 60)) });
    blockStart = phases.length;
  };
  const timedList = (list, { block, kind = 'work', work, rest, label }) => {
    list.forEach((exercise, i) => {
      const counter = [i + 1, list.length];
      phases.push({ kind, duration: work, block, exercise, counter, label });
      if (i < list.length - 1 && rest > 0) {
        phases.push({ kind: 'rest', duration: rest, block, exercise: list[i + 1], counter: [i + 2, list.length] });
      }
    });
  };

  const strength = !absOnly ? strengthExercise(dayKey, levels, week) : null;
  const firstEx = absOnly ? circuit[0] : day.mobility ? byId[MOBILITY[0]] : byId[WARMUP[0]];
  phases.push({ kind: 'prep', duration: T.prep, block: 'prep', exercise: firstEx });
  blockStart = phases.length;

  if (!absOnly && day.mobility) {
    const list = MOBILITY.map((id) => byId[id]);
    timedList(list, { block: 'mobility', kind: 'warmup', work: T.mob, rest: T.mobRest, label: 'Protažení' });
    endBlock('mobility', 'Mobilita', `${list.length} cviků · ${T.mob} s`, list.map((x) => x.name));
  } else if (!absOnly) {
    const list = WARMUP.map((id) => byId[id]);
    timedList(list, { block: 'warmup', kind: 'warmup', work: T.warm, rest: 0 });
    endBlock('warmup', 'Rozcvička', `${list.length} cviky · ${T.warm} s`, list.map((x) => x.name));
  }

  if (strength) {
    const target = targetFor(strength.id);
    phases.push({ kind: 'rest', duration: T.transition, block: 'strength', exercise: strength, set: [1, SETS] });
    for (let s = 1; s <= SETS; s++) {
      phases.push({ kind: 'reps', duration: null, block: 'strength', exercise: strength, set: [s, SETS], target });
      if (s < SETS) {
        phases.push({ kind: 'rest', duration: T.setRest, block: 'strength', exercise: strength, set: [s + 1, SETS] });
      }
    }
    const per = strength.perSide ? ' / strana' : '';
    endBlock('strength', 'Síla', `${strength.name} · ${SETS} × ${target[0]}–${target[1]}${per}`, []);
  } else if (!absOnly && day.hiit) {
    const list = HIIT.map((id) => byId[id]);
    phases.push({ kind: 'rest', duration: T.transition, block: 'hiit', exercise: list[0], counter: [1, list.length] });
    timedList(list, { block: 'hiit', work: T.hiitWork, rest: T.hiitRest, label: 'HIIT' });
    endBlock('hiit', 'Full-body HIIT', `${list.length} cviků · ${T.hiitWork}/${T.hiitRest}`, list.map((x) => x.name));
  }

  // Ab circuit
  const work = light ? T.lightWork : T.work;
  const rest = light ? T.lightRest : T.rest;
  const n = circuit.length;
  if (phases.length > 1) {
    phases.push({ kind: 'rest', duration: T.transition, block: 'abs', exercise: circuit[0], counter: [1, n], round: [1, rounds] });
  }
  for (let r = 1; r <= rounds; r++) {
    circuit.forEach((exercise, i) => {
      phases.push({ kind: 'work', duration: work, block: 'abs', exercise, counter: [i + 1, n], round: [r, rounds] });
      if (i < n - 1) {
        phases.push({ kind: 'rest', duration: rest, block: 'abs', exercise: circuit[i + 1], counter: [i + 2, n], round: [r, rounds] });
      } else if (r < rounds) {
        phases.push({ kind: 'rest', duration: T.roundRest, block: 'abs', exercise: circuit[0], counter: [1, n], round: [r + 1, rounds], label: 'Pauza mezi koly' });
      }
    });
  }
  const roundsText = rounds > 1 ? ` · ${rounds} kola` : '';
  const absDetail = `${n} × ${work}/${rest}${roundsText}`;
  endBlock('abs', light ? 'Lehký core' : 'Břicho', light ? absDetail : `${focus.label} · ${absDetail}`, circuit.map((x) => x.name));

  const totalMin = blocks.reduce((s, b) => s + b.minutes, 0);
  return {
    id: `${date.toISOString().slice(0, 10)}-${Date.now()}`,
    dayKey,
    date: date.toISOString(),
    title: absOnly ? `${DAY_NAMES[dayKey]} · ${focus.label}` : `${DAY_NAMES[dayKey]} · ${day.title}`,
    subtitle: day.mobility ? `${day.title} + lehký core` : `${day.title} · ${focus.label}`,
    blocks,
    minutes: totalMin,
    test: !!settings.testMode, // shortened test session: not saved to history
    phases,
  };
}
