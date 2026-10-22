import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const src = path.join(root, 'src', 'index.html');
if (!fs.existsSync(src)) throw new Error('Missing src/index.html');
fs.copyFileSync(src, path.join(out, 'index.html'));
console.log('NexOS web app copied to www/index.html');
