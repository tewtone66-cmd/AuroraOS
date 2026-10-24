#!/usr/bin/env python3
# NexOS 3.0.8 - Windows 11 style Start + Search, power menu (Lock/Sleep/Restart/Shut down), taskbar search button (run from repo root, after 3.0.7)
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')

if 'START-3.0.8' in s:
    print('already applied'); sys.exit(0)
assert 'MUSIC-3.0.7' in s, 'apply apply-3.0.7.py first'


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} match(es), found {n} for: {old[:70]}'
    s = s.replace(old, new)


css = r"""/* START-3.0.8 */
#start{width:min(94vw,560px);padding:16px 16px 12px;border-radius:22px}
.sbox{position:relative}
.sbox:before{content:"";position:absolute;left:14px;top:50%;width:16px;height:16px;margin-top:-8px;opacity:.55;pointer-events:none;background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='10.5' cy='10.5' r='6'/%3E%3Cpath d='M15.2 15.2l5.3 5.3'/%3E%3C/svg%3E")}
.sbox input{padding-left:40px!important;border-radius:12px!important;height:42px!important}
#pins,#rcnt{display:grid;grid-template-columns:repeat(6,1fr);gap:2px}
#rcnt button{border:0;background:none;border-radius:12px;padding:8px 0;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11.5px;color:var(--txt);cursor:pointer}
#rcnt button:hover{background:var(--hov)}#rcnt .t{width:40px;height:40px}
#pins button span,#rcnt button span{max-width:100%;padding:0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#start h3{display:flex;align-items:center}
.sflt{display:none;gap:6px;margin:10px 0 0;overflow-x:auto;scrollbar-width:none}.sflt::-webkit-scrollbar{display:none}
#start.q .sflt{display:flex}
.sflt button{flex:none;border:0;border-radius:999px;padding:6px 14px;font-size:12.5px;background:var(--hov);color:var(--txt);cursor:pointer}
.sflt button.on{background:var(--acc);color:var(--accT,#fff)}
#sres h4{margin:12px 6px 4px;font-size:12px;color:var(--mut);font-weight:600}
#sres .sr{position:relative}#sres .sr.sel{background:var(--hov);box-shadow:inset 3px 0 0 var(--acc)}
#sres .sr.bm{padding:11px 10px;gap:14px;font-size:15px;font-weight:600;border-radius:14px}#sres .sr.bm .t,#sres .sr.bm .gi{width:44px;height:44px}
#sres .sr span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gi{width:30px;height:30px;flex:none;border-radius:9px;display:grid;place-items:center}.gi svg{width:60%;height:60%}
.sem{padding:22px 10px;text-align:center;color:var(--mut);font-size:13px}
.sfoot{align-items:center}
.sfoot .usr{display:flex;align-items:center;gap:10px;font-size:13px}.sfoot .usr i{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;background:linear-gradient(150deg,var(--acc),#7c3aed);color:#fff}
.sfoot #pwb{width:40px;height:40px;padding:0;margin:0;border-radius:12px;display:grid;place-items:center;cursor:pointer;color:var(--txt)}.sfoot #pwb svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#pwm{position:absolute;right:12px;bottom:66px;min-width:176px;padding:6px;border-radius:14px;background:var(--pn,var(--surf));border:1px solid var(--line);box-shadow:0 16px 40px #0006;display:none;flex-direction:column;z-index:3}
#pwm.on{display:flex;animation:pwin .18s ease-out}@keyframes pwin{from{opacity:0;transform:translateY(8px) scale(.97)}}
#pwm button{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;color:var(--txt);text-align:left;padding:10px 12px;border-radius:9px;font-size:13.5px;cursor:pointer}
#pwm button:hover,#pwm button.vh{background:var(--hov)}#pwm button svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#slp{position:fixed;inset:0;z-index:99996;background:#000;opacity:0;visibility:hidden;transition:opacity .7s ease,visibility 0s .7s;cursor:none}
#slp.on{opacity:1;visibility:visible;transition:opacity .7s ease}
#lck{position:fixed;inset:0;z-index:99995;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:12vh;color:#fff;text-align:center;opacity:0;visibility:hidden;transition:opacity .45s ease,visibility 0s .45s;background:linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.4)),var(--wall);background-size:cover;background-position:center}
#lck.on{opacity:1;visibility:visible;transition:opacity .45s ease}
#lck .lt{font-size:min(96px,18vw);font-weight:300;line-height:1;letter-spacing:-.02em;text-shadow:0 4px 30px #0007;position:absolute;top:16vh;left:0;right:0}
#lck .ld{font-size:20px;position:absolute;top:calc(16vh + min(104px,20vw));left:0;right:0;text-shadow:0 2px 12px #0007}
#lck .lh{font-size:13px;opacity:.85;padding:9px 18px;border-radius:999px;background:#ffffff26;backdrop-filter:blur(8px);animation:lckp 2.4s ease-in-out infinite}@keyframes lckp{50%{opacity:.45}}
body.perf #lck .lh{backdrop-filter:none;animation:none}
#srchBtn .ico svg{width:60%;height:60%}
"""
p, m, c = s.partition('<!--NEXOS-START-->')
assert m and '</style>' in c
s = p + m + c.replace('</style>', css + '</style>', 1)

js = r"""<script>/* START-3.0.8 */
(function(){try{
var st=$('#start'),q=$('#sq'),res=$('#sres'),dock=$('#dock'),sbtn=$('#startBtn');
var FL='all',SEL=0,lastFiles=[],fTok=0,fTm=0,fBusy=false;
var HIDE={about:1,dl:1,exew:1,win:1,inst:1};
var SETS=[['About','about','version device info system'],['Update','update','version alpha channel'],['Display & size','display','interface scale app size desktop icon size'],['Storage','storage','files permission access'],['Background','bg','wallpaper solid color'],['Colors','color','theme dark light accent'],['Taskbar','task','icon size transparency magnify clock pinned shape layout tray previews'],['Mouse','mouse','pointer size color speed scroll motion blur cursor virtual hold to drag'],['Browser','browser','search engine page size']];
var SV=function(p,c){return '<div class="gi" style="background:'+c+'"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg></div>'};
var G={act:SV('<path d="M12 3v8"/><path d="M6.4 6.6a8 8 0 1 0 11.2 0"/>','#64748b'),file:SV('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>','#3b82f6'),dir:SV('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>','#f59e0b'),web:SV('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>','#10b981')};
var tl=function(id){return '<div class="t">'+tile(id)+'</div>'};
var IP={lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',sleep:'<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',restart:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',shut:'<path d="M12 3v9"/><path d="M6.4 6.6a8 8 0 1 0 11.2 0"/>'};
var ico=function(k){return '<svg viewBox="0 0 24 24">'+IP[k]+'</svg>'};

/* ---------- lock + sleep ---------- */
var slp=h('div','','');slp.id='slp';
var lck=h('div','','<div class="lt"></div><div class="ld"></div><div class="lh">Click or press any key to unlock</div>');lck.id='lck';
document.body.appendChild(slp);document.body.appendChild(lck);
var lt=0;
function lckTick(){var d=new Date();lck.querySelector('.lt').textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});lck.querySelector('.ld').textContent=d.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}
function doLock(){closeMenus();try{lck.style.setProperty('--wall',$('#desk').style.getPropertyValue('--wall'))}catch(e){}lckTick();clearInterval(lt);lt=setInterval(lckTick,1000);lck.classList.add('on');sync()}
function unlock(){if(!lck.classList.contains('on'))return;lck.classList.remove('on');clearInterval(lt);lt=0;setTimeout(sync,480)}
function doSleep(){closeMenus();try{MU.au.pause()}catch(e){}slp.classList.add('on');sync()}
function wake(){if(!slp.classList.contains('on'))return;slp.classList.remove('on');setTimeout(sync,720)}
lck.addEventListener('pointerdown',function(e){e.preventDefault();unlock()});
slp.addEventListener('pointerdown',function(e){e.preventDefault();wake()});
addEventListener('keydown',function(e){if(lck.classList.contains('on')){e.preventDefault();e.stopPropagation();unlock()}else if(slp.classList.contains('on')){e.preventDefault();e.stopPropagation();wake()}},true);
window.doLock=doLock;window.doSleep=doSleep;

/* ---------- start layout ---------- */
q.placeholder='Search for apps, settings, files and the web';
var fl=h('div','sflt','<button data-f="all" class="on">All</button><button data-f="apps">Apps</button><button data-f="settings">Settings</button><button data-f="files">Files</button><button data-f="web">Web</button>');
st.insertBefore(fl,res);
var h3=st.querySelector('#sbody h3');if(h3)h3.textContent='Pinned';
var pins=$('#pins'),rh=h('h3','','Recent'),rc=h('div','','');rh.style.marginTop='12px';rc.id='rcnt';pins.parentNode.insertBefore(rh,pins.nextSibling);rh.parentNode.insertBefore(rc,rh.nextSibling);
var ft=st.querySelector('.sfoot'),keep=h('span','','');keep.style.display='none';keep.appendChild($('#rst'));keep.appendChild($('#off'));
ft.innerHTML='';ft.appendChild(h('span','usr','<i>N</i><b>NexOS</b>'));ft.appendChild(h('span','','<button id="pwb" aria-label="Power" title="Power">'+ico('shut')+'</button>'));ft.appendChild(keep);
var pm=h('div','','<button data-p="lock">'+ico('lock')+'Lock</button><button data-p="sleep">'+ico('sleep')+'Sleep</button><button data-p="restart">'+ico('restart')+'Restart</button><button data-p="shut">'+ico('shut')+'Shut down</button>');pm.id='pwm';st.appendChild(pm);
$('#pwb').addEventListener('click',function(e){e.stopPropagation();pm.classList.toggle('on')});
pm.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('[data-p]');if(!b)return;var k=b.dataset.p;closeMenus();if(k==='lock')doLock();else if(k==='sleep')doSleep();else if(k==='restart')doRestart();else doShut()});
st.addEventListener('click',function(e){if(!e.target.closest('#pwm,#pwb'))pm.classList.remove('on')});

/* ---------- recent ---------- */
function recent(){try{var a=JSON.parse(ls('aur.recent')||'[]');return Array.isArray(a)?a.filter(function(i){return A[i]&&!HIDE[i]&&i!=='trash'}):[]}catch(e){return[]}}
function drawRecent(){var a=recent().slice(0,6);rc.innerHTML='';a.forEach(function(id){var b=h('button','',tl(id)+'<span></span>');b.querySelector('span').textContent=A[id].n;b.onclick=function(){openApp(id)};rc.appendChild(b)});rh.style.display=rc.style.display=a.length?'':'none'}
var _oa=openApp;openApp=function(id){var r=_oa.apply(this,arguments);try{if(A[id]&&!HIDE[id]&&id!=='trash'){var a=recent().filter(function(x){return x!==id});a.unshift(id);ls('aur.recent',JSON.stringify(a.slice(0,8)));drawRecent()}}catch(e){}return r};
drawRecent();

/* ---------- search ---------- */
function openFile(it){var e=(it.name.split('.').pop()||'').toLowerCase(),p=it.path,a={path:p,list:[p]};
 if(it.isDirectory)openApp('files',p);
 else if(/^(jpe?g|png|gif|webp|bmp|svg)$/.test(e))openApp('photos',a);
 else if(/^(mp4|mkv|webm|avi|mov|3gp|m4v)$/.test(e))openApp('media',a);
 else if(/^(mp3|m4a|aac|wav|flac|ogg|opus)$/.test(e))openApp('music',a);
 else if(/^(txt|md|log|ini|cfg|csv)$/.test(e))openApp('notes',{path:p});
 else if(/^(js|json|html?|css|java|kt|py|xml|sh|bat|c|cpp|h|ts)$/.test(e))openApp('code',{path:p});
 else if(/^(zip|rar|7z)$/.test(e))openApp('zip',{path:p});
 else if(e==='exe'&&window.aurora&&aurora.openExe)aurora.openExe(p);
 else if(NF)NF.open({path:p,mimeType:it.mimeType}).catch(function(){})}
function fileItem(it){var par=(it.path||'').split('/').slice(-2,-1)[0]||'';return{ic:it.isDirectory?G.dir:G.file,lb:it.name,tag:par,fn:function(){openFile(it)}}}
function collect(raw){var ql=raw.toLowerCase(),o={calc:null,apps:[],sets:[],acts:[],web:[]};
 if(/^[\d\s+\-*/().%]+$/.test(raw)&&/\d/.test(raw)&&/[+\-*/%]/.test(raw)){try{var v=Function('"use strict";return ('+raw.replace(/%/g,'/100')+')')();if(typeof v==='number'&&isFinite(v))o.calc={ic:tl('calc'),lb:'= '+(+v.toFixed(10)),tag:'Calculator',fn:function(){openApp('calc')}}}catch(e){}}
 var rk=function(n){n=n.toLowerCase();return n===ql?0:n.indexOf(ql)===0?1:2};
 Object.keys(A).filter(function(id){return !HIDE[id]&&A[id].n.toLowerCase().indexOf(ql)>-1}).sort(function(a,b){return rk(A[a].n)-rk(A[b].n)}).forEach(function(id){o.apps.push({ic:tl(id),lb:A[id].n,tag:'App',fn:function(){openApp(id)}})});
 SETS.filter(function(x){return(x[0]+' '+x[2]).toLowerCase().indexOf(ql)>-1}).sort(function(a,b){return rk(a[0])-rk(b[0])}).forEach(function(x){o.sets.push({ic:tl('set'),lb:x[0],tag:'Settings',fn:function(){openApp('set',x[1])}})});
 var cm=startCmds().filter(function(c){return c[0]!=='Settings'});[['Lock',doLock],['Sleep',doSleep]].forEach(function(c){cm.push(c)});
 cm.filter(function(c){return c[0].toLowerCase().indexOf(ql)>-1}).forEach(function(c){o.acts.push({ic:G.act,lb:c[0],tag:'Action',fn:c[1]})});
 if(/^\S+\.[a-z]{2,}(\/\S*)?$/i.test(raw))o.web.push({ic:G.web,lb:'Open '+raw,tag:'Web',fn:function(){openApp('browser',/^https?:/i.test(raw)?raw:'https://'+raw)}});
 o.web.push({ic:G.web,lb:'Search the web for "'+raw+'"',tag:'Web',fn:function(){openApp('browser',(SE[S.se]||SE.google)[1]+encodeURIComponent(raw))}});
 return o}
function sec(title,arr,big){if(!arr.length)return;var hd=h('h4','','');hd.textContent=title;res.appendChild(hd);arr.forEach(function(it){var b=h('button','sr'+(big?' bm':''),it.ic+'<span></span><small></small>');b.querySelector('span').textContent=it.lb;b.querySelector('small').textContent=it.tag;b.onclick=function(){closeMenus();it.fn()};res.appendChild(b)})}
function rows(){return[].slice.call(res.querySelectorAll('.sr'))}
function select(i){var r=rows();if(!r.length){SEL=-1;return}SEL=Math.max(0,Math.min(r.length-1,i));r.forEach(function(b,k){b.classList.toggle('sel',k===SEL)});try{r[SEL].scrollIntoView({block:'nearest'})}catch(e){}}
function render(keepSel){var raw=q.value.trim(),prev=SEL;if(!raw){st.classList.remove('q');return}st.classList.add('q');res.innerHTML='';var o=collect(raw),F=FL,n=0;
 if(F==='all'){var best=o.calc||o.apps[0]||o.sets[0]||o.acts[0]||null;if(best)sec('Best match',[best],true);
  var not=function(x){return x!==best};sec('Apps',o.apps.filter(not));sec('Settings',o.sets.filter(not));sec('Actions',o.acts.filter(not))}
 else if(F==='apps')sec('Apps',o.apps);else if(F==='settings')sec('Settings',o.sets);
 if(F==='all'||F==='files'){if(lastFiles.length)sec('Files',lastFiles);else if(fBusy&&raw.length>=2){var hd=h('h4','','');hd.textContent='Files · searching…';res.appendChild(hd)}}
 if(F==='all'||F==='web')sec('Web',o.web);
 if(!rows().length){var e=h('div','sem','');e.textContent=F==='files'?(fBusy?'Searching…':'No files found'):'No results';res.appendChild(e)}
 select(keepSel?prev:0)}
function fileSearch(raw){clearTimeout(fTm);lastFiles=[];fBusy=false;var t=++fTok;if(!NF||raw.length<2)return;fBusy=true;
 fTm=setTimeout(function(){NF.search({path:'',q:raw,max:40}).then(function(r){if(t!==fTok||q.value.trim()!==raw)return;lastFiles=((r&&r.items)||[]).slice(0,10).map(fileItem);fBusy=false;render(true)}).catch(function(){if(t===fTok){fBusy=false;render(true)}})},350)}
q.oninput=function(){var raw=q.value.trim();if(!raw){fTok++;lastFiles=[];fBusy=false;st.classList.remove('q');return}fileSearch(raw);render(false)};
q.onkeydown=function(e){var k=e.key;if(k==='Enter'){var r=rows();if(r[SEL])r[SEL].click();else if(r[0])r[0].click()}else if(k==='ArrowDown'){e.preventDefault();select(SEL+1)}else if(k==='ArrowUp'){e.preventDefault();select(SEL-1)}else if(k==='Escape'){if(q.value){e.stopPropagation();q.value='';q.oninput()}else closeMenus()}};
fl.addEventListener('click',function(e){var b=e.target.closest('[data-f]');if(!b)return;e.stopPropagation();FL=b.dataset.f;fl.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});render(false);try{q.focus({preventScroll:true})}catch(x){}});

/* ---------- close handling ---------- */
var _cm=closeMenus;closeMenus=function(){pm.classList.remove('on');FL='all';fTok++;lastFiles=[];fBusy=false;fl.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x.dataset.f==='all')});return _cm.apply(this,arguments)};
sbtn.addEventListener('click',function(){drawRecent()});

/* ---------- taskbar search button ---------- */
var sb=h('button','dk','');sb.id='srchBtn';sb.setAttribute('aria-label','Search');
sb.innerHTML='<div class="ico" style="--g:linear-gradient(150deg,#2563eb,#7c3aed)">'+P('<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="5.6"/><path d="M15 15l5.2 5.2"/></g>')+'</div>';
dock.insertBefore(sb,sbtn.nextSibling);
function openSearch(){closeMenus();st.classList.add('show');menuOpen=true;sync();drawRecent();setTimeout(function(){try{q.focus({preventScroll:true})}catch(x){q.focus()}try{kbShow(q)}catch(x){}},90)}
sb.addEventListener('click',function(e){e.stopPropagation();var was=st.classList.contains('show')&&document.activeElement===q;if(was){closeMenus();return}openSearch()});
window.openSearch=openSearch;

/* ---------- right-click / long-press on Start (power user menu) ---------- */
function pmenu(){var it=[['Search',openSearch],['File Explorer',function(){openApp('files')}],['Terminal',function(){openApp('term')}],['Task Manager',function(){openApp('taskmgr')}],['Settings',function(){openApp('set')}],null,['Lock',doLock],['Sleep',doSleep],['Restart',doRestart],['Shut down',doShut]];
 var r=sbtn.getBoundingClientRect(),hh=it.reduce(function(a,i){return a+(i?36:9)},10);ctx(Math.max(4,r.left),Math.max(4,r.top-hh-8),it)}
sbtn.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();pmenu()});
if(typeof onLong==='function')onLong(sbtn,function(){pmenu()});
}catch(e){try{console.error(e)}catch(x){}}})();
</script>"""
rep("</script><!--NEXOS-END-->", "</script>" + js + "<!--NEXOS-END-->")

s = s.replace('Version 3.0.7 alpha', 'Version 3.0.8 alpha').replace("'3.0.7 alpha'", "'3.0.8 alpha'")
idx.write_text(s, encoding='utf-8')

pj = root / 'package.json'
if pj.exists():
    t = pj.read_text(encoding='utf-8')
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.0.8"', t, count=1), encoding='utf-8')

with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.0.8 (start/search/power): اسکریپت جدا با کامنت START-3.0.8 قبل از NEXOS-END. استارت: عرض 560، Pinned + Recent (کلید aur.recent، openApp wrap شده)، فوتر با دکمه‌ی پاور #pwb و منوی #pwm (Lock/Sleep/Restart/Shut down)؛ #rst و #off قدیمی مخفی موندن چون startInit بهشون bind کرده. سرچ: q.oninput/onkeydown دوباره ست شدن (startSearch قدیمی دیگه استفاده نمیشه)، بخش‌های Best match/Apps/Settings/Actions/Files/Web، چیپ‌های فیلتر .sflt، فایل‌ها با NF.search(path:'') و debounce، ناوبری با فلش و Enter و Esc. #lck قفل‌صفحه و #slp خواب (با لمس/کلید بیدار میشن). دکمه‌ی سرچ #srchBtn کنار استارت، راست‌کلیک/نگه‌داشتن روی استارت = منوی power-user. توابع جهانی: doLock، doSleep، openSearch\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.0.8\nروی گوشی تست نشده. Sleep فقط صفحه رو سیاه می‌کنه (اندروید از وب‌ویو اجازه‌ی خاموش‌کردن صفحه نمیده) و موزیک رو متوقف می‌کنه. سرچ فایل به مجوز دسترسی کامل نیاز داره. Lock رمز نداره.\n")
print('ok')
