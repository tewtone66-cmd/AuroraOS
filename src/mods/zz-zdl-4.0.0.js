/* DL-4.0.0 - Downloads: Nex Island download view (fly-in animation, live progress, Open + Downloads buttons), Downloads window, NXDL engine used by Nex Store.
   Needs zz-island-3.9.0.js (loads before this file). Uses the native browser events 'download' and 'dlprogress' of AuroraBrowserPlugin. */
(function(){'use strict';
var doc=document;
function g(k,d){var v;try{if(typeof ls==='function')v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{if(typeof ls==='function')ls(k,v)}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function calm(){var b=doc.body.classList;return b.contains('perf')||b.contains('rm')}
function fb(n){n=+n||0;if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(0)+' KB';if(n<1073741824)return(n/1048576).toFixed(n<10485760?1:0)+' MB';return(n/1073741824).toFixed(2)+' GB'}
function fsp(v){return v>0?fb(v)+'/s':'0 KB/s'}
function fe(s){if(!isFinite(s)||s<=0)return'';s=Math.round(s);if(s<60)return s+'s left';if(s<3600)return Math.floor(s/60)+'m '+(s%60)+'s left';return Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m left'}
function ago(t){if(!t)return'';var s=(Date.now()-t)/1000;return s<45?'Just now':s<3600?Math.max(1,Math.round(s/60))+' min ago':s<86400?Math.round(s/3600)+' h ago':new Date(t).toLocaleDateString()}
function sv(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||2)+'" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
var I={down:sv('<path d="M12 4.5v11M7.6 11.2L12 15.6l4.4-4.4M5.5 19.5h13"/>',2.2),list:sv('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),folder:sv('<path d="M3.5 7.5a2 2 0 012-2h4l2 2.2h7a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/>'),x:sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),search:sv('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),open:sv('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),bin:sv('<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12h8.4L17 7"/>')};
/* ---------- file type tiles ---------- */
var CATS=[[/^(exe|msi|apk|bat|cmd|appimage)$/,'#2dd4a0'],[/^(zip|rar|7z|tar|gz|xz|bz2)$/,'#fbbf24'],[/^(png|jpe?g|gif|webp|bmp|svg|avif|heic|ico)$/,'#fb923c'],[/^(mp3|wav|ogg|flac|m4a|aac|opus)$/,'#f472b6'],[/^(mp4|mkv|webm|avi|mov|3gp)$/,'#a78bfa'],[/^pdf$/,'#f87171'],[/^(txt|md|doc|docx|rtf|csv|xls|xlsx|json|html?|js|css|xml|log)$/,'#60a5fa']];
function extOf(n){var m=/\.([a-z0-9]{1,8})$/i.exec(n||'');return m?m[1].toLowerCase():''}
function ftile(name){var e=extOf(name),c='#94a3b8';for(var i=0;i<CATS.length;i++)if(CATS[i][0].test(e)){c=CATS[i][1];break}
 return'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill="'+c+'"/><path d="M0 11A11 11 0 0111 0h18a11 11 0 0111 11v9H0z" fill="#fff" opacity=".18"/><text x="20" y="25" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="'+(e.length>3?9:11)+'" fill="#fff">'+esc((e||'file').toUpperCase().slice(0,4))+'</text></svg>'}
/* ---------- data ---------- */
var L=[];try{L=JSON.parse(g('aur.dl.hist','[]'))||[]}catch(e){L=[]}
L.forEach(function(x){if(x.state==='run'){x.state='failed';x.err='Interrupted'}});
function save(){try{put('aur.dl.hist',JSON.stringify(L.slice(0,80)))}catch(e){}}
var subs=[];function emit(it){subs.slice().forEach(function(f){try{f(it)}catch(e){}})}
function active(){return L.filter(function(x){return x.state==='run'})}
var EXPECT=[],seq=0;
function NBp(){return window.NB||(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.AuroraBrowser)||null}
function closeTab(id){try{var nb=NBp();if(nb&&nb.close&&id)nb.close({id:id}).catch(function(){})}catch(e){}}
/* ---------- opening files / folders / apps (argument names are read from the target app, so this follows the app's own code) ---------- */
function argKeys(id){try{var f=A[id]&&A[id].f;if(!f)return[];var s=Function.prototype.toString.call(f),m=/^\s*(?:async\s*)?(?:function\s*[\w$]*\s*)?\(?\s*[\w$]+\s*,\s*([\w$]+)/.exec(s);if(!m)return[];var re=new RegExp('\\b'+m[1].replace(/\$/g,'\\$')+'\\.([A-Za-z_]\\w*)','g'),o=[],x;while((x=re.exec(s)))if(o.indexOf(x[1])<0)o.push(x[1]);return o}catch(e){return[]}}
function launch(id,val,pref){if(!A[id])return null;var keys=argKeys(id),want=pref||['path','file','exe','src','url','p','f'],o={},hit=0;
 want.forEach(function(k){if(keys.indexOf(k)>=0){o[k]=val;hit=1}});if(!hit)o[want[0]]=val;try{return openApp(id,o)}catch(e){return null}}
function appId(rx,names){var ks=Object.keys(A),i;for(i=0;i<names.length;i++)if(A[names[i]])return names[i];for(i=0;i<ks.length;i++)if(rx.test((A[ks[i]].n||'')+' '+ks[i]))return ks[i];return null}
function nfo(){return typeof NF!=='undefined'?NF:null}
function openFile(p){if(!p)return;var e=extOf(p),n=nfo(),id;
 try{
 if(/^(exe|msi)$/.test(e)&&(id=appId(/^$/,['exe']))){launch(id,p,['path','exe','file']);return}
 if(/^(bat|cmd)$/.test(e)&&A.term){openApp('term',{bat:p});return}
 if(/^(zip|rar|7z|tar|gz)$/.test(e)&&A.zip){launch('zip',p);return}
 if(/^(png|jpe?g|gif|webp|bmp|avif)$/.test(e)&&A.photos){launch('photos',p);return}
 if(/^(mp3|wav|ogg|flac|m4a|aac|opus)$/.test(e)&&A.music){launch('music',p);return}
 if(/^(mp4|mkv|webm|mov|3gp)$/.test(e)&&A.media){launch('media',p);return}
 if(/^(txt|md|json|js|css|html?|xml|log|csv)$/.test(e)&&A.code){launch('code',p);return}
 }catch(x){}
 if(n&&n.open){n.open({path:p}).catch(function(){try{toast('Could not open this file')}catch(x){}})}else{try{toast('Saved to Downloads')}catch(x){}}}
function openFolder(p){var dir=p?p.slice(0,p.lastIndexOf('/')):null,id=appId(/file|explor/i,['files','explorer','fm']);
 if(id&&dir){launch(id,dir,['path','dir','start','cwd','p']);return}if(id)openApp(id)}
/* ---------- island view ---------- */
var isl=doc.getElementById('nxd'),D={on:false,view:'dl',item:null,t:0};
function islOn(){return !!isl&&g('aur.isl.mode','auto')!=='off'}
function notice(title,text,type){try{if(window.NXN)window.NXN.notify({type:type||'downloads',app:'Downloads',title:title,text:text,onClick:function(){openApp(DLID)}})}catch(e){}}
function q(s){return isl.querySelector(s)}
if(isl){
 isl.insertAdjacentHTML('beforeend','<div class="nxd-v v-dl run"><div class="dl-ic"><svg class="dl-ring" viewBox="0 0 52 52"><circle class="bg" cx="26" cy="26" r="23"/><circle class="fg" cx="26" cy="26" r="23"/></svg><span class="dl-ft"></span></div><div class="dl-bd"><b class="dl-t"></b><span class="dl-s"></span><div class="dl-bar"><i></i></div></div><div class="dl-bt"><button data-nxdl="open" class="grn">Open</button><button data-nxdl="list" class="ico" aria-label="Open Downloads">'+I.list+'</button></div></div>'+
 '<div class="nxd-v v-dlm"><svg class="dm-ring" viewBox="0 0 24 24"><circle class="bg" cx="12" cy="12" r="9.5"/><circle class="fg" cx="12" cy="12" r="9.5"/></svg><span class="dm-a">'+I.down+'</span><b class="dm-p">0%</b></div>')}
var CSS=[
'.nxd[data-v=dl]{width:min(376px,calc(100vw - 20px));height:100px;border-radius:34px}',
'.nxd[data-v=dlm]{width:148px;height:36px;border-radius:18px}',
'.nxd[data-v=dl] .v-dl,.nxd[data-v=dlm] .v-dlm{opacity:1;transform:none;filter:none;pointer-events:auto;transition-delay:.1s}',
'.v-dl{align-items:center;gap:13px;padding:0 14px 0 16px}',
'.dl-ic{position:relative;width:54px;height:54px;flex:none}.dl-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}',
'.dl-ring circle,.dm-ring circle{fill:none;stroke-width:3.2}.dl-ring .bg,.dm-ring .bg{stroke:rgba(255,255,255,.16)}',
'.dl-ring .fg{stroke:#32d74b;stroke-linecap:round;stroke-dasharray:144.5;stroke-dashoffset:144.5;transition:stroke-dashoffset .45s linear,stroke .3s}',
'.v-dl.ind .dl-ring{animation:dlSpin 1.1s linear infinite}.v-dl.ind .dl-ring .fg{stroke-dashoffset:105!important}@keyframes dlSpin{to{transform:rotate(270deg)}}',
'.dl-ft{position:absolute;inset:8px;display:block}.dl-ft svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}',
'.dl-bd{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.dl-t{font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dl-s{font-size:12px;color:rgba(255,255,255,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.dl-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.16);overflow:hidden;margin-top:5px}.dl-bar i{display:block;height:100%;width:0;border-radius:2px;background:linear-gradient(90deg,#32d74b,#8dffae);transition:width .45s linear}',
'.v-dl.done .dl-bar,.v-dl.bad .dl-bar{display:none}.v-dl.run .grn,.v-dl.bad .grn{display:none}',
'.v-dl.bad .dl-ring .fg{stroke:#ff453a;stroke-dashoffset:0}.v-dl.done .dl-ring .fg{stroke-dashoffset:0}.v-dl.bad .dl-s{color:#ff8a80}',
'.dl-bt{display:flex;flex-direction:column;gap:6px;align-items:stretch}.nxd .dl-bt button{padding:7px 15px}.nxd .dl-bt button.grn{background:#32d74b;color:#04210d}.nxd .dl-bt button.ico{display:grid;place-items:center;padding:0;height:32px}.dl-bt .ico svg{width:17px;height:17px}',
'.v-dlm{align-items:center;justify-content:center;gap:9px;padding:0 12px}.dm-ring{width:22px;height:22px;transform:rotate(-90deg);flex:none}.dm-ring .fg{stroke:#32d74b;stroke-linecap:round;stroke-dasharray:59.7;stroke-dashoffset:59.7;transition:stroke-dashoffset .45s linear}',
'.dm-a{width:16px;height:16px;display:grid;place-items:center;color:#32d74b;animation:dlBob 1.1s ease-in-out infinite}.dm-a svg{width:16px;height:16px}@keyframes dlBob{50%{transform:translateY(2px)}}.dm-p{font:600 13px ui-monospace,monospace;min-width:34px}',
'.nxd.dl-pop{animation:dlPop .75s ease-out}@keyframes dlPop{0%{box-shadow:0 0 0 0 rgba(50,215,75,.6),0 10px 30px rgba(0,0,0,.35)}100%{box-shadow:0 0 0 22px rgba(50,215,75,0),0 10px 30px rgba(0,0,0,.35)}}',
'.nxd.dl-bad.dl-pop{animation-name:dlPopBad}@keyframes dlPopBad{0%{box-shadow:0 0 0 0 rgba(255,69,58,.55)}100%{box-shadow:0 0 0 22px rgba(255,69,58,0)}}',
'.nxdl-fly{position:fixed;width:0;height:0;z-index:2147483300;pointer-events:none}.nxdl-fly .fi{position:absolute;left:-20px;top:-20px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#05240f;background:radial-gradient(circle at 30% 25%,#9dffbb,#1db35b);box-shadow:0 8px 26px rgba(29,179,91,.6),inset 0 1px 0 rgba(255,255,255,.55)}.nxdl-fly .fi svg{width:22px;height:22px}',
/* ---------- Downloads window ---------- */
'.dlw{--ok:#2fd16b;--bad:#ff5d6c;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--txt);font-size:13px;position:relative;overflow:hidden}',
'.dlw *{box-sizing:border-box}.dlw button,.dlw input{font:inherit;color:inherit}',
'.dlw-h{display:flex;align-items:center;flex-wrap:wrap;gap:10px 14px;padding:14px 16px 10px}.dlw-t{display:flex;align-items:center;gap:12px;flex:1 1 200px;min-width:0}',
'.dlw-ico{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none;color:#04210d;background:linear-gradient(160deg,#9dffbb,#1db35b);box-shadow:0 6px 16px rgba(29,179,91,.35),inset 0 1px 0 rgba(255,255,255,.5)}.dlw-ico svg{width:23px;height:23px}',
'.dlw-t b{display:block;font-size:18px;font-weight:650}.dlw-t span{color:var(--mut);font-size:12px}',
'.dlw-q{position:relative;flex:0 1 220px;min-width:130px}.dlw-q svg{position:absolute;left:10px;top:50%;margin-top:-8px;width:16px;height:16px;color:var(--mut);pointer-events:none}',
'.dlw-q input{width:100%;border:1px solid var(--line);background:var(--surf2);border-radius:11px;padding:8px 10px 8px 33px;outline:0;transition:border-color .2s,box-shadow .2s;-webkit-user-select:text;user-select:text}.dlw-q input:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--selbg)}',
'.dlw-ac{display:flex;gap:6px}.dlw-b{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surf2);border-radius:10px;padding:7px 12px;cursor:pointer;transition:background-color .2s,transform .12s}.dlw-b:hover{background:var(--hov)}.dlw-b:active{transform:scale(.95)}.dlw-b svg{width:15px;height:15px}',
'.dlw-sc{flex:1;min-height:0;overflow:auto;padding:0 16px 18px}',
'.dlw-sec h4{margin:14px 2px 8px;font-size:11.5px;font-weight:650;letter-spacing:.5px;text-transform:uppercase;color:var(--mut)}.dlw-sec[hidden]{display:none}',
'.dlw-ls{display:flex;flex-direction:column;gap:8px}',
'.dlr{position:relative;display:flex;align-items:center;gap:13px;padding:11px 12px;border-radius:16px;background:var(--surf2);border:1px solid var(--line);overflow:hidden;transition:background-color .2s,border-color .3s}',
'.dlr:hover{background:var(--hov)}.dlr.in{animation:dlrIn .5s cubic-bezier(.2,.9,.3,1.1) backwards}@keyframes dlrIn{from{opacity:0;transform:translateY(14px) scale(.97)}}',
'.dlr .ti{width:42px;height:42px;flex:none}.dlr .ti svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))}',
'.dlr .bd{flex:1;min-width:0}.dlr .n{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dlr .s{display:block;color:var(--mut);font-size:12px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.dlr .tg{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.3px;color:#fff;background:linear-gradient(135deg,#ff8fc8,#c94be0);vertical-align:1px}',
'.dlr .bar{height:5px;border-radius:3px;background:var(--line);overflow:hidden;margin-top:8px;display:none}.dlr[data-st=run] .bar{display:block}',
'.dlr .bar i{display:block;height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,#1db35b,#7dffa0);background-size:24px 24px;transition:width .45s linear;position:relative}',
'.dlr .bar i:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-100%);animation:dlSh 1.4s ease-in-out infinite}@keyframes dlSh{to{transform:translateX(100%)}}',
'.dlr.ind .bar i{width:35%!important;animation:dlInd 1.2s ease-in-out infinite alternate}@keyframes dlInd{from{margin-left:0}to{margin-left:65%}}',
'.dlr .ac{display:flex;gap:6px;flex:none}.dlr .ac button{display:grid;place-items:center;height:34px;min-width:34px;border:0;border-radius:11px;background:var(--hov);cursor:pointer;padding:0 10px;transition:transform .12s,background-color .2s}.dlr .ac button:hover{background:var(--selbg)}.dlr .ac button:active{transform:scale(.9)}.dlr .ac svg{width:17px;height:17px}',
'.dlr .ac [data-a=open]{background:var(--ok);color:#04210d;font-weight:650}.dlr[data-st=run] .ac [data-a=open],.dlr[data-st=run] .ac [data-a=dir],.dlr[data-st=failed] .ac [data-a=open],.dlr[data-st=failed] .ac [data-a=dir]{display:none}',
'.dlr[data-st=failed] .s{color:var(--bad)}.dlr[data-st=done].fin:before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent,rgba(47,209,107,.28),transparent);transform:translateX(-100%);animation:dlFin .9s ease-out forwards;pointer-events:none}@keyframes dlFin{to{transform:translateX(100%)}}',
'.dlw-em{display:flex;flex-direction:column;align-items:center;gap:10px;padding:56px 10px;color:var(--mut);text-align:center}.dlw-em[hidden]{display:none}.dlw-em svg{width:84px;height:84px;color:var(--acc);opacity:.85;animation:dlBob2 3s ease-in-out infinite}@keyframes dlBob2{50%{transform:translateY(-6px)}}',
'.dlw[data-w=xs] .dlr{flex-wrap:wrap}.dlw[data-w=xs] .dlr .ac{width:100%;justify-content:flex-end}.dlw[data-w=xs] .dlw-q{flex:1 1 100%}',
':root[data-skin=glass] .dlr,:root[data-skin=glass] .dlw-b,:root[data-skin=glass] .dlw-q input{box-shadow:inset 0 0 0 1px var(--gl-edge,rgba(255,255,255,.18))}',
'body.perf .dlr *,body.rm .dlr *{animation-duration:.01s!important}'
].join('\n');
var sty=doc.createElement('style');sty.id='nx-dl-css';sty.textContent=CSS;doc.head.appendChild(sty);
/* ---------- island logic ---------- */
function pick(){var a=active();return D.item&&D.item.state==='run'?D.item:(a[0]||D.item)}
function paint(){if(!isl||!D.on)return;var it=pick();if(!it)return;D.item=it;var run=it.state==='run',pct=it.total>0?Math.min(1,it.got/it.total):0,ind=run&&!(it.total>0),more=active().length-(run?1:0);
 var box=q('.v-dl');box.classList.remove('run','done','bad','ind');box.classList.add(run?'run':it.state==='done'?'done':'bad');if(ind)box.classList.add('ind');
 isl.classList.toggle('dl-bad',it.state==='failed');
 var ft=q('.dl-ft');if(ft.getAttribute('data-k')!==it.name){ft.setAttribute('data-k',it.name);ft.innerHTML=ftile(it.name)}
 q('.dl-t').textContent=it.name;
 var s=run?fb(it.got)+(it.total>0?' of '+fb(it.total):'')+' \u00b7 '+fsp(it.spd)+(fe(it.eta)?' \u00b7 '+fe(it.eta):''):it.state==='done'?'Download complete \u00b7 '+fb(it.total||it.got):(it.err||'Download failed');
 if(more>0)s+=' \u00b7 +'+more+' more';q('.dl-s').textContent=s;
 q('.dl-ring .fg').style.strokeDashoffset=String(144.5*(1-(run?pct:1)));q('.dl-bar i').style.width=(pct*100).toFixed(1)+'%';
 q('.dm-ring .fg').style.strokeDashoffset=String(59.7*(1-pct));q('.dm-p').textContent=it.total>0?Math.round(pct*100)+'%':fb(it.got);
 var okb=q('[data-nxdl=open]');okb.style.display=it.state==='done'&&it.path?'':'none'}
function apply(){if(!D.on)return;if(isl.getAttribute('data-v')!==D.view)isl.setAttribute('data-v',D.view);if(isl.getAttribute('data-show')!=='1')isl.setAttribute('data-show','1')}
function show(v,ms){D.on=true;D.view=v;clearTimeout(D.t);paint();apply();if(ms)D.t=setTimeout(function(){if(active().length)show('dlm');else end()},ms)}
function end(){D.on=false;clearTimeout(D.t);isl.classList.remove('dl-bad');doc.dispatchEvent(new Event('visibilitychange'))}
if(isl)new MutationObserver(function(){if(!D.on)return;var v=isl.getAttribute('data-v'),s=isl.getAttribute('data-show');if(v==='alarm'&&s==='1')return;if(v!==D.view||s!=='1')apply()}).observe(isl,{attributes:true,attributeFilter:['data-v','data-show']});
function origin(){var best=null;try{Object.keys(W).forEach(function(k){var w=W[k];if(!w||!w.el||w.el.classList.contains('min'))return;var n=String(w.app||'')+' '+((A[w.app]||{}).n||'');if(/brows/i.test(n))best=w})}catch(e){}
 if(best){var r=best.el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height*.55}}return{x:innerWidth/2,y:innerHeight*.62}}
function fly(cb){if(!isl||calm()||!doc.body.animate){cb();return}
 var o=origin(),tx=innerWidth/2,ty=(parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--nxd-top'))||8)+18,dx=tx-o.x,dy=ty-o.y,n=3,done=0;
 for(var i=0;i<n;i++)(function(i){var out=doc.createElement('div');out.className='nxdl-fly';out.style.left=o.x+'px';out.style.top=o.y+'px';var inn=doc.createElement('div');inn.className='fi';inn.innerHTML=I.down;out.appendChild(inn);doc.body.appendChild(out);
  var sc=1-i*.2,op=1-i*.34,delay=i*75,dur=780;
  out.animate([{transform:'translateX(0)'},{transform:'translateX('+dx+'px)'}],{duration:dur,delay:delay,easing:'cubic-bezier(.45,.05,.35,1)',fill:'both'});
  var a=inn.animate([{transform:'translateY(0) scale(1)',opacity:0},{opacity:op,offset:.12},{transform:'translateY('+dy+'px) scale('+(.5*sc)+')',opacity:op*.9}],{duration:dur,delay:delay,easing:'cubic-bezier(.55,-.25,.75,.55)',fill:'both'});
  a.onfinish=function(){out.remove();if(++done===n){isl.classList.add('dl-pop');setTimeout(function(){isl.classList.remove('dl-pop')},760);cb()}}})(i)}
function started(it){if(!islOn()){notice('Download started',it.name);return}D.item=it;fly(function(){D.item=pick()||it;show('dl',5600)})}
function finished(it){if(!islOn()){notice(it.state==='done'?'Download complete':'Download failed',it.name+(it.state==='failed'&&it.err?' - '+it.err:''),it.state==='done'?'downloads':'error');return}D.item=it;show('dl',7000)}
if(isl)isl.addEventListener('click',function(e){var v=isl.getAttribute('data-v');if(!D.on||(v!=='dl'&&v!=='dlm'))return;var b=e.target.closest('[data-nxdl]');
 if(b){e.stopPropagation();var a=b.getAttribute('data-nxdl');if(a==='list'){openApp(DLID);if(!active().length)end()}else if(a==='open'&&D.item){openFile(D.item.path);end()}return}
 if(v==='dlm')show('dl',6500);else if(active().length)show('dlm');else end()});
/* ---------- events from the native browser ---------- */
function onDl(o){var ex=EXPECT.length?EXPECT.shift():null;if(ex){clearTimeout(ex.to);closeTab(ex.tab)}
 var base={t0:Date.now(),got:0,total:0,spd:0,src:ex?ex.src:'browser',meta:ex?ex.meta:null,url:ex?ex.url:'',_t:Date.now(),_g:0};
 if(!o||!o.ok){var f=Object.assign(base,{id:'f'+Date.now(),name:(o&&o.name)||'Download',state:'failed',err:(o&&o.error)||'Download failed',t1:Date.now()});L.unshift(f);save();emit(f);if(ex&&ex.rej)ex.rej(new Error(f.err));finished(f);return}
 var it=Object.assign(base,{id:String(o.id),name:o.name||'download',state:'run'});if(ex){it.res=ex.res;it.rej=ex.rej}
 L.unshift(it);save();emit(it);started(it)}
function onProg(o){var it=null,i;for(i=0;i<L.length;i++)if(L[i].id===String(o.id)){it=L[i];break}if(!it)return;
 var now=Date.now(),got=+o.got||0,tot=+o.total||0;if(tot>0)it.total=tot;
 var dt=(now-it._t)/1000;if(dt>.15){var inst=(got-it._g)/dt;it.spd=it.spd?it.spd*.6+inst*.4:inst;it._t=now;it._g=got}it.got=got;it.eta=it.spd>0&&it.total>0?(it.total-got)/it.spd:0;
 if(o.state==='done'){it.state='done';it.path=o.path||it.path;it.got=it.total||got;it.t1=now;it.spd=0;save();emit(it);if(it.res)it.res(it);finished(it)}
 else if(o.state==='failed'){it.state='failed';it.err=it.err||'The download failed';it.t1=now;save();emit(it);if(it.rej)it.rej(new Error(it.err));finished(it)}
 else{emit(it);paint()}}
(function hook(){var nb=NBp();if(!nb||!nb.addListener)return;try{nb.addListener('download',onDl);nb.addListener('dlprogress',onProg)}catch(e){}})();
/* ---------- NXDL engine (used by Nex Store): starts a download through a hidden native tab, so it goes through the same DownloadManager path ---------- */
function viaFetch(url,o,res,rej){var it={id:'w'+Date.now(),name:o.name||decodeURIComponent((url.split('?')[0].split('/').pop())||'download'),state:'run',t0:Date.now(),got:0,total:0,spd:0,src:o.src||'app',meta:o.meta||null,url:url,_t:Date.now(),_g:0};L.unshift(it);emit(it);started(it);
 fetch(url).then(function(r){if(!r.ok)throw new Error('Server answered '+r.status);it.total=+r.headers.get('content-length')||0;if(!r.body||!r.body.getReader)return r.blob();var rd=r.body.getReader(),ch=[];function pump(){return rd.read().then(function(x){if(x.done)return new Blob(ch);ch.push(x.value);var now=Date.now(),dt=(now-it._t)/1000;it.got+=x.value.length;if(dt>.2){it.spd=(it.got-it._g)/dt;it._t=now;it._g=it.got;emit(it);paint()}return pump()})}return pump()})
 .then(function(b){var a=doc.createElement('a');a.href=URL.createObjectURL(b);a.download=it.name;doc.body.appendChild(a);a.click();setTimeout(function(){a.remove()},500);it.state='done';it.t1=Date.now();it.total=it.total||b.size;it.got=it.total;it.spd=0;save();emit(it);if(res)res(it);finished(it)})
 .catch(function(e){it.state='failed';it.err=(e&&e.message)||'Download failed';it.t1=Date.now();save();emit(it);if(rej)rej(new Error(it.err));finished(it)})}
function start(url,o){o=o||{};return new Promise(function(res,rej){var nb=NBp();
 if(nb&&nb.create&&nb.addListener){var tab='nxdl'+(++seq),ex={src:o.src||'app',meta:o.meta||null,res:res,rej:rej,tab:tab,url:url};EXPECT.push(ex);
  ex.to=setTimeout(function(){var i=EXPECT.indexOf(ex);if(i>=0){EXPECT.splice(i,1);closeTab(tab);rej(new Error('The download did not start. Check your connection.'))}},30000);
  nb.create({id:tab,url:url,vw:0,z:100,zx:true}).catch(function(e){var i=EXPECT.indexOf(ex);if(i>=0)EXPECT.splice(i,1);clearTimeout(ex.to);rej(new Error((e&&e.message)||'Could not start the download'))})}
 else viaFetch(url,o,res,rej)})}
/* ---------- Downloads window ---------- */
var ARROWBIG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11M7.6 10.4L12 14.8l4.4-4.4"/><path d="M4 14.5v3a2.5 2.5 0 002.5 2.5h11a2.5 2.5 0 002.5-2.5v-3"/></svg>';
function appDl(w){var B=w.body;
 B.innerHTML='<div class="dlw" data-w="lg"><div class="dlw-h"><div class="dlw-t"><div class="dlw-ico">'+I.down+'</div><div><b>Downloads</b><span class="sub"></span></div></div><label class="dlw-q">'+I.search+'<input placeholder="Search downloads" spellcheck="false" autocomplete="off"></label><div class="dlw-ac"><button class="dlw-b" data-a="folder">'+I.folder+'<span>Open folder</span></button><button class="dlw-b" data-a="clear">'+I.bin+'<span>Clear</span></button></div></div>'+
 '<div class="dlw-sc"><div class="dlw-sec" data-s="run"><h4>In progress</h4><div class="dlw-ls"></div></div><div class="dlw-sec" data-s="done"><h4>Recent</h4><div class="dlw-ls"></div></div><div class="dlw-em">'+ARROWBIG+'<b>No downloads yet</b><span>Files you download from the browser or Nex Store show up here.</span></div></div></div>';
 var root=B.firstChild,inp=root.querySelector('input'),sub=root.querySelector('.sub'),secR=root.querySelector('[data-s=run]'),secD=root.querySelector('[data-s=done]'),lsR=secR.querySelector('.dlw-ls'),lsD=secD.querySelector('.dlw-ls'),em=root.querySelector('.dlw-em'),rows={},raf=0;
 function leave(r){if(!r.animate||calm()){r.remove();return}var h=r.offsetHeight;r.style.pointerEvents='none';r.animate([{height:h+'px',opacity:1,transform:'none'},{height:'0px',opacity:0,transform:'translateX(40px)',paddingTop:'0px',paddingBottom:'0px',marginTop:'-8px'}],{duration:300,easing:'cubic-bezier(.5,0,.75,.4)',fill:'forwards'}).onfinish=function(){r.remove()}}
 function mk(it){var r=doc.createElement('div');r.className='dlr in';r.dataset.id=it.id;r.innerHTML='<div class="ti"></div><div class="bd"><span class="n"></span><span class="s"></span><div class="bar"><i></i></div></div><div class="ac"><button data-a="open">Open</button><button data-a="dir" title="Show in folder">'+I.folder+'</button><button data-a="rm" title="Remove">'+I.x+'</button></div>';return r}
 function fill(r,it){var pct=it.total>0?Math.min(1,it.got/it.total):0,k=[it.state,it.name,Math.round(pct*500),Math.round((it.spd||0)/2048),it.err,it.src].join('|');if(r._k===k)return;
  if(r._st==='run'&&it.state==='done'&&!calm()){r.classList.add('fin');setTimeout(function(){r.classList.remove('fin')},1000)}r._st=it.state;r._k=k;r.setAttribute('data-st',it.state);r.classList.toggle('ind',it.state==='run'&&!(it.total>0));
  var t=r.querySelector('.ti');if(t.getAttribute('data-k')!==it.name){t.setAttribute('data-k',it.name);t.innerHTML=ftile(it.name)}
  r.querySelector('.n').innerHTML=esc(it.name)+(it.src==='store'?'<span class="tg">NEX STORE</span>':'');
  var s=it.state==='run'?fb(it.got)+(it.total>0?' of '+fb(it.total):'')+' \u00b7 '+fsp(it.spd)+(fe(it.eta)?' \u00b7 '+fe(it.eta):''):it.state==='done'?fb(it.total||it.got)+' \u00b7 '+ago(it.t1):(it.err||'Download failed')+' \u00b7 '+ago(it.t1);
  r.querySelector('.s').textContent=s;r.querySelector('.bar i').style.width=(pct*100).toFixed(1)+'%'}
 function sync(host,items){var want={};items.forEach(function(it,i){want[it.id]=1;var r=rows[it.id];if(!r||r.parentNode!==host){if(r&&r.parentNode&&r.parentNode!==host)leave(r);r=mk(it);rows[it.id]=r}
  fill(r,it);if(host.children[i]!==r)host.insertBefore(r,host.children[i]||null)});
  Object.keys(rows).forEach(function(id){var r=rows[id];if(!want[id]&&r.parentNode===host){leave(r);delete rows[id]}})}
 function render(){raf=0;var qv=inp.value.trim().toLowerCase(),run=[],done=[];L.forEach(function(it){if(qv&&it.name.toLowerCase().indexOf(qv)<0)return;(it.state==='run'?run:done).push(it)});
  sync(lsR,run);sync(lsD,done);secR.hidden=!run.length;secD.hidden=!done.length;em.hidden=!!(run.length||done.length);
  var n=active().length;sub.textContent=n?n+' in progress':L.length?L.length+' item'+(L.length>1?'s':''):'Nothing yet'}
 function sched(){if(!raf)raf=requestAnimationFrame(render)}
 var fn=function(){sched()};subs.push(fn);inp.addEventListener('input',sched);
 root.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,r=b.closest('.dlr'),it=r&&L.filter(function(x){return x.id===r.dataset.id})[0];
  if(a==='folder'){var d=L.filter(function(x){return x.path})[0];openFolder(d?d.path:null)}
  else if(a==='clear'){L=L.filter(function(x){return x.state==='run'});save();sched()}
  else if(a==='open'&&it)openFile(it.path);else if(a==='dir'&&it)openFolder(it.path);
  else if(a==='rm'&&it){L=L.filter(function(x){return x!==it});save();sched()}});
 function tier(){var wd=root.clientWidth;root.dataset.w=wd<520?'xs':wd<760?'md':'lg'}
 var ro=window.ResizeObserver?new ResizeObserver(tier):null;if(ro)ro.observe(root);tier();
 var iv=setInterval(sched,20000);
 w.onclose=function(){clearInterval(iv);if(ro)ro.disconnect();var i=subs.indexOf(fn);if(i>=0)subs.splice(i,1)};
 render()}
/* ---------- register the app (reuses an existing downloads app id if there is one) ---------- */
var DLID=(function(){var ks=Object.keys(A);for(var i=0;i<ks.length;i++)if(/download/i.test(ks[i])||/download/i.test(A[ks[i]].n||''))return ks[i];return'downloads'})();
A[DLID]=Object.assign(A[DLID]||{},{n:'Downloads',g:'linear-gradient(160deg,#6ee79c,#1db35b)',w:720,h:520,f:appDl});
try{if(typeof IC!=='undefined'&&typeof P==='function')IC[DLID]=P('<g stroke="none"><path d="M10.6 4h2.8v8.2l2.6-2.6 2 2L12 17.1 5 11.6l2-2 2.6 2.6z" fill="#fff"/><path d="M5 18.2h14V21H5z" fill="#fff"/></g>')}catch(e){}
try{if(typeof buildIcons==='function')buildIcons(true)}catch(e){}
window.NXDL={start:start,list:function(){return L},active:active,on:function(f){subs.push(f)},off:function(f){var i=subs.indexOf(f);if(i>=0)subs.splice(i,1)},open:openFile,folder:openFolder,launch:launch,appId:appId,show:function(){openApp(DLID)},fmt:{b:fb,s:fsp,t:ago},tile:ftile,id:DLID};
})();
