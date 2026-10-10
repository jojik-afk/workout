# Core Daily

Osobní PWA na denní kalisthenický trénink doma s hrazdou: 10–15 minut denně, důraz na břicho
(intervaly 40/20 ve stylu Chrise Herii). Čisté HTML + CSS + JavaScript (ES moduly), bez frameworku
a bez build kroku. Funguje offline a data ukládá jen v telefonu (`localStorage`).

## Spuštění na počítači

```sh
python -m http.server 8000      # na CachyOS případně python3
```

Pak otevři <http://localhost:8000>. Náhled všech animací cviků je na
<http://localhost:8000/dev/poses.html>.

## Testování na telefonu (Android, Chrome)

Wake lock (displej nezhasne) a service worker (offline) fungují jen přes **HTTPS nebo localhost**.

**USB + `adb reverse` (doporučeno, funguje všechno):**

```sh
sudo pacman -S android-tools
# v telefonu: Nastavení → Možnosti pro vývojáře → Ladění USB, připojit kabelem a povolit
adb reverse tcp:8000 tcp:8000
```

Na telefonu otevři v Chromu `http://localhost:8000`. Konzole telefonu je na PC v `chrome://inspect`.

**Přes Wi-Fi:** `http://<IP-počítače>:8000`. Je to nejrychlejší, ale bez wake locku a offline režimu
(případně povol port 8000 ve firewallu).

> Service worker servíruje soubory z cache. Když při vývoji na telefonu nevidíš změny, zvyš
> `VERSION` v `sw.js` (appka nabídne „Nová verze – Obnovit“), nebo v `chrome://inspect` zapni
> *Update on reload*.

## Nasazení na GitHub Pages

1. Repozitář musí být **veřejný** (GitHub Pages ze soukromého repa vyžaduje placený plán).
2. GitHub → *Settings → Pages → Build and deployment*: **Deploy from a branch**, větev `main`,
   složka `/ (root)`.
3. Po minutě poběží appka na `https://<uživatel>.github.io/<repo>/`
   (tady <https://jojik-afk.github.io/workout/>). Všechny cesty jsou relativní, takže podsložka nevadí.

Totéž přes `gh`:

```sh
gh repo edit --visibility public --accept-visibility-change-consequences
gh api -X POST repos/{owner}/{repo}/pages -f 'source[branch]=main' -f 'source[path]=/'
```

**Každá další verze:** zvyš `VERSION` v `sw.js`, zkontroluj precache a pushni:

```sh
node tools/check-precache.mjs   # ověří, že sw.js cachuje všechny soubory aplikace
git push
```

Telefon si novou verzi stáhne na pozadí a appka nabídne **Obnovit** (nikdy ne uprostřed tréninku).

## Instalace na telefon

V Chromu otevři adresu z GitHub Pages → menu ⋮ → **Nainstalovat aplikaci** (nebo tlačítko
v *Nastavení → Aplikace*). Pak appka funguje i v režimu letadlo.

## Data a záloha

Historie, úrovně a nastavení jsou jen v telefonu. *Nastavení → Data → Stáhnout zálohu* uloží JSON;
*Obnovit ze zálohy* ho nahraje zpět. Smazání dat prohlížeče nebo odinstalace appky data smaže,
takže si zálohu občas stáhni.

## Struktura

```
index.html, manifest.webmanifest, sw.js   app shell, PWA manifest, service worker (offline)
css/app.css                               styly (tmavé téma)
js/main.js                                router, spuštění tréninku, uložení výsledku
js/timer.js                               časovač počítaný z časových razítek (přežije zamčení telefonu)
js/audio.js, js/wakelock.js               pípání (Web Audio), vibrace, hlas, wake lock
js/session.js                             generátor tréninku pro daný den
js/progression.js                         úrovně, dvojitá progrese, progrese kruhů, zpětná vazba
js/records.js                             historie, streak, grafy, export/import
js/storage.js                             veškerý přístup k localStorage (ošetřený try/catch)
js/pwa.js                                 registrace service workeru, banner nové verze, instalace
js/data/exercises.js, plan.js             knihovna cviků, týdenní plán, žebříčky
js/data/poses.js                          keyframy postaviček – upravuj ručně, kontroluj v dev/poses.html
js/data/photoMap.js                       mapování na fotky z free-exercise-db
js/ui/*.js                                obrazovky a komponenty (přehrávač, postavička, graf, …)
assets/icons, assets/photos               ikony a fotky (WebP 400 px)
dev/poses.html                            náhled všech animací
tools/                                    pomocné skripty (nejsou součástí appky)
```

## Pomocné skripty

```sh
python3 -I tools/fetch-photos.py   # stáhne/převede fotky podle js/data/photoMap.js (potřebuje Pillow)
python3 -I tools/make-icons.py     # přegeneruje PNG ikony
node tools/check-precache.mjs      # zkontroluje seznam souborů v sw.js
```

## Zdroje

Fotky cviků: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain / Unlicense),
staženy jen vybrané a zmenšené. Animace postaviček jsou kreslené v kódu. Tlačítko „Video“ jen otevírá
vyhledávání na YouTube; žádná videa ani snímky nejsou součástí appky.
