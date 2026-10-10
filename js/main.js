import { loadSettings, saveSettings, get, remove } from './storage.js';
import * as audio from './audio.js';
import { buildDemoSession } from './data/demoSession.js';
import { renderToday } from './ui/today.js';
import { startPlayer } from './ui/player.js';
import { renderSummary } from './ui/summary.js';

const app = document.getElementById('app');
const ACTIVE_MAX_AGE = 6 * 60 * 60 * 1000;

let settings = loadSettings();
audio.configure(settings);
let player = null;

function activeWorkout() {
  const a = get('active', null);
  if (!a?.session?.phases || !a.timer) return null;
  if (Date.now() - a.savedAt > ACTIVE_MAX_AGE) {
    remove('active');
    return null;
  }
  return a;
}

function showToday() {
  player = null;
  renderToday(app, {
    settings,
    active: activeWorkout(),
    onChange(next, rerender) {
      settings = next;
      saveSettings(settings);
      audio.configure(settings);
      if (rerender) showToday();
    },
    onStart() {
      openPlayer(buildDemoSession({ type: settings.sessionType, test: settings.testMode }), null);
    },
    onResume() {
      const a = activeWorkout();
      if (a) openPlayer(a.session, a.timer);
      else showToday();
    },
    onDiscard() {
      remove('active');
      showToday();
    },
  });
}

function openPlayer(session, restore) {
  audio.unlock(); // inside the Start tap gesture
  history.pushState({ player: true }, '');
  app.onclick = null;
  app.onchange = null;
  let finished = false;
  const p = startPlayer(app, session, {
    restore,
    onFinish(result) {
      finished = true; // may run synchronously inside startPlayer when restoring
      player = null;
      if (history.state?.player) history.back();
      renderSummary(app, result, showToday);
    },
  });
  if (!finished) player = p;
}

// Android back button during a workout asks before leaving.
window.addEventListener('popstate', () => {
  if (player) {
    history.pushState({ player: true }, '');
    player.requestEnd();
  }
});

showToday();
