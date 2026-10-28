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

## tm-3.5.0.js (Task Manager)
- Replaces the UI of the old `appTask` at runtime: `A.taskmgr.f` is overridden (the app is found via `A[id].f===appTask`, default id `taskmgr`). If building the new UI throws, the window body is cleared and the old `appTask` runs, so the app never ends up blank.
- Tabs: Processes (grouped Apps / Background / NexOS system, heat-map CPU/Memory/Disk/Network columns, totals in the header), Performance (CPU with per-core graphs, Memory, Disk, Network; smooth scrolling 60 s graphs on canvas), App history (CPU time, network, launches, last used; stored in `aur.tmh`), Startup apps (enable/disable is saved in `aur.tmst` but cosmetic), Details (PID, status, user, threads, up time, description).
- Real data: open windows (`W`), their app names/icons (`A`, `IC`), z-order for the foreground app, minimized = Suspended, launch counts, JS heap (`performance.memory`), cores (`navigator.hardwareConcurrency`), device memory, storage estimate, connection info, and `NF.sysInfo()` RAM values when they can be recognised by key name. Per-process CPU/disk/network numbers are simulated.
- Actions: End task (closes the real window; system processes show "Access denied", background services restart after 7 s), Switch to, Go to details, Copy PID/name, Run new task, search, click-to-sort columns, right-click or long-press menu, Delete key.
- Animations: keyed row updates with FLIP reordering, new-row flash, end-task flash + strike + slide-out, staggered list replay and slide on tab switch, graph tab crossfade. `body.perf` / `body.rm` turn animations and the 60 fps graph loop off (graphs then update once per 2 s tick).
- Themes: only CSS tokens (`--txt --mut --line --hov --acc --pn --surf --pop-sh`) with fallbacks; the context menu gets a blur in `html[data-skin=glass]`. Responsive by window width (columns hide below breakpoints, Performance switches to a top strip below 640px).
