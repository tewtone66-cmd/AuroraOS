/* VKB-3.5.0 - themed on-screen PC keyboard (EN + Persian), corner toggle button, cursor styles incl. Liquid Glass (injected by scripts/prepare-web.mjs) */
(function(){'use strict';
if(typeof ls!=='function')return;
var root=document.documentElement,doc=document;
function g(k,d){var v;try{v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{ls(k,v)}catch(e){}}
/* ================= key tables ================= */
var PUN={Backquote:['`','~'],Digit1:['1','!'],Digit2:['2','@'],Digit3:['3','#'],Digit4:['4','$'],Digit5:['5','%'],Digit6:['6','^'],Digit7:['7','&'],Digit8:['8','*'],Digit9:['9','('],Digit0:['0',')'],Minus:['-','_'],Equal:['=','+'],BracketLeft:['[','{'],BracketRight:[']','}'],Backslash:['\\','|'],Semicolon:[';',':'],Quote:["'",'"'],Comma:[',','<'],Period:['.','>'],Slash:['/','?']};
/* Persian (Windows standard) layout - approximate for rarely used shifted keys */
var FA={KeyQ:['ض','ْ'],KeyW:['ص','ٌ'],KeyE:['ث','ٍ'],KeyR:['ق','ً'],KeyT:['ف','ُ'],KeyY:['غ','ِ'],KeyU:['ع','َ'],KeyI:['ه','ّ'],KeyO:['خ',']'],KeyP:['ح','['],BracketLeft:['ج','}'],BracketRight:['چ','{'],Backslash:['پ','|'],KeyA:['ش','ؤ'],KeyS:['س','ئ'],KeyD:['ی','ي'],KeyF:['ب','إ'],KeyG:['ل','أ'],KeyH:['ا','آ'],KeyJ:['ت','ة'],KeyK:['ن','»'],KeyL:['م','«'],Semicolon:['ک',':'],Quote:['گ','؛'],KeyZ:['ظ','ك'],KeyX:['ط'],KeyC:['ز','ژ'],KeyV:['ر'],KeyB:['ذ'],KeyN:['د','ء'],KeyM:['ئ'],Comma:['و','<'],Period:['.','>'],Slash:['/','؟'],Digit1:['۱','!'],Digit2:['۲','٬'],Digit3:['۳','٫'],Digit4:['۴','﷼'],Digit5:['۵','٪'],Digit6:['۶','×'],Digit7:['۷','،'],Digit8:['۸','*'],Digit9:['۹',')'],Digit0:['۰','('],Backquote:['‍','÷']};
var NK={ShiftLeft:'Shift',ShiftRight:'Shift',ControlLeft:'Control',ControlRight:'Control',AltLeft:'Alt',AltRight:'Alt',MetaLeft:'Meta'};
var KC={Backspace:8,Tab:9,Enter:13,ShiftLeft:16,ShiftRight:16,ControlLeft:17,ControlRight:17,AltLeft:18,AltRight:18,Pause:19,CapsLock:20,Escape:27,Space:32,PageUp:33,PageDown:34,End:35,Home:36,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40,PrintScreen:44,Insert:45,Delete:46,MetaLeft:91,ScrollLock:145,Semicolon:186,Equal:187,Comma:188,Minus:189,Period:190,Slash:191,Backquote:192,BracketLeft:219,Backslash:220,BracketRight:221,Quote:222};
for(var i=0;i<26;i++)KC['Key'+String.fromCharCode(65+i)]=65+i;
for(i=0;i<10;i++)KC['Digit'+i]=48+i;
for(i=1;i<=12;i++)KC['F'+i]=111+i;
function F(n){var a=[];for(var j=1;j<=n;j++)a.push(['F'+j,'F'+j,1,'f']);return a}
function ks(s){return s.split(' ').map(function(c){return[c,'',1,'']})}
var ROWS=[
 [['Escape','Esc',1.5,'f']].concat(F(12),[['Delete','Del',1.5,'f']]),
 ks('Backquote Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal').concat([['Backspace','⌫',2,'w']]),
 [['Tab','Tab',1.5,'w']].concat(ks('KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP BracketLeft BracketRight'),[['Backslash','',1.5,'']]),
 [['CapsLock','Caps',1.75,'w m']].concat(ks('KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL Semicolon Quote'),[['Enter','Enter ⏎',2.25,'w']]),
 [['ShiftLeft','Shift',2.25,'w m']].concat(ks('KeyZ KeyX KeyC KeyV KeyB KeyN KeyM Comma Period Slash'),[['ShiftRight','Shift',2.75,'w m']]),
 [['ControlLeft','Ctrl',1.25,'w m'],['MetaLeft','Win',1.25,'w m'],['AltLeft','Alt',1.25,'w m'],['Space','',5.75,''],['AltRight','Alt',1.25,'w m'],['ControlRight','Ctrl',1.25,'w m'],['ArrowLeft','◀',1,'a'],['STACK','',1,''],['ArrowRight','▶',1,'a']],
 [['SP','',7,'']].concat([['Insert','Ins',1,'f'],['Home','Home',1,'f'],['PageUp','PgUp',1,'f'],['PageDown','PgDn',1,'f'],['End','End',1,'f'],['PrintScreen','PrtSc',1,'f'],['ScrollLock','ScrLk',1,'f'],['Pause','Pause',1,'f']])
];
/* ================= state ================= */
var st={shift:0,caps:false,ctrl:false,alt:false,meta:false,fa:g('aur.kbfa','0')==='1'};
var keys={},panel,btn,lastT=0;
function mods(){return{shift:!!st.shift,ctrl:st.ctrl,alt:st.alt,meta:st.meta}}
function charFor(c){var sh=!!st.shift;
 if(st.fa&&FA[c])return sh&&FA[c][1]?FA[c][1]:FA[c][0];
 if(/^Key[A-Z]$/.test(c)){var ch=c[3].toLowerCase();return(sh!==st.caps)?ch.toUpperCase():ch}
 if(PUN[c])return sh?PUN[c][1]:PUN[c][0];
 if(c==='Space')return' ';
 return null}
function fire(t,el,c,key,m,rep){var e;try{e=new KeyboardEvent(t,{key:key,code:c,bubbles:true,cancelable:true,composed:true,shiftKey:m.shift,ctrlKey:m.ctrl,altKey:m.alt,metaKey:m.meta,repeat:!!rep})}catch(x){return true}
 var kc=KC[c]||0;try{Object.defineProperty(e,'keyCode',{get:function(){return kc}});Object.defineProperty(e,'which',{get:function(){return kc}})}catch(x){}
 return el.dispatchEvent(e)}
function isEdit(el){return!!el&&(el.isContentEditable||el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&/^(text|search|url|tel|password|email|number|)$/i.test(el.type||'')))}
function isBtn(el){return!!el&&(/^(BUTTON|A|SUMMARY)$/.test(el.tagName)||el.getAttribute('role')==='button')}
function typeChar(el,ch){if(isEdit(el)){var ok=false;try{ok=doc.execCommand('insertText',false,ch)}catch(e){}
  if(!ok&&el.setRangeText){try{el.setRangeText(ch,el.selectionStart,el.selectionEnd,'end');el.dispatchEvent(new Event('input',{bubbles:true}))}catch(e){}}}
 else if(ch===' '&&isBtn(el))el.click()}
function lineStart(v,p){return v.lastIndexOf('\n',p-1)+1}
function lineEnd(v,p){var i=v.indexOf('\n',p);return i<0?v.length:i}
function caret(el,c,m){
 if(el.tagName==='INPUT'||el.tagName==='TEXTAREA'){try{
  var v=el.value,s=el.selectionStart,e=el.selectionEnd,bw=el.selectionDirection==='backward',pos=bw?s:e,anc=bw?e:s,ta=el.tagName==='TEXTAREA',np=pos,a,col,b;
  if(c==='ArrowLeft')np=(s!==e&&!m.shift)?s:Math.max(0,pos-1);
  else if(c==='ArrowRight')np=(s!==e&&!m.shift)?e:Math.min(v.length,pos+1);
  else if(c==='Home')np=m.ctrl?0:(ta?lineStart(v,pos):0);
  else if(c==='End')np=m.ctrl?v.length:(ta?lineEnd(v,pos):v.length);
  else if(ta&&c==='ArrowUp'){a=lineStart(v,pos);col=pos-a;np=a===0?0:Math.min(lineStart(v,a-1)+col,a-1)}
  else if(ta&&c==='ArrowDown'){b=lineEnd(v,pos);np=b>=v.length?v.length:Math.min(b+1+col0(v,pos),lineEnd(v,b+1))}
  else return;
  if(m.shift)el.setSelectionRange(Math.min(anc,np),Math.max(anc,np),np<anc?'backward':'forward');else el.setSelectionRange(np,np)}catch(x){}}
 else if(el.isContentEditable&&getSelection().modify){var d=/Left|Up|Home/.test(c)?'backward':'forward',gr=/Up|Down/.test(c)?'line':(/Home|End/.test(c)?'lineboundary':(m.ctrl?'word':'character'));getSelection().modify(m.shift?'extend':'move',d,gr)}}
function col0(v,p){return p-lineStart(v,p)}
function focusMove(back){var q=[].filter.call(doc.querySelectorAll('input,textarea,select,button,a[href],[tabindex]'),function(x){return!x.closest('.nxkb')&&!x.disabled&&x.tabIndex>=0&&x.offsetParent!==null});if(!q.length)return;var i=q.indexOf(doc.activeElement);i=i<0?0:(i+(back?-1:1)+q.length)%q.length;q[i].focus()}
function shortcut(el,c){try{
 if(c==='KeyA'){if(el.select&&isEdit(el))el.select();else doc.execCommand('selectAll')}
 else if(c==='KeyC'){if(!doc.execCommand('copy')&&navigator.clipboard)navigator.clipboard.writeText(String(getSelection()))}
 else if(c==='KeyX'){doc.execCommand('cut')}
 else if(c==='KeyV'){if(navigator.clipboard&&navigator.clipboard.readText)navigator.clipboard.readText().then(function(t){typeChar(el,t)},function(){doc.execCommand('paste')});else doc.execCommand('paste')}
 else if(c==='KeyZ'){doc.execCommand('undo')}
 else if(c==='KeyY'){doc.execCommand('redo')}}catch(e){}}
function edit(el,c,m){var ed=isEdit(el);
 if(c==='Backspace'){if(ed)doc.execCommand('delete')}
 else if(c==='Delete'){if(ed)doc.execCommand('forwardDelete')}
 else if(c==='Enter'){if(el.tagName==='TEXTAREA')typeChar(el,'\n');else if(el.isContentEditable)doc.execCommand('insertParagraph');else if(isBtn(el))el.click()}
 else if(c==='Tab'){if(el.tagName==='TEXTAREA'&&!m.shift){}else focusMove(m.shift)}
 else if(/^Arrow|^Home$|^End$/.test(c))caret(el,c,m)}
function act(c,rep){var el=doc.activeElement||doc.body,m=mods(),ch=charFor(c),key=ch!=null?ch:(NK[c]||c);
 if(fire('keydown',el,c,key,m,rep)){if(m.ctrl||m.meta)shortcut(el,c);else if(ch!=null&&!m.alt)typeChar(el,ch);else edit(el,c,m)}
 return key}
/* ================= modifiers ================= */
function isMod(c){return/^(Shift|Control|Alt|Meta)(Left|Right)$/.test(c)||c==='CapsLock'}
function paintMods(){Object.keys(keys).forEach(function(c){var e=keys[c].el;
 if(/^Shift/.test(c))e.classList.toggle('on',!!st.shift),e.classList.toggle('lock',st.shift===2);
 else if(c==='CapsLock')e.classList.toggle('on',st.caps);
 else if(/^Control/.test(c))e.classList.toggle('on',st.ctrl);
 else if(/^Alt/.test(c))e.classList.toggle('on',st.alt);
 else if(c==='MetaLeft')e.classList.toggle('on',st.meta)});relabel()}
function relKey(name,flag){var el=doc.activeElement||doc.body;fire(flag?'keydown':'keyup',el,name,NK[name]||name,mods())}
function toggleMod(c){var t=Date.now();
 if(/^Shift/.test(c)){if(st.shift===0){st.shift=(t-lastT<350)?2:1;relKey('ShiftLeft',1)}else{st.shift=0;relKey('ShiftLeft',0)}lastT=t}
 else if(c==='CapsLock'){st.caps=!st.caps;relKey(c,1);relKey(c,0)}
 else{var k=/^Control/.test(c)?'ctrl':/^Alt/.test(c)?'alt':'meta';st[k]=!st[k];relKey(c,st[k])}
 paintMods()}
function oneShot(){var ch=false;if(st.shift===1){st.shift=0;relKey('ShiftLeft',0);ch=true}
 if(st.ctrl){st.ctrl=false;relKey('ControlLeft',0);ch=true}if(st.alt){st.alt=false;relKey('AltLeft',0);ch=true}if(st.meta){st.meta=false;relKey('MetaLeft',0);ch=true}
 if(ch)paintMods()}
/* ================= build ================= */
function relabel(){Object.keys(keys).forEach(function(c){var k=keys[c];if(k.fixed)return;var ch=charFor(c),b=k.el.firstChild,s=k.el.lastChild,sm='';
 if(c!=='Space'){b.textContent=ch==null?'':ch;
  if(!/^Key/.test(c)||st.fa){var o=st.fa&&FA[c]?FA[c][st.shift?0:1]:(PUN[c]?PUN[c][st.shift?0:1]:'');sm=o||''}}
 else b.textContent='';s.textContent=sm})}
function mk(def,idx){var c=def[0],el=doc.createElement('div');el.className='k '+def[3];el.style.flex=def[2]+' 1 0';el.style.setProperty('--i',idx);
 if(c==='SP'){el.className='sp';el.style.flex=def[2]+' 1 0';return el}
 if(c==='STACK'){el.className='sk';el.style.flex='1 1 0';['ArrowUp','ArrowDown'].forEach(function(a){var h=doc.createElement('div');h.className='k a h';h.dataset.c=a;h.innerHTML='<b>'+(a==='ArrowUp'?'▲':'▼')+'</b><i></i>';keys[a]={el:h,fixed:true};el.appendChild(h)});return el}
 el.dataset.c=c;var fixed=!!def[1];el.innerHTML='<b>'+def[1]+'</b><i></i>';keys[c]={el:el,fixed:fixed};return el}
var CSS=[
'.nxkb{position:fixed;left:50%;bottom:66px;width:min(98vw,1020px);z-index:2147483000;padding:6px 8px 10px;border-radius:20px;color:var(--txt);background:var(--pn,#161a22);border:1px solid var(--line);box-shadow:0 24px 64px rgba(0,0,0,.42);transform:translate(calc(-50% + var(--dx,0px)),calc(var(--dy,0px) + 24px)) scale(.96);opacity:0;pointer-events:none;transition:transform .34s cubic-bezier(.2,.9,.25,1.12),opacity .2s;-webkit-user-select:none;user-select:none;touch-action:none;font-family:system-ui,sans-serif}',
'.nxkb.open{transform:translate(calc(-50% + var(--dx,0px)),var(--dy,0px)) scale(1);opacity:1;pointer-events:auto}',
'.nxkb-top{display:flex;align-items:center;gap:8px;padding:2px 4px 6px;font-size:12px;color:var(--mut);cursor:grab}.nxkb-top span{flex:1;letter-spacing:.3px;font-weight:600}.nxkb-top .k{flex:none;width:44px;height:26px;font-size:12px}',
'.nxkb-rows{display:flex;flex-direction:column;gap:5px;--kh:clamp(28px,4.9vw,44px)}',
'.nxkb-r{display:flex;gap:5px}.nxkb-r.nav{--kh:calc(clamp(28px,4.9vw,44px)*.62)}',
'.nxkb .sp{pointer-events:none}.nxkb .sk{display:flex;flex-direction:column;gap:3px}',
'.nxkb .k{position:relative;min-width:0;height:var(--kh,40px);display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--surf2,rgba(255,255,255,.08));border:1px solid var(--line);box-shadow:0 2px 0 rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.12);font:600 clamp(10px,1.55vw,15px) system-ui,sans-serif;overflow:hidden;cursor:pointer;transition:transform .09s,background .14s,box-shadow .12s,color .12s;animation:none}',
'.nxkb .k.h{height:auto;flex:1;border-radius:7px;font-size:10px}.nxkb .k.f,.nxkb .nav .k{font-size:clamp(9px,1.3vw,12px);color:var(--mut)}',
'.nxkb .k i{position:absolute;top:2px;left:5px;font-style:normal;font-size:.68em;opacity:.55;font-weight:500}',
'.nxkb .k::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.6),transparent 62%);opacity:0;pointer-events:none}',
'.nxkb .k.dn{transform:translateY(2px) scale(.94);background:var(--acc);color:var(--accT);box-shadow:0 0 0 rgba(0,0,0,0),0 0 18px var(--acc)}.nxkb .k.dn::after{animation:nxrip .45s ease-out}',
'.nxkb .k.on{border-color:var(--acc);box-shadow:0 2px 0 rgba(0,0,0,.28),0 0 0 1px var(--acc) inset,0 0 12px rgba(124,155,255,.45);color:var(--acc)}.nxkb .k.lock{background:var(--acc);color:var(--accT)}',
'@keyframes nxrip{0%{opacity:.95;transform:scale(.3)}100%{opacity:0;transform:scale(1.7)}}',
'@keyframes nxpop{from{opacity:0;transform:translateY(10px) scale(.88)}to{opacity:1;transform:none}}',
'.nxkb.open .k{animation:nxpop .38s cubic-bezier(.2,.9,.25,1.2) backwards;animation-delay:calc(var(--i,0)*7ms)}',
'#nxkbBtn{position:fixed;right:14px;bottom:78px;width:40px;height:40px;border-radius:14px;display:grid;place-items:center;z-index:2147483001;cursor:pointer;color:var(--txt);background:var(--pn,#161a22);border:1px solid var(--line);box-shadow:0 6px 18px rgba(0,0,0,.32);transition:transform .15s,background .2s,color .2s;touch-action:none;-webkit-user-select:none;user-select:none}',
'#nxkbBtn svg{width:22px;height:22px;pointer-events:none}#nxkbBtn:active{transform:scale(.9)}#nxkbBtn.on{background:var(--acc);color:var(--accT)}body.nxkb-off #nxkbBtn{display:none}',
/* glass skin */
':root[data-skin=glass] .nxkb,:root[data-skin=glass] #nxkbBtn{background-color:rgba(26,34,58,.5);background-image:radial-gradient(120% 70% at 0% 0%,rgba(255,255,255,.22),rgba(255,255,255,0) 55%),linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0));border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.2),0 24px 60px rgba(0,0,0,.38)}',
':root[data-skin=glass] body:not(.perf):not(.lite) :is(.nxkb,#nxkbBtn){-webkit-backdrop-filter:blur(var(--nx-blur,26px)) saturate(170%);backdrop-filter:blur(var(--nx-blur,26px)) saturate(170%)}',
':root[data-skin=glass] .nxkb .k{background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.07));border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -1px 0 rgba(0,0,0,.18),0 3px 8px rgba(0,0,0,.2)}',
':root[data-skin=glass] .nxkb .k.dn{background:linear-gradient(180deg,rgba(170,200,255,.75),rgba(110,150,245,.55));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 0 20px rgba(120,160,255,.65)}',
/* settings cards */
'.nxc{margin:0 0 18px}.nxc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin:10px 0 14px}',
'.nxc-card{position:relative;display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:16px;border:2px solid var(--line);background:var(--surf2);color:var(--txt);font:inherit;text-align:left;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s}',
'.nxc-card:active{transform:scale(.98)}.nxc-card img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;display:block;pointer-events:none}.nxc-card b{font-size:13px;padding:0 2px}.nxc-card small{font-size:11px;color:var(--mut);padding:0 2px 2px}',
'.nxc-card.sel{border-color:var(--acc);box-shadow:0 0 0 3px rgba(124,155,255,.28)}.nxc-card.sel::after{content:"\\2713";position:absolute;top:14px;right:14px;width:22px;height:22px;border-radius:50%;background:var(--acc);color:var(--accT);display:grid;place-items:center;font-size:13px;font-weight:700}',
/* cursor styles (targets the virtual cursor element #cur) */
':root[data-nxcur] #cur{background:none!important;filter:none!important;overflow:visible}:root[data-nxcur] #cur>*{opacity:0!important}',
':root[data-nxcur] #cur::before,:root[data-nxcur] #cur::after{content:"";position:absolute;left:0;top:0;width:26px;height:26px;pointer-events:none}',
':root[data-nxcur=classic] #cur::before{background:url("'+arrow('#fff','#111',1,1.6)+'") no-repeat;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}',
':root[data-nxcur=glass] #cur::before{clip-path:path("M2 1 L2 20 L7 15.4 L10.4 23.2 L14.2 21.6 L10.8 13.9 L17.6 13.9 Z");background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(150,190,255,.3) 60%,rgba(255,255,255,.5));-webkit-backdrop-filter:blur(6px) saturate(170%);backdrop-filter:blur(6px) saturate(170%)}',
':root[data-nxcur=glass] #cur::after{background:url("'+arrow('none','#fff',.95,1.2,true)+'") no-repeat;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}',
'body.perf :root[data-nxcur=glass] #cur::before{-webkit-backdrop-filter:none;backdrop-filter:none}'
].join('\n');
function arrow(fill,stroke,op,w,rim){var d='M2 1L2 20L7 15.4L10.4 23.2L14.2 21.6L10.8 13.9L17.6 13.9Z';
 var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26">'+(rim?'<path d="'+d+'" fill="none" stroke="#0b1020" stroke-opacity=".45" stroke-width="2.6" stroke-linejoin="round"/>':'')+'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-opacity="'+op+'" stroke-width="'+w+'" stroke-linejoin="round"/></svg>';
 return'data:image/svg+xml;utf8,'+encodeURIComponent(s).replace(/"/g,'%22')}
var sty=doc.createElement('style');sty.id='nx-vkb-css';sty.textContent=CSS;doc.head.appendChild(sty);
function build(){panel=doc.createElement('div');panel.className='nxkb';panel.id='nxkb';
 var top=doc.createElement('div');top.className='nxkb-top';top.innerHTML='<span>NexOS Keyboard</span><div class="k" data-c="Lang"><b></b><i></i></div><div class="k" data-c="Hide"><b>✕</b><i></i></div>';panel.appendChild(top);
 keys.Lang={el:top.children[1],fixed:true};keys.Hide={el:top.children[2],fixed:true};
 var rows=doc.createElement('div');rows.className='nxkb-rows';var n=0;
 ROWS.forEach(function(r,ri){var row=doc.createElement('div');row.className='nxkb-r'+(ri===6?' nav':'');r.forEach(function(d){row.appendChild(mk(d,n++))});rows.appendChild(row)});
 panel.appendChild(rows);doc.body.appendChild(panel);relabel();langLabel();
 btn=doc.createElement('div');btn.id='nxkbBtn';btn.title='Keyboard';btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>';doc.body.appendChild(btn);
 var p=null;try{p=JSON.parse(g('aur.kbpos','null'))}catch(e){}if(p){btn.style.left=p.x+'px';btn.style.top=p.y+'px';btn.style.right='auto';btn.style.bottom='auto'}
 doc.body.classList.toggle('nxkb-off',g('aur.kbbtn','1')==='0')}
function langLabel(){var l=keys.Lang;if(l){l.el.firstChild.textContent=st.fa?'فا':'EN'}}
function openKb(v){var o=v==null?!panel.classList.contains('open'):v;panel.classList.toggle('open',o);btn.classList.toggle('on',o)}
/* ================= input handling ================= */
var presses={},recent=0,rt=0,ri=0,focusEl=null;
function repeatable(c){return!isMod(c)&&!/^(F\d+|Escape|Insert|PrintScreen|ScrollLock|Pause|Lang|Hide)$/.test(c)}
function keyDown(pid,el){var c=el.dataset.c;if(!c||presses[pid])return;presses[pid]=el;focusEl=doc.activeElement;el.classList.add('dn');
 if(c==='Hide'){openKb(false);return}
 if(c==='Lang'){st.fa=!st.fa;put('aur.kbfa',st.fa?'1':'0');langLabel();relabel();return}
 if(isMod(c)){toggleMod(c);return}
 var key=act(c,false);el._k=key;oneShot();
 if(repeatable(c)){clearTimeout(rt);clearInterval(ri);rt=setTimeout(function(){ri=setInterval(function(){act(c,true)},42)},420)}}
function keyUp(pid){var el=presses[pid];if(!el)return;delete presses[pid];el.classList.remove('dn');clearTimeout(rt);clearInterval(ri);
 var c=el.dataset.c;if(el._k!=null&&!isMod(c)&&c!=='Lang'&&c!=='Hide'){fire('keyup',doc.activeElement||doc.body,c,el._k,mods());el._k=null}
 if(focusEl&&doc.activeElement!==focusEl&&(!doc.activeElement||doc.activeElement===doc.body)){try{focusEl.focus()}catch(e){}}}
function keyEl(t){return t&&t.closest?t.closest('.nxkb .k[data-c]'):null}
doc.addEventListener('pointerdown',function(e){var k=keyEl(e.target);if(!k)return;recent=Date.now();keyDown(e.pointerId,k)},true);
['pointerup','pointercancel'].forEach(function(t){doc.addEventListener(t,function(e){keyUp(e.pointerId)},true)});
doc.addEventListener('mousedown',function(e){var k=keyEl(e.target);if(!k)return;e.preventDefault();if(Date.now()-recent>500){recent=Date.now();keyDown('m',k)}},true);
doc.addEventListener('mouseup',function(){if(presses.m)keyUp('m')},true);
doc.addEventListener('click',function(e){var k=keyEl(e.target);if(k&&Date.now()-recent>700){keyDown('c',k);setTimeout(function(){keyUp('c')},90)}},true);
/* real keyboard feedback */
doc.addEventListener('keydown',function(e){if(!e.isTrusted||!panel)return;var k=keys[e.code];if(k)k.el.classList.add('dn')},true);
doc.addEventListener('keyup',function(e){if(!e.isTrusted||!panel)return;var k=keys[e.code];if(k)k.el.classList.remove('dn')},true);
/* drag the panel by its top bar; drag the corner button; tap to toggle */
function drag(el,start,move,end){var id=null,sx,sy,m=false;
 el.addEventListener('pointerdown',function(e){if(e.target.closest&&e.target.closest('.k')&&el===panel)return;if(el===panel&&!e.target.closest('.nxkb-top'))return;id=e.pointerId;sx=e.clientX;sy=e.clientY;m=false;start(e)});
 doc.addEventListener('pointermove',function(e){if(e.pointerId!==id)return;var dx=e.clientX-sx,dy=e.clientY-sy;if(!m&&Math.abs(dx)+Math.abs(dy)>6)m=true;if(m)move(dx,dy,e)});
 ['pointerup','pointercancel'].forEach(function(t){doc.addEventListener(t,function(e){if(e.pointerId!==id)return;id=null;end(m)})})}
function init(){build();
 var bx=0,by=0,px=0,py=0;
 drag(panel,function(){px=parseFloat(panel.style.getPropertyValue('--dx'))||0;py=parseFloat(panel.style.getPropertyValue('--dy'))||0;panel.style.transition='none'},function(dx,dy){panel.style.setProperty('--dx',(px+dx)+'px');panel.style.setProperty('--dy',(py+dy)+'px')},function(){panel.style.transition=''});
 drag(btn,function(){var r=btn.getBoundingClientRect();bx=r.left;by=r.top;btn.style.transition='none'},function(dx,dy){btn.style.left=Math.max(0,Math.min(innerWidth-40,bx+dx))+'px';btn.style.top=Math.max(0,Math.min(innerHeight-40,by+dy))+'px';btn.style.right='auto';btn.style.bottom='auto'},function(moved){btn.style.transition='';if(moved){var r=btn.getBoundingClientRect();put('aur.kbpos',JSON.stringify({x:Math.round(r.left),y:Math.round(r.top)}))}else openKb()});
 btn.addEventListener('mousedown',function(e){e.preventDefault()});
 btn.addEventListener('click',function(){if(Date.now()-recent>700&&!btn._d){/* fallback for synthetic click-only input */}});
 window.NXKB={open:function(){openKb(true)},close:function(){openKb(false)},toggle:function(){openKb()}};
 applyCur()}
/* ================= cursor style + settings ================= */
function applyCur(){var v=g('aur.cur','default');if(v==='default')root.removeAttribute('data-nxcur');else root.setAttribute('data-nxcur',v)}
function pv(kind){var bg=kind==='glass'?'<defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset=".5" stop-color="#06b6d4"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect width="320" height="200" fill="url(#w)"/>':'<rect width="320" height="200" fill="#1e293b"/>';
 var d='M120 40L120 130L150 104L170 150L192 140L172 94L214 94Z';
 var a=kind==='glass'?'<path d="'+d+'" fill="rgba(255,255,255,.4)" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>':kind==='classic'?'<path d="'+d+'" fill="#fff" stroke="#111" stroke-width="5" stroke-linejoin="round"/>':'<path d="'+d+'" fill="#e5e7eb" stroke="#6b7280" stroke-width="4" stroke-linejoin="round" opacity=".8"/>';
 return'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">'+bg+a+'</svg>')}
var CUR=[['default','Default','Unchanged'],['classic','Classic','Clean white arrow'],['glass','Liquid Glass','Frosted glass pointer']];
function curHtml(){var v=g('aur.cur','default');return'<h4>Cursor style</h4><div class="nxc-grid">'+CUR.map(function(c){return'<button class="nxc-card'+(v===c[0]?' sel':'')+'" data-nxc="'+c[0]+'"><img src="'+pv(c[0])+'" alt="" draggable="false"><b>'+c[1]+'</b><small>'+c[2]+'</small></button>'}).join('')+'</div>'+
 '<h4>On-screen keyboard button</h4><div class="seg"><button data-nxkv="1" class="'+(g('aur.kbbtn','1')==='1'?'sel':'')+'">On</button><button data-nxkv="0" class="'+(g('aur.kbbtn','1')==='0'?'sel':'')+'">Off</button></div>'}
function injectMouse(){var p=doc.getElementById('spg');if(!p||p.querySelector('.nxc'))return;
 var hs=p.querySelectorAll('h3'),h=null;for(var i=0;i<hs.length;i++)if(/^\s*(mouse|pointer|cursor)/i.test(hs[i].textContent)){h=hs[i];break}
 var box=doc.createElement('div');box.className='nxc';box.innerHTML=curHtml();
 if(h)h.parentNode.insertBefore(box,h.nextSibling);else{var t=p.querySelector('.nxt');if(!t)return;t.appendChild(box)}}
doc.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var c=t.closest('[data-nxc]');
 if(c){e.stopPropagation();e.preventDefault();put('aur.cur',c.dataset.nxc);applyCur();doc.querySelectorAll('.nxc-card').forEach(function(x){x.classList.toggle('sel',x.dataset.nxc===c.dataset.nxc)});return}
 var k=t.closest('[data-nxkv]');if(k){e.stopPropagation();e.preventDefault();put('aur.kbbtn',k.dataset.nxkv);doc.body.classList.toggle('nxkb-off',k.dataset.nxkv==='0');if(k.dataset.nxkv==='0')openKb(false);k.parentNode.querySelectorAll('button').forEach(function(x){x.classList.toggle('sel',x===k)})}},true);
var raf=0;new MutationObserver(function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;injectMouse()})}).observe(doc.body,{childList:true,subtree:true});
init();injectMouse();
})();
