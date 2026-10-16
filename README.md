# Aurora OS

Aurora OS is the original browser-based desktop simulation packaged as an Android app.

## Android APK
Every push to `main` runs the GitHub Actions workflow in `.github/workflows/android-apk.yml`. The workflow packages the web app as an Android APK in landscape orientation and uploads the APK as a workflow artifact.

## Design
The app keeps the Aurora OS web UI and uses its star/sparkle logo as the launcher icon. Screen orientation is locked to landscape.

## Download
Open **Actions → Build Aurora OS APK → latest successful run → Artifacts** to download the debug APK.
