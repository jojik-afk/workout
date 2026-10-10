// Weekly plan. The session for a date is decided by its weekday only, so a
// missed day is simply skipped (no catch-up). Max-effort pull-ups are only on
// Tue and Fri, never two days in a row.

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // Date#getDay order
export const WEEK_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_SHORT = { mon: 'Po', tue: 'Út', wed: 'St', thu: 'Čt', fri: 'Pá', sat: 'So', sun: 'Ne' };
export const DAY_NAMES = {
  mon: 'Pondělí',
  tue: 'Úterý',
  wed: 'Středa',
  thu: 'Čtvrtek',
  fri: 'Pátek',
  sat: 'Sobota',
  sun: 'Neděle',
};

// Progression ladders: followed through exercises' progressesTo from `root`.
// `start` is the default current level for a new user.
export const LADDERS = {
  'push-a': { name: 'Kliky (pondělí)', root: 'wide-push-ups', start: 'diamond-push-ups' },
  'push-b': { name: 'Kliky nohy výš (čtvrtek)', root: 'decline-push-ups', start: 'decline-push-ups' },
  'pull-a': { name: 'Shyby nadhmatem (úterý)', root: 'scapular-pull-ups', start: 'pull-ups' },
  'pull-b': { name: 'Shyby podhmatem (pátek)', root: 'chin-ups', start: 'chin-ups' },
  legs: { name: 'Nohy (středa)', root: 'squats', start: 'bulgarian-split-squats' },
  hanging: { name: 'Břicho na hrazdě', root: 'hanging-knee-raises', start: 'hanging-knee-raises' },
};

export const DEFAULT_CORE_LEVEL = 3; // ab circuits use exercises up to this level

// Ab circuit focus: an ordered list of category slots (mixing in other
// categories keeps 40 s intervals doable and spares the grip on hanging day).
export const FOCUS = {
  lower: { label: 'Spodní břicho', slots: ['lower', 'lower', 'upper', 'lower', 'cardio', 'lower', 'antiext'] },
  obliques: { label: 'Šikmé svaly a rotace', slots: ['obliques', 'obliques', 'cardio', 'obliques', 'lower', 'obliques', 'antiext'] },
  mixed: {
    label: 'Mix ve stylu Heria',
    slots: ['lower', 'upper', 'obliques', 'antiext', 'cardio', 'lower', 'obliques', 'upper'],
  },
  hanging: { label: 'Břicho na hrazdě', slots: ['hanging', 'lower', 'antiext', 'hanging', 'upper', 'obliques', 'cardio'] },
  antiext: { label: 'Anti-extenze (planky, hollow)', slots: ['antiext', 'lower', 'antiext', 'upper', 'antiext', 'cardio', 'antiext'] },
  hard: { label: 'Těžký den', slots: ['lower', 'obliques', 'upper', 'antiext', 'hanging', 'cardio'] },
  light: { label: 'Lehký core', slots: ['antiext', 'lower', 'obliques'], maxLevel: 2 },
};

export const WARMUP = ['arm-circles', 'jumping-jacks', 'cat-cow', 'scapular-hangs'];
export const HIIT = ['burpees', 'jump-squats', 'push-ups', 'mountain-climbers', 'reverse-lunges', 'plank-jacks'];
export const MOBILITY = [
  'cat-cow',
  'hip-flexor-stretch',
  'hamstring-stretch',
  'pigeon-stretch',
  'deep-squat-hold',
  'cobra-stretch',
  'thoracic-rotations',
  'shoulder-stretch',
  'dead-hang',
  'childs-pose',
];

export const SETS = 3;

// strength.alt: on odd weeks Friday swaps chin-ups for slow negatives.
export const WEEK = {
  mon: { title: 'Push', strength: { ladder: 'push-a' }, abs: { focus: 'lower' } },
  tue: { title: 'Pull', strength: { ladder: 'pull-a' }, abs: { focus: 'obliques' } },
  wed: { title: 'Nohy', strength: { ladder: 'legs' }, abs: { focus: 'mixed' } },
  thu: { title: 'Push', strength: { ladder: 'push-b' }, abs: { focus: 'hanging' } },
  fri: { title: 'Pull', strength: { ladder: 'pull-b', alt: 'slow-negatives' }, abs: { focus: 'antiext' } },
  sat: { title: 'Full-body HIIT', hiit: true, abs: { focus: 'hard', rounds: 2 } },
  sun: { title: 'Mobilita', mobility: true, abs: { focus: 'light', light: true } },
};
