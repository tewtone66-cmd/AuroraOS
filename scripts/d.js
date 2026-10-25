/* SYS-3.2.5 - lock/login, first-run setup, account */
(function(){'use strict';
var K={user:'aur.user',pinh:'aur.pinh',pinl:'aur.pinl',lb:'aur.lockboot',oobe:'aur.oobe'};
function name(){return ls(K.user)||'User'}
function setName(v){v=String(v||'').trim().slice(0,24);ls(K.user,v||'User');refreshLock()}
function hasPin(){return !!ls(K.pinh)}
function pinLen(){return +ls(K.pinl)||4}
function hash(p){var s='nexos:'+p;try{if(window.crypto&&crypto.subtle&&window.TextEncoder){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')})}}catch(e){}
 var a=5381,c=52711;for(var i=0;i<s.length;i++){a=((a<<5)+a+s.charCodeAt(i))|0;c=((c<<4)^(c>>>3)^s.charCodeAt(i))|0}return Promise.resolve('f'+(a>>>0).toString(16)+(c>>>0).toString(16))}
function setPin(a,b){a=String(a||'').trim();b=String(b||'').trim();if(!/^\d{4,8}$/.test(a))return 'The PIN must be 4 to 8 digits';if(a!==b)return 'The two PINs are different';
 hash(a).then(function(h){ls(K.pinh,h);ls(K.pinl,String(a.length))});return ''}
function clearPin(){ls(K.pinh,'');ls(K.pinl,'')}
function lockBoot(){return ls(K.lb)!=='0'}
function setLockBoot(on){ls(K.lb,on?'1':'0')}
/* ---- lock screen ---- */
var lck=document.getElementById('lck'),ent='',fails=0,until=0,tmr=0,busy=false,sw=null;
function q(s){return lck&&lck.querySelector(s)}
function buildKp(){var kp=q('.kp');if(!kp||kp.childNodes.length)return;var h='';[1,2,3,4,5,6,7,8,9].forEach(function(n){h+='<button data-n="'+n+'">'+n+'</button>'});h+='<button class="e" data-n="x">Cancel</button><button data-n="0">0</button><button class="e" data-n="b">&#9003;</button>';kp.innerHTML=h;
 kp.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;e.stopPropagation();var n=b.dataset.n;if(n==='x')back();else if(n==='b'){ent=ent.slice(0,-1);dots()}else push(n)})}
function refreshLock(){if(!lck)return;var n=name();q('.un').textContent=n;q('.av').textContent=(n.charAt(0)||'U').toUpperCase()}
function dots(){var L=pinLen(),h='';for(var i=0;i<L;i++)h+='<i'+(i<ent.length?' class="on"':'')+'></i>';q('.pd').innerHTML=h}
function msg(t){q('.lm').textContent=t||''}
function left(){return Math.max(0,Math.ceil((until-Date.now())/1000))}
function tickCool(){var s=left();if(s>0){msg('Too many tries. Wait '+s+' s');tmr=setTimeout(tickCool,500)}else{msg('');fails=0}}
function push(d){if(busy||left()>0)return;if(ent.length>=pinLen())return;ent+=d;dots();if(ent.length===pinLen())check()}
function check(){busy=true;var e=ent;hash(e).then(function(h){busy=false;if(h===ls(K.pinh)){ent='';fails=0;msg('');window.__unlock&&window.__unlock()}else{fails++;ent='';dots();var g=q('.lgn');g.classList.remove('shake');void g.offsetWidth;g.classList.add('shake');try{navigator.vibrate&&navigator.vibrate(60)}catch(_){}
  if(fails>=5){until=Date.now()+30000;clearTimeout(tmr);tickCool()}else msg('Wrong PIN')}})}
function back(){lck.classList.remove('pin');ent='';msg('')}
function proceed(){if(!hasPin()){window.__unlock&&window.__unlock();return}refreshLock();buildKp();ent='';dots();lck.classList.add('pin');if(left()>0)tickCool()}
function lockReset(){ent='';msg('');refreshLock();buildKp();dots()}
function lockDown(e){if(e.target.closest&&e.target.closest('.lgn')&&lck.classList.contains('pin'))return;e.preventDefault();sw={x:e.clientX,y:e.clientY}}
function lockUp(e){if(!sw)return;var s=sw;sw=null;if(lck.classList.contains('pin')){if(!e.target.closest('.lgn')&&Math.abs(e.clientY-s.y)<12)back();return}
 var dy=s.y-e.clientY;if(dy>-30)proceed()}
function lockKey(e){if(!lck.classList.contains('pin')){if(e.key==='Escape')return;proceed();if(!hasPin())return}
 if(/^\d$/.test(e.key))push(e.key);else if(e.key==='Backspace'){ent=ent.slice(0,-1);dots()}else if(e.key==='Escape')back()}
/* ---- first-run setup ---- */
function oobe(){if(document.getElementById('oobe'))return;var O={name:ls(K.user)&&ls(K.user)!=='User'?ls(K.user):'',pin:'',step:0},st=document.createElement('div');st.id='oobe';
 st.innerHTML='<button class="osk">Skip setup</button><div class="oc"></div>';document.body.appendChild(st);var oc=st.querySelector('.oc'),N=6;
 function esc2(t){return String(t).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]})}
 function logo(){return '<svg class="ol" viewBox="0 0 512 512"><path d="M168 368V144l176 224V144" fill="none" stroke="url(#nxg)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
 function dotsH(){var h='<div class="od">';for(var i=0;i<N;i++)h+='<i'+(i===O.step?' class="on"':'')+'></i>';return h+'</div>'}
 function foot(next,back){return '<div class="of">'+(back?'<button data-o="back">Back</button>':'<span></span>')+'<button class="pri" data-o="next">'+next+'</button></div>'+dotsH()}
 function render(){var s=O.step,h='<div class="os">';
  if(s===0)h+=logo()+'<h2>Welcome to NexOS</h2><p>Let\'s set up your desktop. It takes less than a minute and you can change everything later in Settings.</p>'+foot('Get started',false);
  else if(s===1)h+='<h2>What should we call you?</h2><p>Your name is shown on the lock screen.</p><input id="oo-n" maxlength="24" placeholder="Your name" value="'+esc2(O.name)+'" autocomplete="off">'+foot('Next',true);
  else if(s===2){h+='<h2>Make it yours</h2><h4>Theme</h4><div class="oseg">'+['auto','light','dark'].map(function(t){return '<button data-t="'+t+'" class="'+(S.theme===t?'sel':'')+'">'+t.charAt(0).toUpperCase()+t.slice(1)+'</button>'}).join('')+'</div><h4>Accent color</h4><div class="osw">'+ACC.map(function(c){return '<button data-a="'+c+'" class="'+(S.acc===c?'sel':'')+'" style="background:'+c+'"></button>'}).join('')+'</div><h4>Wallpaper</h4><div class="owl">'+WALL.slice(0,6).map(function(w,i){return '<button data-w="'+i+'" class="'+(!S.wc&&S.wall===i?'sel':'')+'" style="background-image:'+w.replace(/"/g,'&quot;')+'"></button>'}).join('')+'</div>'+foot('Next',true)}
  else if(s===3)h+='<h2>Lock screen PIN</h2><p>Optional. Choose 4 to 8 digits to lock NexOS. Leave it empty to skip.</p><input id="oo-p" inputmode="numeric" maxlength="8" placeholder="PIN (optional)" autocomplete="off"><input id="oo-p2" inputmode="numeric" maxlength="8" placeholder="Repeat PIN" autocomplete="off"><div class="ost" id="oo-m"></div>'+foot('Next',true);
  else if(s===4)h+='<h2>Your files</h2><p>File Explorer needs access to your phone\'s storage to show and manage your files.</p><div class="oseg"><button id="oo-f" data-o="files">Allow access to files</button></div><div class="ost" id="oo-fm"></div>'+foot('Next',true);
  else h+=logo()+'<h2>You\'re all set'+(O.name?', '+esc2(O.name):'')+'</h2><p>NexOS is ready. Enjoy your desktop.</p>'+foot('Open desktop',false);
  oc.innerHTML=h+'</div>';var i=oc.querySelector('input');if(i&&s!==3)setTimeout(function(){try{i.focus()}catch(e){}},300);
  if(s===4&&typeof NF!=='undefined'&&NF&&NF.status)NF.status().then(function(x){var m=document.getElementById('oo-fm');if(m&&x.granted)m.textContent='Access is allowed'}).catch(function(){})}
 function finish(){setName(O.name||'User');ls(K.oobe,'1');st.classList.add('out');setTimeout(function(){st.remove()},650);try{toast('Welcome to NexOS')}catch(e){}}
 function next(){var s=O.step;
  if(s===1){var n=document.getElementById('oo-n');O.name=n?n.value.trim():O.name}
  if(s===3){var a=document.getElementById('oo-p').value.trim(),b=document.getElementById('oo-p2').value.trim();if(a||b){var m=setPin(a,b);if(m){document.getElementById('oo-m').textContent=m;return}}}
  if(s>=N-1){finish();return}O.step++;render()}
 oc.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var d=b.dataset;
  if(d.o==='next')next();else if(d.o==='back'){O.step--;render()}
  else if(d.o==='files'){try{NF.requestAccess().catch(function(){})}catch(x){}var m=document.getElementById('oo-fm');if(m)m.textContent='Choose "Allow" in the Android screen, then come back'}
  else if(d.t){S.theme=d.t;ls('aur.theme',d.t);applyTheme();applyTb();render()}
  else if(d.a){S.acc=d.a;ls('aur.acc',d.a);applyTheme();applyTb();render()}
  else if(d.w!=null){S.wall=+d.w;S.wc='';ls('aur.wall',S.wall);ls('aur.wc','');applyWall();render()}});
 oc.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();next()}});
 st.querySelector('.osk').onclick=function(){ls(K.oobe,'1');st.classList.add('out');setTimeout(function(){st.remove()},650)};
 render();requestAnimationFrame(function(){st.classList.add('on')})}
function whenBooted(cb){var n=0,iv=setInterval(function(){n++;if(!document.getElementById('boot')||n>80){clearInterval(iv);setTimeout(cb,350)}},250)}
/* ---- shutdown extras: ring around the logo ---- */
(function(){var s=document.getElementById('shut');if(!s)return;var lg=s.querySelector('.lg');if(!lg||s.querySelector('.lw'))return;var w=document.createElement('div');w.className='lw';w.innerHTML='<div class="rg"><svg viewBox="0 0 120 120"><circle class="bk" cx="60" cy="60" r="54"/><circle cx="60" cy="60" r="54"/></svg></div>';lg.parentNode.insertBefore(w,lg);w.appendChild(lg)})();
refreshLock();if(lck){buildKp();dots()}
window.NX4={name:name,setName:setName,hasPin:hasPin,pinLen:pinLen,setPin:setPin,clearPin:clearPin,lockBoot:lockBoot,setLockBoot:setLockBoot,oobe:oobe,lockDown:lockDown,lockUp:lockUp,lockKey:lockKey,lockReset:lockReset};
whenBooted(function(){if(ls(K.oobe)!=='1')oobe();else if(hasPin()&&lockBoot()&&typeof doLock==='function'){doLock();proceed()}});
})();
