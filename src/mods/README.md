# src/mods

Every `*.js` file here is injected into `www/index.html` at build time by `scripts/prepare-web.mjs` (inline `<script>` placed right before `<!--NEXOS-END--></body>`). Files run in alphabetical order, after the whole main page script has loaded, so they can use globals such as `ls`, `toast`, `doShut`, `doRestart`, `doSleep` and `NX4`.

They are NOT inside `src/index.html`. Edit the mod file, not the built `www/` output.

## acc-3.3.0.js (accounts, login, security)
- Lock screen: PIN dot pop animation, key press feedback, shake on wrong PIN, success transition.
- Salted PBKDF2-SHA256 (120000 iterations) for PIN, password and recovery word (keys `aur.pin2`, `aur.pw2`, `aur.rw2`). Old unsalted SHA-256 PIN hashes (`aur.pinh`) are verified once and migrated on the next successful login. `aur.pinh` now holds the marker `v2` while any credential exists.
- Failed-attempt lockout (5 tries = 30 s) is saved in `aur.fails` / `aur.until`, so restarting the app does not reset it.
- Settings > Account page is rebuilt: profile picture (`aur.avatar`, 256px JPEG data URL), username, PIN, optional password, recovery word, lock at startup, lock/sign out, setup again, reset account. Changing security options needs the current PIN or password.
- Start-menu account button (bottom left) shows the profile picture and name.
- Power button (shut down / restart / sleep) on the lock screen and PIN page.
- First-run setup gets an optional recovery word field on the PIN step.
- Lock screen "Forgot PIN or password?" asks for the recovery word, then sets a new PIN (and removes the password).

## zz-zclock-4.2.0.js (Clock app)
- App id `nxclock` (Start search: clock, alarm, timer, stopwatch). Tabs: World clock (analog + digital, cities in `aur.clk.zones`), Alarm, Timer, Stopwatch.
- Alarms (`aur.alarms`) and timers (`aur.timers`) are the same ones Nex Island uses, so they ring and show on the island. Switch "Show the clock on Nex Island" sets `aur.isl.mode=always`.
- Needs `NXISLAND.ST/timer/decide` (exposed by src/patches/island-3.9.1.mjs).

## zz-zfix-4.2.0.js (right-click menu, Nex Island, File Manager)
- Right-click: explicit background per theme (`--nxm-bg --nxm-bd --nxm-hov`), colourful icon tiles (`data-k` on `.nxm-i`), the Add/New flyout is called "New", and Sort.../View... items get their own flyouts.
- Island: no blur filter on views, no backdrop blur on the pill, centred with auto margins (no half pixels). Cover art + title/artist of the playing song are read from ID3 / FLAC / M4A tags and written to `data-art`, `data-title`, `data-artist` on the audio element (the island already reads these).
- File Manager: `.exe` rows use `NW.exeIcon({path})` (paths come from a wrapper around `NF.list` or from a path attribute on the row). Doubled icons in one row are removed.
