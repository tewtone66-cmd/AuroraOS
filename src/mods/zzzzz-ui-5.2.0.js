/* UI-5.2.0 - four independent blocks, each wrapped in its own try/catch (one failing block never stops the others):
   1) File Explorer: roomier sidebar + storage cards, click = highlight only (no tick circle), double click opens (also with the virtual mouse).
   2) Start + Search: new look, "All apps" page, preview card next to the search results.
   3) Recycle Bin: new app UI (same TR / trRestore / trPurge data as before).
   4) Full-width taskbar (body.tb-full): [Start][Search] | apps | Recycle Bin. Tray and clock stay on the right.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document;
function ok(f){try{return f()}catch(e){try{console.error('UI-5.2.0',e)}catch(_){}}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function mk(t,c,h){var e=doc.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function say(t){ok(function(){if(typeof toast==='function')toast(t)})}
function fsize(n){if(n==null||n<0)return'';var u=['B','KB','MB','GB','TB'],i=0;while(n>=1024&&i<4){n/=1024;i++}return(i?n.toFixed(n<10?1:0):n)+' '+u[i]}
function trl(){try{return Array.isArray(TR)?TR:[]}catch(e){return[]}}
function IS(k,w){var P={restore:'<path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/>',trash:'<path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13M10 11v6M14 11v6"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',x:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'};return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.9)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+P[k]+'</svg>'}

/* ===================== CSS ===================== */
var CSS=[
/* ---- 1. File Explorer ---- */
'.fx-top{padding:12px 16px 10px;gap:8px}',
'.fx-side{width:244px;padding:4px 14px 18px 16px}',
'.fx-sh{margin:22px 10px 9px;letter-spacing:.7px}.fx-side>.fx-sh:first-child{margin-top:8px}',
'.fx-si{padding:9px 10px;gap:12px;margin:0 0 2px;border-radius:12px}',
'.fx-si .tl{width:28px;height:28px;border-radius:9px}.fx-si .tl svg{width:16px;height:16px}',
'.fx-dv{padding:12px 12px 13px;gap:9px;margin:0 0 8px;border-radius:14px;background:rgba(127,127,127,.09)}.fx-dv:hover{background:rgba(127,127,127,.17)}',
'.fx-dv .l{font-size:13px}.fx-dv small{font-size:11.5px;line-height:1.2}.fx-bar{height:6px}',
'.fx-pane{margin:0 14px 16px 0;border-radius:20px}',
'.fx-act{padding:10px 14px}.fx-list{padding:10px 14px 16px}.fx-stat{padding:9px 18px}',
'.fx-g{gap:10px;grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}.fx-t{padding:16px 10px 12px;gap:10px}',
/* click = highlight only; the tick circle exists only in multi-select mode (touch long-press) */
'.fx:not([data-multi]) .fx-cb{display:none!important}',
'.fx:not([data-multi]) .fx-lh>span:first-child{display:none}',
'.fx:not([data-multi]) .fx-lh,.fx:not([data-multi]) .fx-r{grid-template-columns:minmax(0,1fr) 150px 100px 84px}',
'.fx[data-w=m]:not([data-multi]) .fx-lh,.fx[data-w=m]:not([data-multi]) .fx-r{grid-template-columns:minmax(0,1fr) 140px 84px}',
'.fx[data-w=s]:not([data-multi]) .fx-lh,.fx[data-w=s]:not([data-multi]) .fx-r{grid-template-columns:minmax(0,1fr) 78px}',
'.fx-r.sel,.fx-t.sel{box-shadow:inset 0 0 0 1.5px rgba(79,124,255,.55);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--fxa) 58%,transparent)}',

/* ---- 2. Start + Search ---- */
'body #start{width:min(96vw,660px);padding:20px 20px 12px;border-radius:28px}',
'body #start .sbox{margin-bottom:2px}',
'body #start .sbox:before{left:17px;width:18px;height:18px;margin-top:-9px;opacity:.6}',
'body #start .sbox input{height:48px!important;padding-left:46px!important;border-radius:16px!important;font-size:14.5px;background:rgba(127,127,127,.12)!important;border:1px solid var(--line)!important;transition:box-shadow .18s,border-color .18s}',
'body #start .sbox input:focus{border-color:var(--acc)!important;box-shadow:0 0 0 3px rgba(79,124,255,.28);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 32%,transparent)}',
'#start h3{font-size:13px;font-weight:650;letter-spacing:.1px;color:var(--txt);margin:20px 4px 10px}',
'#start h3 .nxall{margin-left:auto;display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 12px;border:0;border-radius:999px;background:rgba(127,127,127,.16);color:var(--txt);font:600 12px system-ui,sans-serif;cursor:pointer;transition:background-color .15s,transform .12s}',
'#start h3 .nxall:hover{background:rgba(127,127,127,.27)}#start h3 .nxall:active{transform:scale(.94)}',
'body #pins{gap:8px 4px}',
'body #pins button{border-radius:18px;padding:12px 2px 9px;transition:background-color .15s,transform .2s cubic-bezier(.3,1.5,.5,1)}',
'body #pins button:hover{background:var(--hov);transform:translateY(-2px)}body #pins button:active{transform:scale(.93)}',
'#pins .t{width:50px;height:50px;border-radius:15px;box-shadow:0 8px 18px rgba(0,0,0,.28)}',
'body #rcnt{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 10px}',
'body #rcnt button{display:grid;grid-template-columns:42px minmax(0,1fr);grid-template-rows:auto auto;column-gap:12px;align-items:center;text-align:left;padding:8px 10px;border-radius:14px;font-size:13px;font-weight:600;transition:background-color .15s,transform .15s}',
'body #rcnt button:active{transform:scale(.97)}',
'body #rcnt button .t{grid-row:1/3;width:42px;height:42px;border-radius:12px}',
'body #rcnt button span{grid-column:2;grid-row:1;align-self:end;text-align:left}',
'body #rcnt button::after{content:"Recently opened";grid-column:2;grid-row:2;align-self:start;font-weight:400;font-size:11px;color:var(--mut)}',
'#start .nxqs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}',
'#start .nxqs>*{height:42px;border-radius:14px;font-weight:600;font-size:12.5px;transition:transform .12s,filter .15s}#start .nxqs>*:active{transform:scale(.95)}',
'#start .sfoot{margin-top:16px;padding:12px 4px 4px;border-top:1px solid var(--line)}',
'#start .sfoot .usr i{width:36px;height:36px}',
'#start .sfoot #pwb{width:42px;height:42px;border-radius:14px;transition:background-color .15s,transform .12s}#start .sfoot #pwb:hover{background:var(--hov)}#start .sfoot #pwb:active{transform:scale(.93)}',
'#pwm{border-radius:18px;padding:8px;min-width:200px}#pwm button{padding:11px 12px;border-radius:11px}',
/* all apps page */
'#nxall{display:none}',
'#start.nxallon #sbody{display:none!important}#start.nxallon #nxall{display:block;animation:nxaIn .2s ease-out}@keyframes nxaIn{from{opacity:0;transform:translateX(14px)}}',
'#nxall .hd{display:flex;align-items:center;gap:12px;margin:18px 2px 8px}#nxall .hd b{font-size:15px;font-weight:700}',
'#nxall .back{height:32px;padding:0 14px;border:0;border-radius:999px;background:rgba(127,127,127,.16);color:var(--txt);font:600 12.5px system-ui,sans-serif;cursor:pointer;transition:background-color .15s,transform .12s}#nxall .back:hover{background:rgba(127,127,127,.27)}#nxall .back:active{transform:scale(.95)}',
'#nxall .lst{max-height:min(52vh,420px);overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 12px;padding-right:4px;scrollbar-width:thin}',
'#nxall .lt{grid-column:1/-1;position:sticky;top:0;z-index:1;font-size:12px;font-weight:700;color:var(--mut);padding:10px 6px 4px;background:var(--pn,var(--surf))}',
'#nxall .ar{display:flex;align-items:center;gap:12px;padding:8px 10px;border:0;border-radius:14px;background:none;color:var(--txt);text-align:left;font-size:13.5px;font-weight:550;cursor:pointer;min-width:0;transition:background-color .15s,transform .12s}',
'#nxall .ar:hover{background:var(--hov)}#nxall .ar:active{transform:scale(.97)}#nxall .ar span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#nxall .ar .t{width:36px;height:36px;border-radius:11px;flex:none}',
/* search */
'body #start.q .sflt{display:flex;gap:8px;margin:12px 0 4px}',
'.sflt button{height:32px;padding:0 16px;font-weight:600;font-size:12.5px;transition:background-color .15s,transform .12s}.sflt button:active{transform:scale(.95)}',
'#nxsw{display:contents}',
'#start.q #nxsw{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:14px;align-items:start;margin-top:8px}',
'#start.q #nxsw>#sres{margin:0;max-height:min(46vh,380px);overflow:auto;padding-right:4px;scrollbar-width:thin}',
'#sres h4{margin:14px 6px 5px;font-size:11.5px;letter-spacing:.5px;text-transform:uppercase}',
'#sres .sr{padding:9px 12px;gap:12px;border-radius:14px;transition:background-color .12s}#sres .sr small{margin-left:auto;opacity:.6;font-size:11.5px;flex:none}',
'#sres .sr.sel{background:rgba(79,124,255,.2);background:color-mix(in srgb,var(--acc) 22%,transparent);box-shadow:inset 0 0 0 1px rgba(79,124,255,.5);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--acc) 50%,transparent)}',
'#nxprev{display:none}#nxprev:empty{display:none!important}',
'#start.q #nxprev{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:22px 16px 14px;border-radius:22px;background:rgba(127,127,127,.1);border:1px solid var(--line);position:sticky;top:0;min-height:230px;animation:nxpIn .22s ease-out}',
'@keyframes nxpIn{from{opacity:0;transform:translateY(6px)}}',
'#nxprev .pi{width:84px;height:84px;display:grid;place-items:center;margin-bottom:4px}#nxprev .pi>*{width:84px!important;height:84px!important;border-radius:24px!important}',
'#nxprev h4{margin:0;font-size:18px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-transform:none;letter-spacing:0}',
'#nxprev em{font-style:normal;font-size:12px;color:var(--mut);padding:3px 10px;border-radius:999px;background:rgba(127,127,127,.16)}',
'#nxprev .po{margin-top:10px;height:38px;padding:0 28px;border:0;border-radius:12px;background:var(--acc);color:var(--accT,#fff);font:650 13.5px system-ui,sans-serif;cursor:pointer;transition:transform .12s,filter .15s}#nxprev .po:hover{filter:brightness(1.1)}#nxprev .po:active{transform:scale(.95)}',
'#nxprev small{color:var(--mut);font-size:11px}',
'@media(max-width:560px){#start.q #nxsw{grid-template-columns:minmax(0,1fr)}#nxprev{display:none!important}}',

/* ---- 3. Recycle Bin ---- */
'.trx{--a:var(--acc,#4f7cff);position:relative;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--txt);font-size:13px;outline:0;overflow:hidden}',
'.trx *{box-sizing:border-box}.trx button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}.trx svg{display:block}',
'.trx-hero{display:flex;align-items:center;gap:18px;padding:18px 22px 12px;flex:none;flex-wrap:wrap}',
'.trx-ill{width:76px;height:76px;flex:none}.trx-ill svg{width:100%;height:100%;overflow:visible}.trx-ill.pop svg{animation:trxPop .38s cubic-bezier(.3,1.6,.5,1)}@keyframes trxPop{0%{transform:scale(.86) rotate(-5deg)}100%{transform:none}}',
'.trx-ht{flex:1;min-width:150px;display:flex;flex-direction:column;gap:3px}.trx-ht b{font-size:21px;font-weight:700;letter-spacing:-.2px}.trx-sub{color:var(--mut)}',
'.trx-hb{display:flex;gap:8px;flex-wrap:wrap}',
'.trx-b{height:38px;padding:0 16px;border-radius:12px;background:rgba(127,127,127,.17);font-weight:600;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;transition:background-color .15s,transform .12s,filter .15s}',
'.trx-b svg{width:17px;height:17px;flex:none}.trx-b:hover{background:rgba(127,127,127,.28)}.trx-b:active{transform:scale(.95)}',
'.trx-b.pr{background:var(--a);color:#fff}.trx-b.pr:hover{background:var(--a);filter:brightness(1.1)}',
'.trx-b.dg{background:#e5484d;color:#fff}.trx-b.dg:hover{background:#e5484d;filter:brightness(1.1)}',
'.trx-b.dl{color:#ff6b73}.trx-b[disabled]{opacity:.38;pointer-events:none}',
'.trx-act{display:flex;align-items:center;gap:8px;padding:6px 22px 10px;flex:none;min-height:50px;flex-wrap:wrap}.trx-act .sp{flex:1}.trx-act .cnt{color:var(--mut)}',
'.trx-list{flex:1;min-height:0;overflow:auto;margin:0 14px;padding:4px 0 10px;border-top:1px solid var(--line);scrollbar-width:thin}',
'.trx-lh,.trx-r{display:grid;grid-template-columns:44px minmax(0,1fr) 128px 78px 76px;gap:10px;align-items:center}',
'.trx-lh{padding:8px 12px;color:var(--mut);font-size:11.5px;font-weight:600;position:sticky;top:0;z-index:2;background:var(--surf,#14171f)}.trx-lh .r,.trx-c.r{text-align:right}',
'.trx-r{padding:7px 12px;border-radius:14px;cursor:default;-webkit-user-select:none;user-select:none;transition:background-color .12s}',
'.trx-r:hover{background:rgba(127,127,127,.13)}',
'.trx-r.sel{background:rgba(79,124,255,.22);background:color-mix(in srgb,var(--a) 22%,transparent);box-shadow:inset 0 0 0 1.5px rgba(79,124,255,.55);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--a) 55%,transparent)}',
'.trx-ic{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;overflow:hidden}.trx-ic>svg,.trx-ic>div{width:100%;height:100%}.trx-ic .ico{width:100%;height:100%}',
'.trx-nt{min-width:0;display:flex;flex-direction:column}.trx-nt b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trx-nt span{color:var(--mut);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.trx-c{color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.trx-ra{display:flex;gap:2px;justify-content:flex-end;opacity:0;transition:opacity .12s}.trx-r:hover .trx-ra,.trx-r.sel .trx-ra{opacity:1}',
'.trx-ra button{width:32px;height:32px;border-radius:10px;display:grid;place-items:center}.trx-ra button:hover{background:rgba(127,127,127,.24)}.trx-ra button.dg:hover{background:rgba(229,72,77,.24);color:#ff6b73}.trx-ra svg{width:17px;height:17px}',
'.trx-foot{flex:none;padding:9px 22px;border-top:1px solid var(--line);color:var(--mut);font-size:12px}',
'.trx-em{display:none;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--mut);text-align:center;padding:24px}.trx-em b{color:var(--txt);font-size:16px}.trx-em p{margin:0;max-width:320px;line-height:1.45}',
'.trx[data-empty] .trx-em{display:flex}.trx[data-empty] .trx-list,.trx[data-empty] .trx-act,.trx[data-empty] .trx-foot{display:none}',
'.trx[data-w=s] .trx-lh,.trx[data-w=s] .trx-r{grid-template-columns:44px minmax(0,1fr) 76px}.trx[data-w=s] .cd,.trx[data-w=s] .cs{display:none}.trx[data-w=s] .trx-hero{padding:14px 16px 8px}.trx[data-w=s] .trx-act{padding:4px 16px 8px}',
'.trx-modal{position:absolute;inset:0;z-index:10;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.42)}',
'.trx-card{width:min(400px,100%);padding:20px;border-radius:20px;background:var(--pn,var(--surf2,var(--surf)));border:1px solid var(--line);box-shadow:0 24px 70px rgba(0,0,0,.45);animation:trxC .18s ease-out}@keyframes trxC{from{opacity:0;transform:scale(.94)}}',
'.trx-card h3{margin:0 0 8px;font-size:16px}.trx-card p{margin:0;color:var(--mut);line-height:1.45}.trx-card .rw{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}',

/* ---- 4. Full-width taskbar ---- */
'#nxSep1,#nxSep2,#nxTrash{display:none}',
'body.tb-full #dock{display:flex!important;align-items:center;justify-content:center;gap:4px;grid-template-columns:none!important;padding:0 12px}',
'body.tb-full.tb-left #dock{justify-content:flex-start}',
'body.tb-full #tbL{display:contents}',
'body.tb-full #startBtn{order:1}body.tb-full #srchBtn{order:2}',
'body.tb-full #tasks{order:4;grid-column:auto;justify-self:auto}',
'body.tb-full #nxSep1,body.tb-full #nxSep2{display:block;flex:none;order:3;width:1px;height:calc(var(--tbs,56px)*.5);margin:0 8px;border-radius:1px;background:var(--line,rgba(255,255,255,.24))}body.tb-full #nxSep2{order:5}',
'body.tb-full #nxTrash{display:flex;order:6;position:relative}',
'body.tb-full #tasks .dk[data-id=trash]{display:none}',
'body.tb-full #tbR{position:absolute;right:12px;top:0;bottom:0;margin:0}',
'#nxTrash .nxb{display:none;position:absolute;top:1px;right:1px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--acc,#4f7cff);color:#fff;font:700 10.5px/17px system-ui,sans-serif;text-align:center;font-style:normal;pointer-events:none}',
'#nxTrash.has .nxb{display:block}',
'#nxTrash.run::after{content:"";position:absolute;bottom:1px;left:50%;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:var(--acc,#4f7cff)}'
].join('\n');
var sty=doc.createElement('style');sty.id='nx-ui52-css';sty.textContent=CSS;doc.head.appendChild(sty);

/* ===================== 1. File Explorer: double click ===================== */
ok(function(){
 var last={el:null,t:0};
 doc.addEventListener('click',function(e){
  var t=e.target;if(!t||!t.closest)return;
  var row=t.closest('.fx-r[data-i],.fx-t[data-i]');
  if(!row||t.closest('[data-cb]')||e.ctrlKey||e.metaKey||e.shiftKey){last.el=null;return}
  var root=row.closest('.fx');if(!root||root.hasAttribute('data-multi')){last.el=null;return}
  var now=Date.now();
  if(last.el===row&&now-last.t<720){
   last.el=null;e.stopPropagation();e.preventDefault();
   var ob=root.querySelector('.fx-ab[data-a=open]');if(ob)ob.click();
   return}
  last.el=row;last.t=now},true);
});

/* ===================== 2. Start + Search ===================== */
ok(function(){
 var st=doc.getElementById('start'),q=doc.getElementById('sq'),res=doc.getElementById('sres');
 if(!st||!q||!res)return;
 var body=doc.getElementById('sbody');
 /* tag the Quick settings label + row so they can be styled */
 var all0=st.querySelectorAll('h3,h4,div,span,p,b'),lab=null,i;
 for(i=0;i<all0.length;i++){var el=all0[i];if(!el.children.length&&/^quick settings$/i.test((el.textContent||'').trim())){lab=el;break}}
 if(lab){var qr=lab.nextElementSibling;if(qr&&qr.querySelector('button'))qr.classList.add('nxqs')}
 /* all apps page */
 if(body&&body.parentNode&&typeof A!=='undefined'&&typeof tile==='function'){
  var HID={about:1,dl:1,exew:1,win:1,inst:1,site:1,exe:1,lnk:1,filesold:1};
  var page=mk('div','','<div class="hd"><button class="back" type="button">\u2039 Back</button><b>All apps</b></div><div class="lst"></div>');page.id='nxall';
  body.parentNode.insertBefore(page,body.nextSibling);
  var lst=page.querySelector('.lst');
  var fill=function(){
   var ids=Object.keys(A).filter(function(id){return A[id]&&A[id].n&&!HID[id]&&!A[id].hid}).sort(function(a,b){return String(A[a].n).toLowerCase()<String(A[b].n).toLowerCase()?-1:1});
   lst.innerHTML='';var cur='';
   ids.forEach(function(id){
    var ch=String(A[id].n).charAt(0).toUpperCase();if(!/[A-Z]/.test(ch))ch='#';
    if(ch!==cur){cur=ch;var l=mk('div','lt','');l.textContent=ch;lst.appendChild(l)}
    var b=mk('button','ar','<div class="t">'+tile(id)+'</div><span></span>');b.type='button';b.dataset.id=id;b.querySelector('span').textContent=A[id].n;
    b.addEventListener('click',function(){ok(function(){if(typeof closeMenus==='function')closeMenus()});ok(function(){openApp(id)})});
    lst.appendChild(b)})};
  var h3=body.querySelector('h3');
  if(h3){var ab=mk('button','nxall','All apps \u203a');ab.type='button';ab.className='nxall';ab.addEventListener('click',function(e){e.stopPropagation();fill();st.classList.add('nxallon');lst.scrollTop=0});h3.appendChild(ab)}
  page.querySelector('.back').addEventListener('click',function(e){e.stopPropagation();st.classList.remove('nxallon')});
  q.addEventListener('input',function(){st.classList.remove('nxallon')});
  new MutationObserver(function(){if(!st.classList.contains('show'))st.classList.remove('nxallon')}).observe(st,{attributes:true,attributeFilter:['class']});
 }
 /* preview card next to the search results */
 var sw=mk('div','',''),prev=mk('div','','');sw.id='nxsw';prev.id='nxprev';
 if(res.parentNode===st){
  st.insertBefore(sw,res);sw.appendChild(res);sw.appendChild(prev);
  var hov=null,key='',raf=0;
  var upd=function(){
   var r=(hov&&hov.isConnected)?hov:res.querySelector('.sr.sel');
   if(!r||!st.classList.contains('q')){prev.innerHTML='';prev._r=null;key='';return}
   var sec='',p=r.previousElementSibling;while(p){if(p.tagName==='H4'){sec=p.textContent;break}p=p.previousElementSibling}
   var nm=r.querySelector('span'),tg=r.querySelector('small'),k=(nm?nm.textContent:'')+'|'+(tg?tg.textContent:'')+'|'+sec;
   prev._r=r;if(k===key&&prev.firstChild)return;key=k;
   prev.innerHTML='<div class="pi"></div><h4></h4><em></em><button type="button" class="po">Open</button><small>Press Enter to open</small>';
   var ic=r.querySelector('.t,.gi');if(ic)prev.querySelector('.pi').appendChild(ic.cloneNode(true));
   prev.querySelector('h4').textContent=nm?nm.textContent:'';
   prev.querySelector('em').textContent=(tg&&tg.textContent)||sec||'Result'};
  var sched=function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;ok(upd)})};
  var mo=new MutationObserver(sched);
  mo.observe(res,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  mo.observe(st,{attributes:true,attributeFilter:['class']});
  res.addEventListener('mouseover',function(e){var r=e.target.closest?e.target.closest('.sr'):null;if(r&&r!==hov){hov=r;sched()}});
  res.addEventListener('mouseleave',function(){hov=null;sched()});
  q.addEventListener('keydown',function(){hov=null},true);
  prev.addEventListener('click',function(e){var b=e.target.closest('.po');if(b&&prev._r&&prev._r.isConnected){e.stopPropagation();prev._r.click()}});
 }
});

/* ===================== 3. Recycle Bin ===================== */
ok(function(){
 if(typeof A==='undefined'||!A.trash)return;
 var OLDT=A.trash.f;
 var FT=[[/^(jpe?g|png|gif|webp|bmp|avif|heic|svg|ico)$/,'#ff7ab0','#d9387f'],[/^(mp4|m4v|webm|mkv|mov|3gp|avi)$/,'#ff8a66','#e0452b'],[/^(mp3|flac|m4a|aac|ogg|opus|wav)$/,'#b197fc','#6f4be0'],[/^pdf$/,'#ff6b78','#d62839'],[/^(docx?|rtf|odt)$/,'#62a8ff','#2f6fe0'],[/^(xlsx?|csv|ods)$/,'#4cc98a','#1b9a54'],[/^(zip|rar|7z|tar|gz)$/,'#ffcd4d','#e29a0a'],[/^apk$/,'#86e070','#3fae2f'],[/^(exe|msi|dll)$/,'#6a7ca3','#2f3a55'],[/^(js|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts)$/,'#34d6c6','#0f9d90']];
 function extOf(n){var m=/\.([^./]+)$/.exec(n||'');return m?m[1].toLowerCase():''}
 function fileIco(n,dir){
  if(dir)return'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 12a4 4 0 0 1 4-4h10l5 5h17a4 4 0 0 1 4 4v1H4z" fill="#f0a93a"/><rect x="4" y="16" width="40" height="26" rx="4" fill="#ffc653"/><rect x="4" y="16" width="40" height="8" rx="4" fill="#fff" opacity=".2"/></svg>';
  var e=extOf(n),c=['#b3bccd','#7d889d'],i;for(i=0;i<FT.length;i++)if(FT[i][0].test(e)){c=[FT[i][1],FT[i][2]];break}
  var t=(e||'file').toUpperCase().slice(0,4);
  return'<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M6 2h20l10 10v32a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="'+c[0]+'"/><path d="M26 2l10 10h-8a2 2 0 0 1-2-2z" fill="#fff" opacity=".42"/><rect x="4" y="28" width="32" height="13" rx="2.5" fill="'+c[1]+'"/><text x="20" y="37.6" text-anchor="middle" font-size="'+(t.length>3?8:9.5)+'" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">'+esc(t)+'</text></svg>'}
 function bin(full){
  var p=full?'<rect x="28" y="14" width="24" height="22" rx="3" fill="#7fc4ff" transform="rotate(-8 40 25)"/><rect x="46" y="12" width="24" height="22" rx="3" fill="#ffd66b" transform="rotate(9 58 23)"/>':'';
  return'<svg viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="trxg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9bdd2"/><stop offset="1" stop-color="#5d748c"/></linearGradient><linearGradient id="trxg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7d5e4"/><stop offset="1" stop-color="#8ea4ba"/></linearGradient></defs>'+p+'<path d="M24 38h48l-4.2 43.6A6 6 0 0 1 61.8 87H34.2a6 6 0 0 1-6-5.4z" fill="url(#trxg1)"/><path d="M38 47v30M48 47v30M58 47v30" stroke="#fff" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/><g'+(full?' transform="rotate(-6 24 34)"':'')+'><rect x="18" y="28" width="60" height="9" rx="4.5" fill="url(#trxg2)"/><rect x="39" y="20" width="18" height="9" rx="4" fill="url(#trxg2)"/></g></svg>'}
 function when(ms){
  if(!ms)return'';var d=new Date(ms),n=new Date(),t=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  var a=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),df=Math.round((a-b)/864e5);
  if(df===0)return'Today, '+t;if(df===1)return'Yesterday, '+t;return d.toLocaleDateString([],{month:'short',day:'numeric'})+', '+t}
 function nameOf(e){return e.n||(e.o?String(e.o).replace(/\/+$/,'').split('/').pop():'')||'Item'}
 function sizeOf(e){var v=e.size!=null?e.size:(e.sz!=null?e.sz:e.s);return typeof v==='number'&&v>=0?v:null}
 function where(e){if(e.k==='app')return'Desktop icon';if(e.k==='lnk')return'Desktop shortcut'+(e.o?' \u00b7 '+e.o:'');if(e.k==='exe')return'Program';var o=String(e.o||'');return o?(o.replace(/\/[^/]*\/?$/,'')||'/'):''}
 function ico(e){
  var inner;
  if(e.k==='app'&&typeof tile==='function'&&typeof A!=='undefined'&&A[e.app])inner='<div>'+tile(e.app)+'</div>';
  else if(e.k==='exe')inner=fileIco('x.exe',false);
  else inner=fileIco(nameOf(e),!!e.dir);
  return'<span class="trx-ic">'+inner+'</span>'}
 var TT='<div class="trx" tabindex="0"><div class="trx-hero"><div class="trx-ill"></div><div class="trx-ht"><b>Recycle Bin</b><span class="trx-sub"></span></div><div class="trx-hb"><button class="trx-b" data-a="ra">'+IS('restore')+'Restore all</button><button class="trx-b dg" data-a="empty">'+IS('trash')+'Empty Recycle Bin</button></div></div><div class="trx-act"></div><div class="trx-list"></div><div class="trx-em"><svg viewBox="0 0 96 96" width="84" height="84" aria-hidden="true"></svg><b>Recycle Bin is empty</b><p>Deleted files and desktop icons show up here, so you can bring them back.</p></div><div class="trx-foot">Items stay here until you delete them for good.</div></div>';
 function trashApp(w,arg){
  var Bd=w.body,sel=new Set(),anchor=null,multi=false,last='',iv=0,lp=null,lpd=false,busy=false,ro=null;
  Bd.innerHTML=TT;var root=Bd.firstChild;
  function $(s){return root.querySelector(s)}
  var list=$('.trx-list'),act=$('.trx-act'),sub=$('.trx-sub'),ill=$('.trx-ill'),emp=$('.trx-em svg');
  function items(){return trl().slice().sort(function(a,b){return(b.t||0)-(a.t||0)})}
  function ids(){return Array.from(sel)}
  function actHtml(n){var s=sel.size;return(s?'<button class="trx-b pr" data-a="restore">'+IS('restore')+'Restore</button><button class="trx-b dl" data-a="del">'+IS('trash')+'Delete</button>':'')+'<button class="trx-b" data-a="all">'+(s&&s===n?'Deselect all':'Select all')+'</button><span class="sp"></span><span class="cnt">'+(s?s+' selected':'Click an item to select it')+'</span>'}
  function paint(){
   var L=items(),n=L.length;
   Array.prototype.forEach.call(list.querySelectorAll('.trx-r'),function(r){r.classList.toggle('sel',sel.has(r.getAttribute('data-id')))});
   act.innerHTML=actHtml(n)}
  function draw(){
   var L=items(),n=L.length,tot=0,tk=0,live={};
   L.forEach(function(e){live[e.id]=1;var z=sizeOf(e);if(z!=null){tot+=z;tk++}});
   last=L.map(function(e){return e.id}).join('|');
   sel.forEach(function(id){if(!live[id])sel.delete(id)});if(!sel.size)multi=false;
   var wasFull=ill.getAttribute('data-f')==='1';
   ill.innerHTML=bin(n>0);ill.setAttribute('data-f',n>0?'1':'0');
   if(wasFull!==(n>0)){ill.classList.remove('pop');void ill.offsetWidth;ill.classList.add('pop')}
   emp.innerHTML=bin(false).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
   sub.textContent=n?n+(n===1?' item':' items')+(tk?' \u00b7 '+fsize(tot):''):'Nothing here';
   if(n)root.removeAttribute('data-empty');else root.setAttribute('data-empty','');
   $('[data-a=ra]').disabled=!n;$('[data-a=empty]').disabled=!n;
   act.innerHTML=actHtml(n);
   var h='<div class="trx-lh"><span></span><span>Name</span><span class="cd">Deleted</span><span class="cs r">Size</span><span></span></div>';
   L.forEach(function(e){var z=sizeOf(e);
    h+='<div class="trx-r'+(sel.has(e.id)?' sel':'')+'" data-id="'+esc(e.id)+'">'+ico(e)+'<div class="trx-nt"><b>'+esc(nameOf(e))+'</b><span>'+esc(where(e))+'</span></div><span class="trx-c cd">'+esc(when(e.t))+'</span><span class="trx-c cs r">'+(z==null?'':fsize(z))+'</span><div class="trx-ra"><button data-one="r" title="Restore" aria-label="Restore">'+IS('restore')+'</button><button class="dg" data-one="d" title="Delete permanently" aria-label="Delete permanently">'+IS('trash')+'</button></div></div>'});
   list.innerHTML=h}
  function after(){busy=false;sel.clear();multi=false;draw()}
  function restore(list2){
   if(!list2.length||busy)return;busy=true;
   Promise.resolve().then(function(){return trRestore(list2)}).then(function(){say(list2.length===1?'Restored':'Restored '+list2.length+' items')}).catch(function(e){say(String((e&&e.message)||'Could not restore'))}).then(after)}
  function purge(list2){
   if(!list2.length||busy)return;busy=true;
   Promise.resolve().then(function(){return trPurge(list2)}).then(function(){ok(function(){if(typeof buildIcons==='function')buildIcons(true)})}).catch(function(e){say(String((e&&e.message)||'Could not delete'))}).then(after)}
  function sure(title,msg,label,go){
   var m=mk('div','trx-modal','<div class="trx-card"><h3></h3><p></p><div class="rw"><button class="trx-b" data-m="x">Cancel</button><button class="trx-b dg" data-m="ok"></button></div></div>');
   m.querySelector('h3').textContent=title;m.querySelector('p').textContent=msg;var okb=m.querySelector('[data-m=ok]');okb.textContent=label;root.appendChild(m);
   function close(){m.remove();try{root.focus({preventScroll:true})}catch(x){}}
   m.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(b){var yes=b.getAttribute('data-m')==='ok';close();if(yes)go()}else if(e.target===m)close()});
   setTimeout(function(){try{okb.focus()}catch(x){}},30)}
  function emptyAsk(){var L=items();if(!L.length)return;sure('Empty the Recycle Bin?','All '+L.length+(L.length===1?' item':' items')+' will be deleted for good. This can not be undone.','Empty Recycle Bin',function(){purge(L.map(function(e){return e.id}))})}
  function delSel(list2){var n=list2.length;if(!n)return;sure(n===1?'Delete this item?':'Delete '+n+' items?','This deletes '+(n===1?'it':'them')+' for good. This can not be undone.','Delete',function(){purge(list2)})}
  function selAll(){var L=items();if(sel.size&&sel.size===L.length){sel.clear();multi=false}else sel=new Set(L.map(function(e){return e.id}));paint()}
  function pick(id,e){
   var order=items().map(function(x){return x.id});
   if(e&&e.shiftKey&&anchor!=null){var a=order.indexOf(anchor),b=order.indexOf(id);if(a<0)a=b;sel=new Set(order.slice(Math.min(a,b),Math.max(a,b)+1))}
   else if((e&&(e.ctrlKey||e.metaKey))||multi){if(sel.has(id))sel.delete(id);else sel.add(id);anchor=id;if(!sel.size)multi=false}
   else{sel=new Set([id]);anchor=id}
   paint()}
  root.addEventListener('click',function(e){
   var t=e.target;if(!t.closest)return;
   var a=t.closest('[data-a]');
   if(a&&root.contains(a)){var k=a.getAttribute('data-a');
    if(k==='ra')restore(items().map(function(x){return x.id}));else if(k==='empty')emptyAsk();else if(k==='restore')restore(ids());else if(k==='del')delSel(ids());else if(k==='all')selAll();return}
   var one=t.closest('[data-one]');
   if(one){var rr=one.closest('.trx-r');if(!rr)return;var id=rr.getAttribute('data-id');if(one.getAttribute('data-one')==='r')restore([id]);else delSel([id]);return}
   var r=t.closest('.trx-r');
   if(r){if(lpd){lpd=false;return}pick(r.getAttribute('data-id'),e);return}
   if(t.closest('.trx-list')&&sel.size){sel.clear();multi=false;paint()}});
  root.addEventListener('pointerdown',function(e){if(!e.target.closest('input,textarea'))try{root.focus({preventScroll:true})}catch(x){}},true);
  list.addEventListener('pointerdown',function(e){var r=e.target.closest('.trx-r');if(!r||e.pointerType!=='touch')return;lpd=false;lp=setTimeout(function(){lp=null;lpd=true;multi=true;pick(r.getAttribute('data-id'),null)},420)},true);
  ['pointerup','pointercancel','scroll'].forEach(function(ev){list.addEventListener(ev,function(){if(lp){clearTimeout(lp);lp=null}},true)});
  root.addEventListener('keydown',function(e){
   var md=root.querySelector('.trx-modal'),c=e.ctrlKey||e.metaKey,k=String(e.key||'').toLowerCase();
   if(md){if(k==='escape'){e.preventDefault();md.remove()}return}
   if(c&&k==='a'){e.preventDefault();selAll()}else if(k==='delete'&&sel.size){e.preventDefault();delSel(ids())}else if(k==='enter'&&sel.size){e.preventDefault();restore(ids())}else if(k==='escape'&&sel.size){sel.clear();multi=false;paint()}});
  if(window.ResizeObserver){ro=new ResizeObserver(function(){root.setAttribute('data-w',root.clientWidth<560?'s':'l')});ro.observe(root)}
  iv=setInterval(function(){if(!root.isConnected){clearInterval(iv);if(ro)ro.disconnect();return}var s=items().map(function(e){return e.id}).join('|');if(s!==last)draw()},500);
  w.onclose=function(){clearInterval(iv);if(ro)ro.disconnect()};
  w.emptyAsk=emptyAsk;
  draw()}
 A.trash.f=function(w,arg){
  try{return trashApp(w,arg)}
  catch(e){try{console.error('UI-5.2.0 trash',e);w.body.innerHTML=''}catch(_){}return OLDT?OLDT.apply(this,arguments):undefined}};
});

/* ===================== 4. Full-width taskbar ===================== */
ok(function(){
 var dock=doc.getElementById('dock'),tasks=doc.getElementById('tasks');
 if(!dock||!tasks)return;
 /* drop the wide search box rules of the old taskbar mod: Search becomes a normal app-sized icon */
 var ts=doc.getElementById('nx-taskbar-css');
 if(ts&&!ts.getAttribute('data-ui52')){ts.textContent=ts.textContent.split('\n').filter(function(l){return l.indexOf('#srchBtn')<0||l.indexOf('#startBtn')>=0}).join('\n');ts.setAttribute('data-ui52','1')}
 var s1=mk('span','',''),s2=mk('span','','');s1.id='nxSep1';s2.id='nxSep2';
 var tb=mk('button','dk','');tb.id='nxTrash';tb.type='button';tb.title='Recycle Bin';tb.setAttribute('aria-label','Recycle Bin');
 tb.innerHTML=ok(function(){return typeof tile==='function'?tile('trash'):''})||'';
 tb.insertAdjacentHTML('beforeend','<i class="nxb"></i>');
 dock.insertBefore(s1,tasks);dock.insertBefore(s2,tasks.nextSibling);dock.insertBefore(tb,s2.nextSibling);
 tb.addEventListener('click',function(e){e.stopPropagation();ok(function(){if(typeof closeMenus==='function')closeMenus()});ok(function(){openApp('trash')})});
 function emptyNow(){
  ok(function(){openApp('trash')});
  setTimeout(function(){ok(function(){if(typeof W==='undefined')return;Object.keys(W).forEach(function(k){var w=W[k];if(w&&w.app==='trash'&&w.emptyAsk)w.emptyAsk()})})},320)}
 function menu(){
  var r=tb.getBoundingClientRect();
  ok(function(){ctx(Math.max(4,r.left-70),Math.max(4,r.top-96),[['Open',function(){openApp('trash')}],null,['Empty Recycle Bin',emptyNow,'',!trl().length]])})}
 tb.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();menu()});
 ok(function(){if(typeof onLong==='function')onLong(tb,menu)});
 var nb=tb.querySelector('.nxb');
 function upd(){
  if(doc.hidden)return;
  var n=trl().length;tb.classList.toggle('has',n>0);if(nb)nb.textContent=n>99?'99+':String(n);
  var run=false;ok(function(){if(typeof W!=='undefined')Object.keys(W).forEach(function(k){if(W[k]&&W[k].app==='trash')run=true})});
  tb.classList.toggle('run',run)}
 setInterval(upd,700);upd();
});
})();
