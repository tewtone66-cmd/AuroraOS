#!/usr/bin/env node
// peek.mjs - print only a small window of a big file (default src/index.html).
//   node scripts/peek.mjs appSet 60          first match of /appSet/, 60 lines (5 lines before it)
//   node scripts/peek.mjs appSet --list      every matching line number + short snippet
//   node scripts/peek.mjs appSet 60 --n 2    the 2nd match
//   node scripts/peek.mjs @1200 80           lines 1200..1279
//   options: --file path  --w 400 (max chars per line)  --full (no cut)  --out (also write /sdcard/Download/peek.txt)
import fs from 'node:fs';
const a = process.argv.slice(2);
const flag = (f) => { const i = a.indexOf(f); if (i < 0) return false; a.splice(i, 1); return true; };
const opt = (f, d) => { const i = a.indexOf(f); if (i < 0) return d; const v = a[i + 1]; a.splice(i, 2); return v; };
const full = flag('--full'), list = flag('--list'), out = flag('--out');
const file = opt('--file', 'src/index.html'), nth = Math.max(1, +opt('--n', 1)), w = +opt('--w', 400);
const [pat, len = '40'] = a;
if (!pat) { console.log('usage: node scripts/peek.mjs <regex|@line> [lines] [--list] [--n k] [--file f] [--w 400] [--full] [--out]'); process.exit(1); }
const L = fs.readFileSync(file, 'utf8').split('\n');
const cut = (s) => (full || s.length <= w ? s : s.slice(0, w) + ' ...[' + s.length + ' chars]');
const buf = [];
const say = (s) => { buf.push(s); console.log(s); };
const show = (s, e) => { for (let n = s; n <= Math.min(e, L.length); n++) say(n + ': ' + cut(L[n - 1])); };
if (pat[0] === '@') {
  const s = Math.max(1, +pat.slice(1));
  show(s, s + Math.max(1, +len) - 1);
} else {
  let re; try { re = new RegExp(pat); } catch { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
  const hits = []; L.forEach((l, i) => { if (re.test(l)) hits.push(i + 1); });
  say('[' + file + '] ' + L.length + ' lines, ' + hits.length + ' match(es) for /' + pat + '/');
  if (!hits.length) process.exit(0);
  if (list) hits.slice(0, 60).forEach((n) => say(n + ': ' + cut(L[n - 1]).slice(0, 140)));
  else {
    const h = hits[Math.min(nth, hits.length) - 1], s = Math.max(1, h - 5);
    say('--- match ' + Math.min(nth, hits.length) + ' at line ' + h + ' (others: ' + hits.slice(0, 12).join(',') + (hits.length > 12 ? ',...' : '') + ') ---');
    show(s, s + Math.max(1, +len) - 1);
  }
}
if (out) { const p = fs.existsSync('/sdcard/Download') ? '/sdcard/Download/peek.txt' : 'peek.txt'; fs.writeFileSync(p, buf.join('\n')); console.log('written: ' + p); }
