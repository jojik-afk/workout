// Exercise library.
// Fields: id, name (English), cue (one-line form cue), category,
// type ('timed' | 'reps'), level (1–5), progressesTo (next harder id or null).
// Optional: reps [min, max] for rep exercises, hanging (on the bar → safety note),
// perSide (reps counted per side), switchSides (timed hold: switch sides halfway).

export const CATEGORIES = {
  warmup: 'Warm-up',
  lower: 'Abs – lower',
  upper: 'Abs – upper',
  obliques: 'Abs – obliques',
  antiext: 'Abs – anti-extension',
  cardio: 'Abs – cardio',
  hanging: 'Abs – hanging',
  push: 'Push (push-ups)',
  pull: 'Pull (pull-ups)',
  legs: 'Legs',
  mobility: 'Mobility',
};

const e = (id, name, category, type, level, progressesTo, cue, extra = {}) => ({
  id,
  name,
  category,
  type,
  level,
  progressesTo,
  cue,
  ...extra,
});

export const EXERCISES = [
  // --- warm-up ---
  e('arm-circles', 'Arm circles', 'warmup', 'timed', 1, null, 'Big arm circles, switch direction halfway.'),
  e('jumping-jacks', 'Jumping jacks', 'warmup', 'timed', 1, null, 'Light on your toes, arms all the way overhead.'),
  e('cat-cow', 'Cat-cow', 'warmup', 'timed', 1, null, 'On all fours, alternate rounding and arching your back, slowly with your breath.'),
  e('scapular-hangs', 'Scapular hangs', 'warmup', 'timed', 1, null, 'Hang with straight arms, pull your shoulder blades down, then relax.', { hanging: true }),

  // --- core: lower abs ---
  e('reverse-crunches', 'Reverse crunches', 'lower', 'timed', 1, 'lying-leg-raises', 'Knees to chest and lift your hips off the floor, no swinging.'),
  e('lying-leg-raises', 'Lying leg raises', 'lower', 'timed', 2, 'hip-raises', 'Lower back pressed to the floor, lower your legs slowly.'),
  e('hip-raises', 'Hip raises', 'lower', 'timed', 3, null, 'Legs straight up, lift your hips toward the ceiling, lower slowly.'),
  e('flutter-kicks', 'Flutter kicks', 'lower', 'timed', 2, 'scissor-kicks', 'Lower back down, legs low, quick small kicks.'),
  e('scissor-kicks', 'Scissor kicks', 'lower', 'timed', 2, null, 'Lower back down, legs off the floor crossing like scissors.'),
  e('in-and-outs', 'In-and-outs', 'lower', 'timed', 2, null, 'Leaning on your elbows, pull knees to chest, then extend your legs above the floor.'),

  // --- core: upper / flexion ---
  e('crunches', 'Crunches', 'upper', 'timed', 1, 'sit-ups', 'Lower back on the floor, lift only your shoulder blades, chin off your chest.'),
  e('sit-ups', 'Sit-ups', 'upper', 'timed', 2, 'v-ups', 'Smoothly all the way up to sitting, down slowly one vertebra at a time.'),
  e('toe-taps', 'Toe taps', 'upper', 'timed', 1, 'tuck-ups', 'Legs straight up, reach your hands to your toes, shoulder blades off the floor.'),
  e('tuck-ups', 'Tuck-ups', 'upper', 'timed', 2, 'v-ups', 'From leaning back, tuck in: knees to chest, arms around your shins.'),
  e('v-ups', 'V-ups', 'upper', 'timed', 3, 'star-crunches', 'Straight arms and legs meet above your hips, lower slowly.'),
  e('star-crunches', 'Star crunches', 'upper', 'timed', 4, null, 'From a star on your back, curl into a ball, arms and legs together.'),

  // --- core: obliques ---
  e('heel-touches', 'Heel touches', 'obliques', 'timed', 1, 'bicycle-crunches', 'Shoulder blades off the floor, alternately reach a hand to your heel.'),
  e('bicycle-crunches', 'Bicycle crunches', 'obliques', 'timed', 2, 'oblique-v-ups', 'Elbow to opposite knee, straighten the other leg.'),
  e('oblique-v-ups', 'Oblique V-ups', 'obliques', 'timed', 3, null, 'Lying on your side, lift torso and legs together. Switch sides halfway.', { switchSides: true }),
  e('russian-twists', 'Russian twists', 'obliques', 'timed', 2, null, 'Lean back with a straight back, rotate your shoulders side to side.'),
  e('side-plank', 'Side plank', 'obliques', 'timed', 2, 'side-plank-hip-dips', 'Elbow under shoulder, body in one line. Switch sides halfway.', { switchSides: true }),
  e('side-plank-hip-dips', 'Side plank hip dips', 'obliques', 'timed', 3, null, 'In a side plank, dip your hip to the floor and lift. Switch sides halfway.', { switchSides: true }),

  // --- core: anti-extension ---
  e('plank', 'Plank', 'antiext', 'timed', 1, 'plank-shoulder-taps', 'Elbows under shoulders, brace abs and glutes, don’t sag.'),
  e('plank-shoulder-taps', 'Plank shoulder taps', 'antiext', 'timed', 2, 'plank-to-push-up', 'Solid plank, hips don’t sway, alternate hands.'),
  e('plank-to-push-up', 'Plank to push-up', 'antiext', 'timed', 3, null, 'From elbow plank up to high plank and back, keep your hips still.'),
  e('hollow-body-hold', 'Hollow body hold', 'antiext', 'timed', 2, 'hollow-rocks', 'Lower back down, shoulders and legs off the floor, body like a banana.'),
  e('hollow-rocks', 'Hollow rocks', 'antiext', 'timed', 3, null, 'Rock in the hollow position, body shape stays the same.'),

  // --- core: cardio ---
  e('mountain-climbers', 'Mountain climbers', 'cardio', 'timed', 1, 'cross-body-mountain-climbers', 'Hands under shoulders, quickly alternate knees to chest.'),
  e('cross-body-mountain-climbers', 'Cross-body mountain climbers', 'cardio', 'timed', 2, null, 'Knee to opposite elbow, keep your hips low.'),
  e('plank-jacks', 'Plank jacks', 'cardio', 'timed', 2, null, 'In a high plank, jump your feet out and in, hips low.'),
  e('burpees', 'Burpees', 'cardio', 'timed', 3, null, 'Squat, plank, push-up, back to squat and jump with a clap.'),

  // --- core: hanging (bar) ---
  e('hanging-knee-raises', 'Hanging knee raises', 'hanging', 'timed', 2, 'bent-knee-leg-raises', 'Tuck your pelvis, knees to chest, no swinging, lower slowly.', { hanging: true }),
  e('bent-knee-leg-raises', 'Bent-knee leg raises', 'hanging', 'timed', 3, 'hanging-leg-raises', 'Tuck your pelvis, thighs above horizontal, no swinging, lower slowly.', { hanging: true }),
  e('hanging-leg-raises', 'Hanging leg raises', 'hanging', 'timed', 4, 'toes-to-bar', 'Straight legs to horizontal, tuck your pelvis, no swinging, lower slowly.', { hanging: true }),
  e('toes-to-bar', 'Toes-to-bar', 'hanging', 'timed', 5, 'windshield-wipers', 'Toes all the way to the bar, tuck your pelvis, no swinging, lower slowly.', { hanging: true }),
  e('windshield-wipers', 'Windshield wipers', 'hanging', 'timed', 5, null, 'Legs up by the bar, slowly swing them side to side.', { hanging: true }),
  e('hanging-knee-raise-twists', 'Hanging knee raise twists', 'hanging', 'timed', 3, null, 'Tuck your pelvis, alternate knees to each side, no swinging.', { hanging: true }),

  // --- push ---
  e('wide-push-ups', 'Wide push-ups', 'push', 'reps', 1, 'push-ups', 'Hands wider than shoulders, body straight as a board.', { reps: [12, 20] }),
  e('push-ups', 'Push-ups', 'push', 'reps', 2, 'diamond-push-ups', 'Hands under shoulders, chest all the way to the floor, elbows about 45°.', { reps: [15, 25] }),
  e('diamond-push-ups', 'Diamond push-ups', 'push', 'reps', 3, 'archer-push-ups', 'Hands together under your chest, elbows along your body.', { reps: [10, 15] }),
  e('archer-push-ups', 'Archer push-ups', 'push', 'reps', 4, null, 'Wide stance, lower toward one hand, the other arm stays straight.', { reps: [5, 8], perSide: true }),
  e('decline-push-ups', 'Decline push-ups', 'push', 'reps', 3, 'pike-push-ups', 'Feet on a bed or chair, body straight, chest to the floor.', { reps: [10, 15] }),
  e('pike-push-ups', 'Pike push-ups', 'push', 'reps', 4, null, 'Hips high like a roof, head goes between your hands toward the floor.', { reps: [8, 12] }),
  e('explosive-push-ups', 'Explosive push-ups', 'push', 'reps', 4, null, 'Explode up until your hands leave the floor, land softly.', { reps: [6, 10] }),

  // --- pull ---
  e('scapular-pull-ups', 'Scapular pull-ups', 'pull', 'reps', 1, 'slow-negatives', 'Straight arms, pull your shoulder blades down so your body rises a few cm.', { reps: [8, 12], hanging: true }),
  e('slow-negatives', 'Slow negatives', 'pull', 'reps', 2, 'pull-ups', 'Jump up with your chin over the bar and lower yourself over 5 seconds.', { reps: [3, 5], hanging: true }),
  e('pull-ups', 'Pull-ups', 'pull', 'reps', 3, 'wide-pull-ups', 'Overhand grip, chin over the bar, full range, no swinging. Not to failure.', { reps: [5, 7], hanging: true }),
  e('wide-pull-ups', 'Wide pull-ups', 'pull', 'reps', 4, 'archer-pull-ups', 'Grip wider than shoulders, chest to the bar, no swinging.', { reps: [4, 6], hanging: true }),
  e('archer-pull-ups', 'Archer pull-ups', 'pull', 'reps', 5, null, 'Pull up toward one hand, the other arm stays almost straight.', { reps: [3, 5], hanging: true, perSide: true }),
  e('chin-ups', 'Chin-ups', 'pull', 'reps', 3, 'l-sit-pull-ups', 'Underhand grip shoulder-width, chin over the bar, lower slowly.', { reps: [5, 8], hanging: true }),
  e('l-sit-pull-ups', 'L-sit / tuck pull-ups', 'pull', 'reps', 4, null, 'Hold your knees (or straight legs) up and pull yourself up.', { reps: [4, 6], hanging: true }),

  // --- legs ---
  e('squats', 'Squats', 'legs', 'reps', 1, 'reverse-lunges', 'Heels down, knees out over your toes, go deep with a straight back.', { reps: [20, 30] }),
  e('reverse-lunges', 'Reverse lunges', 'legs', 'reps', 2, 'bulgarian-split-squats', 'Step back, rear knee almost to the floor, torso upright.', { reps: [10, 15], perSide: true }),
  e('bulgarian-split-squats', 'Bulgarian split squats', 'legs', 'reps', 3, null, 'Rear foot on a bed or chair, go straight down, knee over your toes.', { reps: [8, 12], perSide: true }),
  e('jump-squats', 'Jump squats', 'legs', 'reps', 3, null, 'Explosive jump from a squat, land softly straight into the next squat.', { reps: [12, 20] }),
  e('glute-bridges', 'Glute bridges', 'legs', 'reps', 1, 'single-leg-glute-bridges', 'Lying on your back, push your heels into the floor and lift your hips, squeeze your glutes.', { reps: [15, 25] }),
  e('single-leg-glute-bridges', 'Single-leg glute bridges', 'legs', 'reps', 2, null, 'Bridge on one leg, keep your hips level.', { reps: [10, 15], perSide: true }),
  e('wall-sit', 'Wall sit', 'legs', 'timed', 1, null, 'Back against the wall, thighs horizontal, knees over ankles.'),
  e('calf-raises', 'Calf raises', 'legs', 'reps', 1, null, 'Slowly up onto your toes and back down, pause briefly at the top.', { reps: [20, 30] }),

  // --- mobility (Sunday) ---
  e('hip-flexor-stretch', 'Hip flexor stretch', 'mobility', 'timed', 1, null, 'Lunge with your knee on the floor, push your hips forward. Switch sides halfway.', { switchSides: true }),
  e('hamstring-stretch', 'Hamstring stretch', 'mobility', 'timed', 1, null, 'Sit with straight legs, lean forward with a straight back.'),
  e('pigeon-stretch', 'Pigeon stretch', 'mobility', 'timed', 1, null, 'Front leg bent in front of you, back leg extended. Switch sides halfway.', { switchSides: true }),
  e('deep-squat-hold', 'Deep squat hold', 'mobility', 'timed', 1, null, 'Deep squat, heels down, elbows push your knees out.'),
  e('cobra-stretch', 'Cobra stretch', 'mobility', 'timed', 1, null, 'On your stomach, lift your chest on your arms, hips stay on the floor.'),
  e('childs-pose', "Child's pose", 'mobility', 'timed', 1, null, 'Kneel, sit back on your heels, stretch your arms forward and breathe into your back.'),
  e('thoracic-rotations', 'Thoracic rotations', 'mobility', 'timed', 1, null, 'On all fours, hand behind your head, rotate your elbow toward the ceiling. Switch sides halfway.', { switchSides: true }),
  e('shoulder-stretch', 'Cross-body shoulder stretch', 'mobility', 'timed', 1, null, 'Straight arm across your chest, press it in with the other. Switch sides halfway.', { switchSides: true }),
  e('dead-hang', 'Dead hang', 'mobility', 'timed', 1, null, 'Relaxed hang from the bar, loosen your shoulders and breathe calmly.', { hanging: true }),
];

export const byId = Object.fromEntries(EXERCISES.map((x) => [x.id, x]));
