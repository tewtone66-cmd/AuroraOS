/* NX-4.0.1 - Nex Island blur fix, size control, and module-only updater. */
(function(){'use strict';
var doc=document, root=doc.documentElement, BASE_VERSION='4.0.1';
var MOD_KEY='aur.mod.nex-island.code', VER_KEY='aur.mod.nex-island.version';
var PATCH_URL='https://raw.githubusercontent.com/tewtone66-cmd/AuroraOS/main/updates/nex-island.js';
var MANIFEST_URL='https://raw.githubusercontent.com/tewtone66-cmd/AuroraOS/main/updates/nex-island.json';
var bounds={min:70,max:130,step:5};
function g(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function versionParts(v){return String(v||'0').split('.').map(function(x){var n=parseInt(x,10);return isFinite(n)?n:0})}
function newer(a,b){var x=versionParts(a),y=versionParts(b);for(var i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0)}return false}
function currentVersion(){return g(VER_KEY,BASE_VERSION)||BASE_VERSION}
function css(){
 if(doc.getElementById('nx-fix-css'))return;
 var s=doc.createElement('style');s.id='nx-fix-css';s.textContent=[
  '#nxd .nxd-v{filter:none!important;-webkit-filter:none!important;backface-visibility:hidden;transition-property:opacity,transform!important}',
  '.nx-island-size{display:flex;align-items:center;gap:12px;margin:10px 0 16px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surf2)}',
  '.nx-island-size label{flex:1;min-width:100px;font-size:12px;color:var(--mut)}.nx-island-size input{width:min(190px,42%);accent-color:var(--acc)}.nx-island-size output{min-width:42px;text-align:right;font-size:12px;font-variant-numeric:tabular-nums}',
  '.nx-island-update{margin:12px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surf2)}',
  '.nx-island-update .nx-iu-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
  '.nx-island-update .nx-iu-status{min-height:18px;margin:8px 0 0;color:var(--mut);font-size:12px}',
  '.nx-island-update button{border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--surf);cursor:pointer}',
  '.nx-island-update button.primary{border-color:transparent;background:var(--acc);color:var(--accT,#fff)}',
  '.nx-island-update button:disabled{opacity:.55;cursor:wait}'
 ].join('\n');doc.head.appendChild(s)
}
function island(){return doc.getElementById('nxd')}
function clamp(n){return Math.max(bounds.min,Math.min(bounds.max,Math.round(n/bounds.step)*bounds.step))}
function applyScale(n){var el=island();if(!el)return;el.style.scale=(clamp(n)/100);}
function installSizeControl(){
 var box=doc.querySelector('#spg .nxd-set');if(!box||box.querySelector('.nx-island-size'))return;
 var row=doc.createElement('div');row.className='nx-island-size';
 row.innerHTML='<label for="nxIslandScale">Island size</label><input id="nxIslandScale" type="range" min="'+bounds.min+'" max="'+bounds.max+'" step="'+bounds.step+'"><output for="nxIslandScale"></output>';
 var slider=row.querySelector('input'),out=row.querySelector('output');slider.value=clamp(parseInt(g('aur.isl.scale','100'),10)||100);out.value=slider.value+'%';out.textContent=out.value;
 slider.addEventListener('input',function(){var n=clamp(+slider.value);out.value=n+'%';out.textContent=out.value;put('aur.isl.scale',String(n));applyScale(n)});
 var h4=box.querySelector('h4');if(h4&&h4.nextSibling)h4.parentNode.insertBefore(row,h4.nextSibling);else box.insertBefore(row,box.firstChild);
}
function applyPatchConfig(cfg){
 if(!cfg||typeof cfg!=='object'||!/^\d+\.\d+\.\d+$/.test(String(cfg.version||'')))return false;
 bounds.min=Math.max(50,Math.min(95,parseInt(cfg.minScale,10)||70));
 bounds.max=Math.max(105,Math.min(160,parseInt(cfg.maxScale,10)||130));
 bounds.step=Math.max(1,Math.min(10,parseInt(cfg.sizeStep,10)||5));
 put(VER_KEY,cfg.version);applyScale(parseInt(g('aur.isl.scale','100'),10)||100);installSizeControl();
 var d=doc.getElementById('nxIslandUpdateStatus');if(d)d.textContent='Nex Island module '+cfg.version+' installed.';
 return true
}
window.NXIslandPatchApply=applyPatchConfig;
function runSavedPatch(){
 var src=g(MOD_KEY,'');if(!src||src.length>32768)return;
 try{new Function(src)()}catch(e){try{console.warn('Nex Island patch could not be loaded',e)}catch(x){}}
}
function settingsPage(){
 var p=doc.getElementById('spg');if(!p)return;
 var h=p.querySelector('h3'),title=h&&(h.textContent||'').trim();
 if(title==='Nex Island'||title==='Island')installSizeControl();
 if(title==='Update')installUpdatePanel(p)
}
function installUpdatePanel(p){
 if(p.querySelector('.nx-island-update'))return;
 var box=doc.createElement('section');box.className='nx-island-update';
 box.innerHTML='<h4>Nex Island module</h4><div class="nx-iu-actions"><button class="primary" data-nx-iu="check">Check for module update</button><button data-nx-iu="install" disabled>Download and install module</button></div><p class="nx-iu-status" id="nxIslandUpdateStatus">Installed module '+currentVersion()+'. This updates only the Nex Island add-on, not the app.</p>';
 var anchor=p.querySelector('.nxu .uw')||p.querySelector('.nxu')||p.querySelector('h3');
 if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else p.appendChild(box);
 var status=box.querySelector('.nx-iu-status'),check=box.querySelector('[data-nx-iu="check"]'),install=box.querySelector('[data-nx-iu="install"]'),available='';
 function say(s){status.textContent=s}
 function busy(on){check.disabled=on;install.disabled=on||!available}
 function fetchManifest(){return fetch(MANIFEST_URL,{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('manifest unavailable');return r.json()}).then(function(m){
   if(!m||m.module!=='nex-island'||!/^\d+\.\d+\.\d+$/.test(String(m.version||''))||m.url!==PATCH_URL)throw Error('invalid module manifest');return m
 })}
 check.addEventListener('click',function(){busy(true);available='';say('Checking Nex Island module…');fetchManifest().then(function(m){
   if(!newer(m.version,currentVersion())){say('Nex Island module is up to date ('+currentVersion()+').');return}
   available=m.version;install.dataset.url=m.url;busy(false);say('Nex Island module '+m.version+' is available. The rest of the app will not be downloaded.')
 }).catch(function(){say('Could not check the official NexOS module manifest. Try again when online.')}).then(function(){busy(false)})});
 install.addEventListener('click',function(){if(!available)return;busy(true);say('Downloading only the Nex Island module…');fetch(PATCH_URL,{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('module download failed');return r.text()}).then(function(src){
   if(src.length>32768||src.indexOf('NXISLAND_PATCH_VERSION')<0||src.indexOf('NXIslandPatchApply')<0)throw Error('invalid module patch');
   var m=src.match(/NXISLAND_PATCH_VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/);if(!m||m[1]!==available)throw Error('module version mismatch');
   put(MOD_KEY,src);new Function(src)();say('Nex Island module '+available+' installed. Other project files were not changed.')
 }).catch(function(){say('Module update failed validation or download. The installed version was kept.')}).then(function(){busy(false)})
 })
}
function boot(){css();applyScale(parseInt(g('aur.isl.scale','100'),10)||100);runSavedPatch();settingsPage();
 var ob=new MutationObserver(function(){settingsPage();applyScale(parseInt(g('aur.isl.scale','100'),10)||100)});
 ob.observe(doc.body||doc.documentElement,{childList:true,subtree:true});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
