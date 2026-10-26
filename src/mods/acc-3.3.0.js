/* ACC-3.3.0 - accounts, login, security (injected into index.html by scripts/prepare-web.mjs) */
(function(){'use strict';
var K={pin:'aur.pin2',pw:'aur.pw2',rw:'aur.rw2',mk:'aur.pinh',pl:'aur.pinl',av:'aur.avatar',user:'aur.user',fails:'aur.fails',until:'aur.until'};
var IT=120000,lck=document.getElementById('lck');if(!lck||!window.NX4)return;
function g(k){return ls(k)}function s(k,v){ls(k,v)}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]})}
/* ---------- crypto: salted PBKDF2 ---------- */
function b64(u){var a='';u.forEach(function(x){a+=String.fromCharCode(x)});return btoa(a)}
function ub64(t){return Uint8Array.from(atob(t),function(c){return c.charCodeAt(0)})}
function kdf(secret,salt,it){var e=new TextEncoder();return crypto.subtle.importKey('raw',e.encode(secret),'PBKDF2',false,['deriveBits']).then(function(k){return crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:it},k,256)}).then(function(b){return b64(new Uint8Array(b))})}
function mk(secret){var salt=crypto.getRandomValues(new Uint8Array(16));return kdf(secret,salt,IT).then(function(h){return JSON.stringify({s:b64(salt),i:IT,h:h})})}
function chk(rec,secret){try{var r=JSON.parse(rec);return kdf(secret,ub64(r.s),r.i).then(function(h){return h===r.h})}catch(e){return Promise.resolve(false)}}
function sha(p){return crypto.subtle.digest('SHA-256',new TextEncoder().encode('nexos:'+p)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')})}
/* ---------- state ---------- */
function legacy(){var m=g(K.mk);return !!m&&m!=='v2'&&!g(K.pin)}
function hasPin(){return !!g(K.pin)||legacy()}
function hasPw(){return !!g(K.pw)}
function hasRw(){return !!g(K.rw)}
function locked(){return hasPin()||hasPw()}
function pinLen(){return +g(K.pl)||4}
function mark(){if(!legacy()){if(hasPin()||hasPw())s(K.mk,'v2');else{s(K.mk,'');s(K.pl,'')}}}
function verify(kind,secret){
 if(kind==='pin'&&legacy())return sha(secret).then(function(h){if(h!==g(K.mk))return false;return setCred('pin',secret).then(function(){return true})});
 var rec=g(K[kind]);return rec?chk(rec,secret):Promise.resolve(false)}
function setCred(kind,secret){return mk(secret).then(function(r){s(K[kind],r);if(kind==='pin'){s(K.pl,String(secret.length));s(K.mk,'v2')}else mark()})}
function clearCred(kind){s(K[kind],'');if(kind==='pin'&&legacy())s(K.mk,'');mark()}
function okPin(p){return /^\d{4,8}$/.test(p)}
/* ---------- lockout (persisted) ---------- */
function left(){return Math.max(0,Math.ceil(((+g(K.until)||0)-Date.now())/1000))}
function fail(){var n=(+g(K.fails)||0)+1;s(K.fails,String(n));if(n>=5){s(K.until,String(Date.now()+30000));s(K.fails,'0')}}
function okReset(){s(K.fails,'0');s(K.until,'0')}
/* ---------- css ---------- */
var css=document.createElement('style');css.textContent=
'#lck .lx{display:flex;flex-direction:column;align-items:center;gap:10px;width:min(300px,86vw)}'+
'#lck .lx .sec{display:none;flex-direction:column;gap:10px;width:100%}'+
'#lck .lgn[data-lm=pw] .sec.pw,#lck .lgn[data-lm=rec1] .sec.r1,#lck .lgn[data-lm=rec2] .sec.r2{display:flex}'+
'#lck .lgn:not([data-lm=pin]) .pd,#lck .lgn:not([data-lm=pin]) .kp{display:none}'+
'#lck .lx input{width:100%;height:46px;border-radius:14px;border:1px solid #ffffff44;background:#ffffff1f;color:#fff;font-size:16px;text-align:center;outline:none;box-sizing:border-box;backdrop-filter:blur(8px)}'+
'#lck .lx input::placeholder{color:#ffffffa0}#lck .lx input:focus{border-color:#fff}'+
'#lck .lx .lb{height:42px;border:0;border-radius:14px;background:var(--acc,#4f7cff);color:#fff;font-size:14px;font-weight:600;cursor:pointer;width:100%}'+
'#lck .lx .lk{display:flex;gap:18px;font-size:13px;min-height:18px}#lck .lx .lk a{opacity:.85;cursor:pointer;text-decoration:underline;text-underline-offset:3px}'+
'#lck .av.im{background-size:cover;background-position:center;font-size:0}'+
'#lck .pd i.pp{animation:a3pop .22s var(--ease,ease-out)}@keyframes a3pop{0%{transform:scale(.4)}60%{transform:scale(1.4)}100%{transform:scale(1.1)}}'+
'#lck .lgn.ok .pd i{background:#4ade80;border-color:#4ade80;transform:scale(1.25)}'+
'#lck .lgn.ok{animation:a3ok .4s ease-in forwards}@keyframes a3ok{to{transform:scale(1.06);opacity:0}}'+
'#lck .kp button.pr{background:#ffffff66;transform:scale(.92)}'+
'#lck .lpb{position:absolute;right:20px;bottom:20px;width:46px;height:46px;border-radius:50%;border:0;background:#ffffff26;color:#fff;display:grid;place-items:center;backdrop-filter:blur(8px);cursor:pointer;z-index:3}'+
'#lck .lpb svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'+
'#lck .lpm{position:absolute;right:20px;bottom:74px;min-width:170px;padding:6px;border-radius:14px;background:#10162cf0;border:1px solid #ffffff22;display:none;flex-direction:column;z-index:3;text-align:left}'+
'#lck .lpm.on{display:flex;animation:pwin .18s ease-out}#lck .lpm button{border:0;background:none;color:#fff;text-align:left;padding:11px 12px;border-radius:9px;font-size:14px;cursor:pointer}#lck .lpm button:hover,#lck .lpm button:active{background:#ffffff20}'+
'body.perf #lck .lgn *,body.rm #lck .lgn *,body.perf #lck .lgn,body.rm #lck .lgn{animation:none!important}'+
'.av2.im{background-size:cover;background-position:center;font-size:0}.sfoot .usr i.im{background-size:cover;background-position:center;font-size:0}'+
'.a3r{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.a3r .sinp{margin-top:8px}.a3d{background:#c0392b!important;color:#fff!important}';
document.head.appendChild(css);
/* ---------- lock screen ---------- */
var lgn=lck.querySelector('.lgn'),ent='',busy=false,mode='pin',tmr=0;
var lx=document.createElement('div');lx.className='lx';
lx.innerHTML='<div class="sec pw"><input class="lpi" type="password" placeholder="Password" autocomplete="off"><button class="lb" data-l="pwgo">Sign in</button></div>'+
'<div class="sec r1"><input class="lri" type="text" placeholder="Recovery word" autocomplete="off"><button class="lb" data-l="rcgo">Continue</button></div>'+
'<div class="sec r2"><input class="ln1" type="password" inputmode="numeric" maxlength="8" placeholder="New PIN (4 to 8 digits)"><input class="ln2" type="password" inputmode="numeric" maxlength="8" placeholder="Repeat new PIN"><button class="lb" data-l="rcset">Save new PIN</button></div>'+
'<div class="lk"></div>';
lgn.appendChild(lx);
var pb=document.createElement('button');pb.className='lpb';pb.setAttribute('aria-label','Power');pb.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 3v9M6.3 6.6a8 8 0 1 0 11.4 0"/></svg>';
var pm=document.createElement('div');pm.className='lpm';pm.innerHTML='<button data-lp="shut">Shut down</button><button data-lp="restart">Restart</button><button data-lp="sleep">Sleep</button>';
lck.appendChild(pb);lck.appendChild(pm);
['pointerdown','pointerup'].forEach(function(t){pb.addEventListener(t,function(e){e.stopPropagation()});pm.addEventListener(t,function(e){e.stopPropagation()})});
pb.addEventListener('click',function(e){e.stopPropagation();pm.classList.toggle('on')});
pm.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('[data-lp]');if(!b)return;pm.classList.remove('on');var k=b.dataset.lp;if(k==='shut')doShut(true);else if(k==='restart')doRestart();else doSleep()});
function q(x){return lgn.querySelector(x)}
function msg(t){q('.lm').textContent=t||''}
function dots(last){var L=pinLen(),h='';for(var i=0;i<L;i++)h+='<i'+(i<ent.length?' class="on'+(last&&i===ent.length-1?' pp':'')+'"':'')+'></i>';q('.pd').innerHTML=h}
function paintLock(){var n=g(K.user)||'User',av=q('.av'),im=g(K.av);q('.un').textContent=n;if(im){av.classList.add('im');av.style.backgroundImage='url('+im+')';av.textContent=''}else{av.classList.remove('im');av.style.backgroundImage='';av.textContent=(n.charAt(0)||'U').toUpperCase()}}
function links(){var h='';if(mode==='pin'&&hasPw())h+='<a data-l="alt">Use password</a>';if(mode==='pw'&&hasPin())h+='<a data-l="alt">Use PIN</a>';if((mode==='pin'||mode==='pw')&&hasRw())h+='<a data-l="forgot">Forgot PIN or password?</a>';if(mode==='rec1'||mode==='rec2')h+='<a data-l="cancel">Back to sign in</a>';q('.lk').innerHTML=h}
function setMode(m){mode=m;lgn.dataset.lm=m;ent='';dots();msg('');links();lgn.classList.remove('ok');lgn.querySelectorAll('input').forEach(function(i){i.value=''});if(m==='pw')setTimeout(function(){q('.lpi').focus()},120);if(m==='rec1')setTimeout(function(){q('.lri').focus()},120);if(m==='rec2')setTimeout(function(){q('.ln1').focus()},120);cool()}
function cool(){clearTimeout(tmr);var s=left();if(s>0){msg('Too many tries. Wait '+s+' s');tmr=setTimeout(cool,500)}else if(/^Too many/.test(q('.lm').textContent))msg('')}
function bad(t){fail();lgn.classList.remove('shake');void lgn.offsetWidth;lgn.classList.add('shake');try{navigator.vibrate&&navigator.vibrate(60)}catch(_){}msg(left()>0?'':t);cool()}
function good(){okReset();msg('');lgn.classList.add('ok');setTimeout(function(){window.__unlock&&window.__unlock();lgn.classList.remove('ok');ent='';dots()},380)}
function guard(){if(busy||left()>0){cool();return false}return true}
function tryPin(){if(!guard())return;busy=true;var e=ent;verify('pin',e).then(function(ok){busy=false;if(ok)good();else{ent='';dots();bad('Wrong PIN')}})}
function tryPw(){if(!guard())return;var v=q('.lpi').value;if(!v)return;busy=true;verify('pw',v).then(function(ok){busy=false;if(ok)good();else{q('.lpi').value='';bad('Wrong password')}})}
function tryRc(){if(!guard())return;var v=q('.lri').value.trim().toLowerCase();if(!v)return;busy=true;verify('rw',v).then(function(ok){busy=false;if(ok){okReset();setMode('rec2')}else{q('.lri').value='';bad('Wrong recovery word')}})}
function setNew(){var a=q('.ln1').value.trim(),b=q('.ln2').value.trim();if(!okPin(a))return msg('The PIN must be 4 to 8 digits');if(a!==b)return msg('The two PINs are different');
 setCred('pin',a).then(function(){clearCred('pw');paintAll();msg('');good()})}
function open(){if(!locked()){window.__unlock&&window.__unlock();return}paintLock();setMode(hasPin()?'pin':'pw');lck.classList.add('pin')}
NX4.hasPin=hasPin;
NX4.lockReset=function(){pm.classList.remove('on');paintLock();setMode(hasPin()?'pin':'pw')};
NX4.lockKey=function(e){var ai=document.activeElement;
 if(!lck.classList.contains('pin')){if(e.key==='Escape')return;open();if(!locked())return}
 if(ai&&ai.tagName==='INPUT'&&lx.contains(ai)){if(e.key==='Enter'){var b=ai.closest('.sec').querySelector('.lb');b&&b.click()}else if(e.key==='Escape')lck.classList.remove('pin');else typeIn(ai,e);return}
 if(mode==='pw'||mode==='rec1'||mode==='rec2'){var f=q(mode==='pw'?'.lpi':mode==='rec1'?'.lri':'.ln1');if(f&&e.key.length===1){f.focus();typeIn(f,e)}else if(e.key==='Escape')lck.classList.remove('pin');return}
 if(/^\d$/.test(e.key))pushD(e.key);else if(e.key==='Backspace'){ent=ent.slice(0,-1);dots()}else if(e.key==='Escape')lck.classList.remove('pin')};
/* the global keydown handler calls preventDefault, so type into inputs by hand */
function typeIn(inp,e){if(e.ctrlKey||e.metaKey||e.altKey)return;var v=inp.value,a=inp.selectionStart,b=inp.selectionEnd;if(a==null){a=b=v.length}
 if(e.key==='Backspace'){if(a!==b)inp.value=v.slice(0,a)+v.slice(b);else if(a>0){inp.value=v.slice(0,a-1)+v.slice(a);a--}else return;b=a}
 else if(e.key.length===1){var mx=+inp.maxLength;if(mx>0&&v.length-(b-a)>=mx)return;inp.value=v.slice(0,a)+e.key+v.slice(b);a++;b=a}else return;
 try{inp.setSelectionRange(a,b)}catch(_){}}
function pushD(d){if(mode!=='pin'||busy||left()>0)return;if(ent.length>=pinLen())return;ent+=d;dots(true);if(ent.length===pinLen())setTimeout(tryPin,90)}
/* keypad: take over from the old handler (capture phase) */
lck.addEventListener('click',function(e){var b=e.target.closest('.kp button');if(!b)return;e.stopPropagation();e.preventDefault();var n=b.dataset.n;b.classList.add('pr');setTimeout(function(){b.classList.remove('pr')},120);
 if(n==='x')lck.classList.remove('pin');else if(n==='b'){ent=ent.slice(0,-1);dots()}else pushD(n)},true);
lx.addEventListener('click',function(e){var a=e.target.closest('[data-l]');if(!a)return;e.stopPropagation();var k=a.dataset.l;
 if(k==='alt')setMode(mode==='pin'?'pw':'pin');else if(k==='forgot')setMode('rec1');else if(k==='cancel')setMode(hasPin()?'pin':'pw');else if(k==='pwgo')tryPw();else if(k==='rcgo')tryRc();else if(k==='rcset')setNew()});
new MutationObserver(function(){if(lck.classList.contains('pin')){if(!lgn.dataset.lm)setMode(hasPin()?'pin':'pw');paintLock();links()}else{pm.classList.remove('on');if(lgn.dataset.lm&&lgn.dataset.lm!=='pin')setMode('pin')}}).observe(lck,{attributes:true,attributeFilter:['class']});
/* ---------- taskbar / start-menu account button ---------- */
function paintBar(){var u=document.querySelector('.sfoot .usr');if(!u)return;var i=u.querySelector('i'),b=u.querySelector('b'),im=g(K.av),n=g(K.user)||'User';
 if(b)b.textContent=n;if(i){if(im){i.classList.add('im');i.style.backgroundImage='url('+im+')';i.textContent=''}else{i.classList.remove('im');i.style.backgroundImage='';i.textContent=(n.charAt(0)||'U').toUpperCase()}}}
function paintAll(){paintLock();paintBar();var o=document.querySelector('.acc3 .av2');if(o)drawAv(o)}
function drawAv(o){var im=g(K.av),n=g(K.user)||'User';if(im){o.classList.add('im');o.style.backgroundImage='url('+im+')';o.textContent=''}else{o.classList.remove('im');o.style.backgroundImage='';o.textContent=(n.charAt(0)||'U').toUpperCase()}}
var _sn=NX4.setName;NX4.setName=function(v){_sn(v);paintAll()};
/* ---------- avatar ---------- */
function pickAvatar(){var f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=function(){var file=f.files&&f.files[0];if(!file)return;var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d'),m=Math.min(im.width,im.height);x.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,256,256);s(K.av,c.toDataURL('image/jpeg',.85));paintAll();toast('Profile picture updated')};im.onerror=function(){toast('That file is not an image')};im.src=r.result};r.readAsDataURL(file)};f.click()}
/* ---------- Settings > Account page ---------- */
function acctHTML(){var n=g(K.user)||'User',p=hasPin(),w=hasPw(),r=hasRw(),any=locked();
 function sec(t,b){return '<h4>'+t+'</h4>'+b}
 function inp(id,ph,num){return '<input id="'+id+'" class="sinp" type="password" '+(num?'inputmode="numeric" maxlength="8" ':'')+'placeholder="'+ph+'" autocomplete="off" style="margin-top:8px">'}
 var cur=any?inp('a3cur','Current PIN or password (required)'):'';
 return '<div class="acc3"><h3>Account</h3><div class="acc0"><div class="av2"></div><div><b>'+esc(n)+'</b><small>Local account &middot; Administrator</small></div></div>'+
 sec('Profile picture','<div class="a3r"><button class="pgb" data-a3="pic">Choose picture</button><button class="pgb" data-a3="nopic">Remove</button></div>')+
 sec('Username','<input id="a3un" class="sinp" value="'+esc(n)+'" maxlength="24"><button class="pgb" data-a3="name">Save username</button>')+
 (any?sec('Confirm it is you','<p class="bnote">Changing security options needs your current PIN or password.</p>'+cur):'')+
 sec('Lock PIN','<p class="bnote">'+(p?'A PIN is set.':'No PIN yet.')+'</p>'+inp('a3p1',p?'New PIN (4 to 8 digits)':'PIN (4 to 8 digits)',1)+inp('a3p2','Repeat PIN',1)+'<div class="a3r"><button class="pgb" data-a3="setpin">'+(p?'Change PIN':'Set PIN')+'</button>'+(p?'<button class="pgb" data-a3="clrpin">Remove PIN</button>':'')+'</div>')+
 sec('Password','<p class="bnote">'+(w?'A password is set. You can use it instead of the PIN on the lock screen.':'Optional. Works as an alternative to the PIN.')+'</p>'+inp('a3w1',w?'New password (4+ characters)':'Password (4+ characters)')+inp('a3w2','Repeat password')+'<div class="a3r"><button class="pgb" data-a3="setpw">'+(w?'Change password':'Set password')+'</button>'+(w?'<button class="pgb" data-a3="clrpw">Remove password</button>':'')+'</div>')+
 sec('Recovery word','<p class="bnote">'+(r?'A recovery word is set. On the lock screen choose "Forgot PIN or password?" and type it to set a new PIN.':'Choose a secret word. If you forget your PIN or password, typing it on the lock screen lets you set a new PIN.')+'</p>'+'<input id="a3rw" class="sinp" placeholder="'+(r?'New recovery word':'Recovery word (3+ characters)')+'" autocomplete="off" style="margin-top:8px"><div class="a3r"><button class="pgb" data-a3="setrw">'+(r?'Change word':'Save word')+'</button>'+(r?'<button class="pgb" data-a3="clrrw">Remove</button>':'')+'</div>')+
 sec('Ask for the PIN when NexOS starts','<div class="seg"><button data-k="lockboot" data-v="1" class="'+(NX4.lockBoot()?'sel':'')+'">On</button><button data-k="lockboot" data-v="0" class="'+(NX4.lockBoot()?'':'sel')+'">Off</button></div>')+
 sec('More','<div class="a3r"><button class="pgb" data-k="locknow">Lock now / Sign out</button><button class="pgb" data-k="oobe">Run setup again</button><button class="pgb a3d" data-a3="reset">Reset account</button></div><p class="bnote">This is NexOS\'s own screen lock. It keeps the desktop private, but it does not protect your phone or its files.</p>')+'</div>'}
function v(id){var e=document.getElementById(id);return e?e.value:''}
function gate(){if(!locked())return Promise.resolve(true);var c=v('a3cur');if(!c){toast('Enter your current PIN or password first');return Promise.resolve(false)}
 if(left()>0){toast('Too many tries. Wait '+left()+' s');return Promise.resolve(false)}
 return Promise.all([hasPin()?verify('pin',c):false,hasPw()?verify('pw',c):false]).then(function(r){if(r[0]||r[1]){okReset();return true}fail();toast('Wrong PIN or password');return false})}
function redraw(){var p=document.getElementById('spg');if(p&&p.querySelector('.acc3')){var t=p.scrollTop;p.innerHTML='<button class="sbk" data-k="back">&#8249; Settings</button>'+acctHTML();p.scrollTop=t;drawAv(p.querySelector('.acc3 .av2'))}}
document.addEventListener('click',function(e){var b=e.target.closest('[data-a3]');if(!b)return;e.stopPropagation();var k=b.dataset.a3;
 if(k==='pic'){pickAvatar();return}if(k==='nopic'){s(K.av,'');paintAll();redraw();return}
 if(k==='name'){NX4.setName(v('a3un').trim()||'User');toast('Username saved');redraw();return}
 if(k==='reset'){if(b.dataset.c!=='1'){b.dataset.c='1';b.textContent='Tap again to confirm';setTimeout(function(){b.dataset.c='';b.textContent='Reset account'},3500);return}
  gate().then(function(ok){if(!ok)return;[K.pin,K.pw,K.rw,K.mk,K.pl,K.av,K.user,K.fails,K.until,'aur.oobe'].forEach(function(x){s(x,'')});paintAll();redraw();toast('Account reset');NX4.oobe()});return}
 gate().then(function(ok){if(!ok)return;
  if(k==='setpin'){var a=v('a3p1').trim(),c=v('a3p2').trim();if(!okPin(a))return toast('The PIN must be 4 to 8 digits');if(a!==c)return toast('The two PINs are different');setCred('pin',a).then(function(){toast('PIN saved');redraw()})}
  else if(k==='clrpin'){clearCred('pin');toast('PIN removed');redraw()}
  else if(k==='setpw'){var a2=v('a3w1'),c2=v('a3w2');if(a2.length<4)return toast('The password needs 4 or more characters');if(a2!==c2)return toast('The two passwords are different');setCred('pw',a2).then(function(){toast('Password saved');redraw()})}
  else if(k==='clrpw'){clearCred('pw');toast('Password removed');redraw()}
  else if(k==='setrw'){var w=v('a3rw').trim().toLowerCase();if(w.length<3)return toast('The word needs 3 or more characters');mk(w).then(function(r){s(K.rw,r);toast('Recovery word saved');redraw()})}
  else if(k==='clrrw'){s(K.rw,'');toast('Recovery word removed');redraw()}})},true);
new MutationObserver(function(){var p=document.getElementById('spg');if(!p||p.querySelector('.acc3'))return;if(p.querySelector('.acc0')&&p.querySelector('#unm')){var t=p.scrollTop;p.innerHTML='<button class="sbk" data-k="back">&#8249; Settings</button>'+acctHTML();p.scrollTop=t;drawAv(p.querySelector('.acc3 .av2'))}}).observe(document.body,{childList:true,subtree:true});
/* ---------- first-run setup: recovery word ---------- */
new MutationObserver(function(){var oc=document.querySelector('#oobe .oc');if(!oc||!oc.querySelector('#oo-p2')||oc.querySelector('#oo-rw'))return;
 var d=document.createElement('input');d.id='oo-rw';d.placeholder='Recovery word (optional)';d.autocomplete='off';oc.querySelector('#oo-p2').insertAdjacentElement('afterend',d);
 var n=document.createElement('p');n.style.cssText='font-size:12px;margin:8px 0 0;opacity:.7';n.textContent='If you forget your PIN, typing this word on the lock screen lets you set a new one.';d.insertAdjacentElement('afterend',n)}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',function(e){var b=e.target.closest('#oobe [data-o="next"]'),d=document.getElementById('oo-rw');if(!b||!d)return;var w=d.value.trim().toLowerCase();if(!w)return;
 if(w.length<3){e.stopPropagation();var m=document.getElementById('oo-m');if(m)m.textContent='The recovery word needs 3 or more characters';return}
 mk(w).then(function(r){s(K.rw,r)})},true);
paintAll();if(!window.crypto||!crypto.subtle)console.warn('ACC-3.3.0: WebCrypto missing, PIN checks will fail');
})();
