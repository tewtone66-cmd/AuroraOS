import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const src = path.join(root, 'src', 'index.html');
if (!fs.existsSync(src)) throw new Error('Missing src/index.html');
let html = fs.readFileSync(src, 'utf8');

// Mods: every src/mods/*.js file is injected as an inline <script> right before
// the final <!--NEXOS-END--></body>, so it runs after the main code has loaded.
const modsDir = path.join(root, 'src', 'mods');
const modText = {};
if (fs.existsSync(modsDir)) {
  for (const f of fs.readdirSync(modsDir).filter((x) => x.endsWith('.js')).sort()) {
    modText[f] = fs.readFileSync(path.join(modsDir, f), 'utf8');
  }
}

// Patches: exact text replacements applied at build time.
// src/patches/*.mjs export default [{ name, find, replace, mod?, optional? }].
//  - without `mod` the patch edits src/index.html, with `mod: 'file.js'` it edits that mod file.
//  - `find` must occur exactly once, otherwise the build fails (so a patch never silently misses).
//  - `optional: true` only prints a warning instead of failing (used for patches into other mods).
const patchDir = path.join(root, 'src', 'patches');
if (fs.existsSync(patchDir)) {
  for (const f of fs.readdirSync(patchDir).filter((x) => x.endsWith('.mjs')).sort()) {
    const list = (await import(pathToFileURL(path.join(patchDir, f)).href)).default;
    for (const p of list) {
      const isMod = !!p.mod;
      const text = isMod ? modText[p.mod] : html;
      if (isMod && text == null) {
        if (p.optional) { console.warn('WARN patch "' + p.name + '": mod ' + p.mod + ' not found'); continue; }
        throw new Error('Patch "' + p.name + '" (' + f + '): mod ' + p.mod + ' not found');
      }
      const n = text.split(p.find).length - 1;
      if (n !== 1) {
        const msg = 'Patch "' + p.name + '" (' + f + '): expected 1 match, found ' + n;
        if (p.optional) { console.warn('WARN ' + msg); continue; }
        throw new Error(msg);
      }
      const res = text.replace(p.find, () => p.replace);
      if (isMod) modText[p.mod] = res; else html = res;
      console.log('Patched: ' + p.name);
    }
  }
}

const mods = Object.keys(modText).sort();
if (mods.length) {
  const tag = '<!--NEXOS-END--></body>';
  const at = html.lastIndexOf(tag);
  if (at < 0) throw new Error('Marker ' + tag + ' not found in src/index.html');
  const code = mods
    .map((f) => '<script>/* mod: ' + f + ' */\n' + modText[f].replace(/<\/script/gi, '<\\/script') + '\n</script>')
    .join('\n');
  html = html.slice(0, at) + code + html.slice(at);
  console.log('Injected mods: ' + mods.join(', '));
}
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('NexOS web app written to www/index.html');

// Theme preview images shown in Settings > Themes (assets/theme-previews/*.svg|png|jpg|webp).
// Replace the placeholder files there (keep the names dark/light/glass) or edit THEME_META in src/index.html.
const prevDir = path.join(root, 'assets', 'theme-previews');
if (fs.existsSync(prevDir)) {
  fs.cpSync(prevDir, path.join(out, 'theme-previews'), { recursive: true });
  console.log('Copied theme previews');
}

// v86 (old Windows PC app) is no longer bundled: smaller APK
