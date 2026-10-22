# NexOS 2.1

A desktop-style OS shell packaged as an Android app (landscape).

- **Browser** – real tabs on native Android WebViews (desktop user agent): links that open new windows become new tabs, file uploads work, downloads go to your Downloads folder, bookmarks bar with a star button.
- **File Explorer** – Windows-style: Quick access, This PC, `Local Disk (C:)` = your internal storage, breadcrumb, details/icon view, sortable columns, search, New folder / Cut / Copy / Paste / Rename / Delete, right-click menus, opens files with the matching app. On first run press **Allow** to grant "All files access".
- **Virtual mouse** – touchpad mode: drag = move, tap = click, two fingers = scroll, hold **L** + drag = drag windows, **R** = right click. The pointer is drawn above the browser and can click/scroll/drag inside web pages. A physical mouse switches it off automatically.
- One icon set and one theme (light/dark/auto) across desktop, dock, launcher, window title bars and the Android launcher icon (`assets/aurora-icon.svg`).

Source of the OS: `src/index.html`. Native code: `android-src/`. Build: push to `main`, then download the APK from **Actions → Build NexOS APK → Artifacts**.

If you previously uploaded the "part 1" zip, delete the old `source/` and `apps/` folders from the repo (they are not used any more).
