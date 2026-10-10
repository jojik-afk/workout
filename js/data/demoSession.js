// Milestone 1: hard-coded session for testing the player.
// Replaced by data/exercises.js + data/plan.js + the session generator in milestone 2.

const EX = {
  armCircles: { id: 'arm-circles', name: 'Arm circles', czCue: 'Velké kruhy pažemi, v půlce času změň směr.' },
  jumpingJacks: { id: 'jumping-jacks', name: 'Jumping jacks', czCue: 'Lehce na špičkách, paže až nad hlavu.' },
  catCow: { id: 'cat-cow', name: 'Cat-cow', czCue: 'Na čtyřech střídej kulatá a prohnutá záda, pomalu s dechem.' },
  scapHang: {
    id: 'scapular-hangs',
    name: 'Scapular hangs',
    czCue: 'Vis s propnutými pažemi, stahuj lopatky dolů a zase povol.',
    hanging: true,
  },
  diamond: { id: 'diamond-push-ups', name: 'Diamond push-ups', czCue: 'Dlaně u sebe pod hrudníkem, lokty podél těla.' },
  hangingKnee: {
    id: 'hanging-knee-raises',
    name: 'Hanging knee raises',
    czCue: 'Podsaď pánev, kolena k hrudníku, nehoupej se, dolů pomalu.',
    hanging: true,
  },
  legRaises: { id: 'lying-leg-raises', name: 'Lying leg raises', czCue: 'Bedra přitisknutá k zemi, nohy spouštěj pomalu.' },
  reverseCrunch: { id: 'reverse-crunches', name: 'Reverse crunches', czCue: 'Kolena k hrudníku a zvedni pánev od země, bez švihu.' },
  flutter: { id: 'flutter-kicks', name: 'Flutter kicks', czCue: 'Bedra u země, nohy nízko, rychlé malé kopy.' },
  bicycle: { id: 'bicycle-crunches', name: 'Bicycle crunches', czCue: 'Loket k opačnému kolenu, druhou nohu propni.' },
  shoulderTaps: { id: 'plank-shoulder-taps', name: 'Plank shoulder taps', czCue: 'Pevný plank, boky se nehoupou, střídej ruce.' },
  climbers: { id: 'mountain-climbers', name: 'Mountain climbers', czCue: 'Ruce pod rameny, rychle střídej kolena k hrudníku.' },
  hollow: { id: 'hollow-body-hold', name: 'Hollow body hold', czCue: 'Bedra u země, ramena a nohy nad zemí, tělo jako banán.' },
};

const WARMUP = [EX.armCircles, EX.jumpingJacks, EX.catCow, EX.scapHang];
const CIRCUIT = [
  EX.hangingKnee,
  EX.legRaises,
  EX.reverseCrunch,
  EX.flutter,
  EX.bicycle,
  EX.shoulderTaps,
  EX.climbers,
  EX.hollow,
];
const SETS = 3;

export function buildDemoSession({ type = 'full', test = false } = {}) {
  const T = test
    ? { prep: 5, warm: 6, work: 8, rest: 4, setRest: 8, transition: 6 }
    : { prep: 10, warm: 30, work: 40, rest: 20, setRest: 75, transition: 20 };
  const phases = [];
  const full = type === 'full';

  phases.push({ kind: 'prep', duration: T.prep, block: 'prep', exercise: full ? WARMUP[0] : CIRCUIT[0] });

  if (full) {
    WARMUP.forEach((exercise, i) =>
      phases.push({ kind: 'warmup', duration: T.warm, block: 'warmup', exercise, counter: [i + 1, WARMUP.length] }),
    );
    phases.push({ kind: 'rest', duration: T.transition, block: 'strength', exercise: EX.diamond, set: [1, SETS] });
    for (let s = 1; s <= SETS; s++) {
      phases.push({ kind: 'reps', duration: null, block: 'strength', exercise: EX.diamond, set: [s, SETS], target: [10, 15] });
      if (s < SETS) {
        phases.push({ kind: 'rest', duration: T.setRest, block: 'strength', exercise: EX.diamond, set: [s + 1, SETS] });
      }
    }
    phases.push({ kind: 'rest', duration: T.transition, block: 'abs', exercise: CIRCUIT[0], counter: [1, CIRCUIT.length] });
  }

  CIRCUIT.forEach((exercise, i) => {
    const n = CIRCUIT.length;
    phases.push({ kind: 'work', duration: T.work, block: 'abs', exercise, counter: [i + 1, n], round: [1, 1] });
    if (i < n - 1) {
      phases.push({ kind: 'rest', duration: T.rest, block: 'abs', exercise: CIRCUIT[i + 1], counter: [i + 2, n], round: [1, 1] });
    }
  });

  return {
    id: `demo-${Date.now()}`,
    title: full ? 'Testovací trénink' : 'Kruh na břicho',
    createdAt: Date.now(),
    phases,
  };
}

export function estimateMinutes(session) {
  const sec = session.phases.reduce((s, p) => s + (p.duration ?? 40), 0);
  return Math.round(sec / 60);
}
