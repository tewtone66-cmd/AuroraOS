// dump6.mjs - one-shot extract for "section 6" (apps + taskbar). Run:  node scripts/dump6.mjs
// Writes /sdcard/Download/nexos-6.txt (or ./nexos-6.txt). Short windows only, lines cut to 300 chars.
import fs from 'node:fs';
const L = fs.readFileSync('src/index.html', 'utf8').split('\n');
const out = [];
const cut = (s, w = 300) => (s.length > w ? s.slice(0, w) + ' ...[' + s.length + ']' : s);
const list = (title, re, max = 20) => {
  out.push('\n=== ' + title + ' ===');
  let n = 0;
  for (let i = 0; i < L.length && n < max; i++) if (re.test(L[i])) { out.push((i + 1) + ': ' + cut(L[i])); n++; }
  if (!n) out.push('(no match)');
};
const win = (title, re, before, after, nth = 1) => {
  out.push('\n=== ' + title + ' ===');
  let k = 0;
  for (let i = 0; i < L.length; i++) if (re.test(L[i]) && ++k === nth) {
    for (let j = Math.max(0, i - before); j <= Math.min(L.length - 1, i + after); j++) out.push((j + 1) + ': ' + cut(L[j], 420));
    return;
  }
  out.push('(no match)');
};
win('HIDE definition', /\bHIDE\s*=/, 1, 4);
win('taskbar search function (around !HIDE[id])', /!HIDE\[id\]/, 16, 14);
list('app registry entries', /\b(code|vscode|vsc|taskman|taskmgr|tm|sysmon|monitor|browser|web|term|files):\{n:/, 20);
list('VS Code mentions', /VS ?Code|vscode/i, 20);
list('Task Manager / processes', /Task Manager|taskmgr|Processes|Performance/i, 20);
list('google mentions', /google\.com|\bgoogle\b/i, 14);
list('browser app function', /function appBrowser|function appWeb|function appBrowse/, 6);
list('search panel css/ids', /#(srch|search|sp|srp|sres)\b|\.srch|\.sres|\.srp/, 24);
list('search open function', /function (search|openSearch|doSearch|srch)/i, 8);
list('dock css', /#dock\b/, 30);
const txt = out.join('\n');
const p = fs.existsSync('/sdcard/Download') ? '/sdcard/Download/nexos-6.txt' : 'nexos-6.txt';
fs.writeFileSync(p, txt);
console.log('written ' + p + ' (' + txt.length + ' chars)');
