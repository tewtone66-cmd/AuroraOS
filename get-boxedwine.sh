#!/data/data/com.termux/files/usr/bin/sh
# Downloads the Boxedwine (Wine + x86 emulator, WebAssembly) runtime for Aurora OS. ~65 MB.
set -e
D=/storage/emulated/0/AuroraOS/boxedwine
U=https://www.boxedwine.org/boxedwine
mkdir -p "$D"
for f in boxedwine.js boxedwine.wasm boxedwine-shell.js browserfs.boxedwine.js jszip.min.js; do
  echo "-> $f"; curl -fL -o "$D/$f" "$U/build/default/$f"
done
echo "-> fullWine1.7.55-v8.zip (50 MB)"
curl -fL -o "$D/fullWine1.7.55-v8.zip" "$U/fs/fullWine1.7.55-v8.zip"
ls -l "$D"
