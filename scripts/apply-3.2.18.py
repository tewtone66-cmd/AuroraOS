#!/usr/bin/env python3
# NexOS 3.2.18 - fullscreen: blue dock button + peeking taskbar made robust
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'src', 'index.html')
PKG = os.path.join(ROOT, 'package.json')
MARK = '/*nx-3.2.18*/'
html = open(HTML, encoding='utf-8').read()
if MARK in html:
    print('already applied (marker found) - nothing to do'); sys.exit(0)
assert '/*nx-3.2.17*/' in html, 'run scripts/apply-3.2.17.py first'

def rep(s, old, new, n=1, name=''):
    c = s.count(old)
    assert c == n, 'anchor "%s": expected %d, found %d' % (name or old[:50], n, c)
    return s.replace(old, new)

CSS = r'''/*nx-3.2.18*/
body.fs.peek #dock{visibility:visible!important;opacity:1!important;transform:translateX(-50%)!important;pointer-events:auto!important}
'''
html = rep(html, '</style><!--NEXOS-END--></head>', CSS + '</style><!--NEXOS-END--></head>', 1, 'css end')

FS = "let peekT=0;function fsPeek(on){const b=document.body;clearTimeout(peekT);if(on&&!b.classList.contains('fs'))return;b.classList.toggle('peek',!!on);if(on)peekT=setTimeout(()=>fsPeek(false),5000);sync()}"
JS = r'''
/*nx-3.2.18*/(function(){var dn=0,last=0;
function tg(){var n=Date.now();if(n-last<400)return;last=n;var b=document.body;try{updateFs()}catch(x){}if(!b.classList.contains('fs'))return;fsPeek(!b.classList.contains('peek'))}
function isF(e){return e.target&&e.target.closest&&e.target.closest('.fsd')}
document.addEventListener('pointerdown',function(e){dn=isF(e)?1:0},true);
document.addEventListener('pointerup',function(e){if(dn&&isF(e)){dn=0;tg()}},true);
document.addEventListener('click',function(e){if(isF(e)){e.stopImmediatePropagation();e.preventDefault();tg()}},true);
})();'''
html = rep(html, FS, FS + JS, 1, 'fsPeek')
html = rep(html, "['Installed version','3.2.17']", "['Installed version','3.2.18']", 2, 'Installed version')
open(HTML, 'w', encoding='utf-8').write(html)
pkg = open(PKG, encoding='utf-8').read()
pkg = rep(pkg, '"version": "3.2.17"', '"version": "3.2.18"', 1, 'package.json')
open(PKG, 'w', encoding='utf-8').write(pkg)
print('OK: 3.2.18 applied')
