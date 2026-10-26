#!/usr/bin/env python3
# NexOS 3.2.19 - music player: closing its window stops playback and hides the taskbar player
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'src', 'index.html')
PKG = os.path.join(ROOT, 'package.json')
MARK = '/*nx-3.2.19*/'
html = open(HTML, encoding='utf-8').read()
if MARK in html:
    print('already applied (marker found) - nothing to do'); sys.exit(0)
assert '/*nx-3.2.18*/' in html, 'run scripts/apply-3.2.18.py first'

def rep(s, old, new, n=1, name=''):
    c = s.count(old)
    if n is None:
        assert c >= 1, 'anchor "%s": not found' % (name or old[:50])
    else:
        assert c == n, 'anchor "%s": expected %d, found %d' % (name or old[:50], n, c)
    return s.replace(old, new)

# music: window close = stop playback + hide mini player (same stop the player's own Stop button uses)
html = rep(html, "w.onclose=function(){MU.w=null};",
  "w.onclose=function(){MU.w=null;" + MARK + "try{muStop()}catch(e){}try{if(MU.card)MU.card.classList.remove('on')}catch(e){}};", None, 'music onclose')
html = rep(html, "['Installed version','3.2.18']", "['Installed version','3.2.19']", 2, 'Installed version')
open(HTML, 'w', encoding='utf-8').write(html)
pkg = open(PKG, encoding='utf-8').read()
pkg = rep(pkg, '"version": "3.2.18"', '"version": "3.2.19"', 1, 'package.json')
open(PKG, 'w', encoding='utf-8').write(pkg)
print('OK: 3.2.19 applied')
