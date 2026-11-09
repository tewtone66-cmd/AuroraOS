/* SET-5.0.0 - Settings redesign (looks only: every setting, key and handler is untouched) + Nex Island move / size controls
   - new sidebar: profile card, search pill, big coloured icon tiles, accent pill on the open page
   - new page header (icon + title + one-line description), grouped card rows, real switches for On/Off, accent segmented controls
   - sliders that work with finger AND the virtual mouse (native <input type=range> ignores synthetic mouse events)
   - Nex Island: vertical / horizontal position sliders, drag the island itself, reset */
(function(){'use strict';
var doc=document,root=doc.documentElement;
function g(k,d){try{var v=localStorage.getItem(k);return v==null||v===''?d:v}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function $(s,r){return(r||doc).querySelector(s)}

/* ================= CSS ================= */
var CSS=[
/* ---- shell ---- */
'.sx{background:var(--surf)}',
'.sx .snav{width:268px;padding:14px 12px 18px;display:flex;flex-direction:column;gap:0;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0) 38%),var(--surf2);border-right:1px solid var(--line)}',
'.sx .snav::-webkit-scrollbar,.sx .spg::-webkit-scrollbar{width:0;height:0}',
'.sx .nsp{display:flex;align-items:center;gap:12px;width:100%;padding:12px 12px;margin:0 0 12px;border-radius:18px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(124,155,255,.2),rgba(124,155,255,.04));color:var(--txt);text-align:left;cursor:pointer;transition:transform .18s,background .2s,box-shadow .2s;flex:none}',
'.sx .nsp:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(0,0,0,.22)}.sx .nsp:active{transform:scale(.985)}',
'.sx .nsp .av{width:46px;height:46px;flex:none;border-radius:50%;display:grid;place-items:center;font:700 19px/1 system-ui,sans-serif;color:var(--accT,#fff);background:linear-gradient(145deg,var(--acc),#8a63ff);background-size:cover;background-position:center;box-shadow:0 5px 16px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.35)}',
'.sx .nsp span.tx{min-width:0;flex:1}.sx .nsp b{display:block;font-size:14.5px;font-weight:650;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.sx .nsp small{display:block;margin-top:3px;font-size:11.5px;color:var(--mut)}.sx .nsp i{flex:none;font-style:normal;font-size:20px;line-height:1;opacity:.45}',
'.sx .snav input{flex:none;height:38px;margin:0 0 4px;padding:0 12px 0 36px;border-radius:12px;font-size:13px;background:var(--surf) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238d93a5\' stroke-width=\'2.2\' stroke-linecap=\'round\'%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'6.5\'/%3E%3Cpath d=\'M20 20l-4.2-4.2\'/%3E%3C/svg%3E") no-repeat 11px 50%/17px}',
'.sx .snav h5{margin:18px 8px 6px;font-size:10.5px;font-weight:700;letter-spacing:.1em;color:var(--mut);opacity:.9}',
'.sx #snv{display:block}.sx #snv button{position:relative;display:flex;align-items:center;gap:12px;width:100%;height:44px;margin:2px 0;padding:0 10px;border-radius:13px;font-size:13.5px;font-weight:550;line-height:1;transition:background .18s,transform .18s}',
'.sx #snv button .nxi,.sx #snv button .nxp-i{width:30px;height:30px;margin:0;flex:none;vertical-align:0;display:inline-flex}.sx #snv button .nxp-i svg{width:100%;height:100%}',
'.sx #snv button:hover{background:var(--hov);transform:translateX(2px)}',
'.sx #snv button.sel{font-weight:700;background:none;box-shadow:inset 0 0 0 1px rgba(124,155,255,.4)}',
'.sx #snv button.sel::after{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--acc);opacity:.17;pointer-events:none}',
'.sx #snv button.sel::before{content:"";position:absolute;left:-12px;top:11px;bottom:11px;width:4px;border-radius:0 4px 4px 0;background:var(--acc)}',
/* ---- content ---- */
'.sx .spg{padding:0 30px 40px;background:transparent}',
'.sx .spg>.sbk{margin-top:12px}',
'.sx .spg>h3{display:flex;align-items:center;gap:14px;margin:0 -30px 2px;padding:26px 30px 6px;font-size:28px;font-weight:750;letter-spacing:-.02em;line-height:1.1}',
'.sx .spg>h3 .nxi,.sx .spg>h3 .nxp-i{width:44px;height:44px;margin:0;flex:none;vertical-align:0;display:inline-flex;filter:drop-shadow(0 6px 12px rgba(0,0,0,.3))}.sx .spg>h3 svg{width:100%;height:100%}',
'.sx .spg .nsub{margin:0 0 6px;padding:0 0 0 0;font-size:13.5px;color:var(--mut)}',
'.sx .spg h4{margin:28px 4px 10px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mut)}',
'.sx .spg>.nsub+h4,.sx .spg>h3+h4{margin-top:18px}',
'.sx .spg p,.sx .spg .bnote{font-size:12.5px;line-height:1.6;color:var(--mut)}',
'.sx .spg .bnote{margin:12px 0 0;padding:12px 14px;border-radius:14px;background:var(--surf2);border:1px solid var(--line);border-left:3px solid var(--acc)}',
'.sx .spg ul{padding-left:22px;line-height:1.8}',
/* ---- controls ---- */
'.sx .spg .seg{gap:4px;padding:4px;background:var(--surf2);border:1px solid var(--line);border-radius:15px;box-shadow:none}',
'.sx .spg .seg button{padding:10px 14px;border-radius:11px;font-size:13px;font-weight:600;color:var(--mut);transition:background .2s,color .2s,transform .12s,box-shadow .2s}',
'.sx .spg .seg button:hover{color:var(--txt);background:var(--hov)}',
'.sx .spg .seg button.sel{background:var(--acc);color:var(--accT,#fff);box-shadow:0 5px 14px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.3)}',
'.sx .spg .seg button:active{transform:scale(.96)}',
'.sx .spg .step{padding:5px;gap:6px;background:var(--surf2);border:1px solid var(--line);border-radius:16px;box-shadow:none}',
'.sx .spg .step button{padding:10px 18px;border-radius:12px;font-weight:600;background:var(--surf);box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 3px 8px rgba(0,0,0,.18)}',
'.sx .spg .step b{font-size:19px;font-weight:700}',
'.sx .spg .pgb,.sx .spg button.pgb{margin-top:14px;padding:12px 20px;border:0;border-radius:13px;font-weight:650;font-size:13.5px;background:var(--acc);color:var(--accT,#fff);box-shadow:0 8px 20px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .15s,filter .15s}',
'.sx .spg .pgb:hover{filter:brightness(1.08)}.sx .spg .pgb:active{transform:scale(.97)}',
/* grouped rows: first / middle / last / single */
'.sx .spg :is(.kv,.nxd-row){display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0;padding:14px 18px;background:var(--surf2);border:0;border-bottom:1px solid var(--line);font-size:13.5px}',
'.sx .spg :is(.kv,.nxd-row) span{color:var(--txt);font-size:13.5px}.sx .spg .kv span{color:var(--mut)}',
'.sx .spg :is(.kv,.nxd-row) b{font-weight:600}',
'.sx .spg :is(.kv,.nxd-row) .seg{margin:0;padding:3px;border-radius:13px}.sx .spg :is(.kv,.nxd-row) .seg button{padding:8px 12px}',
'.sx .spg :not(.kv):not(.nxd-row)+:is(.kv,.nxd-row),.sx .spg>:is(.kv,.nxd-row):first-child{border-radius:18px 18px 0 0}',
'.sx .spg :is(.kv,.nxd-row):has(+ :not(.kv):not(.nxd-row)),.sx .spg :is(.kv,.nxd-row):last-child{border-radius:0 0 18px 18px;border-bottom:0}',
'.sx .spg :not(.kv):not(.nxd-row)+:is(.kv,.nxd-row):has(+ :not(.kv):not(.nxd-row)),.sx .spg :not(.kv):not(.nxd-row)+:is(.kv,.nxd-row):last-child{border-radius:18px}',
/* about hero */
'.sx .spg .abh{gap:18px;margin:12px 0 18px;padding:22px;border-radius:22px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(124,155,255,.2),rgba(124,155,255,.03) 70%)}',
'.sx .spg .abh h2{font-size:26px;letter-spacing:-.02em}',
/* switches (On/Off segmented -> iOS style) */
'.sx .spg .seg.nsw{position:relative;flex:none;width:52px;height:30px;padding:0;gap:0;border:0;border-radius:999px;background:none;box-shadow:none;margin:0}',
'.sx .spg .seg.nsw button{position:absolute;inset:0;width:100%;min-width:0;padding:0;border:0;border-radius:999px;font-size:0;color:transparent;background:none;box-shadow:none;transition:opacity .22s}',
'.sx .spg .seg.nsw button::before{content:"";position:absolute;inset:0;border-radius:999px;background:rgba(128,134,150,.5);transition:background .25s}',
'.sx .spg .seg.nsw button::after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .28s cubic-bezier(.3,1.5,.5,1)}',
'.sx .spg .seg.nsw button.nsw-on::before{background:var(--acc)}.sx .spg .seg.nsw button.nsw-on::after{transform:translateX(22px)}',
'.sx .spg .seg.nsw button:not(.sel){opacity:0;z-index:2}.sx .spg .seg.nsw button.sel{pointer-events:none;z-index:1;background:none;box-shadow:none}',
'.sx .spg .seg.nsw button:hover{background:none}',
/* sliders */
'.sx .spg .nx-island-size,.sx .spg .nxl-row{display:flex;align-items:center;gap:16px;margin:0;padding:14px 18px;background:var(--surf2);border:0;border-bottom:1px solid var(--line);border-radius:0}',
'.sx .spg .nx-island-size label,.sx .spg .nxl-row label{flex:1;min-width:110px;font-size:13.5px;color:var(--txt)}',
'.sx .spg .nx-island-size output,.sx .spg .nxl-row output{min-width:54px;text-align:right;font-size:13px;font-weight:650;font-variant-numeric:tabular-nums;color:var(--acc)}',
'.sx .spg .nxr-src{display:none!important}',
'.nxr{position:relative;flex:0 0 min(260px,46%);height:34px;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none}',
'.nxr::before{content:"";position:absolute;left:0;right:0;top:50%;height:6px;margin-top:-3px;border-radius:6px;background:rgba(128,134,150,.35)}',
'.nxr .nxr-f{position:absolute;left:0;top:50%;height:6px;margin-top:-3px;width:var(--p,50%);border-radius:6px;background:linear-gradient(90deg,var(--acc),#9a7bff)}',
'.nxr .nxr-t{position:absolute;top:50%;left:var(--p,50%);width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.08);transition:transform .15s}',
'.nxr.on .nxr-t{transform:scale(1.18);box-shadow:0 3px 12px rgba(0,0,0,.5),0 0 0 6px rgba(124,155,255,.28)}',
'.sx .spg .nxl-row.last,.sx .spg .nx-island-size.last{border-radius:0 0 18px 18px;border-bottom:0}',
'.sx .spg .nx-island-size{border-radius:18px 18px 0 0}',
'.sx .spg .nxl-btns{display:flex;gap:10px;margin:14px 0 0}',
'.sx .spg .kv .nxi,.sx .spg .kv .nxp-i{display:none!important}',
'.sx .spg .nxl-drag{border-radius:0 0 18px 18px!important;border-bottom:0}',
/* cards coming from other mods */
'.sx .spg :is(.nxs,.nxc,.nxt,.nx-island-update){border-radius:18px}',
'.sx .spg .thc{border-radius:18px;transition:transform .18s,box-shadow .2s,border-color .2s}.sx .spg .thc:hover{transform:translateY(-2px)}',
/* narrow (phone) layout */
'.sx.nar .snav{width:auto;padding:14px 14px 20px}.sx.nar #snv button{height:52px;font-size:15px}.sx.nar .nsp{padding:14px}',
'.sx.nar .spg{padding:0 16px 30px}.sx.nar .spg>h3{margin:0 -16px 2px;padding:18px 16px 4px;font-size:24px}',
'.sx.nar .spg :is(.kv,.nxd-row){padding:13px 14px}',
/* island drag cursor + horizontal offset */
'#nxd{translate:var(--nxd-dx,0px) 0}',
'html.nxd-drag #nxd{touch-action:none}html.nxd-drag #nxd.nxd-moving{cursor:grabbing;transition:none!important}'
].join('\n');
function css(){if($('#sx5-css'))return;var s=doc.createElement('style');s.id='sx5-css';s.textContent=CSS;doc.head.appendChild(s)}

/* ================= page descriptions ================= */
var SUB={
 'about':'Your device and this NexOS version','display & size':'Interface scale, icon size, night light and dimming','display':'Interface scale, icon size, night light and dimming',
 'battery':'Charge, health and temperature','performance':'Speed, animations and battery saver','storage':'File access and storage','update':'Version, what is new and updates',
 'account':'Profile, sign-in and security','themes':'The look of windows, taskbar, menus and apps','background':'Wallpapers and desktop colour','colors':'Accent colour',
 'taskbar':'Size, transparency, clock and pinned apps','nex island':'Dynamic island, music, alerts, size and position','island':'Dynamic island, music, alerts, size and position',
 'notifications':'Where and how alerts appear','mouse':'Pointer size, colour, speed and gestures','browser':'Search engine and defaults'};

/* ================= decorators (idempotent) ================= */
function profile(sx){var nav=$('.snav',sx);if(!nav)return;var b=$('.nsp',nav);
 if(!b){b=doc.createElement('button');b.className='nsp';b.setAttribute('data-k','pg');b.setAttribute('data-v','account');b.innerHTML='<span class="av"></span><span class="tx"><b></b><small></small></span><i>›</i>';nav.insertBefore(b,nav.firstChild)}
 var name=g('aur.user','')||'NexOS user',av=g('aur.avatar',''),a=$('.av',b),n=$('b',b),s=$('small',b);
 if(n.textContent!==name)n.textContent=name;var sm='NexOS 4.0.0';if(s.textContent!==sm)s.textContent=sm;
 if(av&&av.indexOf('data:')===0){var u='url("'+av+'")';if(a.style.backgroundImage!==u){a.style.backgroundImage=u;a.textContent=''}}
 else{if(a.style.backgroundImage)a.style.backgroundImage='';var ch=(name.trim()[0]||'N').toUpperCase();if(a.textContent!==ch)a.textContent=ch}}
function header(sx,late){var pg=$('#spg',sx);if(!pg)return;var h=pg.querySelector(':scope>h3');if(!h)return;
 var t=(h.textContent||'').trim().toLowerCase();
 var nx=h.nextElementSibling;if(SUB[t]&&!(nx&&nx.classList.contains('nsub'))){var p=doc.createElement('p');p.className='nsub';p.textContent=SUB[t];h.parentNode.insertBefore(p,h.nextSibling)}
 if(late&&!h.querySelector('.nxi,.nxp-i')){var sel=$('#snv button.sel .nxi,#snv button.sel .nxp-i',sx);if(sel){var c=sel.cloneNode(true);c.classList.add('lg');h.dataset.nxi='1';h.insertBefore(c,h.firstChild)}}}
function switches(sx){var pg=$('#spg',sx);if(!pg)return;pg.querySelectorAll('.seg:not(.nsw)').forEach(function(sg){var bs=sg.children;if(bs.length!==2)return;
 var on=null,off=null;for(var i=0;i<2;i++){var tx=(bs[i].textContent||'').trim().toLowerCase();if(tx==='on')on=bs[i];else if(tx==='off')off=bs[i]}
 if(on&&off){sg.classList.add('nsw');on.classList.add('nsw-on');on.setAttribute('aria-label','On');off.setAttribute('aria-label','Off')}})}

/* ================= sliders that work with touch and the virtual mouse ================= */
var AS=null;
function paint(inp,w){var mn=+inp.min||0,mx=+inp.max||100,p=(inp.value-mn)/((mx-mn)||1);p=Math.max(0,Math.min(1,p));w.style.setProperty('--p',(p*100)+'%')}
function setFrom(x){if(!AS)return;var inp=AS.i,w=AS.w,r=w.getBoundingClientRect(),mn=+inp.min||0,mx=+inp.max||100,st=+inp.step||1;
 var p=Math.max(0,Math.min(1,(x-r.left)/(r.width||1))),v=mn+p*(mx-mn);v=Math.round(v/st)*st;v=Math.max(mn,Math.min(mx,v));
 if(String(v)!==String(inp.value)){inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}))}paint(inp,w)}
function upgradeRange(inp){if(inp.dataset.nxr)return;inp.dataset.nxr='1';inp.classList.add('nxr-src');
 var w=doc.createElement('div');w.className='nxr';w.innerHTML='<i class="nxr-f"></i><b class="nxr-t"></b>';inp.parentNode.insertBefore(w,inp.nextSibling);
 inp._nxr=w;paint(inp,w);inp.addEventListener('input',function(){paint(inp,w)});
 w.addEventListener('pointerdown',function(e){if(e.button>0)return;AS={i:inp,w:w,id:e.pointerId};w.classList.add('on');setFrom(e.clientX);e.preventDefault()})}
doc.addEventListener('pointermove',function(e){if(AS&&e.pointerId===AS.id){setFrom(e.clientX);e.preventDefault()}},true);
['pointerup','pointercancel'].forEach(function(t){doc.addEventListener(t,function(e){if(AS&&e.pointerId===AS.id){AS.w.classList.remove('on');try{AS.i.dispatchEvent(new Event('change',{bubbles:true}))}catch(x){}AS=null}},true)});
function sliders(sx){var pg=$('#spg',sx);if(!pg)return;pg.querySelectorAll('input[type=range]').forEach(upgradeRange)}

/* ================= Nex Island: position, size, drag ================= */
function isl(){return doc.getElementById('nxd')}
function topV(){var n=parseInt(g('aur.isl.top','8'),10);return isFinite(n)?n:8}
function dxV(){var n=parseInt(g('aur.isl.dx','0'),10);return isFinite(n)?n:0}
function applyPos(){root.style.setProperty('--nxd-top',topV()+'px');root.style.setProperty('--nxd-dx',dxV()+'px')}
function dragOn(){return g('aur.isl.drag','1')==='1'}
function applyDrag(){root.classList.toggle('nxd-drag',dragOn())}
function rowHtml(id,label,mn,mx,st){return'<label for="'+id+'">'+label+'</label><input id="'+id+'" type="range" min="'+mn+'" max="'+mx+'" step="'+st+'"><output for="'+id+'"></output>'}
function installIsland(sx){var pg=$('#spg',sx);if(!pg)return;var h=$('h3',pg),t=h&&h.textContent.trim().toLowerCase();if(t!=='nex island'&&t!=='island')return;
 var box=$('.nxd-set',pg);if(!box||$('.nxl-row',box))return;var size=$('.nx-island-size',box);if(!size)return;
 var maxTop=Math.max(40,Math.min(300,innerHeight-70)),maxDx=Math.max(60,Math.floor((innerWidth/2-70)/4)*4);
 var vr=doc.createElement('div'),hr=doc.createElement('div'),dr=doc.createElement('div'),bt=doc.createElement('div');
 vr.className='nxl-row';vr.innerHTML=rowHtml('nxlTop','Vertical position',0,maxTop,2);
 hr.className='nxl-row';hr.innerHTML=rowHtml('nxlDx','Horizontal position',-maxDx,maxDx,4);
 dr.className='nxd-row nxl-drag';dr.innerHTML='<span>Move the island by dragging it</span><div class="seg"><button data-nxl="drag:1" class="'+(dragOn()?'sel':'')+'">On</button><button data-nxl="drag:0" class="'+(dragOn()?'':'sel')+'">Off</button></div>';
 bt.className='nxl-btns';bt.innerHTML='<button class="pgb" data-nxl="reset" style="margin-top:0">Reset size &amp; position</button>';
 size.after(vr);vr.after(hr);hr.after(dr);dr.after(bt);
 var ti=$('input',vr),to=$('output',vr),di=$('input',hr),dout=$('output',hr);
 function sync(){ti.value=Math.min(maxTop,Math.max(0,topV()));to.textContent=ti.value+' px';di.value=Math.max(-maxDx,Math.min(maxDx,dxV()));dout.textContent=(di.value>0?'+':'')+di.value+' px';if(ti._nxr)paint(ti,ti._nxr);if(di._nxr)paint(di,di._nxr)}
 sync();
 ti.addEventListener('input',function(){put('aur.isl.top',ti.value);applyPos();to.textContent=ti.value+' px'});
 di.addEventListener('input',function(){put('aur.isl.dx',di.value);applyPos();dout.textContent=(di.value>0?'+':'')+di.value+' px'});
 box._nxlSync=sync}
doc.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-nxl]');
 if(b){var v=b.getAttribute('data-nxl');e.stopPropagation();e.preventDefault();
  if(v==='reset'){put('aur.isl.top','8');put('aur.isl.dx','0');put('aur.isl.scale','100');applyPos();var el=isl();if(el)el.style.scale=1;
   var si=$('#nxIslandScale');if(si){si.value=100;si.dispatchEvent(new Event('input',{bubbles:true}));var o=si.parentNode&&si.parentNode.querySelector('output');if(o)o.textContent='100%'}
   var bx=$('#spg .nxd-set');if(bx&&bx._nxlSync)bx._nxlSync()}
  else if(v.indexOf('drag:')===0){put('aur.isl.drag',v.slice(5));applyDrag();b.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('sel',x===b)})}
  return}
 var p=e.target.closest&&e.target.closest('[data-nxd^="top:"]');if(p)setTimeout(function(){applyPos();var bx=$('#spg .nxd-set');if(bx&&bx._nxlSync)bx._nxlSync()},60)},true);
/* drag the island itself */
var D=null,lastDrag=0;
doc.addEventListener('pointerdown',function(e){if(!dragOn()||(e.button>0&&e.pointerType==='mouse'))return;var el=isl();if(!el||!e.target.closest||!e.target.closest('#nxd'))return;
 if(e.target.closest('button,input,select,textarea,a,[data-nxdc],[data-nxdq],[data-nxdp]'))return;
 D={id:e.pointerId,x:e.clientX,y:e.clientY,top:topV(),dx:dxV(),on:false,el:el}},true);
doc.addEventListener('pointermove',function(e){if(!D||e.pointerId!==D.id)return;var mx=e.clientX-D.x,my=e.clientY-D.y;
 if(!D.on){if(Math.abs(mx)+Math.abs(my)<10)return;D.on=true;D.el.classList.add('nxd-moving')}
 var top=Math.max(0,Math.min(innerHeight-60,Math.round(D.top+my))),lim=Math.round(innerWidth/2-50),dx=Math.max(-lim,Math.min(lim,Math.round(D.dx+mx)));
 root.style.setProperty('--nxd-top',top+'px');root.style.setProperty('--nxd-dx',dx+'px');D.t=top;D.d=dx;e.preventDefault()},true);
['pointerup','pointercancel'].forEach(function(t){doc.addEventListener(t,function(e){if(!D||e.pointerId!==D.id)return;
 if(D.on){D.el.classList.remove('nxd-moving');put('aur.isl.top',String(D.t));put('aur.isl.dx',String(D.d));lastDrag=Date.now();var bx=$('#spg .nxd-set');if(bx&&bx._nxlSync)bx._nxlSync();
  try{if(window.NXISLAND&&NXISLAND.decide)NXISLAND.decide()}catch(x){}}
 D=null},true)});
doc.addEventListener('click',function(e){if(Date.now()-lastDrag<450&&e.target.closest&&e.target.closest('#nxd')){e.stopPropagation();e.preventDefault()}},true);

/* ================= wiring ================= */
var raf=0,obs=null;
function run(late){var sx=$('.sx');if(!sx)return;css();profile(sx);header(sx,late);switches(sx);sliders(sx);installIsland(sx)}
function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;run(false)})}
function watch(){var sx=$('.sx');if(!sx||sx._sx5)return;sx._sx5=1;run(false);setTimeout(function(){run(true)},350);
 new MutationObserver(function(){schedule();clearTimeout(watch._t);watch._t=setTimeout(function(){run(true)},350)}).observe(sx,{childList:true,subtree:true})}
css();applyPos();applyDrag();
new MutationObserver(function(){if($('.sx'))watch()}).observe(doc.body,{childList:true,subtree:true});
watch();
})();
