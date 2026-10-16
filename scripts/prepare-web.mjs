import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const encoded = path.join(root, 'source', 'aurora.html.gz.b64');
const outDir = path.join(root, 'www');
fs.mkdirSync(outDir, { recursive: true });

const looksLikeHtml = (buffer) => /^\s*(?:<!doctype html|<html)/i.test(buffer.toString('utf8'));

if (!fs.existsSync(encoded)) {
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error('Aurora OS source is missing: expected source/aurora.html.gz.b64');
  }
} else {
  const raw = fs.readFileSync(encoded, 'utf8').replace(/\s+/g, '');
  let html;
  let recovery = 'exact';

  const tryDecode = (base64) => {
    try {
      const candidate = zlib.gunzipSync(Buffer.from(base64, 'base64'));
      return looksLikeHtml(candidate) ? candidate : null;
    } catch {
      return null;
    }
  };

  html = tryDecode(raw);

  // Recover a single accidentally inserted character in the transferred base64.
  if (!html) {
    for (let i = 0; i < raw.length; i++) {
      const candidate = tryDecode(raw.slice(0, i) + raw.slice(i + 1));
      if (candidate) {
        html = candidate;
        recovery = `removed character at offset ${i}`;
        break;
      }
    }
  }

  if (!html) {
    throw new Error(`Could not restore Aurora HTML (encoded length: ${raw.length}); source transfer contains more than a recoverable single-character insertion or has been truncated.`);
  }

  if (!looksLikeHtml(html) || !html.toString('utf8').includes('</html>')) {
    throw new Error('Recovered source failed HTML integrity checks.');
  }

  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`Restored Aurora OS HTML: ${html.length} bytes (${recovery})`);
}

// Apply narrowly scoped runtime/performance improvements to the restored copy only.
// The archived original HTML remains untouched; replacements fail loudly if the baseline changes.
const output = path.join(outDir, 'index.html');
let page = fs.readFileSync(output, 'utf8');
const replaceOnce = (needle, replacement, label) => {
  const first = page.indexOf(needle);
  if (first < 0) throw new Error(`Aurora patch failed: expected ${label} was not found.`);
  if (page.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Aurora patch failed: ${label} matched more than once.`);
  }
  page = page.slice(0, first) + replacement + page.slice(first + needle.length);
};

replaceOnce('html{scroll-padding-top:env(safe-area-inset-top,0px)}', 'html{scroll-padding-top:env(safe-area-inset-top,0px)}', 'HTML safe-area declaration');
replaceOnce('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n', '', 'remote font stylesheet');
replaceOnce(' const wl=$(".walls",b),cw=+ls("wall")||0;', ' const wl=$(".walls",b),cw=+ls("wall")||0;', 'wallpaper settings declaration');
replaceOnce('function mag(px){hov=px;const d=$("#dock");if(px!=null)d.style.setProperty("--mx",(px-d.getBoundingClientRect().left)+"px");\n d.classList.toggle("hov",px!=null);if(!raf)raf=requestAnimationFrame(step)}', 'function mag(px){if(px!=null&&hov!=null&&Math.abs(px-hov)<1)return;hov=px;const d=$("#dock");if(px!=null)d.style.setProperty("--mx",(px-d.getBoundingClientRect().left)+"px");\n d.classList.toggle("hov",px!=null);if(!raf)raf=requestAnimationFrame(step)}', 'dock pointer-move guard');
replaceOnce('magOn=ls("mag")!=="0";setWall(Math.min(+ls("wall")||0,W.length-1));render();', 'magOn=ls("mag")!=="0";setWall(Math.min(+ls("wall")||0,W.length-1));render();', 'boot wallpaper restore');

const appsSource = path.join(root, 'apps', 'aurora-apps.js');
if (!fs.existsSync(appsSource)) throw new Error('Aurora app bundle is missing: apps/aurora-apps.js');
fs.copyFileSync(appsSource, path.join(outDir, 'aurora-apps.js'));
replaceOnce('</body>', '<script src="aurora-apps.js"></script>\n</body>', 'body close for real apps bundle');

fs.writeFileSync(output, page);
console.log(`Applied launcher scale/performance patch: ${Buffer.byteLength(page)} bytes`);
