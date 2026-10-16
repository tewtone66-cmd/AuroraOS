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

replaceOnce('--surf:#fff;--surf2:', '--ui-scale:.82;--surf:#fff;--surf2:', 'root style variables');
replaceOnce('html{scroll-padding-top:env(safe-area-inset-top,0px)}', 'html{zoom:var(--ui-scale,.82);scroll-padding-top:env(safe-area-inset-top,0px)}', 'html zoom declaration');
replaceOnce('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n', '', 'remote font stylesheet');
replaceOnce('.seg button.sel{background:var(--surf);color:var(--txt);box-shadow:0 1px 4px rgba(0,0,0,.15)}', '.seg button.sel{background:var(--surf);color:var(--txt);box-shadow:0 1px 4px rgba(0,0,0,.15)}\n.scaleValue{float:right;color:var(--acc);font-size:12px;font-weight:700}.scaleRow{display:flex;align-items:center;gap:10px}.scaleRow input{min-width:0;flex:1;accent-color:var(--acc);height:28px}.scaleRow button{border:0;border-radius:10px;padding:8px 12px;background:var(--surf2);color:var(--txt);font-size:12px}.scaleHelp{margin:7px 0 0;color:var(--mut);font-size:11px;line-height:1.5}', 'settings scale styles');
replaceOnce('<div class="seg" id="sg1"><button data-m="auto">Auto</button><button data-m="light">Light</button><button data-m="dark">Dark</button></div>\n <h4>Dock magnification</h4>', '<div class="seg" id="sg1"><button data-m="auto">Auto</button><button data-m="light">Light</button><button data-m="dark">Dark</button></div>\n <h4>Interface size <span id="scaleLabel" class="scaleValue">82%</span></h4><div class="scaleRow"><input id="uiScale" type="range" min="65" max="100" step="1" value="82" aria-label="Interface size"><button id="scaleReset" type="button">Reset</button></div><p class="scaleHelp">Adjust the size of the entire Aurora OS interface.</p>\n <h4>Dock magnification</h4>', 'settings markup');
replaceOnce('const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem("aur."+k);localStorage.setItem("aur."+k,v)}catch(e){return null}};', 'const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem("aur."+k);localStorage.setItem("aur."+k,v)}catch(e){return null}};\n{const saved=Number(ls("uiScale"));document.documentElement.style.setProperty("--ui-scale",(Math.max(65,Math.min(100,saved||82))/100).toFixed(2))}', 'local storage helper');
replaceOnce('function settings(b){\n b.innerHTML=`', 'function applyUiScale(value,save=true){const v=Math.max(65,Math.min(100,Number(value)||82));document.documentElement.style.setProperty("--ui-scale",(v/100).toFixed(2));const slider=$("#uiScale"),label=$("#scaleLabel");if(slider)slider.value=String(v);if(label)label.textContent=v+"%";if(save)ls("uiScale",String(v));requestAnimationFrame(()=>{cacheDock();if(hov!=null)mag(hov)})}\nfunction settings(b){\n b.innerHTML=`', 'settings function');
replaceOnce(' const wl=$(".walls",b),cw=+ls("wall")||0;', ' const slider=$("#uiScale",b),reset=$("#scaleReset",b);slider.addEventListener("input",()=>applyUiScale(slider.value));reset.onclick=()=>applyUiScale(82);applyUiScale(ls("uiScale")||82,false);\n const wl=$(".walls",b),cw=+ls("wall")||0;', 'settings scale handlers');
replaceOnce('function mag(px){hov=px;const d=$("#dock");if(px!=null)d.style.setProperty("--mx",(px-d.getBoundingClientRect().left)+"px");\n d.classList.toggle("hov",px!=null);if(!raf)raf=requestAnimationFrame(step)}', 'function mag(px){if(px!=null&&hov!=null&&Math.abs(px-hov)<1)return;hov=px;const d=$("#dock");if(px!=null)d.style.setProperty("--mx",(px-d.getBoundingClientRect().left)+"px");\n d.classList.toggle("hov",px!=null);if(!raf)raf=requestAnimationFrame(step)}', 'dock pointer-move guard');
replaceOnce('magOn=ls("mag")!=="0";setWall(Math.min(+ls("wall")||0,W.length-1));render();', 'magOn=ls("mag")!=="0";applyUiScale(ls("uiScale")||82,false);setWall(Math.min(+ls("wall")||0,W.length-1));render();', 'boot scale restore');

fs.writeFileSync(output, page);
console.log(`Applied launcher scale/performance patch: ${Buffer.byteLength(page)} bytes`);
