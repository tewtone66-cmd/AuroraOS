import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const src = path.join(root, 'src', 'index.html');
if (!fs.existsSync(src)) throw new Error('Missing src/index.html');
let html = fs.readFileSync(src, 'utf8');
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

// Mods: every src/mods/*.js file is injected right before the final <!--NEXOS-END--></body>,
// so it runs after the main code has loaded.
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
//  - `all: true` replaces every occurrence (at least one must exist).
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
      if (p.all ? n < 1 : n !== 1) {
        const msg = 'Patch "' + p.name + '" (' + f + '): expected 1 match, found ' + n;
        if (p.optional) { console.warn('WARN ' + msg); continue; }
        throw new Error(msg);
      }
      const res = p.all ? text.split(p.find).join(p.replace) : text.replace(p.find, () => p.replace);
      if (isMod) modText[p.mod] = res; else html = res;
      console.log('Patched: ' + p.name);
    }
  }
}

// Live updates (NXHU): mods are injected as inert <script type="text/x-nxmod"> blocks and started in order by
// scripts/nxhu-runner.js, which lets a downloaded small update replace one mod without a new APK.
// `base` = the main page (after patches, without mods); `build` = base + every mod. Both go into the page.
// With NXHU_OUT=updates/hot the same build also writes the downloadable bundle (manifest + built mods).
const mods = Object.keys(modText).sort();
if (mods.length) {
  const tag = '<!--NEXOS-END--></body>';
  const at = html.lastIndexOf(tag);
  if (at < 0) throw new Error('Marker ' + tag + ' not found in src/index.html');
  const info = { format: 1, base: sha1(html), mods: {} };
  for (const f of mods) info.mods[f] = { sha: sha1(modText[f]), size: Buffer.byteLength(modText[f], 'utf8') };
  info.build = sha1(info.base + mods.map((f) => f + info.mods[f].sha).join(','));
  const runnerFile = path.join(root, 'scripts', 'nxhu-runner.js');
  const runner = fs.existsSync(runnerFile) ? fs.readFileSync(runnerFile, 'utf8') : '';
  const esc = (s) => s.replace(/<\/script/gi, '<\\/script');
  let code;
  if (runner) {
    code = '<script type="application/json" id="nxhu-info">' + JSON.stringify(info).replace(/</g, '\\u003c') + '</script>\n'
      + mods.map((f) => '<script type="text/x-nxmod" data-nxmod="' + f + '">/* mod: ' + f + ' */\n' + esc(modText[f]) + '\n</script>').join('\n')
      + '\n<script>/* nxhu runner */\n' + esc(runner) + '\n</script>';
  } else {
    code = mods.map((f) => '<script>/* mod: ' + f + ' */\n' + esc(modText[f]) + '\n</script>').join('\n');
  }
  html = html.slice(0, at) + code + html.slice(at);
  console.log('Injected mods: ' + mods.join(', '));
  if (process.env.NXHU_OUT) {
    const dir = path.resolve(root, process.env.NXHU_OUT);
    fs.rmSync(path.join(dir, 'mods'), { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, 'mods'), { recursive: true });
    for (const f of mods) fs.writeFileSync(path.join(dir, 'mods', f), modText[f]);
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ format: 1, base: info.base, mods: info.mods }, null, 1) + '\n');
    console.log('Live update bundle written to ' + process.env.NXHU_OUT + ' (' + mods.length + ' mods)');
  }
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
