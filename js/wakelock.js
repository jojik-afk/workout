// Keeps the screen on during a workout. The browser drops the lock whenever the
// page is hidden, so we re-request it when the page becomes visible again.

let sentinel = null;
let wanted = false;

async function request() {
  if (!('wakeLock' in navigator)) return false;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
    return true;
  } catch {
    sentinel = null;
    return false;
  }
}

export async function acquire() {
  wanted = true;
  return request();
}

export async function release() {
  wanted = false;
  try {
    await sentinel?.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
}

document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible' && !sentinel) request();
});
