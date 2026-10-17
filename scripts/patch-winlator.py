import re
from pathlib import Path

# Winlator infra (step 1): targetSdk 28, arm64 only, extraction libraries.
# Runs after `cap add android` and after patch-android.py.

vg = Path('android/variables.gradle')
if not vg.exists():
    raise SystemExit('android/variables.gradle not found')
v = vg.read_text(encoding='utf-8')
v, n1 = re.subn(r'(targetSdkVersion\s*=\s*)\d+', r'\g<1>28', v)
v, n2 = re.subn(r'(minSdkVersion\s*=\s*)\d+', r'\g<1>26', v)
if n1 == 0 or n2 == 0:
    raise SystemExit('targetSdkVersion/minSdkVersion not found in variables.gradle')
vg.write_text(v, encoding='utf-8')

bg = Path('android/app/build.gradle')
b = bg.read_text(encoding='utf-8')

if 'abiFilters' not in b:
    b, n = re.subn(r'(defaultConfig\s*\{)', r'\1\n        ndk { abiFilters "arm64-v8a" }', b, count=1)
    if n == 0:
        raise SystemExit('defaultConfig not found in app/build.gradle')

deps = [
    ('zstd-jni', 'com.github.luben:zstd-jni:1.5.2-3@aar'),
    ('commons-compress', 'org.apache.commons:commons-compress:1.20'),
    ('org.tukaani:xz', 'org.tukaani:xz:1.7'),
]
missing = [d for key, d in deps if key not in b]
if missing:
    idx = b.rfind('dependencies {')
    if idx < 0:
        raise SystemExit('dependencies block not found in app/build.gradle')
    pos = idx + len('dependencies {')
    ins = ''.join("\n    implementation '%s'" % d for d in missing)
    b = b[:pos] + ins + b[pos:]

bg.write_text(b, encoding='utf-8')
print('Winlator infra patched: targetSdk 28, minSdk 26, arm64-v8a only, deps:', ', '.join(missing) or 'already present')
