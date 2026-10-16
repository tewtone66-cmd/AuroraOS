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
