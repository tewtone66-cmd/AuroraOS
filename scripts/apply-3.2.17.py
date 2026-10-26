#!/usr/bin/env python3
# NexOS 3.2.17 - taskbar fit fix, faster login, virtual mouse above login screen
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'src', 'index.html')
PKG = os.path.join(ROOT, 'package.json')
MARK = '/*nx-3.2.17*/'
html = open(HTML, encoding='utf-8').read()
if MARK in html:
    print('already applied (marker found) - nothing to do'); sys.exit(0)
assert '/*nx-3.2.16*/' in html, 'run scripts/apply-3.2.16.py first'

def rep(s, old, new, n=1, name=''):
    c = s.count(old)
    assert c == n, 'anchor "%s": expected %d, found %d' % (name or old[:50], n, c)
    return s.replace(old, new)

CSS = r'''/*nx-3.2.17*/
#dock.fitm .dk,#dock.fitm #tasks>*{transform:none!important;transition:none!important}
body:not(.tb-full) #dock.fit{padding-left:18px;padding-right:18px;gap:10px}
'''
html = rep(html, '</style><!--NEXOS-END--></head>', CSS + '</style><!--NEXOS-END--></head>', 1, 'css end')

# taskbar: measure without transforms (magnify), re-fit when layout settles
html = rep(html, "function fit(){raf=0;dk.classList.remove('fit','crowd');",
  "function fit(){raf=0;dk.classList.add('fitm');try{fit0()}finally{dk.classList.remove('fitm')}}\nfunction fit0(){dk.classList.remove('fit','crowd');", 1, 'fit')
OBS = "try{new MutationObserver(soon).observe($('#tray'),{childList:true})}catch(e){}"
html = rep(html, OBS, OBS + r'''
try{new MutationObserver(soon).observe($('#tray'),{subtree:true,characterData:true,childList:true})}catch(e){}
try{new MutationObserver(soon).observe($('#clock'),{subtree:true,characterData:true,childList:true})}catch(e){}
try{if(window.ResizeObserver)new ResizeObserver(soon).observe(dk)}catch(e){}
try{document.fonts&&document.fonts.ready&&document.fonts.ready.then(soon)}catch(e){}
addEventListener('load',soon);try{if(window.visualViewport)visualViewport.addEventListener('resize',soon)}catch(e){}
[400,1200,2600,4500].forEach(function(t){setTimeout(soon,t)});''', 1, 'tray observer')

# login: show right when the boot screen starts fading (was: after it is removed + 350ms)
html = rep(html, "function whenBooted(cb){var n=0,iv=setInterval(function(){n++;if(!document.getElementById('boot')||n>80){clearInterval(iv);setTimeout(cb,350)}},250)}",
  "function whenBooted(cb){var n=0,iv=setInterval(function(){n++;var b=document.getElementById('boot');if(!b||b.classList.contains('out')||n>400){clearInterval(iv);setTimeout(cb,60)}},50)}", 1, 'whenBooted')

# virtual mouse above the lock screen
LK = "refreshLock();if(lck){buildKp();dots()}"
html = rep(html, LK, LK + ";(function(){function u(){document.body.classList.toggle('nxtop',!!document.querySelector('#lck.on,#swb.on'))}var l=document.getElementById('lck');try{if(l)new MutationObserver(u).observe(l,{attributes:true,attributeFilter:['class']})}catch(e){}u()})();", 1, 'lock nxtop')

html = rep(html, "['Installed version','3.2.16']", "['Installed version','3.2.17']", 2, 'Installed version')
open(HTML, 'w', encoding='utf-8').write(html)
pkg = open(PKG, encoding='utf-8').read()
pkg = rep(pkg, '"version": "3.2.16"', '"version": "3.2.17"', 1, 'package.json')
open(PKG, 'w', encoding='utf-8').write(pkg)
print('OK: 3.2.17 applied')
