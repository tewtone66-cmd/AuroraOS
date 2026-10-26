import fs from 'node:fs';
import path from 'node:path';

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
if (fs.existsSync(modsDir)) {
  const mods = fs.readdirSync(modsDir).filter((f) => f.endsWith('.js')).sort();
  const tag = '<!--NEXOS-END--></body>';
  const at = html.lastIndexOf(tag);
  if (mods.length && at < 0) throw new Error('Marker ' + tag + ' not found in src/index.html');
  if (mods.length) {
    const code = mods
      .map((f) => '<script>/* mod: ' + f + ' */\n' + fs.readFileSync(path.join(modsDir, f), 'utf8').replace(/<\/script/gi, '<\\/script') + '\n</script>')
      .join('\n');
    html = html.slice(0, at) + code + html.slice(at);
    console.log('Injected mods: ' + mods.join(', '));
  }
}
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('NexOS web app written to www/index.html');

// v86 (old Windows PC app) is no longer bundled: smaller APK
