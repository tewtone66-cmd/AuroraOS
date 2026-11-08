/* HU-1.0 - Settings > Update: small updates from GitHub (downloads only the mods that changed, not the whole app). */
(function(){'use strict';
var D=document,N=window.NXHU;
if(!N)return;
var BASE='https://raw.githubusercontent.com/tewtone66-cmd/AuroraOS/main/updates/hot/';
var SELF='zz-hotupdate.js',AUTO='aur.hu.auto',LAST='aur.hu.last',MAXB=300000;
function g(k){try{return localStorage.getItem(k)}catch(e){return null}}
function s(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function kb(n){return n<1024?n+' B':(n/1024).toFixed(n<10240?1:0)+' KB'}
function hex(b){var a=new Uint8Array(b),o='';for(var i=0;i<a.length;i++)o+=(a[i]<16?'0':'')+a[i].toString(16);return o}
function sha1(t){return crypto.subtle.digest('SHA-1',new TextEncoder().encode(t)).then(hex)}
function manifest(){return fetch(BASE+'manifest.json',{cache:'no-store'}).then(function(r){
  if(!r.ok)throw new Error('No update list on GitHub yet');return r.json()})}
function plan(m){
  if(!m||m.format!==1||!m.mods||typeof m.mods!=='object'||!/^[0-9a-f]{40}$/.test(m.base||''))throw new Error('The update list is not valid');
  var r={need:[],bytes:0,blocked:''};
  if(m.base!==N.base){r.blocked='This update changes the main app, so it needs a new APK.';return r}
  Object.keys(m.mods).sort().forEach(function(n){
    var e=m.mods[n];
    if(n===SELF||!/^[A-Za-z0-9][A-Za-z0-9._-]*\.js$/.test(n)||!e||!/^[0-9a-f]{40}$/.test(e.sha||''))return;
    if(e.sha!==N.sha(n)){var z=+e.size||0;r.need.push({name:n,sha:e.sha,size:z});r.bytes+=z}});
  return r}
function fetchMod(x){
  return fetch(BASE+'mods/'+encodeURIComponent(x.name),{cache:'no-store'}).then(function(r){
    if(!r.ok)throw new Error('Could not download '+x.name);return r.text()}).then(function(t){
    if(!t||t.length>MAXB)throw new Error(x.name+' has a wrong size');
    return sha1(t).then(function(h){if(h!==x.sha)throw new Error(x.name+' did not match its checksum');return t})})}
function install(p,say){
  var files={},i=0;
  function next(){
    if(i>=p.need.length)return Promise.resolve();
    var x=p.need[i++];say('Downloading '+x.name+' ('+i+' of '+p.need.length+')...');
    return fetchMod(x).then(function(t){files[x.name]={sha:x.sha,code:t};return next()})}
  return next().then(function(){return N.save(files)})}
function css(){
  if(D.getElementById('nxhu-css'))return;
  var e=D.createElement('style');e.id='nxhu-css';
  e.textContent='.nxhu{margin:12px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surf2)}.nxhu h4{margin:0 0 6px}.nxhu .nxhu-s{min-height:18px;margin:6px 0 10px;font-size:12.5px;line-height:1.5;color:var(--mut)}.nxhu .nxhu-a{display:flex;gap:8px;flex-wrap:wrap}.nxhu button{border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--surf);color:inherit;cursor:pointer}.nxhu button.pri{border-color:transparent;background:var(--acc);color:var(--accT,#fff)}.nxhu button:disabled{opacity:.5}.nxhu button[hidden]{display:none}.nxhu label{display:block;margin-top:10px;font-size:12px;color:var(--mut)}';
  D.head.appendChild(e)}
function restart(){try{if(typeof doRestart==='function'){doRestart();return}}catch(e){}location.reload()}
function panel(p){
  if(p.querySelector('.nxhu'))return;css();
  var b=D.createElement('section');b.className='nxhu';
  b.innerHTML='<h4>Small updates</h4><p class="nxhu-s"></p><div class="nxhu-a"><button class="pri" data-a="chk">Check GitHub</button><button data-a="get" disabled>Download</button><button class="pri" data-a="rst" hidden>Restart to apply</button></div><label><input type="checkbox" data-a="auto"> Check automatically (about 1 KB, twice a day at most)</label>';
  var st=b.querySelector('.nxhu-s'),chk=b.querySelector('[data-a=chk]'),get=b.querySelector('[data-a=get]'),rst=b.querySelector('[data-a=rst]'),au=b.querySelector('[data-a=auto]'),cur=null;
  function say(t){st.textContent=t}
  function busy(on){chk.disabled=on;get.disabled=on||!cur||!cur.need.length}
  au.checked=g(AUTO)!=='0';
  au.addEventListener('change',function(){s(AUTO,au.checked?'1':'0')});
  var inst=N.installed(),note=N.note();
  say(note||('Only changed parts are downloaded, never the whole app.'+(inst?' '+inst+' small update'+(inst>1?'s are':' is')+' installed.':'')));
  chk.addEventListener('click',function(){busy(true);cur=null;say('Checking GitHub...');
    manifest().then(plan).then(function(r){s(LAST,String(Date.now()));
      if(r.blocked){say(r.blocked);return}
      if(!r.need.length){say('Everything is up to date.');return}
      cur=r;say(r.need.length+' small update'+(r.need.length>1?'s':'')+' ready: '+kb(r.bytes)+' to download ('+r.need.map(function(x){return x.name.replace(/\.js$/,'')}).join(', ')+').')
    }).catch(function(e){say(e.message||'Could not check. Try again when online.')}).then(function(){busy(false)})});
  get.addEventListener('click',function(){if(!cur)return;busy(true);
    install(cur,say).then(function(n){cur=null;say(n+' update'+(n>1?'s':'')+' installed. Restart NexOS to use them.');rst.hidden=false;chk.hidden=true;get.hidden=true
    }).catch(function(e){say((e.message||'Update failed')+'. Nothing was changed.')}).then(function(){busy(false)})});
  rst.addEventListener('click',restart);
  var h=p.querySelector('.nxu .uw')||p.querySelector('.nxu')||p.querySelector('h3');
  if(h&&h.parentNode)h.parentNode.insertBefore(b,h.nextSibling);else p.appendChild(b)}
function page(){
  var p=D.getElementById('spg');if(!p)return;
  var h=p.querySelector('h3');if(h&&(h.textContent||'').trim()==='Update')panel(p)}
function autoCheck(){
  if(g(AUTO)==='0'||navigator.onLine===false)return;
  if(Date.now()-(+g(LAST)||0)<12*3600*1000)return;
  setTimeout(function(){manifest().then(plan).then(function(r){s(LAST,String(Date.now()));
    if(!r.blocked&&r.need.length&&typeof toast==='function')toast('Small update available ('+kb(r.bytes)+'). Open Settings > Update.')}).catch(function(){})},8000)}
function boot(){page();new MutationObserver(page).observe(D.body||D.documentElement,{childList:true,subtree:true});autoCheck()}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
