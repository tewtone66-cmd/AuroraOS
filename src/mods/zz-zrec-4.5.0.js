/* REC-4.5.1 - Screen Recorder (app id nxrec): Record + Library tabs, quality/fps/mic options, 3-2-1 countdown, thumbnails, share/save/delete,
   and a live recording pill that anchors to Nex Island. Needs getDisplayMedia + MediaRecorder; otherwise the app explains why it cannot record.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document;
if(typeof A==='undefined'||typeof openApp!=='function')return;
function say(t){try{if(typeof toast==='function')toast(t)}catch(e){}}
function pad(n){return(n<10?'0':'')+n}
function fmt(s){var h=Math.floor(s/3600),m=Math.floor(s%3600/60);s%=60;return(h?h+':'+pad(m):pad(m))+':'+pad(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ls_(k,d){var v;try{v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{ls(k,v)}catch(e){}}
function sv(p,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.8)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var IK={rec:sv('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>'),lib:sv('<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M10 9.5v5l4.2-2.5z" fill="currentColor"/>'),
 mic:sv('<rect x="9" y="3.5" width="6" height="10" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v2.5"/>'),pause:sv('<path d="M8.5 6v12M15.5 6v12" stroke-width="2.6"/>'),play:sv('<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>'),
 save:sv('<path d="M12 4.5v10M7.8 10.8L12 15l4.2-4.2M5 19.5h14"/>'),share:sv('<circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8 11l7.5-4M8 13l7.5 4"/>'),
 trash:sv('<path d="M5 7h14M10 4h4M7 7l.8 12a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4L17 7"/>'),x:sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>')};
var CAN=!!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia&&window.MediaRecorder);
var Q={'720':{w:1280,b:3e6,l:'720p'},'1080':{w:1920,b:6e6,l:'1080p'},'max':{w:3840,b:12e6,l:'Max'}};
var O={q:ls_('aur.rec.q','1080'),fps:+ls_('aur.rec.fps','30')||30,mic:ls_('aur.rec.mic','0')==='1',cd:ls_('aur.rec.cd','1')==='1'};
var R={st:'idle',t0:0,acc:0,rec:null,stream:null,mix:null,chunks:[],list:[],ui:null,tab:'rec',pv:null,cdv:0,cdt:0};
function secs(){return Math.floor((R.acc+(R.st==='rec'?Date.now()-R.t0:0))/1000)}
function busy(){return R.st==='rec'||R.st==='pause'||R.st==='cd'}
/* ---------- css ---------- */
var st=doc.createElement('style');st.id='nx-rec-css';st.textContent=[
'.rc{--rd:#ff3b4e;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--txt);font-size:13px;overflow:hidden}.rc *{box-sizing:border-box}.rc button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}',
'.rc-tabs{display:flex;gap:4px;margin:12px 14px 0;padding:4px;border-radius:14px;background:var(--surf2);border:1px solid var(--line);flex:none}',
'.rc-tabs button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;background:none;padding:8px;cursor:pointer;color:var(--mut);transition:background-color .2s,color .2s,transform .12s}.rc-tabs button:active{transform:scale(.96)}.rc-tabs svg{width:17px;height:17px}',
'.rc[data-tab=rec] .rc-tabs [data-t=rec],.rc[data-tab=lib] .rc-tabs [data-t=lib]{background:var(--acc,#4f7cff);color:#fff}.rc-tabs em{font-style:normal;font-size:11px;background:rgba(255,255,255,.22);border-radius:999px;padding:0 6px}',
'.rc-pg{flex:1;min-height:0;overflow:auto;padding:14px 16px 20px}.rc[data-tab=rec] .rc-lib,.rc[data-tab=lib] .rc-rec{display:none}',
'.rc-hero{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 0 4px}',
'.rc-ring{position:relative;width:148px;height:148px;display:grid;place-items:center}.rc-ring svg.pr{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}.rc-ring circle{fill:none;stroke-width:5}.rc-ring .bg{stroke:var(--line)}.rc-ring .fg{stroke:var(--rd);stroke-linecap:round;stroke-dasharray:439.8;stroke-dashoffset:439.8;transition:stroke-dashoffset .5s linear}',
'.rc-go{position:relative;width:104px;height:104px;border-radius:50%;border:0;background:linear-gradient(160deg,#ff6b7c,var(--rd));box-shadow:0 10px 28px rgba(255,59,78,.42);display:grid;place-items:center;cursor:pointer;padding:0;transition:transform .15s,box-shadow .2s}.rc-go:active{transform:scale(.93)}',
'.rc-go i{display:block;width:34px;height:34px;border-radius:50%;background:#fff;transition:border-radius .25s,width .25s,height .25s}.rc[data-st=rec] .rc-go i,.rc[data-st=pause] .rc-go i{width:30px;height:30px;border-radius:8px}.rc[data-st=rec] .rc-go{animation:rcp 1.8s ease-in-out infinite}.rc[data-st=cd] .rc-go{opacity:.5}',
'@keyframes rcp{50%{box-shadow:0 10px 44px rgba(255,59,78,.7)}}',
'.rc-t{font-size:46px;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:1px;margin-top:10px}.rc-s{display:flex;align-items:center;gap:7px;color:var(--mut);font-size:12.5px}.rc-s i{width:8px;height:8px;border-radius:50%;background:var(--mut)}.rc[data-st=rec] .rc-s i{background:var(--rd);animation:rcb 1s ease-in-out infinite}.rc[data-st=pause] .rc-s i{background:#ff9f0a}@keyframes rcb{50%{opacity:.2}}',
'.rc-ctl{display:flex;justify-content:center;gap:10px;min-height:42px;margin:10px 0 4px}.rc-b{display:flex;align-items:center;gap:7px;border:1px solid var(--line);background:var(--surf2);border-radius:12px;padding:9px 14px;cursor:pointer;transition:transform .12s,background-color .2s}.rc-b:hover{background:var(--hov)}.rc-b:active{transform:scale(.95)}.rc-b svg{width:16px;height:16px}.rc-b.dg{color:#ff5d73}',
'.rc-card{margin-top:12px;border-radius:16px;background:var(--surf2);border:1px solid var(--line);overflow:hidden}.rc-r{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px}.rc-r+.rc-r{border-top:1px solid var(--line)}.rc-r b{font-weight:600}.rc-r small{display:block;color:var(--mut);font-size:11.5px;margin-top:1px}',
'.rc-seg{display:flex;gap:3px;padding:3px;border-radius:11px;background:var(--hov)}.rc-seg button{border:0;background:none;border-radius:8px;padding:6px 11px;cursor:pointer;color:var(--mut)}.rc-seg button.on{background:var(--acc,#4f7cff);color:#fff}',
'.rc-sw{position:relative;width:46px;height:28px;border-radius:999px;border:0;background:var(--line);cursor:pointer;padding:0;flex:none;transition:background-color .2s}.rc-sw:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .22s}.rc-sw.on{background:#32d74b}.rc-sw.on:after{transform:translateX(18px)}',
'.rc-warn{margin-top:12px;padding:12px 14px;border-radius:14px;background:rgba(255,159,10,.12);border:1px solid rgba(255,159,10,.35);color:#ff9f0a;line-height:1.5}',
'.rc-gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}.rc-vi{border-radius:16px;background:var(--surf2);border:1px solid var(--line);overflow:hidden}',
'.rc-th{position:relative;aspect-ratio:16/9;background:#0b0e14 center/cover no-repeat;cursor:pointer;display:grid;place-items:center}.rc-th:after{content:"";width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.5) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M9 6.5v11l9-5.5z%27 fill=%27white%27/%3E%3C/svg%3E") center/22px no-repeat}.rc-th span{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.65);color:#fff;border-radius:7px;padding:2px 7px;font-size:11px;font-variant-numeric:tabular-nums}',
'.rc-vi video{display:block;width:100%;aspect-ratio:16/9;background:#000}.rc-vm{padding:9px 12px 4px}.rc-vm b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rc-vm small{color:var(--mut);font-size:11.5px}',
'.rc-va{display:flex;gap:6px;padding:6px 8px 10px}.rc-va button,.rc-va a{flex:1;display:grid;place-items:center;height:34px;border:0;border-radius:10px;background:var(--hov);cursor:pointer;color:inherit}.rc-va button:active,.rc-va a:active{transform:scale(.92)}.rc-va svg{width:17px;height:17px}',
'.rc-em{text-align:center;color:var(--mut);padding:46px 10px;line-height:1.6}.rc-em svg{width:46px;height:46px;opacity:.5;display:block;margin:0 auto 10px}',
'#nxrcd{position:fixed;inset:0;z-index:2147483100;display:none;place-items:center;background:rgba(5,8,14,.55);color:#fff;font:700 120px system-ui;cursor:pointer}#nxrcd.on{display:grid}#nxrcd b{display:block;animation:rcn 1s ease-out}@keyframes rcn{0%{transform:scale(1.7);opacity:0}30%{opacity:1}100%{transform:scale(.8);opacity:.2}}',
'#nxrp{position:fixed;top:10px;left:calc(50% + 96px);z-index:2147483000;display:none;align-items:center;gap:8px;height:34px;padding:0 5px 0 12px;border-radius:999px;background:#000;color:#fff;font:600 12px system-ui;box-shadow:0 4px 16px rgba(0,0,0,.4);cursor:pointer}',
'#nxrp.on{display:flex}#nxrp i{width:9px;height:9px;border-radius:50%;background:#ff3b4e;animation:rcb 1.1s ease-in-out infinite}#nxrp.p i{animation:none;background:#ff9f0a}#nxrp b{font-weight:600;font-variant-numeric:tabular-nums}',
'#nxrp button{width:24px;height:24px;border-radius:50%;border:0;background:#ff3b4e;padding:0;cursor:pointer;display:grid;place-items:center}#nxrp button:after{content:"";width:9px;height:9px;border-radius:2px;background:#fff}'
].join('\n');
doc.head.appendChild(st);
var pill=doc.createElement('div');pill.id='nxrp';pill.innerHTML='<i></i><b>00:00</b><button aria-label="Stop recording"></button>';doc.body.appendChild(pill);
var cdo=doc.createElement('div');cdo.id='nxrcd';doc.body.appendChild(cdo);
pill.addEventListener('click',function(e){if(e.target.closest('button'))stop();else openApp(ID)});
cdo.addEventListener('click',cancelCd);
function place(){var n=doc.querySelector('.nxd');if(!n)return;var r=n.getBoundingClientRect();if(r.width>0){pill.style.left=Math.min(innerWidth-pill.offsetWidth-8,r.right+8)+'px';pill.style.top=Math.max(6,r.top+(r.height-34)/2)+'px'}}
function sync(){var on=R.st==='rec'||R.st==='pause';pill.classList.toggle('on',on);pill.classList.toggle('p',R.st==='pause');pill.querySelector('b').textContent=fmt(secs());if(on)place();if(R.ui)R.ui()}
setInterval(function(){if(busy())sync()},500);
/* ---------- recording ---------- */
function cancelCd(){if(R.st!=='cd')return;clearInterval(R.cdt);cdo.classList.remove('on');release();R.st='idle';sync()}
function release(){try{if(R.stream)R.stream.getTracks().forEach(function(t){t.stop()})}catch(e){}try{if(R.mix)R.mix.close()}catch(e){}R.stream=null;R.mix=null}
function begin(stream){var q=Q[O.q]||Q['1080'],mt=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'].filter(function(m){try{return MediaRecorder.isTypeSupported(m)}catch(e){return false}})[0]||'',rec;
 try{rec=new MediaRecorder(stream,mt?{mimeType:mt,videoBitsPerSecond:q.b}:{videoBitsPerSecond:q.b})}catch(e){say('Recording failed to start');release();R.st='idle';sync();return}
 R.rec=rec;R.chunks=[];rec.ondataavailable=function(e){if(e.data&&e.data.size)R.chunks.push(e.data)};
 rec.onstop=function(){var type=rec.mimeType||'video/webm',b=new Blob(R.chunks,{type:type}),d=secs(),id=Date.now(),
   it={id:id,n:'Recording '+new Date().toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),file:'NexOS-recording-'+new Date().toISOString().replace(/[:T]/g,'-').slice(0,19)+(/mp4/.test(type)?'.mp4':'.webm'),url:URL.createObjectURL(b),d:d,sz:b.size,q:q.l,th:'',blob:b};
  R.list.unshift(it);R.st='idle';R.acc=0;release();thumb(it);sync();say('Recording saved to Library')};
 stream.getVideoTracks()[0].onended=function(){stop()};
 rec.start(1000);R.st='rec';R.t0=Date.now();R.acc=0;sync()}
function countdown(stream){if(!O.cd){begin(stream);return}R.st='cd';R.cdv=3;sync();
 function show(){cdo.innerHTML='<b>'+R.cdv+'</b>';cdo.classList.add('on')}show();
 R.cdt=setInterval(function(){R.cdv--;if(R.cdv<=0){clearInterval(R.cdt);cdo.classList.remove('on');setTimeout(function(){if(R.st==='cd')begin(stream)},120)}else show()},1000)}
function start(){if(!CAN){say('Screen recording is not available in this WebView');return}if(busy())return;
 var q=Q[O.q]||Q['1080'];
 navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:O.fps,max:O.fps},width:{ideal:q.w}},audio:true}).then(function(s){
  R.stream=s;
  if(!O.mic){countdown(s);return}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(m){var ac=new(window.AudioContext||window.webkitAudioContext)(),d=ac.createMediaStreamDestination();R.mix=ac;
   if(s.getAudioTracks().length)ac.createMediaStreamSource(new MediaStream([s.getAudioTracks()[0]])).connect(d);ac.createMediaStreamSource(m).connect(d);
   R.stream=new MediaStream(s.getVideoTracks().concat(d.stream.getAudioTracks()));countdown(R.stream)}).catch(function(){say('Microphone not allowed, recording without it');countdown(s)})
 }).catch(function(){say('Recording cancelled')})}
function stop(){if(R.st==='cd'){cancelCd();return}if(R.rec&&(R.st==='rec'||R.st==='pause')){try{R.rec.stop()}catch(e){}}}
function pause(){if(R.st==='rec'){R.rec.pause();R.acc+=Date.now()-R.t0;R.st='pause'}else if(R.st==='pause'){R.rec.resume();R.t0=Date.now();R.st='rec'}sync()}
function thumb(it){try{var v=doc.createElement('video');v.muted=true;v.preload='auto';v.src=it.url;v.onloadeddata=function(){try{v.currentTime=Math.min(0.5,(v.duration||1)/2)}catch(e){}};
 v.onseeked=function(){try{var c=doc.createElement('canvas');c.width=320;c.height=Math.round(320*(v.videoHeight||9)/(v.videoWidth||16));c.getContext('2d').drawImage(v,0,0,c.width,c.height);it.th=c.toDataURL('image/jpeg',.7);if(R.ui)R.ui()}catch(e){}v.removeAttribute('src');v.load()}}catch(e){}}
function sizeLbl(b){return b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB'}
/* ---------- app ---------- */
function appRec(w){var B=w.body;
 B.innerHTML='<div class="rc" data-tab="'+R.tab+'" data-st="idle"><div class="rc-tabs"><button data-t="rec">'+IK.rec+'<span>Record</span></button><button data-t="lib">'+IK.lib+'<span>Library</span><em></em></button></div><div class="rc-pg">'+
  '<div class="rc-rec"><div class="rc-hero"><div class="rc-ring"><svg class="pr" viewBox="0 0 150 150"><circle class="bg" cx="75" cy="75" r="70"/><circle class="fg" cx="75" cy="75" r="70"/></svg><button class="rc-go" data-a="go" aria-label="Record"><i></i></button></div><div class="rc-t">00:00</div><div class="rc-s"><i></i><span></span></div></div>'+
  '<div class="rc-ctl"></div>'+
  '<div class="rc-card"><div class="rc-r"><div><b>Quality</b><small>Resolution and bitrate</small></div><div class="rc-seg" data-o="q"><button data-v="720">720p</button><button data-v="1080">1080p</button><button data-v="max">Max</button></div></div>'+
  '<div class="rc-r"><div><b>Frame rate</b><small>Smoother motion uses more space</small></div><div class="rc-seg" data-o="fps"><button data-v="24">24</button><button data-v="30">30</button><button data-v="60">60</button></div></div>'+
  '<div class="rc-r"><div><b>Microphone</b><small>Mix your voice into the video</small></div><button class="rc-sw" data-a="mic" role="switch" aria-label="Microphone"></button></div>'+
  '<div class="rc-r"><div><b>Countdown</b><small>3 seconds before recording starts</small></div><button class="rc-sw" data-a="cd" role="switch" aria-label="Countdown"></button></div></div>'+
  (CAN?'':'<div class="rc-warn">This WebView cannot capture the screen (getDisplayMedia is missing). Recording works in a normal browser. On the phone it needs a native recorder in a new APK.</div>')+'</div>'+
  '<div class="rc-lib"></div></div></div>';
 var root=B.firstChild;function $(s){return root.querySelector(s)}var libH='';
 function seg(){[].forEach.call(root.querySelectorAll('.rc-seg'),function(g){var k=g.getAttribute('data-o');[].forEach.call(g.children,function(b){b.classList.toggle('on',String(O[k])===b.getAttribute('data-v'))})})}
 function ctl(){var h='';if(R.st==='rec'||R.st==='pause')h='<button class="rc-b" data-a="pause">'+(R.st==='pause'?IK.play+'<span>Resume</span>':IK.pause+'<span>Pause</span>')+'</button><button class="rc-b dg" data-a="stop">'+IK.x+'<span>Stop</span></button>';else if(R.st==='cd')h='<button class="rc-b" data-a="stop">'+IK.x+'<span>Cancel</span></button>';
  var c=$('.rc-ctl');if(c._h!==h){c._h=h;c.innerHTML=h}}
 function lib(){var h='';if(!R.list.length)h='<div class="rc-em">'+IK.lib+'No recordings yet.<br>Your recordings will appear here.</div>';
  else{h='<div class="rc-gr">';R.list.forEach(function(r){h+='<div class="rc-vi" data-id="'+r.id+'">'+(R.pv===r.id?'<video controls autoplay playsinline src="'+r.url+'"></video>':'<div class="rc-th" data-a="play" style="'+(r.th?'background-image:url('+r.th+')':'')+'"><span>'+fmt(r.d)+'</span></div>')+
   '<div class="rc-vm"><b>'+esc(r.n)+'</b><small>'+r.q+' \u00b7 '+sizeLbl(r.sz)+'</small></div><div class="rc-va"><a href="'+r.url+'" download="'+esc(r.file)+'" aria-label="Save">'+IK.save+'</a><button data-a="share" aria-label="Share">'+IK.share+'</button><button data-a="del" aria-label="Delete">'+IK.trash+'</button></div></div>'});h+='</div>'}
  if(h!==libH){libH=h;$('.rc-lib').innerHTML=h}}
 function render(){root.setAttribute('data-tab',R.tab);root.setAttribute('data-st',R.st);var s=secs();$('.rc-t').textContent=fmt(s);
  $('.rc-s span').textContent=R.st==='rec'?'Recording':R.st==='pause'?'Paused':R.st==='cd'?'Starting in '+R.cdv+'...':'Ready to record';
  $('.fg').style.strokeDashoffset=busy()?String(439.8*(1-(s%60)/60)):'439.8';
  root.querySelector('.rc-tabs em').textContent=R.list.length||'';root.querySelector('.rc-tabs em').style.display=R.list.length?'':'none';
  $('[data-a=mic]').classList.toggle('on',O.mic);$('[data-a=cd]').classList.toggle('on',O.cd);seg();ctl();if(R.tab==='lib')lib()}
 root.addEventListener('click',function(e){var b=e.target.closest('[data-t],[data-a],.rc-seg button');if(!b)return;
  if(b.hasAttribute('data-t')){R.tab=b.getAttribute('data-t');render();return}
  if(b.parentNode.classList&&b.parentNode.classList.contains('rc-seg')){var k=b.parentNode.getAttribute('data-o'),v=b.getAttribute('data-v');if(busy())return;O[k]=k==='q'?v:+v;put('aur.rec.'+k,O[k]);render();return}
  var a=b.getAttribute('data-a'),vi=b.closest('.rc-vi'),it=vi?R.list.filter(function(x){return String(x.id)===vi.getAttribute('data-id')})[0]:null;
  if(a==='go'){busy()?stop():start()}else if(a==='pause')pause();else if(a==='stop')stop();
  else if(a==='mic'){if(!busy()){O.mic=!O.mic;put('aur.rec.mic',O.mic?'1':'0');render()}}
  else if(a==='cd'){if(!busy()){O.cd=!O.cd;put('aur.rec.cd',O.cd?'1':'0');render()}}
  else if(a==='play'&&it){R.pv=it.id;libH='';render()}
  else if(a==='del'&&it){try{URL.revokeObjectURL(it.url)}catch(x){}R.list=R.list.filter(function(x){return x!==it});if(R.pv===it.id)R.pv=null;libH='';render()}
  else if(a==='share'&&it){try{var f=new File([it.blob],it.file,{type:it.blob.type});if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:it.n}).catch(function(){});else say('Sharing is not available here, use Save')}catch(x){say('Sharing is not available here, use Save')}}});
 R.ui=function(){if(root.isConnected){libH=R.tab==='lib'&&R.pv?libH:libH;render()}};w.onclose=function(){R.ui=null;R.pv=null};render()}
/* ---------- register ---------- */
var ID='nxrec';
A[ID]=Object.assign(A[ID]||{},{n:'Screen Recorder',g:'linear-gradient(155deg,#ff7a8a 0%,#ff3b4e 48%,#a3123a 100%)',w:460,h:640,f:appRec,kw:'record recorder screen capture video rec'});
try{if(typeof IC!=='undefined'&&typeof P==='function')IC[ID]=P('<g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9V6.5A1.5 1.5 0 016.5 5H9M15 5h2.5A1.5 1.5 0 0119 6.5V9M19 15v2.5a1.5 1.5 0 01-1.5 1.5H15M9 19H6.5A1.5 1.5 0 015 17.5V15" opacity=".85"/><circle cx="12" cy="12" r="3.6" fill="#fff" stroke="none"/></g>')}catch(e){}
try{if(typeof buildIcons==='function')buildIcons(true)}catch(e){}
window.NXREC={open:function(){openApp(ID)},start:start,stop:stop,id:ID};
})();
