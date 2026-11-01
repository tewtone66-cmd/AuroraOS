/* NOTIFY-3.7.0 - clean themed notification popups (top-right, animated, auto-dismiss) + hooks for toasts, downloads, Notification API */
(function(){'use strict';
var doc=document;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
function el(t,c,x){var e=doc.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
/* ---------- icons: colored tiles ---------- */
var COL={green:['#6EE79C','#1DB35B'],red:['#FF7F96','#EE3560'],blue:['#62B4FF','#1F6BFF'],yellow:['#FFDA78','#F5A524'],purple:['#C7A0FF','#7B4DFF'],teal:['#5BE0D8','#12A39C'],orange:['#FFC45A','#FF7A1A'],pink:['#FF8FC8','#C94BE0'],indigo:['#93A0FF','#4954E0']};
var LET=['blue','purple','teal','orange','pink','indigo','green'];
function defs(){var s='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>';Object.keys(COL).forEach(function(k){s+='<linearGradient id="nxn-'+k+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+COL[k][0]+'"/><stop offset="1" stop-color="'+COL[k][1]+'"/></linearGradient>'});
 s+='<linearGradient id="nxn-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>';var d=el('div');d.id='nxn-defs';d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';d.innerHTML=s;doc.body.appendChild(d)}
function tile(c,inner){return'<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.4" fill="url(#nxn-'+c+')"/><path d="M0 6.4A6.4 6.4 0 016.4 0h11.2A6.4 6.4 0 0124 6.4V12H0z" fill="url(#nxn-sh)"/>'+inner+'</svg>'}
function gl(g_){return'<g transform="translate(12 12) scale(.78) translate(-12 -12)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+g_+'</g>'}
var TY={
 downloads:['green','<path d="M12 4.5v10M7.8 10.8L12 15l4.2-4.2M5 19.5h14"/>'],
 install:['green','<rect x="4" y="4" width="6.5" height="6.5" rx="1.7"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.7"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.7"/><path d="M16.7 13.8v5.8M13.8 16.7h5.8"/>'],
 update:['green','<path d="M19.5 12a7.5 7.5 0 01-13 5M4.5 12a7.5 7.5 0 0113-5"/><path d="M17.5 3.5V7H14M6.5 20.5V17H10"/>'],
 error:['red','<path d="M12 6.5v7"/><circle cx="12" cy="17.4" r=".6"/>'],
 success:['green','<path d="M6 12.5l4 4 8-9"/>'],
 info:['blue','<path d="M12 11v6"/><circle cx="12" cy="7.6" r=".6"/>'],
 files:['yellow','<path d="M3.5 7.5a2 2 0 012-2h4l2 2.2h7a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/>']
};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
function dockIcon(app){if(!app)return'';try{var a=String(app).toLowerCase(),q=doc.querySelectorAll('#dock [title],#dock [aria-label],#start [title],#start [aria-label]');
 for(var i=0;i<q.length;i++){var n=(q[i].getAttribute('title')||q[i].getAttribute('aria-label')||'').toLowerCase();if(n&&n===a){var s=q[i].querySelector('svg,img');if(s)return s.outerHTML}}}catch(e){}return''}
function iconFor(o){var ic=o.icon;if(ic){if(/^\s*<svg/i.test(ic))return ic;if(/^(data:|https?:|blob:|\.{0,2}\/|assets\/)/.test(ic))return'<img src="'+esc(ic)+'" alt="" draggable="false">'}
 if(o.type&&TY[o.type])return tile(TY[o.type][0],gl(TY[o.type][1]));
 var d=dockIcon(o.app);if(d)return d;
 var name=(o.app||o.title||'?').trim(),ch=(name[0]||'?').toUpperCase(),c=LET[hash(name)%LET.length];
 return tile(c,'<text x="12" y="16.6" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="12.5" fill="#fff">'+esc(ch)+'</text>')}
/* ---------- css ---------- */
var CSS=[
'#nxnHost{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:12px;width:min(calc(100vw - 24px),352px);display:flex;flex-direction:column;gap:8px;z-index:2147483200;pointer-events:none}',
'.nxn{position:relative;display:flex;gap:11px;align-items:flex-start;padding:11px 34px 13px 12px;border-radius:18px;background:var(--pn,#161a22);color:var(--txt,#eef1f6);border:1px solid var(--line,rgba(255,255,255,.14));box-shadow:0 14px 38px rgba(0,0,0,.34),0 2px 8px rgba(0,0,0,.18);pointer-events:auto;overflow:hidden;animation:nxnIn .5s cubic-bezier(.2,.9,.25,1.15) backwards;transition:max-height .3s ease,margin .3s ease,padding .3s ease,opacity .25s,transform .28s;font-family:system-ui,sans-serif;cursor:pointer;-webkit-user-select:none;user-select:none;touch-action:pan-y;max-height:200px}',
'.nxn.out{opacity:0;transform:translateY(-16px) scale(.96)}.nxn.sw{transition:none}',
'@keyframes nxnIn{0%{opacity:0;transform:translateY(-34px) scale(.94)}60%{opacity:1;transform:translateY(4px) scale(1.01)}100%{opacity:1;transform:none}}',
'.nxn-i{flex:none;width:38px;height:38px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))}.nxn-i svg,.nxn-i img{width:100%;height:100%;display:block;border-radius:10px;object-fit:cover}',
'.nxn-b{min-width:0;flex:1}.nxn-a{font-size:10.5px;letter-spacing:.4px;text-transform:uppercase;color:var(--mut,#9aa3b2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.nxn-ti{display:block;font-size:14px;font-weight:650;line-height:1.25;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.nxn-tx{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12.5px;line-height:1.35;color:var(--mut,#9aa3b2);margin-top:2px;word-break:break-word}',
'.nxn-x{position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:var(--mut,#9aa3b2);opacity:.75;transition:background .15s,opacity .15s}.nxn-x:hover{background:var(--hov,rgba(255,255,255,.1));opacity:1}.nxn-x svg{width:11px;height:11px}',
'.nxn-p{position:absolute;left:0;bottom:0;height:2.5px;width:100%;background:linear-gradient(90deg,var(--acc,#7c9bff),transparent);transform-origin:left;animation:nxnP var(--d,5s) linear forwards}@keyframes nxnP{to{transform:scaleX(0)}}',
'.nxn.hold .nxn-p{animation-play-state:paused}',
':root[data-skin=glass] .nxn{background-color:rgba(26,34,58,.5);background-image:radial-gradient(120% 90% at 0% 0%,rgba(255,255,255,.22),rgba(255,255,255,0) 55%),linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0));border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.2),0 18px 44px rgba(0,0,0,.38)}',
':root[data-skin=glass] body:not(.perf):not(.lite) .nxn{-webkit-backdrop-filter:blur(var(--nx-blur,26px)) saturate(170%);backdrop-filter:blur(var(--nx-blur,26px)) saturate(170%)}',
'.nxs{margin:0 0 18px}.nxs .seg{margin:6px 0 12px}.nxs .pgb{margin-top:4px}'
].join('\n');
var sty=el('style');sty.id='nx-notify-css';sty.textContent=CSS;doc.head.appendChild(sty);
/* ---------- core ---------- */
var host=null,items=[],hist=[],lastKey='',lastT=0,MAX=3;
function ensure(){if(host&&host.isConnected)return;if(!doc.getElementById('nxn-defs'))defs();host=el('div');host.id='nxnHost';doc.body.appendChild(host)}
function dur(o){var d=+o.ms;if(d>0)return Math.min(d,15000);var v=+g('aur.nxdur',5000);return v>0?v:5000}
function dismiss(n){if(n._gone)return;n._gone=1;clearTimeout(n._t);var e=n.el;e.classList.add('out');var h=e.offsetHeight;e.style.maxHeight=h+'px';
 requestAnimationFrame(function(){e.style.maxHeight='0px';e.style.marginBottom='-8px';e.style.paddingTop='0';e.style.paddingBottom='0'});
 setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e)},330);var i=items.indexOf(n);if(i>=0)items.splice(i,1)}
function arm(n,ms){clearTimeout(n._t);n._t0=Date.now();n._rem=ms;n._t=setTimeout(function(){dismiss(n)},ms)}
function notify(o){o=o||{};if(typeof o==='string')o={title:o};
 var title=String(o.title||o.app||'Notification'),text=o.text==null?(o.body==null?'':String(o.body)):String(o.text),app=o.app?String(o.app):'';
 var key=app+'|'+title+'|'+text,now=Date.now();if(key===lastKey&&now-lastT<1500)return null;lastKey=key;lastT=now;
 hist.unshift({app:app,title:title,text:text,type:o.type||'',time:now});if(hist.length>50)hist.pop();
 if(g('aur.nxdnd','0')==='1')return null;
 ensure();while(items.length>=MAX)dismiss(items[0]);
 var ms=dur(o),e=el('div','nxn'),n={el:e,onClick:o.onClick};e.style.setProperty('--d',ms+'ms');
 var ic=el('div','nxn-i');ic.innerHTML=iconFor({icon:o.icon,type:o.type,app:app||title,title:title});
 var b=el('div','nxn-b');if(app)b.appendChild(el('div','nxn-a',app));var t=el('b','nxn-ti',title);t.dir='auto';b.appendChild(t);
 if(text){var x=el('div','nxn-tx',text);x.dir='auto';b.appendChild(x)}
 var cl=el('div','nxn-x');cl.innerHTML='<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg>';
 e.appendChild(ic);e.appendChild(b);e.appendChild(cl);e.appendChild(el('i','nxn-p'));host.appendChild(e);items.push(n);arm(n,ms);
 /* interactions: pause on hold, swipe sideways to dismiss, tap to open */
 var sx=0,dx=0,down=false,moved=false;
 e.addEventListener('pointerenter',function(){if(n._gone)return;e.classList.add('hold');clearTimeout(n._t);n._rem=Math.max(1200,n._rem-(Date.now()-n._t0))});
 e.addEventListener('pointerleave',function(){if(down||n._gone)return;e.classList.remove('hold');arm(n,Math.max(1200,n._rem))});
 e.addEventListener('pointerdown',function(ev){if(ev.target.closest('.nxn-x'))return;down=true;moved=false;sx=ev.clientX;dx=0;e.classList.add('sw','hold');clearTimeout(n._t);n._rem=Math.max(1200,n._rem-(Date.now()-n._t0))});
 doc.addEventListener('pointermove',function(ev){if(!down)return;dx=ev.clientX-sx;if(Math.abs(dx)>6)moved=true;if(moved){e.style.transform='translateX('+dx+'px)';e.style.opacity=String(Math.max(.2,1-Math.abs(dx)/260))}});
 doc.addEventListener('pointerup',function(){if(!down)return;down=false;e.classList.remove('sw');if(Math.abs(dx)>80){e.style.transform='translateX('+(dx>0?'120':'-120')+'%)';dismiss(n)}else{e.style.transform='';e.style.opacity='';e.classList.remove('hold');if(!n._gone)arm(n,Math.max(1200,n._rem))}});
 cl.addEventListener('click',function(ev){ev.stopPropagation();dismiss(n)});
 e.addEventListener('click',function(){if(moved||n._gone)return;try{if(typeof n.onClick==='function')n.onClick()}catch(er){}dismiss(n)});
 return n}
window.NXN={notify:notify,history:hist,dismissAll:function(){items.slice().forEach(dismiss)},test:function(){notify({app:'Downloads',type:'downloads',title:'Download complete',text:'NexOS-update.apk (24 MB) is ready to install'})}};
if(!window.nxNotify)window.nxNotify=notify;
window.addEventListener('nx:notify',function(e){notify(e.detail)});
window.addEventListener('message',function(e){var d=e.data;if(d&&typeof d==='object'&&d.type==='nx-notify')notify(d.payload||d)});
/* ---------- hook 1: toast() messages that are really notifications ---------- */
var RULES=[
 [/download(ed|ing)?\b[^]*\b(fail|error)|\b(fail|error)[^]*download/i,{type:'error',app:'Downloads',title:'Download failed'}],
 [/^downloaded\b|download(ed)?\b[^]*\b(complete|completed|finished|done|saved)|\u062f\u0627\u0646\u0644\u0648\u062f[^]*(\u0634\u062f|\u06a9\u0627\u0645\u0644)/i,{type:'downloads',app:'Downloads',title:'Download complete'}],
 [/\binstall(ed)?\b[^]*(complete|success|done)|^installed\b|\u0646\u0635\u0628 \u0634\u062f/i,{type:'install',app:'Apps',title:'Installed'}],
 [/\bupdate[ds]?\b[^]*(ready|available|complete|installed)/i,{type:'update',app:'Update',title:'Update'}],
 [/\b(exported|uploaded)\b|saved to\b/i,{type:'files',app:'Files',title:'Done'}]
];
function classify(m){for(var i=0;i<RULES.length;i++)if(RULES[i][0].test(m)){var r=RULES[i][1];return{type:r.type,app:r.app,title:r.title,text:m}}return null}
if(typeof window.toast==='function'){var _t=window.toast;window.toast=function(m){try{var r=classify(String(m));if(r&&notify(r)!==undefined)return}catch(e){}return _t.apply(this,arguments)}}
/* ---------- hook 2: file downloads (blob/data anchors finish instantly) ---------- */
function onDl(a){var h=a.getAttribute('href')||'',name=a.getAttribute('download')||h.split('/').pop().split('?')[0]||'file';
 if(/^(blob:|data:)/.test(h))setTimeout(function(){notify({type:'downloads',app:'Downloads',title:'Download complete',text:name})},450);
 else notify({type:'downloads',app:'Downloads',title:'Download started',text:name})}
if(window.HTMLAnchorElement){var oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){try{if(this.hasAttribute('download'))onDl(this)}catch(e){}return oc.apply(this,arguments)}}
doc.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[download]');if(a&&e.isTrusted)onDl(a)},true);
/* ---------- hook 3: Web Notification API (apps that "send notifications") ---------- */
var RN=window.Notification;
function FN(title,opts){opts=opts||{};var self=this;this.title=title;this.body=opts.body||'';
 if(doc.hidden&&RN&&RN.permission==='granted'){try{return new RN(title,opts)}catch(e){}}
 notify({app:opts.tag||'',title:String(title),text:opts.body,icon:opts.icon,onClick:function(){if(typeof self.onclick==='function')self.onclick({target:self})}});setTimeout(function(){if(typeof self.onshow==='function')self.onshow({target:self})},0)}
FN.permission='granted';FN.requestPermission=function(cb){if(typeof cb==='function')cb('granted');return Promise.resolve('granted')};FN.prototype.close=function(){};FN.prototype.addEventListener=function(){};
try{window.Notification=FN}catch(e){}
function patchFrame(f){try{var w=f.contentWindow;if(w&&w.Notification!==FN){w.Notification=FN;w.nxNotify=notify}}catch(e){}}
function watchFrames(n){if(n.nodeType!==1)return;var fs=n.tagName==='IFRAME'?[n]:n.querySelectorAll?[].slice.call(n.querySelectorAll('iframe')):[];fs.forEach(function(f){patchFrame(f);f.addEventListener('load',function(){patchFrame(f)})})}
/* ---------- Settings > Notifications: on/off, duration, test ---------- */
function box(){var on=g('aur.nxdnd','0')!=='1',d=+g('aur.nxdur',5000);
 function sg(attr,vals,cur){return'<div class="seg">'+vals.map(function(v){return'<button '+attr+'="'+v[0]+'" class="'+(String(cur)===String(v[0])?'sel':'')+'">'+v[1]+'</button>'}).join('')+'</div>'}
 return'<h4>Notification popups</h4>'+sg('data-nxn',[['on','On'],['off','Off']],on?'on':'off')+'<h4>Show for</h4>'+sg('data-nxd',[[3000,'3 s'],[5000,'5 s'],[8000,'8 s']],d)+'<button class="pgb" data-nxn="test">Send test notification</button>'}
function inject(){var p=doc.getElementById('spg');if(!p||p.querySelector('.nxs'))return;var hs=p.querySelectorAll('h3'),h=null;for(var i=0;i<hs.length;i++)if(/^\s*notif/i.test(hs[i].textContent)){h=hs[i];break}
 var b=el('div','nxs');b.innerHTML=box();if(h)h.parentNode.insertBefore(b,h.nextSibling);else{var t=p.querySelector('.nxc,.nxt');if(!t)return;t.appendChild(b)}}
doc.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var a=t.closest('[data-nxn]'),d=t.closest('[data-nxd]');
 if(a){e.stopPropagation();e.preventDefault();var v=a.dataset.nxn;if(v==='test'){window.NXN.test();return}put('aur.nxdnd',v==='off'?'1':'0');a.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('sel',x===a)});if(v==='on')notify({type:'info',app:'Notifications',title:'Notifications are on',text:'Popups will appear here.'});return}
 if(d){e.stopPropagation();e.preventDefault();put('aur.nxdur',d.dataset.nxd);d.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('sel',x===d)})}},true);
var raf=0;new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++)watchFrames(a[j])}if(!raf)raf=requestAnimationFrame(function(){raf=0;inject()})}).observe(doc.body,{childList:true,subtree:true});
watchFrames(doc.body);inject();
})();
