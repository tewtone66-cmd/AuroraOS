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

## code-3.5.0.js (Code Editor, part 1)
- Overrides `A.code.f` (found via `A[id].f===appCode`, default id `code`). If building the new UI throws, the body is cleared and the old `appCode` runs. The old editor code stays in `src/index.html`.
- Two modes: `openApp('code',{path})` (double-click a file) = clean single-file view (no sidebar, no tabs); `openApp('code',{})` (Start menu / app) = full project UI: activity bar, Explorer, Search, Settings, tabs, panel.
- Explorer: project root (saved in `aur.cx.root`, default `<internal>/AuroraOS/D/Projects`) on top in bold caps, children indented 12px per level in a smaller font, lazy-loaded with `NF.list`, folders first. Material-style file/folder icons (`icon(name,dir,open)`, also `CX.icon`). Header buttons (corner): new file, new folder, rename, delete, refresh, collapse all. Inline name input like VS Code (Enter = ok, Esc = cancel). Right-click or long-press menu: Open, New File/Folder, Cut/Copy/Paste (`NF.paste`), Copy Path, Rename (F2), Delete (Del, confirmed), Refresh, Open Folder. Open tabs follow renames and deletes.
- Editor: textarea over a highlighted `<pre>` (one pair per tab, so each tab keeps its own undo history), line numbers, minimap (click/drag), bracket matching, current-line highlight, auto-close brackets/quotes, auto-indent, Tab/Shift+Tab indent, snippets (type the prefix, press Tab), comment toggle, move/duplicate/delete line, find/replace widget (case, whole word, regex, replace all), go to line, auto save (1.2 s after typing, on by default; untitled files are never auto-saved), save-on-tab-switch.
- Panel (bottom): Output, Preview, Terminal. Drag the top edge to resize (size saved in `aur.cx.ph`); double-click the edge to maximize/restore. Sidebar width is draggable too (`aur.cx.sw`).
- Run (F5 / Ctrl+Enter): JavaScript (Web Worker, console captured), TypeScript (compiler loaded from jsDelivr on first use), Python (Pyodide in a Worker, loaded from jsDelivr on first use, imports like numpy auto-load), HTML (iframe preview, local CSS/JS files inlined, console and errors go to Output), CSS (preview on a sample page), Markdown (preview), SVG (preview), JSON (validate), BAT (opens the Terminal app). Terminal tab: JavaScript REPL (stateful), `py <code>`, `run`, `clear`, `help`.
- Command palette: Ctrl+P files, Ctrl+Shift+P / F1 commands, `:` line. Other shortcuts: Ctrl+S, Ctrl+Shift+S, Ctrl+N, Ctrl+W, Ctrl+B, Ctrl+J, Ctrl+`, Ctrl+F, Ctrl+H, Ctrl+G, Ctrl+/, Alt+Up/Down, Shift+Alt+Down, Ctrl+Shift+K, Shift+Alt+F (format), Ctrl+Shift+E/F, Ctrl+, (settings).
- Settings (`aur.cx.set`): color theme (Auto follows NexOS), font, font size, tab size, spaces, auto save, minimap, line numbers, bracket matching, clear output on run. Built-in themes: NexOS Dark/Light, Monokai, One Dark, Solarized Dark, GitHub Light.
- Extension API (`window.CX`): `addTheme`, `addLang`, `addSnippets`, `addFormatter`, `addRunner`, `addView`, `addCommand`, `menu`, `icon`, `hl`. Part 2 (`code-ext-*.js`) builds Extensions and AI on top of it.
- Limits: no word wrap, no multi-cursor, binary files are refused, files over 3 MB cannot be read (limit of `NF.readText`). Python and TypeScript need internet on first use.
