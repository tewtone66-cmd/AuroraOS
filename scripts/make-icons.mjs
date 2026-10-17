import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const res = 'android/app/src/main/res';
const out = (p, buf) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); };
const png = (svg, w, h = w) => sharp(svg).resize(w, h).png().toBuffer();
const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, s] of Object.entries(sizes)) {
  const b = await png('assets/aurora-icon.svg', s);
  out(`${res}/mipmap-${d}/ic_launcher.png`, b);
  out(`${res}/mipmap-${d}/ic_launcher_round.png`, b);
  out(`${res}/mipmap-${d}/ic_launcher_foreground.png`, await png('assets/aurora-fg.svg', s * 2.25));
}
out(`${res}/drawable-nodpi/aurora_ic_fg.png`, await png('assets/aurora-fg.svg', 432));
out(`${res}/drawable-nodpi/aurora_ic_bg.png`, await png('assets/aurora-bg.svg', 432));
const splash = await png('assets/aurora-splash.svg', 1080);
for (const d of fs.readdirSync(res)) {
  if (d.startsWith('drawable') && fs.existsSync(`${res}/${d}/splash.png`)) out(`${res}/${d}/splash.png`, splash);
}
const adaptive = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@drawable/aurora_ic_bg"/>\n  <foreground android:drawable="@drawable/aurora_ic_fg"/>\n</adaptive-icon>\n';
out(`${res}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive);
out(`${res}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive);
console.log('Aurora icons + splash written');
