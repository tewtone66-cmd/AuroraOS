// Restores the fixed APK signing key on CI so every new build is signed with the
// SAME key and Android installs it as an update over the old app (keeps app data).
// Runs only on GitHub Actions; local builds keep their own debug key.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SHA256 = '0e37e3f107e3367ee4ee615129ad4c7ed7671c9ca7616579599b408fa02d5beb';

if (!process.env.GITHUB_ACTIONS) {
  console.log('[signing] not on CI, keeping the local debug key');
  process.exit(0);
}
try {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const b64 = fs.readFileSync(path.join(dir, 'signing', 'nexos-debug.keystore.b64'), 'utf8').replace(/\s+/g, '');
  const buf = Buffer.from(b64, 'base64');
  const got = crypto.createHash('sha256').update(buf).digest('hex');
  if (got !== SHA256) throw new Error('checksum mismatch (' + got + ')');
  const d = path.join(os.homedir(), '.android');
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'debug.keystore'), buf);
  console.log('[signing] fixed debug key restored');
} catch (e) {
  console.warn('::warning::[signing] could not restore the fixed key, this APK gets a random key: ' + e.message);
}
