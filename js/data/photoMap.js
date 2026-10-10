// Real photos from free-exercise-db (https://github.com/yuhonas/free-exercise-db,
// public domain / Unlicense). Each entry maps our exercise id to the dataset's
// exercise folder; the start (0) and end (1) photos are stored as
// assets/photos/<our-id>-0.webp / -1.webp by tools/fetch-photos.py.
// Edit by hand, then re-run the script. Exercises without a close match are left out.

export const SOURCES = {
  'arm-circles': 'Arm_Circles',
  'cat-cow': 'Cat_Stretch',
  'scapular-hangs': 'Scapular_Pull-Up',
  'scapular-pull-ups': 'Scapular_Pull-Up',
  'reverse-crunches': 'Reverse_Crunch',
  'scissor-kicks': 'Scissor_Kick',
  crunches: 'Crunches',
  'sit-ups': 'Sit-Up',
  'toe-taps': 'Toe_Touchers',
  'v-ups': 'Jackknife_Sit-Up',
  'heel-touches': 'Alternate_Heel_Touchers',
  'oblique-v-ups': 'Side_Jackknife',
  'russian-twists': 'Russian_Twist',
  'side-plank': 'Side_Bridge',
  plank: 'Plank',
  'mountain-climbers': 'Mountain_Climbers',
  'hanging-leg-raises': 'Hanging_Leg_Raise',
  'toes-to-bar': 'Hanging_Pike',
  'push-ups': 'Pushups',
  'wide-push-ups': 'Push-Up_Wide',
  'diamond-push-ups': 'Push-Ups_-_Close_Triceps_Position',
  'decline-push-ups': 'Decline_Push-Up',
  'explosive-push-ups': 'Plyo_Push-up',
  'pull-ups': 'Pullups',
  'chin-ups': 'Chin-Up',
  squats: 'Bodyweight_Squat',
  'jump-squats': 'Freehand_Jump_Squat',
  'glute-bridges': 'Butt_Lift_Bridge',
  'single-leg-glute-bridges': 'Single_Leg_Glute_Bridge',
  'hip-flexor-stretch': 'Kneeling_Hip_Flexor',
  'hamstring-stretch': 'Seated_Floor_Hamstring_Stretch',
  'childs-pose': 'Childs_Pose',
  'shoulder-stretch': 'Shoulder_Stretch',
};

export const PHOTOS = Object.fromEntries(Object.keys(SOURCES).map((id) => [id, [`${id}-0.webp`, `${id}-1.webp`]]));
