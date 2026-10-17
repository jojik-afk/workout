// Weekly plan. The session for a date is decided by its weekday only, so a
// missed day is simply skipped (no catch-up). Max-effort pull-ups are only on
// Tue and Fri, never two days in a row.

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // Date#getDay order
export const WEEK_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_SHORT = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };
export const DAY_NAMES = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

// Progression ladders: followed through exercises' progressesTo from `root`.
// `start` is the default current level for a new user.
export const LADDERS = {
  'push-a': { name: 'Push-ups (Monday)', root: 'wide-push-ups', start: 'diamond-push-ups' },
  'push-b': { name: 'Feet-elevated push-ups (Thursday)', root: 'decline-push-ups', start: 'decline-push-ups' },
  'pull-a': { name: 'Overhand pull-ups (Tuesday)', root: 'scapular-pull-ups', start: 'pull-ups' },
  'pull-b': { name: 'Underhand pull-ups (Friday)', root: 'chin-ups', start: 'chin-ups' },
  legs: { name: 'Legs (Wednesday)', root: 'squats', start: 'bulgarian-split-squats' },
  hanging: { name: 'Hanging abs', root: 'hanging-knee-raises', start: 'hanging-knee-raises' },
};

export const DEFAULT_CORE_LEVEL = 3; // ab circuits use exercises up to this level

// Ab circuit focus: an ordered list of category slots (mixing in other
// categories keeps 40 s intervals doable and spares the grip on hanging day).
export const FOCUS = {
  lower: { label: 'Lower abs', slots: ['lower', 'lower', 'upper', 'lower', 'cardio', 'lower', 'antiext'] },
  obliques: { label: 'Obliques and rotation', slots: ['obliques', 'obliques', 'cardio', 'obliques', 'lower', 'obliques', 'antiext'] },
  mixed: {
    label: 'Heria-style mix',
    slots: ['lower', 'upper', 'obliques', 'antiext', 'cardio', 'lower', 'obliques', 'upper'],
  },
  hanging: { label: 'Hanging abs', slots: ['hanging', 'lower', 'antiext', 'hanging', 'upper', 'obliques', 'cardio'] },
  antiext: { label: 'Anti-extension (planks, hollow)', slots: ['antiext', 'lower', 'antiext', 'upper', 'antiext', 'cardio', 'antiext'] },
  hard: { label: 'Hard day', slots: ['lower', 'obliques', 'upper', 'antiext', 'hanging', 'cardio'] },
  light: { label: 'Light core', slots: ['antiext', 'lower', 'obliques'], maxLevel: 2 },
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
  wed: { title: 'Legs', strength: { ladder: 'legs' }, abs: { focus: 'mixed' } },
  thu: { title: 'Push', strength: { ladder: 'push-b' }, abs: { focus: 'hanging' } },
  fri: { title: 'Pull', strength: { ladder: 'pull-b', alt: 'slow-negatives' }, abs: { focus: 'antiext' } },
  sat: { title: 'Full-body HIIT', hiit: true, abs: { focus: 'hard', rounds: 2 } },
  sun: { title: 'Mobility', mobility: true, abs: { focus: 'light', light: true } },
};
