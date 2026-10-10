import { loadSettings, saveSettings, get, remove } from './storage.js';
import * as audio from './audio.js';
import { renderToday } from './ui/today.js';
import { renderHistory } from './ui/history.js';
import { renderLibrary } from './ui/library.js';
import { renderSettings } from './ui/settings.js';
import { startPlayer } from './ui/player.js';
import { renderSummary } from './ui/summary.js';
import { saveSession, streaks } from './records.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const ACTIVE_MAX_AGE = 6 * 60 * 60 * 1000;

let settings = loadSettings();
audio.configure(settings);
let player = null;
let previewDay = null; // weekday key shown on Today instead of today

function activeWorkout() {
  const a = get('active', null);
  if (!a?.session?.phases || !a.timer) return null;
  if (Date.now() - a.savedAt > ACTIVE_MAX_AGE) {
    remove('active');
    return null;
  }
  return a;
}

function updateSettings(next) {
  settings = next;
  saveSettings(settings);
  audio.configure(settings);
}

// Every screen sets its own handlers; clear the previous screen's first.
function mount() {
  app.onclick = null;
  app.onchange = null;
  document.body.classList.remove('in-player');
  nav.hidden = false;
  window.scrollTo(0, 0);
}

const routes = {
  dnes() {
    renderToday(app, {
      settings,
      active: activeWorkout(),
      previewDay,
      onPreview(day) {
        previewDay = day;
        route();
      },
      onStart: (session) => openPlayer(session, null),
      onResume() {
        const a = activeWorkout();
        if (a) openPlayer(a.session, a.timer);
        else route();
      },
      onDiscard() {
        remove('active');
        route();
      },
    });
  },
  historie() {
    renderHistory(app);
  },
  cviky() {
    renderLibrary(app);
  },
  nastaveni() {
    renderSettings(app, {
      settings,
      onChange(next) {
        updateSettings(next);
        route();
      },
    });
  },
};

function currentRoute() {
  const r = location.hash.slice(1);
  return routes[r] ? r : 'dnes';
}

function route() {
  if (player) return;
  const r = currentRoute();
  const y = window.scrollY;
  mount();
  routes[r]();
  if (r === 'cviky' || r === 'nastaveni') window.scrollTo(0, y); // keep place when re-rendering after a change
  for (const a of nav.querySelectorAll('a')) a.setAttribute('aria-current', a.getAttribute('href') === `#${r}` ? 'page' : 'false');
}

function openPlayer(session, restore) {
  audio.unlock(); // inside the Start tap gesture
  history.pushState({ player: true }, '');
  mount();
  nav.hidden = true;
  document.body.classList.add('in-player');
  let finished = false;
  const p = startPlayer(app, session, {
    restore,
    onFinish(result) {
      finished = true; // may run synchronously inside startPlayer when restoring
      player = null;
      if (history.state?.player) history.back();
      const entry = saveSession(session, result);
      mount();
      renderSummary(app, { ...result, saved: !!entry, streak: streaks().current }, () => {
        previewDay = null;
        if (location.hash !== '#dnes') location.hash = '#dnes';
        else route();
      });
    },
  });
  if (!finished) player = p;
}

window.addEventListener('hashchange', route);

// Android back button during a workout asks before leaving.
window.addEventListener('popstate', () => {
  if (player) {
    history.pushState({ player: true }, '');
    player.requestEnd();
  }
});

route();
