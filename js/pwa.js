// Service worker registration, "new version" banner and the install prompt.

let installEvent = null;
const installListeners = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // show our own button in Settings instead
  installEvent = e;
  installListeners.forEach((fn) => fn(true));
});

window.addEventListener('appinstalled', () => {
  installEvent = null;
  installListeners.forEach((fn) => fn(false));
});

export const canInstall = () => !!installEvent;

export function onInstallChange(fn) {
  installListeners.add(fn);
  return () => installListeners.delete(fn);
}

export async function promptInstall() {
  if (!installEvent) return false;
  installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = null;
  installListeners.forEach((fn) => fn(false));
  return outcome === 'accepted';
}

export function isStandalone() {
  try {
    return matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

// isBusy(): true while a workout runs — never reload in the middle of one.
export function registerSW({ isBusy }) {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  // The very first install also fires controllerchange (clients.claim) – only
  // reload when an existing version is being replaced.
  let hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloading || isBusy()) return;
    reloading = true;
    location.reload();
  });

  navigator.serviceWorker
    .register('sw.js', { type: 'module' })
    .then((reg) => {
      const offer = (worker) => showUpdateBanner(() => worker.postMessage('skipWaiting'), isBusy);
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          // "installed" with an existing controller = an update, not the first install.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
        });
      });
      // Check for a new version whenever the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    })
    .catch(() => {
      /* offline or unsupported: the app still works online */
    });
}

function showUpdateBanner(activate, isBusy) {
  if (document.querySelector('.update-banner')) return;
  const bar = document.createElement('div');
  bar.className = 'update-banner';
  bar.innerHTML = '<span>New app version</span><button class="btn btn-primary">Reload</button>';
  bar.querySelector('button').addEventListener('click', () => {
    if (isBusy()) {
      bar.querySelector('span').textContent = 'Will reload after the workout';
      return;
    }
    bar.remove();
    activate();
  });
  document.body.append(bar);
}
