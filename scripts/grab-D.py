#!/usr/bin/env python3
# استخراج بخش‌های لازم index.html برای D2 (خاموش‌شدن) / D3 (OOBE) / D4 (لاگین+لاک‌اسکرین)
import re, sys, pathlib, os
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
idx = root / 'src' / 'index.html'
assert idx.exists(), 'src/index.html پیدا نشد؛ داخل پوشه‌ی AuroraOS اجرا کن'
s = idx.read_text(encoding='utf-8')
# (اسم, regex, حداکثر تعداد, چند کاراکتر قبل, چند کاراکتر بعد)
P = [
 ('lock screen', r'id="lck"|#lck\b|\blck\b', 14, 900, 1600),
 ('shutdown/power', r'[Ss]hut ?[Dd]own|shutdown|power ?off|powerOff|restart|[Rr]eboot', 14, 700, 1300),
 ('boot/splash', r'id="boot|#boot\b|bootscr|boot-?anim|bootSeq|function boot|\bsplash\b', 10, 700, 1300),
 ('storage helpers ls()', r'function ls\(|(?:var|let|const) ls\s*=', 3, 100, 500),
 ('wallpaper', r'wallpaper|setWall|\bWALLS?\b', 8, 500, 900),
 ('theme', r'aur\.theme|setTheme|data-theme|aur\.accent|\bACCENT', 8, 500, 900),
 ('permissions', r'requestPermission|MANAGE_EXTERNAL|ensureStorage|storagePerm|hasStorage|checkPerm|requestStorage|askStorage|grantAccess', 10, 500, 1100),
 ('user/pin', r'aur\.user|userName|username|aur\.pin|aur\.pass|aur\.lock', 10, 500, 900),
 ('desktop shell', r'id="desk(top)?"|id="taskbar"|id="start(menu)?"', 5, 200, 600),
 ('version/end markers', r'var VER=|<!--NEXOS-END-->|NX3\s*=', 6, 100, 300),
]
BUDGET = 280_000
hits = []
for name, rx, cap, a, b in P:
    n = 0
    for m in re.finditer(rx, s):
        hits.append((name, max(0, m.start() - a), min(len(s), m.end() + b)))
        n += 1
        if n >= cap: break
# ادغام بازه‌های هم‌پوشان
hits.sort(key=lambda h: h[1])
merged = []
for name, a, b in hits:
    if merged and a <= merged[-1][2] + 80:
        merged[-1][0].add(name); merged[-1][2] = max(merged[-1][2], b)
    else:
        merged.append([{name}, a, b])
out, total = [], 0
for names, a, b in merged:
    chunk = s[a:b]
    if total + len(chunk) > BUDGET:
        out.append(f'\n#### [قطع شد: سقف حجم] ####\n'); break
    out.append(f'\n\n######## offset {a}-{b} | {", ".join(sorted(names))} ########\n' + chunk)
    total += len(chunk)
head = f'NexOS D-parts | index.html={len(s)} chars | {len(merged)} بخش | {total} chars\n'
dst = pathlib.Path(os.path.expanduser('~/storage/downloads/nexos-D-parts.txt'))
try:
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(head + ''.join(out), encoding='utf-8')
except Exception:
    dst = root / 'nexos-D-parts.txt'; dst.write_text(head + ''.join(out), encoding='utf-8')
print(head.strip()); print('فایل:', dst)
