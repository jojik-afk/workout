// Workout history: saving sessions, streaks and per-exercise progress.
// Stored under the "history" key as an array of session entries (oldest first).

import { get, set, remove } from './storage.js';

export const APP_ID = 'core-daily';
export const SCHEMA_VERSION = 1;
const MIN_COUNTED_MS = 5 * 60 * 1000; // an ended-early session still counts if ≥ 5 min

export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (k, n) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

export function getHistory() {
  const h = get('history', []);
  return Array.isArray(h) ? h.filter((e) => e && typeof e.date === 'string') : [];
}

export const counts = (e) => !e.early || e.activeMs >= MIN_COUNTED_MS;

// Builds a history entry from the player's result and stores it.
export function saveSession(session, result, endedAt = Date.now()) {
  const sets = result.done
    .filter((d) => d.kind === 'reps')
    .map(({ exId, name, set: s, reps, target }) => ({ exId, name, set: s, reps, target }));
  const timed = result.done
    .filter((d) => d.kind !== 'reps')
    .map(({ exId, name, kind, duration, reps }) => ({ exId, name, kind, duration, ...(reps != null ? { reps } : {}) }));
  if (!sets.length && !timed.length) return null;
  const entry = {
    id: session.id,
    date: dateKey(new Date(endedAt)),
    endedAt,
    dayKey: session.dayKey,
    title: session.title,
    early: !!result.early,
    activeMs: Math.round(result.activeMs),
    sets,
    timed,
  };
  const history = getHistory().filter((e) => e.id !== entry.id);
  history.push(entry);
  set('history', history);
  return entry;
}

export function updateSession(id, patch) {
  const history = getHistory();
  const e = history.find((x) => x.id === id);
  if (!e) return;
  Object.assign(e, patch);
  set('history', history);
}

export function doneDays(history = getHistory()) {
  return new Set(history.filter(counts).map((e) => e.date));
}

// Current streak: consecutive counted days ending today, or yesterday if
// today's session isn't done yet. Longest: best run ever.
export function streaks(history = getHistory(), today = dateKey()) {
  const days = doneDays(history);
  let current = 0;
  let k = days.has(today) ? today : addDays(today, -1);
  while (days.has(k)) {
    current++;
    k = addDays(k, -1);
  }
  let longest = 0;
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue; // not the start of a run
    let n = 0;
    let x = d;
    while (days.has(x)) {
      n++;
      x = addDays(x, 1);
    }
    longest = Math.max(longest, n);
  }
  return { current, longest, total: history.filter(counts).length, doneToday: days.has(today) };
}

// Best logged reps per day for one exercise (rep sets + optional reps logged
// for timed hanging exercises).
export function bestRepsSeries(exId, history = getHistory()) {
  const byDate = new Map();
  for (const e of history) {
    const reps = [...e.sets, ...e.timed].filter((s) => s.exId === exId && Number.isFinite(s.reps)).map((s) => s.reps);
    if (!reps.length) continue;
    byDate.set(e.date, Math.max(byDate.get(e.date) ?? 0, ...reps));
  }
  return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, best]) => ({ date, best }));
}

export function loggedExercises(history = getHistory()) {
  const ids = new Set();
  for (const e of history) for (const s of [...e.sets, ...e.timed]) if (Number.isFinite(s.reps)) ids.add(s.exId);
  return ids;
}

// --- backup ---

const KEYS = ['settings', 'levels', 'progress', 'history', 'lastReps', 'photoPref'];

export function exportData() {
  const data = {};
  for (const k of KEYS) {
    const v = get(k, undefined);
    if (v !== undefined) data[k] = v;
  }
  return { app: APP_ID, version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}

// Validates a parsed backup; returns a human-readable error or null.
export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object') return 'The file does not contain valid data.';
  if (obj.app !== APP_ID) return 'This is not a Core Daily backup.';
  if (typeof obj.version !== 'number' || obj.version > SCHEMA_VERSION) return 'The backup is from a newer version of the app.';
  if (!obj.data || typeof obj.data !== 'object') return 'The backup contains no data.';
  if (obj.data.history != null && !Array.isArray(obj.data.history)) return 'The history in the backup is corrupted.';
  return null;
}

export function importData(obj) {
  for (const k of KEYS) {
    if (k in obj.data) set(k, obj.data[k]);
    else remove(k);
  }
}

export function resetData() {
  for (const k of [...KEYS, 'active']) remove(k);
}
