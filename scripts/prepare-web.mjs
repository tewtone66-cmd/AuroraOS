import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const src = path.join(root, 'src', 'index.html');
if (!fs.existsSync(src)) throw new Error('Missing src/index.html');
fs.copyFileSync(src, path.join(out, 'index.html'));
console.log('Aurora OS web app copied to www/index.html');

// v86 emulator files (installed from npm) for the Windows PC app
const v = path.join(root, 'node_modules', 'v86');
const dst = path.join(out, 'vendor', 'v86');
fs.mkdirSync(dst, { recursive: true });
let missing = [];
for (const [from, to] of [['build/libv86.js', 'libv86.js'], ['build/v86.wasm', 'v86.wasm'], ['bios/seabios.bin', 'seabios.bin'], ['bios/vgabios.bin', 'vgabios.bin']]) {
  const f = path.join(v, from);
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dst, to)); else missing.push(from);
}
if (missing.length) console.warn('WARNING: v86 files missing (Windows PC app will not start): ' + missing.join(', '));
else console.log('v86 emulator files copied to www/vendor/v86');
