import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root = process.cwd();
const encoded = path.join(root, 'source', 'aurora.html.gz.b64');
const outDir = path.join(root, 'www');
fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(encoded)) {
  const raw = fs.readFileSync(encoded, 'utf8').replace(/\\s+/g, '');
  let html;
  try { html = zlib.gunzipSync(Buffer.from(raw, 'base64')); }
  catch (firstError) {
    // Recover from a single accidental extra base64 character while preserving the gzip checksum.
    for (let i = 0; i < raw.length; i++) {
      try {
        const candidate = zlib.gunzipSync(Buffer.from(raw.slice(0, i) + raw.slice(i + 1), 'base64'));
        if (/^\\s*<!doctype html|^\\s*<html/i.test(candidate.toString('utf8'))) { html = candidate; break; }
      } catch {}
    }
    if (!html) throw firstError;
  }
  if (!/^\\s*<!doctype html|^\\s*<html/i.test(html.toString('utf8'))) throw new Error('Decoded source is not an HTML document');
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
} else if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  throw new Error('Aurora OS source is missing: expected source/aurora.html.gz.b64');
}
