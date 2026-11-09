/* REC-4.5.0 - Screen Recorder app (id nxrec) + red recording pill next to Nex Island.
   Uses getDisplayMedia (+ optional microphone) and MediaRecorder. Where the WebView has no getDisplayMedia the app says so.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document;
if(typeof A==='undefined'||typeof openApp!=='function')return;
function say(t){try{if(typeof toast==='function')toast(t)}catch(e){}}
function pad(n){return(n<10?'0':'')+n}
function fmt(s){var h=Math.floor(s/3600),m=Math.floor(s%3600/60);s%=60;return(h?h+':'+pad(m):pad(m))+':'+pad(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var CAN=!!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia&&window.MediaRecorder);
var R={on:false,paused:false,t0:0,acc:0,rec:null,stream:null,chunks:[],mic:false,list:[],ui:null};
function secs(){return Math.floor((R.acc+(R.on&&!R.paused?Date.now()-R.t0:0))/1000)}
/* ---------- css ---------- */
var st=doc.createElement('style');st.id='nx-rec-css';st.textContent=[
'.rc{display:flex;flex-direction:column;align-items:center;gap:14px;height:100%;padding:22px 18px;overflow:auto;color:var(--txt);font-size:13px;box-sizing:border-box}.rc *{box-sizing:border-box}.rc button{font:inherit;color:inherit}',
'.rc-t{font-size:50px;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:1px}.rc-s{color:var(--mut);margin-top:-6px}',
'.rc-big{width:84px;height:84px;border-radius:50%;border:4px solid var(--line);background:var(--surf2);display:grid;place-items:center;cursor:pointer;padding:0;transition:transform .15s}.rc-big:active{transform:scale(.92)}',
'.rc-big i{display:block;width:44px;height:44px;border-radius:50%;background:#ff3b4e;transition:border-radius .2s,width .2s,height .2s}.rc.on .rc-big i{width:30px;height:30px;border-radius:9px}',
'.rc-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center}',
'.rc-b{border:1px solid var(--line);background:var(--surf2);border-radius:11px;padding:8px 14px;cursor:pointer}.rc-b:hover{background:var(--hov)}.rc-b:active{transform:scale(.95)}',
'.rc-sw{display:flex;align-items:center;gap:10px}.rc-sw button{position:relative;width:46px;height:28px;border-radius:999px;border:0;background:var(--line);cursor:pointer;padding:0}.rc-sw button:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}.rc-sw button.on{background:#32d74b}.rc-sw button.on:after{transform:translateX(18px)}',
'.rc-list{width:100%;display:flex;flex-direction:column;gap:8px}.rc-list h4{margin:6px 2px;font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--mut)}',
'.rc-it{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--surf2);border:1px solid var(--line)}.rc-it span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rc-it a{color:var(--acc,#7c9bff);text-decoration:none;padding:4px 8px}',
'.rc-v{width:100%;max-height:220px;border-radius:14px;background:#000}',
'.rc-warn{color:#ff9f0a;text-align:center;max-width:340px;line-height:1.5}',
'#nxrp{position:fixed;top:10px;left:calc(50% + 96px);z-index:2147483000;display:none;align-items:center;gap:8px;height:34px;padding:0 6px 0 12px;border-radius:999px;background:#000;color:#fff;font:600 12px system-ui;box-shadow:0 4px 16px rgba(0,0,0,.4);cursor:pointer}',
'#nxrp.on{display:flex}#nxrp i{width:9px;height:9px;border-radius:50%;background:#ff3b4e;animation:nxrpd 1.1s ease-in-out infinite}#nxrp.p i{animation:none;background:#ff9f0a}',
'#nxrp b{font-weight:600;font-variant-numeric:tabular-nums}#nxrp button{width:24px;height:24px;border-radius:50%;border:0;background:#ff3b4e;padding:0;cursor:pointer;display:grid;place-items:center}#nxrp button:after{content:"";width:9px;height:9px;border-radius:2px;background:#fff}',
'@keyframes nxrpd{50%{opacity:.25}}'
].join('\n');
doc.head.appendChild(st);
var pill=doc.createElement('div');pill.id='nxrp';pill.innerHTML='<i></i><b>00:00</b><button aria-label="Stop recording"></button>';doc.body.appendChild(pill);
pill.addEventListener('click',function(e){if(e.target.closest('button'))stop();else openApp('nxrec')});
function sync(){pill.classList.toggle('on',R.on);pill.classList.toggle('p',R.paused);pill.querySelector('b').textContent=fmt(secs());if(R.ui)R.ui()}
setInterval(function(){if(R.on)sync()},500);
/* ---------- recording ---------- */
function start(){if(!CAN){say('Screen recording is not available in this WebView');return}if(R.on)return;
 navigator.mediaDevices.getDisplayMedia({video:true,audio:true}).then(function(s){
  var go=function(stream){R.stream=stream;R.chunks=[];var mt=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'].filter(function(m){try{return MediaRecorder.isTypeSupported(m)}catch(e){return false}})[0]||'';
   var rec;try{rec=new MediaRecorder(stream,mt?{mimeType:mt}:undefined)}catch(e){say('Recording failed to start');stream.getTracks().forEach(function(t){t.stop()});return}
   R.rec=rec;rec.ondataavailable=function(e){if(e.data&&e.data.size)R.chunks.push(e.data)};
   rec.onstop=function(){var type=rec.mimeType||'video/webm',b=new Blob(R.chunks,{type:type}),n='NexOS-recording-'+new Date().toISOString().replace(/[:T]/g,'-').slice(0,19)+(/mp4/.test(type)?'.mp4':'.webm');
    R.list.unshift({n:n,url:URL.createObjectURL(b),d:secs()});R.on=false;R.paused=false;R.acc=0;R.stream.getTracks().forEach(function(t){t.stop()});sync();say('Recording saved')};
   s.getVideoTracks()[0].onended=function(){stop()};
   rec.start(1000);R.on=true;R.paused=false;R.t0=Date.now();R.acc=0;sync()};
  if(R.mic){navigator.mediaDevices.getUserMedia({audio:true}).then(function(m){var ac=new(window.AudioContext||window.webkitAudioContext)(),d=ac.createMediaStreamDestination();
    if(s.getAudioTracks().length)ac.createMediaStreamSource(new MediaStream([s.getAudioTracks()[0]])).connect(d);ac.createMediaStreamSource(m).connect(d);
    go(new MediaStream(s.getVideoTracks().concat(d.stream.getAudioTracks())))}).catch(function(){say('Microphone not allowed');go(s)})}
  else go(s)}).catch(function(){say('Recording cancelled')})}
function stop(){if(R.rec&&R.on){try{R.rec.stop()}catch(e){}}}
function pause(){if(!R.on)return;if(R.paused){R.rec.resume();R.t0=Date.now();R.paused=false}else{R.rec.pause();R.acc+=Date.now()-R.t0;R.paused=true}sync()}
/* ---------- app ---------- */
function appRec(w){var B=w.body;
 B.innerHTML='<div class="rc"><div class="rc-t">00:00</div><div class="rc-s"></div><button class="rc-big" aria-label="Record"><i></i></button>'+
  '<div class="rc-row"><button class="rc-b" data-a="p">Pause</button></div>'+
  '<div class="rc-sw"><span>Record microphone</span><button data-a="m" role="switch" aria-label="Microphone"></button></div>'+
  (CAN?'':'<p class="rc-warn">This WebView cannot capture the screen (no getDisplayMedia). It works in a normal browser; on the phone it needs a native recorder in a new APK.</p>')+
  '<div class="rc-list"></div></div>';
 var root=B.firstChild;function $(s){return root.querySelector(s)}
 function render(){root.classList.toggle('on',R.on);$('.rc-t').textContent=fmt(secs());$('.rc-s').textContent=R.on?(R.paused?'Paused':'Recording'):'Ready';$('[data-a=p]').style.display=R.on?'':'none';$('[data-a=p]').textContent=R.paused?'Resume':'Pause';$('[data-a=m]').classList.toggle('on',R.mic);
  var h=R.list.length?'<h4>Recordings</h4>':'';R.list.forEach(function(r){h+='<div class="rc-it"><span>'+esc(r.n)+' ('+fmt(r.d)+')</span><a href="'+r.url+'" download="'+esc(r.n)+'">Save</a><a href="#" data-v="'+r.url+'">Play</a></div>'});
  var l=$('.rc-list');if(l._h!==h){l._h=h;l.innerHTML=h}}
 root.addEventListener('click',function(e){var b=e.target.closest('button,[data-v]');if(!b)return;
  if(b.classList.contains('rc-big')){R.on?stop():start();return}
  var a=b.getAttribute('data-a'),v=b.getAttribute('data-v');
  if(a==='p')pause();else if(a==='m'){if(!R.on)R.mic=!R.mic;render()}
  else if(v){e.preventDefault();var old=$('.rc-v');if(old)old.remove();var el=doc.createElement('video');el.className='rc-v';el.controls=true;el.autoplay=true;el.src=v;$('.rc-list').appendChild(el)}});
 R.ui=function(){if(root.isConnected)render()};w.onclose=function(){R.ui=null};render()}
/* ---------- register ---------- */
var ID='nxrec';
A[ID]=Object.assign(A[ID]||{},{n:'Screen Recorder',g:'linear-gradient(160deg,#ff5a6e,#c2185b)',w:420,h:560,f:appRec,kw:'record recorder screen capture video rec'});
try{if(typeof IC!=='undefined'&&typeof P==='function')IC[ID]=P('<g fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2" fill="#fff"/></g>')}catch(e){}
try{if(typeof buildIcons==='function')buildIcons(true)}catch(e){}
window.NXREC={open:function(){openApp(ID)},start:start,stop:stop,id:ID};
})();
