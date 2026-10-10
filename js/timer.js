// Timestamp-based workout timer.
//
// A session is a flat list of phases: { kind, duration (s) | null, ... }.
// duration === null means an open-ended rep set that waits for completeReps().
// Remaining time is always derived from wall-clock timestamps (Date.now(), which
// keeps counting while the phone sleeps — unlike performance.now() on Android),
// never from counting ticks. tick() can be called at any rate; if the page was
// throttled or backgrounded it fast-forwards through every elapsed phase.

const EST_REPS_SET = 40; // seconds, used only for the progress bar

export class Timer {
  constructor(phases, handlers = {}, clock = () => Date.now()) {
    this.phases = phases;
    this.h = handlers;
    this.clock = clock;
    this.index = 0;
    this.phaseStart = 0;
    this.startedAt = 0;
    this.pausedAt = null;
    this.pausedTotal = 0;
    this.status = 'idle'; // idle | running | paused | done
    this.done = {}; // phase index -> log entry
    this.lastCount = null;

    // Prefix sums of estimated durations for the progress bar.
    this.est = phases.map((p) => p.duration ?? EST_REPS_SET);
    this.prefix = [0];
    for (const d of this.est) this.prefix.push(this.prefix.at(-1) + d);
  }

  get phase() {
    return this.phases[this.index];
  }

  start() {
    const t = this.clock();
    this.startedAt = t;
    this.phaseStart = t;
    this.status = 'running';
    this._enter({ caughtUp: false });
  }

  serialize() {
    const { index, phaseStart, startedAt, pausedAt, pausedTotal, done } = this;
    return { index, phaseStart, startedAt, pausedAt, pausedTotal, done };
  }

  restore(s) {
    Object.assign(this, {
      index: s.index,
      phaseStart: s.phaseStart,
      startedAt: s.startedAt,
      pausedAt: s.pausedAt,
      pausedTotal: s.pausedTotal,
      done: s.done || {},
    });
    this.status = s.pausedAt != null ? 'paused' : 'running';
    if (this.status === 'running' && this._advance(this.clock()) < 0) return;
    this._enter({ caughtUp: true });
  }

  elapsed(t = this.clock()) {
    return Math.max(0, ((this.pausedAt ?? t) - this.phaseStart) / 1000);
  }

  remaining() {
    const p = this.phase;
    if (!p || p.duration == null) return null;
    return Math.max(0, p.duration - this.elapsed());
  }

  progress() {
    if (this.status === 'done') return 1;
    const cur = Math.min(this.elapsed(), this.est[this.index] ?? 0);
    return Math.min(1, (this.prefix[this.index] + cur) / this.prefix.at(-1));
  }

  activeMs(t = this.clock()) {
    const pausedNow = this.pausedAt != null ? t - this.pausedAt : 0;
    return Math.max(0, t - this.startedAt - this.pausedTotal - pausedNow);
  }

  tick() {
    if (this.status !== 'running') return;
    const t = this.clock();
    const steps = this._advance(t);
    if (steps < 0) return;
    if (steps > 0) {
      // More than one phase passed, or we arrived late: we were throttled/backgrounded.
      this._enter({ caughtUp: steps > 1 || t - this.phaseStart > 1500 });
      return;
    }
    const rem = this.remaining();
    if (rem != null && rem <= 3) {
      const n = Math.ceil(rem);
      if (n >= 1 && n !== this.lastCount) {
        this.lastCount = n;
        // Only beep if we hit the second boundary on time (not after a resume).
        if (n - rem < 0.5) this.h.onCountdown?.(n, this.phases[this.index + 1]);
      }
    }
  }

  pause() {
    if (this.status !== 'running') return;
    this.pausedAt = this.clock();
    this.status = 'paused';
    this.h.onState?.('paused');
  }

  resume() {
    if (this.status !== 'paused') return;
    const d = this.clock() - this.pausedAt;
    this.pausedTotal += d;
    this.phaseStart += d;
    this.pausedAt = null;
    this.status = 'running';
    this.h.onState?.('running');
  }

  skip() {
    if (this.status === 'done' || this.status === 'idle') return;
    const t = this.clock();
    this._record(this.index, this.elapsed(t));
    this._goto(this.index + 1, t);
  }

  back() {
    if (this.status === 'done' || this.status === 'idle') return;
    const t = this.clock();
    // Within the first 3 s of a phase, go to the previous one; otherwise restart it.
    const target = this.elapsed(t) > 3 || this.index === 0 ? this.index : this.index - 1;
    this._goto(target, t);
  }

  completeReps(reps) {
    const p = this.phase;
    if (!p || p.kind !== 'reps' || this.status === 'done') return;
    this.done[this.index] = {
      exId: p.exercise.id,
      name: p.exercise.name,
      kind: 'reps',
      reps,
      set: p.set,
    };
    this._goto(this.index + 1, this.clock());
  }

  finish(early = false) {
    if (this.status === 'done') return;
    const t = this.clock();
    if (early) this._record(this.index, this.elapsed(t));
    const activeMs = this.activeMs(t);
    this.status = 'done';
    this.h.onDone?.({ early, activeMs, done: Object.values(this.done) });
  }

  // --- internals ---

  // Moves past every phase whose end time is <= t. Returns number of phases
  // advanced, or -1 if the session finished.
  _advance(t) {
    let steps = 0;
    for (;;) {
      const p = this.phase;
      if (p.duration == null) break;
      const end = this.phaseStart + p.duration * 1000;
      if (t < end) break;
      this._record(this.index, p.duration);
      this.index++;
      this.phaseStart = end;
      steps++;
      if (this.index >= this.phases.length) {
        this.finish(false);
        return -1;
      }
    }
    return steps;
  }

  _goto(index, t) {
    if (index >= this.phases.length) {
      this.finish(false);
      return;
    }
    this.index = Math.max(0, index);
    this.phaseStart = t;
    if (this.pausedAt != null) this.pausedAt = t;
    this._enter({ caughtUp: false });
  }

  // Timed exercise counts as done if at least half of it was performed.
  _record(index, elapsedSec) {
    const p = this.phases[index];
    if (!p || (p.kind !== 'work' && p.kind !== 'warmup')) return;
    if (elapsedSec < p.duration / 2) return;
    this.done[index] = { exId: p.exercise.id, name: p.exercise.name, kind: p.kind, duration: p.duration };
  }

  _enter(info) {
    this.lastCount = null;
    this.h.onPhase?.(this.phase, this.index, info);
  }
}
