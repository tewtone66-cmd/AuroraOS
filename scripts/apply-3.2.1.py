#!/usr/bin/env python3
# NexOS 3.2.1 (part A2) - Windows-like text selection + copy bar, file manager perf. Run from repo root after 3.2.0.
import re, sys, pathlib
here = pathlib.Path(__file__).resolve().parent
root = here.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'SEL-3.2.1' in s:
    print('already applied'); sys.exit(0)
assert 'DND-3.2.0' in s, 'apply 3.2.0 first'

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:80]}'
    s = s.replace(old, new)

# file manager: build rows in one fragment (one reflow), smaller thumbnails, debounced search
rep("v.forEach(i=>L.appendChild(mk(i)));if(!v.length)", "{const fr=document.createDocumentFragment();v.forEach(i=>fr.appendChild(mk(i)));L.appendChild(fr)}if(!v.length)")
rep("th=k==='img'&&it.size>0&&it.size<8e6", "th=k==='img'&&it.size>0&&it.size<2.5e6")
rep('<img class="th" loading="lazy" decoding="async"', '<img class="th" loading="lazy" decoding="async" fetchpriority="low"')
rep("srch.oninput=()=>{E.q=srch.value;draw()};", "let sq=0;srch.oninput=()=>{E.q=srch.value;clearTimeout(sq);sq=setTimeout(draw,140)};")

css = (here / 'a2.css').read_text(encoding='utf-8')
js = (here / 'a2.js').read_text(encoding='utf-8')
rep("</style><!--NEXOS-END--></head>", "/*SEL-3.2.1*/\n" + css + "\n</style><!--NEXOS-END--></head>")
rep("</script><!--NEXOS-END--></body></html>", js + "\n</script><!--NEXOS-END--></body></html>")

s, n = re.subn(r'Version 3\.2\.0', 'Version 3.2.1', s)
assert n >= 1, n
rep("var VER='3.2.0'", "var VER='3.2.1'")
a = s.index('var ITEMS=['); b = s.index('];', a) + 2
items = """var ITEMS=[
['🔤','Select and copy text','Hold on text to select it (blue, like Windows). Drag to extend, then Copy from the small bar'],
['🖱️','Works with the virtual mouse','Double click selects a word, triple click a paragraph, right click opens Copy / Paste'],
['📋','Cut, copy, paste in text boxes','Right click or select text in any input'],
['📂','Faster File Explorer','Lighter lists, smaller thumbnails and smoother search typing']
];"""
s = s[:a] + items + s[b:]
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.2.1"', t, count=1), encoding='utf-8')
with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.2.1 (SEL-3.2.1، بخش A2): انتخاب متن آبی (::selection) داخل .body/.tmo/.cro، موتور انتخاب سفارشی برای لمس (نگه‌داشتن ۴۵۰ms = کلمه، ادامه با کشیدن) و ماوس مجازی (pointerId 99: کلیک دوم=کلمه، سوم=پاراگراف، درگ=بازه)، نوار شناور #selbar (Copy/Cut/Paste/Select all) و منوی راست‌کلیک برای متن و input ها. کلیپبورد: navigator.clipboard با fallback به execCommand و حافظه داخلی. فایل‌منیجر: fragment، content-visibility روی ردیف‌ها، تامبنیل زیر ۲.۵MB، debounce جستجو.\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.2.1\nروی گوشی تست نشده: دسته‌های (handle) انتخاب مثل اندروید نداریم؛ فقط کشیدن بعد از نگه‌داشتن. محتوای مرورگر (WebView بومی) انتخاب خودش رو دارد.\n")
print('ok')
