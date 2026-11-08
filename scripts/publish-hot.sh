#!/bin/sh
# Publishes the small-update bundle (built mods + manifest) so the app can download only what changed.
# Run it after you changed something in src/mods (and committed it). Usage:  sh scripts/publish-hot.sh
set -e
cd "$(dirname "$0")/.."
command -v node >/dev/null 2>&1 || { echo "Install Node first: pkg install nodejs"; exit 1; }
git pull -q
NXHU_OUT=updates/hot node scripts/prepare-web.mjs
git add updates/hot
if git diff --cached --quiet; then echo "Nothing new to publish."; exit 0; fi
git commit -m "Small update bundle"
git push
echo "Published. In NexOS: Settings > Update > Check GitHub."
