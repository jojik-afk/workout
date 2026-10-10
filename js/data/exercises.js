// Exercise library.
// Fields: id, name (English), czCue (one-line Czech form cue), category,
// type ('timed' | 'reps'), level (1–5), progressesTo (next harder id or null).
// Optional: reps [min, max] for rep exercises, hanging (on the bar → safety note),
// perSide (reps counted per side), switchSides (timed hold: switch sides halfway).

export const CATEGORIES = {
  warmup: 'Rozcvička',
  lower: 'Břicho – spodní',
  upper: 'Břicho – horní',
  obliques: 'Břicho – šikmé',
  antiext: 'Břicho – anti-extenze',
  cardio: 'Břicho – kardio',
  hanging: 'Břicho – na hrazdě',
  push: 'Push (kliky)',
  pull: 'Pull (shyby)',
  legs: 'Nohy',
  mobility: 'Mobilita',
};

const e = (id, name, category, type, level, progressesTo, czCue, extra = {}) => ({
  id,
  name,
  category,
  type,
  level,
  progressesTo,
  czCue,
  ...extra,
});

export const EXERCISES = [
  // --- warm-up ---
  e('arm-circles', 'Arm circles', 'warmup', 'timed', 1, null, 'Velké kruhy pažemi, v půlce času změň směr.'),
  e('jumping-jacks', 'Jumping jacks', 'warmup', 'timed', 1, null, 'Lehce na špičkách, paže až nad hlavu.'),
  e('cat-cow', 'Cat-cow', 'warmup', 'timed', 1, null, 'Na čtyřech střídej kulatá a prohnutá záda, pomalu s dechem.'),
  e('scapular-hangs', 'Scapular hangs', 'warmup', 'timed', 1, null, 'Vis s propnutými pažemi, stahuj lopatky dolů a zase povol.', { hanging: true }),

  // --- core: lower abs ---
  e('reverse-crunches', 'Reverse crunches', 'lower', 'timed', 1, 'lying-leg-raises', 'Kolena k hrudníku a zvedni pánev od země, bez švihu.'),
  e('lying-leg-raises', 'Lying leg raises', 'lower', 'timed', 2, 'hip-raises', 'Bedra přitisknutá k zemi, nohy spouštěj pomalu.'),
  e('hip-raises', 'Hip raises', 'lower', 'timed', 3, null, 'Nohy kolmo vzhůru, zvedni pánev ke stropu, dolů pomalu.'),
  e('flutter-kicks', 'Flutter kicks', 'lower', 'timed', 2, 'scissor-kicks', 'Bedra u země, nohy nízko, rychlé malé kopy.'),
  e('scissor-kicks', 'Scissor kicks', 'lower', 'timed', 2, null, 'Bedra u země, nohy nad zemí se kříží jako nůžky.'),
  e('in-and-outs', 'In-and-outs', 'lower', 'timed', 2, null, 'Opřený o lokty přitáhni kolena k hrudníku, pak nohy propni nad zemí.'),

  // --- core: upper / flexion ---
  e('crunches', 'Crunches', 'upper', 'timed', 1, 'sit-ups', 'Bedra na zemi, zvedej jen lopatky, brada od hrudníku.'),
  e('sit-ups', 'Sit-ups', 'upper', 'timed', 2, 'v-ups', 'Plynule až do sedu, dolů pomalu obratel po obratli.'),
  e('toe-taps', 'Toe taps', 'upper', 'timed', 1, 'tuck-ups', 'Nohy kolmo vzhůru, sahej rukama ke špičkám, lopatky od země.'),
  e('tuck-ups', 'Tuck-ups', 'upper', 'timed', 2, 'v-ups', 'Ze záklonu se sbal: kolena k hrudníku, ruce kolem holení.'),
  e('v-ups', 'V-ups', 'upper', 'timed', 3, 'star-crunches', 'Propnuté ruce i nohy se potkají nad boky, dolů pomalu.'),
  e('star-crunches', 'Star crunches', 'upper', 'timed', 4, null, 'Z hvězdy na zádech se sbal do klubíčka, ruce i nohy k sobě.'),

  // --- core: obliques ---
  e('heel-touches', 'Heel touches', 'obliques', 'timed', 1, 'bicycle-crunches', 'Lopatky nad zemí, střídavě sahej rukou k patě.'),
  e('bicycle-crunches', 'Bicycle crunches', 'obliques', 'timed', 2, 'oblique-v-ups', 'Loket k opačnému kolenu, druhou nohu propni.'),
  e('oblique-v-ups', 'Oblique V-ups', 'obliques', 'timed', 3, null, 'Leh na boku, zvedni trup i nohy k sobě. V půlce vyměň strany.', { switchSides: true }),
  e('russian-twists', 'Russian twists', 'obliques', 'timed', 2, null, 'Záklon s rovnými zády, otáčej ramena ze strany na stranu.'),
  e('side-plank', 'Side plank', 'obliques', 'timed', 2, 'side-plank-hip-dips', 'Loket pod ramenem, tělo v jedné linii. V půlce vyměň strany.', { switchSides: true }),
  e('side-plank-hip-dips', 'Side plank hip dips', 'obliques', 'timed', 3, null, 'V bočním planku spouštěj bok k zemi a zvedej. V půlce vyměň strany.', { switchSides: true }),

  // --- core: anti-extension ---
  e('plank', 'Plank', 'antiext', 'timed', 1, 'plank-shoulder-taps', 'Lokty pod rameny, zatni břicho i hýždě, neprohýbej se.'),
  e('plank-shoulder-taps', 'Plank shoulder taps', 'antiext', 'timed', 2, 'plank-to-push-up', 'Pevný plank, boky se nehoupou, střídej ruce.'),
  e('plank-to-push-up', 'Plank to push-up', 'antiext', 'timed', 3, null, 'Z planku na lokty do vzporu a zpět, boky drž v klidu.'),
  e('hollow-body-hold', 'Hollow body hold', 'antiext', 'timed', 2, 'hollow-rocks', 'Bedra u země, ramena a nohy nad zemí, tělo jako banán.'),
  e('hollow-rocks', 'Hollow rocks', 'antiext', 'timed', 3, null, 'V pozici hollow se houpej, tvar těla se nemění.'),

  // --- core: cardio ---
  e('mountain-climbers', 'Mountain climbers', 'cardio', 'timed', 1, 'cross-body-mountain-climbers', 'Ruce pod rameny, rychle střídej kolena k hrudníku.'),
  e('cross-body-mountain-climbers', 'Cross-body mountain climbers', 'cardio', 'timed', 2, null, 'Koleno k opačnému lokti, boky drž nízko.'),
  e('plank-jacks', 'Plank jacks', 'cardio', 'timed', 2, null, 'Ve vzporu roznožuj a snožuj výskokem, boky nízko.'),
  e('burpees', 'Burpees', 'cardio', 'timed', 3, null, 'Dřep, vzpor, klik, zpět do dřepu a výskok s tlesknutím.'),

  // --- core: hanging (bar) ---
  e('hanging-knee-raises', 'Hanging knee raises', 'hanging', 'timed', 2, 'bent-knee-leg-raises', 'Podsaď pánev, kolena k hrudníku, nehoupej se, dolů pomalu.', { hanging: true }),
  e('bent-knee-leg-raises', 'Bent-knee leg raises', 'hanging', 'timed', 3, 'hanging-leg-raises', 'Podsaď pánev, stehna nad vodorovnou, nehoupej se, dolů pomalu.', { hanging: true }),
  e('hanging-leg-raises', 'Hanging leg raises', 'hanging', 'timed', 4, 'toes-to-bar', 'Propnuté nohy do vodorovné, podsaď pánev, bez švihu, dolů pomalu.', { hanging: true }),
  e('toes-to-bar', 'Toes-to-bar', 'hanging', 'timed', 5, 'windshield-wipers', 'Špičky až k hrazdě, podsaď pánev, nehoupej se, dolů pomalu.', { hanging: true }),
  e('windshield-wipers', 'Windshield wipers', 'hanging', 'timed', 5, null, 'Nohy nahoře u hrazdy, pomalu je kývej ze strany na stranu.', { hanging: true }),
  e('hanging-knee-raise-twists', 'Hanging knee raise twists', 'hanging', 'timed', 3, null, 'Podsaď pánev, kolena střídavě k bokům, nehoupej se.', { hanging: true }),

  // --- push ---
  e('wide-push-ups', 'Wide push-ups', 'push', 'reps', 1, 'push-ups', 'Dlaně širší než ramena, tělo rovné jako prkno.', { reps: [12, 20] }),
  e('push-ups', 'Push-ups', 'push', 'reps', 2, 'diamond-push-ups', 'Dlaně pod rameny, hrudník až k zemi, lokty asi 45°.', { reps: [15, 25] }),
  e('diamond-push-ups', 'Diamond push-ups', 'push', 'reps', 3, 'archer-push-ups', 'Dlaně u sebe pod hrudníkem, lokty podél těla.', { reps: [10, 15] }),
  e('archer-push-ups', 'Archer push-ups', 'push', 'reps', 4, null, 'Široko, jdi dolů k jedné ruce, druhá zůstane propnutá.', { reps: [5, 8], perSide: true }),
  e('decline-push-ups', 'Decline push-ups', 'push', 'reps', 3, 'pike-push-ups', 'Nohy na posteli nebo židli, tělo rovné, hrudník k zemi.', { reps: [10, 15] }),
  e('pike-push-ups', 'Pike push-ups', 'push', 'reps', 4, null, 'Boky vysoko jako stříška, hlava jde mezi ruce k zemi.', { reps: [8, 12] }),
  e('explosive-push-ups', 'Explosive push-ups', 'push', 'reps', 4, null, 'Výbušně nahoru, až se dlaně odlepí od země, měkce dopadni.', { reps: [6, 10] }),

  // --- pull ---
  e('scapular-pull-ups', 'Scapular pull-ups', 'pull', 'reps', 1, 'slow-negatives', 'Propnuté paže, stáhni lopatky dolů a tělo se zvedne o pár cm.', { reps: [8, 12], hanging: true }),
  e('slow-negatives', 'Slow negatives', 'pull', 'reps', 2, 'pull-ups', 'Vyskoč bradou nad hrazdu a spouštěj se 5 sekund.', { reps: [3, 5], hanging: true }),
  e('pull-ups', 'Pull-ups', 'pull', 'reps', 3, 'wide-pull-ups', 'Nadhmat, brada nad hrazdu, plný rozsah, bez švihu. Ne do selhání.', { reps: [5, 7], hanging: true }),
  e('wide-pull-ups', 'Wide pull-ups', 'pull', 'reps', 4, 'archer-pull-ups', 'Úchop širší než ramena, hrudník k hrazdě, bez švihu.', { reps: [4, 6], hanging: true }),
  e('archer-pull-ups', 'Archer pull-ups', 'pull', 'reps', 5, null, 'Přitáhni se k jedné ruce, druhá paže zůstane skoro propnutá.', { reps: [3, 5], hanging: true, perSide: true }),
  e('chin-ups', 'Chin-ups', 'pull', 'reps', 3, 'l-sit-pull-ups', 'Podhmat na šířku ramen, brada nad hrazdu, dolů pomalu.', { reps: [5, 8], hanging: true }),
  e('l-sit-pull-ups', 'L-sit / tuck pull-ups', 'pull', 'reps', 4, null, 'Kolena (nebo propnuté nohy) drž nahoře a přitahuj se.', { reps: [4, 6], hanging: true }),

  // --- legs ---
  e('squats', 'Squats', 'legs', 'reps', 1, 'reverse-lunges', 'Paty na zemi, kolena ven nad špičky, hluboko a rovná záda.', { reps: [20, 30] }),
  e('reverse-lunges', 'Reverse lunges', 'legs', 'reps', 2, 'bulgarian-split-squats', 'Krok vzad, zadní koleno skoro k zemi, trup vzpřímený.', { reps: [10, 15], perSide: true }),
  e('bulgarian-split-squats', 'Bulgarian split squats', 'legs', 'reps', 3, null, 'Zadní noha na posteli či židli, jdi dolů svisle, koleno nad špičkou.', { reps: [8, 12], perSide: true }),
  e('jump-squats', 'Jump squats', 'legs', 'reps', 3, null, 'Z dřepu výbušný výskok, měkký dopad rovnou do dalšího dřepu.', { reps: [12, 20] }),
  e('glute-bridges', 'Glute bridges', 'legs', 'reps', 1, 'single-leg-glute-bridges', 'Leh na zádech, tlač paty do země a zvedni pánev, zatni hýždě.', { reps: [15, 25] }),
  e('single-leg-glute-bridges', 'Single-leg glute bridges', 'legs', 'reps', 2, null, 'Most na jedné noze, pánev drž rovně.', { reps: [10, 15], perSide: true }),
  e('wall-sit', 'Wall sit', 'legs', 'timed', 1, null, 'Záda na zdi, stehna vodorovně, kolena nad kotníky.'),
  e('calf-raises', 'Calf raises', 'legs', 'reps', 1, null, 'Pomalu na špičky a zase dolů, nahoře krátce zastav.', { reps: [20, 30] }),

  // --- mobility (Sunday) ---
  e('hip-flexor-stretch', 'Hip flexor stretch', 'mobility', 'timed', 1, null, 'Výpad s kolenem na zemi, zatlač pánev dopředu. V půlce vyměň strany.', { switchSides: true }),
  e('hamstring-stretch', 'Hamstring stretch', 'mobility', 'timed', 1, null, 'Sed s propnutýma nohama, předkloň se s rovnými zády.'),
  e('pigeon-stretch', 'Pigeon stretch', 'mobility', 'timed', 1, null, 'Přední noha pokrčená před tělem, zadní natažená. V půlce vyměň strany.', { switchSides: true }),
  e('deep-squat-hold', 'Deep squat hold', 'mobility', 'timed', 1, null, 'Hluboký dřep, paty na zemi, lokty tlačí kolena ven.'),
  e('cobra-stretch', 'Cobra stretch', 'mobility', 'timed', 1, null, 'Na břiše zvedni hrudník na pažích, boky zůstanou na zemi.'),
  e('childs-pose', "Child's pose", 'mobility', 'timed', 1, null, 'Klek, sedni na paty, paže natáhni dopředu a dýchej do zad.'),
  e('thoracic-rotations', 'Thoracic rotations', 'mobility', 'timed', 1, null, 'Na čtyřech, ruka za hlavou, otáčej loket ke stropu. V půlce vyměň strany.', { switchSides: true }),
  e('shoulder-stretch', 'Cross-body shoulder stretch', 'mobility', 'timed', 1, null, 'Natažená paže přes hrudník, druhou ji přitlač. V půlce vyměň strany.', { switchSides: true }),
  e('dead-hang', 'Dead hang', 'mobility', 'timed', 1, null, 'Volný vis na hrazdě, uvolni ramena a klidně dýchej.', { hanging: true }),
];

export const byId = Object.fromEntries(EXERCISES.map((x) => [x.id, x]));
