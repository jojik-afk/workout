// Service worker: precaches the whole app so it works fully offline.
// Registered as a module worker (see js/pwa.js) so it can read the photo list.
//
// Bump VERSION whenever you deploy a change — the new version is downloaded in
// the background and the app offers "New version – Reload".
// `node tools/check-precache.mjs` verifies APP_FILES lists every app file.

import { PHOTOS } from './js/data/photoMap.js';

const VERSION = 2;
const CACHE = `core-daily-v${VERSION}`;

const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/audio.js',
  'js/data/exercises.js',
  'js/data/photoMap.js',
  'js/data/plan.js',
  'js/data/poses.js',
  'js/main.js',
  'js/progression.js',
  'js/pwa.js',
  'js/records.js',
  'js/session.js',
  'js/storage.js',
  'js/timer.js',
  'js/ui/chart.js',
  'js/ui/dialog.js',
  'js/ui/figure.js',
  'js/ui/history.js',
  'js/ui/library.js',
  'js/ui/player.js',
  'js/ui/settings.js',
  'js/ui/summary.js',
  'js/ui/today.js',
  'js/ui/util.js',
  'js/wakelock.js',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/maskable-192.png',
  'assets/icons/maskable-512.png',
  'assets/icons/apple-touch-icon.png',
];

const PHOTO_FILES = Object.values(PHOTOS)
  .flat()
  .map((f) => `assets/photos/${f}`);

self.addEventListener('install', (event) => {
  // cache: 'reload' bypasses the HTTP cache so a new version gets fresh files.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([...APP_FILES, ...PHOTO_FILES].map((u) => new Request(u, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('core-daily-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Cache first; navigations fall back to the cached app shell.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (hit) return hit;
      try {
        return await fetch(req);
      } catch (err) {
        if (req.mode === 'navigate') {
          const shell = await cache.match('index.html');
          if (shell) return shell;
        }
        throw err;
      }
    })(),
  );
});
