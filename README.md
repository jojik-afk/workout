# Core Daily

A personal PWA for daily calisthenics at home with a pull-up bar: 10–15 minutes a day, focused on abs
(40/20 intervals in the style of Chris Heria). Plain HTML + CSS + JavaScript (ES modules), no framework
and no build step. Works offline and stores data only on the phone (`localStorage`).

## Running on a computer

```sh
python -m http.server 8000      # on CachyOS possibly python3
```

Then open <http://localhost:8000>. A preview of all exercise animations is at
<http://localhost:8000/dev/poses.html>.

## Testing on a phone (Android, Chrome)

Wake lock (screen stays on) and the service worker (offline) only work over **HTTPS or localhost**.

**USB + `adb reverse` (recommended, everything works):**

```sh
sudo pacman -S android-tools
# on the phone: Settings → Developer options → USB debugging, connect the cable and allow
adb reverse tcp:8000 tcp:8000
```

On the phone, open `http://localhost:8000` in Chrome. The phone's console is on the PC at `chrome://inspect`.

**Over Wi-Fi:** `http://<computer-IP>:8000`. It's the quickest, but without wake lock and offline mode
(you may need to allow port 8000 in the firewall).

> The service worker serves files from the cache. If you don't see changes on the phone during
> development, bump `VERSION` in `sw.js` (the app will offer "New version – Reload"), or enable
> *Update on reload* in `chrome://inspect`.

## Deploying to GitHub Pages

1. The repository must be **public** (GitHub Pages from a private repo requires a paid plan).
2. GitHub → *Settings → Pages → Build and deployment*: **Deploy from a branch**, branch `main`,
   folder `/ (root)`.
3. After a minute the app runs at `https://<user>.github.io/<repo>/`
   (here <https://jojik-afk.github.io/workout/>). All paths are relative, so the subfolder is fine.

The same via `gh`:

```sh
gh repo edit --visibility public --accept-visibility-change-consequences
gh api -X POST repos/{owner}/{repo}/pages -f 'source[branch]=main' -f 'source[path]=/'
```

**Every new version:** bump `VERSION` in `sw.js`, check the precache list and push:

```sh
node tools/check-precache.mjs   # verifies that sw.js caches every app file
git push
```

The phone downloads the new version in the background and the app offers **Reload** (never in the middle of a workout).

## Installing on the phone

In Chrome, open the GitHub Pages address → menu ⋮ → **Install app** (or use the button
in *Settings → App*). The app then works in airplane mode too.

## Data and backup

History, levels and settings live only on the phone. *Settings → Data → Download backup* saves a JSON file;
*Restore from backup* loads it back. Clearing browser data or uninstalling the app deletes the data,
so download a backup now and then.

## Structure

```
index.html, manifest.webmanifest, sw.js   app shell, PWA manifest, service worker (offline)
css/app.css                               styles (dark theme)
js/main.js                                router, starting a workout, saving the result
js/timer.js                               timestamp-based timer (survives the phone locking)
js/audio.js, js/wakelock.js               beeps (Web Audio), vibration, voice, wake lock
js/session.js                             workout generator for a given day
js/progression.js                         levels, double progression, circuit progression, feedback
js/records.js                             history, streak, charts, export/import
js/storage.js                             all localStorage access (wrapped in try/catch)
js/pwa.js                                 service worker registration, new-version banner, install
js/data/exercises.js, plan.js             exercise library, weekly plan, ladders
js/data/poses.js                          stick-figure keyframes – edit by hand, check in dev/poses.html
js/data/photoMap.js                       mapping to photos from free-exercise-db
js/ui/*.js                                screens and components (player, figure, chart, …)
assets/icons, assets/photos               icons and photos (WebP 400 px)
dev/poses.html                            preview of all animations
tools/                                    helper scripts (not part of the app)
```

## Helper scripts

```sh
python3 -I tools/fetch-photos.py   # downloads/converts photos per js/data/photoMap.js (needs Pillow)
python3 -I tools/make-icons.py     # regenerates the PNG icons
node tools/check-precache.mjs      # checks the file list in sw.js
```

## Credits

Exercise photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain / Unlicense),
only selected ones downloaded and downscaled. The stick-figure animations are drawn in code. The "Video" button
only opens a YouTube search; no videos or frames are part of the app.
