import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root = process.cwd();
const encoded = path.join(root, 'source', 'aurora.html.gz.b64');
const outDir = path.join(root, 'www');
fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(encoded)) {
  const compressed = Buffer.from(fs.readFileSync(encoded, 'utf8').replace(/\s+/g, ''), 'base64');
  fs.writeFileSync(path.join(outDir, 'index.html'), zlib.gunzipSync(compressed));
} else if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  throw new Error('Aurora OS source is missing: expected source/aurora.html.gz.b64');
}
