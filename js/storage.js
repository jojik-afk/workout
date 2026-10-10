// All localStorage access goes through here; every call is guarded because
// storage can be unavailable (private mode, quota, blocked site data).

const PREFIX = 'coreDaily.';

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export const DEFAULT_SETTINGS = {
  sound: true,
  voice: true,
  vibration: true,
  testMode: false,
  work: 40,
  rest: 20,
  setRest: 75,
};

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...get('settings', {}) };
}

export function saveSettings(s) {
  set('settings', s);
}
