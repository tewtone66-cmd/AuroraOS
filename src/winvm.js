/* Aurora OS - Windows VM app (v86). Loaded after the main script; uses its globals. */
function mkFloppy(name,bytes){
  const SS=512,TOT=2880,FATS=9,ROOT=14,DATA=1+2*FATS+ROOT,max=(TOT-DATA)*SS;
  if(bytes.length>max)throw new Error('File too big for the shared disk (max '+Math.floor(max/1024)+' KB)');
  const d=new Uint8Array(TOT*SS),dv=new DataView(d.buffer);
  d.set([0xEB,0x3C,0x90],0);d.set([...'MSDOS5.0'].map(c=>c.charCodeAt(0)),3);
  dv.setUint16(11,SS,true);d[13]=1;dv.setUint16(14,1,true);d[16]=2;dv.setUint16(17,224,true);dv.setUint16(19,TOT,true);d[21]=0xF0;dv.setUint16(22,FATS,true);dv.setUint16(24,18,true);dv.setUint16(26,2,true);
  d[38]=0x29;dv.setUint32(39,0x41555231,true);d.set([...'AURORA     '].map(c=>c.charCodeAt(0)),43);d.set([...'FAT12   '].map(c=>c.charCodeAt(0)),54);d[510]=0x55;d[511]=0xAA;
  const n=Math.max(1,Math.ceil(bytes.length/SS)),fat=new Uint8Array(FATS*SS);
  const setF=(i,v)=>{const o=Math.floor(i*3/2);if(i%2===0){fat[o]=v&0xFF;fat[o+1]=(fat[o+1]&0xF0)|((v>>8)&0x0F)}else{fat[o]=(fat[o]&0x0F)|((v&0x0F)<<4);fat[o+1]=(v>>4)&0xFF}};
  setF(0,0xFF0);setF(1,0xFFF);for(let i=0;i<n;i++)setF(2+i,i===n-1?0xFFF:3+i);
  d.set(fat,SS);d.set(fat,SS+FATS*SS);
  const dot=name.lastIndexOf('.'),clean=s=>s.toUpperCase().replace(/[^A-Z0-9_]/g,'_');
  const base=clean(dot>0?name.slice(0,dot):name).slice(0,8)||'PROGRAM',ext=clean(dot>0?name.slice(dot+1):'EXE').slice(0,3)||'EXE';
  const ro=(1+2*FATS)*SS,e=[...(base.padEnd(8,' ')+ext.padEnd(3,' '))].map(c=>c.charCodeAt(0));
  d.set(e,ro);d[ro+11]=0x20;dv.setUint16(ro+26,2,true);dv.setUint32(ro+28,bytes.length,true);
  d.set(bytes,DATA*SS);
  return {buffer:d.buffer,dosName:base+'.'+ext};
}
if(typeof module!=='undefined')module.exports={mkFloppy};
if(typeof A!=='undefined'){
IC.win=P('<path d="M3 5l8-1.2V11H3zM13 3.6L21 2.5V11h-8zM3 13h8v7.2L3 19zM13 13h8v8.5L13 20.4z"/>');
A.win={n:'Windows PC',g:'linear-gradient(145deg,#60a5fa,#1d4ed8)',w:760,h:520,f:appWin};
function appWin(w,arg){
  const B=w.body,V={emu:null,exe:(arg&&arg.exe)||null,held:false,running:false};
  B.innerHTML=`<div class="vmw"><div class="vmt"><button class="ib" data-k="go">Start</button><button class="ib" data-k="kb">Keyboard</button><button class="ib" data-k="ent">Enter</button><button class="ib" data-k="esc">Esc</button><button class="ib" data-k="hold">Hold click</button><button class="ib" data-k="rc">Right click</button></div><div class="vsc"><div></div><canvas style="display:none"></canvas><div class="vsu"></div></div></div>`;
  const sc=$('.vsc',B),su=$('.vsu',B),bt=k=>$(`[data-k=${k}]`,B);
  const MS=1.6,say=(h2)=>{su.innerHTML=h2;su.style.display='flex'};
  const setup=()=>{su.style.display='flex';su.innerHTML=`<b>Windows PC (v86 emulator)</b><p>Put a bootable image on your phone (for example the free ReactOS LiveCD .iso) and type its full path:</p><input class="vpath" spellcheck="false" autocapitalize="off"><p class="vexe"></p><button class="ib pri vgo">Start Windows</button><p class="vnote">Only old, light 32-bit programs work. Boot can take a few minutes.</p>`;
    const i=$('.vpath',su);i.value=ls('aur.vmos')||'/storage/emulated/0/Download/reactos.iso';$('.vexe',su).textContent=V.exe?'Program: '+V.exe.split('/').pop()+' (will appear as drive A:)':'No program selected (open an .exe from File Explorer).';$('.vgo',su).onclick=()=>start(i.value.trim())};
  const loadLib=()=>window.V86||window.V86Starter?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='vendor/v86/libv86.js';s.onload=ok;s.onerror=()=>no(new Error('v86 files are missing from the app'));document.head.appendChild(s)});
  async function getBuf(path,label){const r=await fetch(fsrc(path));if(!r.ok)throw new Error('Cannot read '+path.split('/').pop()+' ('+r.status+')');if(!r.body||!r.body.getReader)return r.arrayBuffer();const rd=r.body.getReader(),ch=[];let n=0;for(;;){const x=await rd.read();if(x.done)break;ch.push(x.value);n+=x.value.length;say('<b>'+esc(label)+'</b><p>'+(n/1048576).toFixed(0)+' MB loaded…</p>')}const o=new Uint8Array(n);let k=0;for(const c of ch){o.set(c,k);k+=c.length}return o.buffer}
  async function start(p){if(!p)return;ls('aur.vmos',p);try{
    say('<b>Preparing…</b>');await loadLib();
    const os=await getBuf(p,'Loading '+p.split('/').pop());
    let fda=null;if(V.exe){try{const eb=await getBuf(V.exe,'Loading program');fda=mkFloppy(V.exe.split('/').pop(),new Uint8Array(eb))}catch(e){toast((e&&e.message)||'Program not attached')}}
    say('<b>Starting…</b><p>Please wait.</p>');
    const iso=/\.iso$/i.test(p),o={wasm_path:'vendor/v86/v86.wasm',memory_size:384*1024*1024,vga_memory_size:16*1024*1024,screen_container:sc,bios:{url:'vendor/v86/seabios.bin'},vga_bios:{url:'vendor/v86/vgabios.bin'},autostart:true,disable_keyboard:true,disable_mouse:true};
    if(iso)o.cdrom={buffer:os};else o.hda={buffer:os};if(fda)o.fda={buffer:fda.buffer};
    V.emu=new(window.V86||window.V86Starter)(o);V.running=true;su.style.display='none';bt('go').textContent='Stop'}
  catch(e){V.running=false;say('<b>Could not start</b><p></p><button class="ib vback">Back</button>');$('p',su).textContent=(e&&e.message)||String(e);$('.vback',su).onclick=setup}}
  function stop(){try{V.emu&&V.emu.destroy()}catch(e){}V.emu=null;V.running=false;V.held=false;bt('go').textContent='Start';bt('hold').classList.remove('pri');setup()}
  const send=(a,b)=>{try{V.emu&&V.emu.bus.send(a,b)}catch(e){}};
  const click=b=>{send('mouse-click',b);setTimeout(()=>send('mouse-click',[V.held,false,false]),60)};
  const key=sc2=>{try{V.emu&&V.emu.keyboard_send_scancodes([sc2,sc2|0x80])}catch(e){}};
  B.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;
    if(k==='go'){V.running?stop():setup()}
    else if(!V.emu)toast('Start Windows first');
    else if(k==='kb')dialog(w,{title:'Type text',def:''},t=>{if(t)try{V.emu.keyboard_send_text(t)}catch(x){toast('Typing failed')}});
    else if(k==='ent')key(0x1C);else if(k==='esc')key(0x01);
    else if(k==='hold'){V.held=!V.held;b.classList.toggle('pri',V.held);send('mouse-click',[V.held,false,false])}
    else if(k==='rc')click([false,false,true])});
  const pts=new Map();let g=null;
  sc.addEventListener('pointerdown',e=>{if(!V.emu||e.target.closest('.vsu'))return;try{sc.setPointerCapture(e.pointerId)}catch(x){}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!g)g={t:Date.now(),m:0,n:0};g.n=Math.max(g.n,pts.size)});
  sc.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p||!g)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;g.m+=Math.abs(dx)+Math.abs(dy);if(pts.size===1&&V.emu)send('mouse-delta',[dx*MS,-dy*MS])});
  const up=e=>{if(!pts.delete(e.pointerId))return;if(!pts.size&&g){if(g.m<10&&Date.now()-g.t<350&&V.emu)click(g.n>=2?[false,false,true]:[true,false,false]);g=null}};
  sc.addEventListener('pointerup',up);sc.addEventListener('pointercancel',up);
  w.open=a=>{if(a&&a.exe){V.exe=a.exe;if(V.running)toast('Restart Windows to attach this program');else setup()}};
  w.onclose=()=>{try{V.emu&&V.emu.destroy()}catch(e){}};
  setup();
}
}
