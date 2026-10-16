import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root = process.cwd();
const encoded = path.join(root, 'source', 'aurora.html.gz.b64');
const outDir = path.join(root, 'www');
fs.mkdirSync(outDir, { recursive: true });
const looksLikeHtml = b => /^\\s*(?:<!doctype html|<html)/i.test(b.toString('utf8'));
if (fs.existsSync(encoded)) {
  const raw = fs.readFileSync(encoded, 'utf8').replace(/\\s+/g, '');
  let html;
  try {
    const candidate = zlib.gunzipSync(Buffer.from(raw, 'base64'));
    if (looksLikeHtml(candidate)) html = candidate;
  } catch {}
  if (!html) {
    // If a single extra character slipped into the transferred base64, find the removal
    // that restores a valid gzip stream and the expected HTML document signature.
    for (let i = 0; i < raw.length; i++) {
      try {
        const candidate = zlib.gunzipSync(Buffer.from(raw.slice(0, i) + raw.slice(i + 1), 'base64'));
        if (looksLikeHtml(candidate)) { html = candidate; break; }
      } catch {}
    }
  }
  if (!html) throw new Error('Could not restore Aurora HTML from compressed source; source transfer needs correction');
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
} else if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  throw new Error('Aurora OS source is missing: expected source/aurora.html.gz.b64');
}
