#!/usr/bin/env python3
# NexOS 3.2.16 - UI part 2 (shutdown screen, restore windows, window placement, VM default)
import sys, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'src', 'index.html')
PKG = os.path.join(ROOT, 'package.json')
MARK = '/*nx-3.2.16*/'

html = open(HTML, encoding='utf-8').read()
if MARK in html:
    print('already applied (marker found) - nothing to do'); sys.exit(0)

def rep(s, old, new, n=1, name=''):
    c = s.count(old)
    assert c == n, 'anchor "%s": expected %d, found %d' % (name or old[:50], n, c)
    return s.replace(old, new)

CSS = r'''/*nx-3.2.16*/
#swb{position:fixed;inset:0;z-index:99996;display:none;align-items:center;justify-content:center;background:#0b5ed7;color:#fff;font-family:"Segoe UI",system-ui,sans-serif;opacity:0}
#swb.on{display:flex;animation:swbin .35s ease forwards}@keyframes swbin{to{opacity:1}}
#swb .swi{max-width:620px;padding:24px;display:flex;flex-direction:column;gap:14px}
#swb .swf{font-size:84px;line-height:1}#swb h1{margin:0;font-size:26px;font-weight:600}#swb p{margin:0;font-size:15px;opacity:.92}
#swb .swb2{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
#swb .swb2 button{border:2px solid #fff;background:transparent;color:#fff;padding:10px 16px;font-size:14px;border-radius:2px;cursor:pointer;touch-action:manipulation}
#swb .swb2 button[data-k=go]{background:#fff;color:#0b5ed7;font-weight:600}#swb .swb2 button:active{background:#ffffff40;color:#fff}
body.vm.nxtop #pad{z-index:99998}body.vm.nxtop #cur{z-index:99999}body.vm.nxtop #vbtns button{z-index:99999}
'''

JS = r'''/*nx-3.2.16*/
var NXSKIP=['exew','inst','dl','win'];
function saveWins(){if(!window.__nxRdy)return;try{var a=[];for(var k in W){var w=W[k];if(!w||!w.el||NXSKIP.indexOf(w.app)>-1)continue;var e=w.el,c=e.classList;a.push({a:w.app,l:e.style.left,t:e.style.top,w:e.style.width,h:e.style.height,x:c.contains('max')?1:0,m:c.contains('min')?1:0})}ls('aur.wins',JSON.stringify(a))}catch(x){}}
window.restoreWins=function(){window.__nxShut=0;var a=[];try{a=JSON.parse(ls('aur.wins')||'[]')}catch(x){}
 if(!Array.isArray(a)||Object.keys(W).length){window.__nxRdy=1;return}
 a=a.slice(0,8);
 a.forEach(function(s,i){setTimeout(function(){try{if(!A[s.a]||NXSKIP.indexOf(s.a)>-1)return;openApp(s.a);var w=wins(s.a).slice(-1)[0];if(!w)return;var e=w.el,mw=innerWidth,mh=innerHeight,ww=Math.min(parseFloat(s.w)||e.offsetWidth,mw-12),hh=Math.min(parseFloat(s.h)||e.offsetHeight,mh-130);
  e.style.width=ww+'px';e.style.height=hh+'px';e.style.left=Math.max(0,Math.min(parseFloat(s.l)||6,mw-ww))+'px';e.style.top=Math.max(0,Math.min(parseFloat(s.t)||8,mh-hh-60))+'px';
  if(s.x)setTimeout(function(){try{$('.mx',e).click()}catch(x){}},420);else if(s.m)setTimeout(function(){try{minW(w)}catch(x){}},420)}catch(x){}},i*220)});
 setTimeout(function(){window.__nxRdy=1},a.length*220+900)};
setInterval(function(){if(!window.__nxShut)saveWins()},2000);
addEventListener('pagehide',function(){if(!window.__nxShut)saveWins()});
document.addEventListener('visibilitychange',function(){if(document.hidden&&!window.__nxShut)saveWins()});
setTimeout(function(){window.restoreWins()},2300);
(function(){var el=null;
function mk(){if(el)return el;el=h('div','','<div class="swi"><div class="swf">:(</div><h1>Windows are still open</h1><p></p><div class="swb2"><button data-k="go">Close windows and shut down</button><button data-k="no">Go back</button></div></div>');el.id='swb';document.body.appendChild(el);
 el.addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(!b)return;if(b.dataset.k==='go'){window.swHide();doShut(true)}else window.swHide()});return el}
window.swShow=function(){closeMenus();var n=Object.keys(W).length,e=mk();$('p',e).textContent=n+(n>1?' windows are':' window is')+' still open. Close them and shut down? They come back next time you turn NexOS on.';e.classList.add('on');document.body.classList.add('bsod','nxtop')};
window.swHide=function(){if(!el||!el.classList.contains('on'))return false;el.classList.remove('on');document.body.classList.remove('bsod','nxtop');return true};
var pw=document.getElementById('pw');if(pw)pw.addEventListener('click',function(){setTimeout(function(){window.restoreWins()},1500)});
})();
/*nx-end*/
'''

# 1) css
html = rep(html, '</style><!--NEXOS-END--></head>', CSS + '</style><!--NEXOS-END--></head>', 1, 'css end')
# 2) shutdown / restart / close all
html = rep(html, "function doShut(){closeMenus();document.body.classList.add('shutting');",
  JS + "function doShut(force){closeMenus();if(force!==true&&Object.keys(W).length)return window.swShow();saveWins();window.__nxShut=1;document.body.classList.add('shutting');", 1, 'doShut')
html = rep(html, "function doRestart(){closeMenus();closeAll();", "function doRestart(){closeMenus();saveWins();closeAll();", 1, 'doRestart')
html = rep(html, "const closeAll=()=>Object.keys(W).forEach(k=>closeW(k,true));",
  "const closeAll=()=>{saveWins();window.__nxShut=1;Object.keys(W).forEach(k=>closeW(k,true))};", 1, 'closeAll')
# 3) openApp: re-enable saving + semi-random placement
html = rep(html, "function openApp(id,arg){closeMenus();", "function openApp(id,arg){window.__nxShut=0;closeMenus();", 1, 'openApp')
html = rep(html, "left:${Math.max(6,(innerWidth-wd)/2+n*22-30)}px;top:${20+n*22}px;",
  "left:${Math.round(6+Math.max(0,innerWidth-wd-12)*(.5+(Math.random()-.5)*.7))}px;top:${Math.round(8+Math.max(0,innerHeight-ht-110)*(.5+(Math.random()-.5)*.9))}px;", 1, 'win pos')
# 4) old "Close NexOS?" screen: shut down without asking twice; back button closes new screen first
html = rep(html, "else if(k==='off'){bsHide();doShut();bgQuit()}", "else if(k==='off'){bsHide();doShut(true);bgQuit()}", 1, 'bsod off')
html = rep(html, "NW.addListener('backPressed',()=>{if(bsod.classList.contains('on'))return bsHide();",
  "NW.addListener('backPressed',()=>{if(window.swHide&&window.swHide())return;if(bsod.classList.contains('on'))return bsHide();", 1, 'backPressed')
# 5) virtual mouse on by default (one-time for this update; later user choice is kept)
html = rep(html, "()=>vmSet(ls('aur.vm')==='1')",
  "()=>{if(ls('aur.vm316')!=='1'){ls('aur.vm316','1');ls('aur.vm','1')}vmSet(ls('aur.vm')!=='0')}", 1, 'vm default')
# 6) version (two places)
html = rep(html, "['Installed version','3.2.15']", "['Installed version','3.2.16']", 2, 'Installed version')
open(HTML, 'w', encoding='utf-8').write(html)

pkg = open(PKG, encoding='utf-8').read()
pkg = rep(pkg, '"version": "3.2.15"', '"version": "3.2.16"', 1, 'package.json')
open(PKG, 'w', encoding='utf-8').write(pkg)
print('OK: 3.2.16 applied')
