/* FULLUPD-4.1.3 - Settings > Update: "Full update": gets the newest APK from the GitHub Release and opens Android's installer.
   Covers everything small updates cannot (main page, Java/native, build changes). */
(function(){'use strict';
var doc=document,REPO='tewtone66-cmd/AuroraOS';
function plug(){try{var C=window.Capacitor;return C&&(C.Plugins&&C.Plugins.AuroraUpdate||(C.registerPlugin&&C.registerPlugin('AuroraUpdate')))}catch(e){return null}}
function mb(n){return(n/1048576).toFixed(1)+' MB'}
function css(){if(doc.getElementById('nxfu-css'))return;var s=doc.createElement('style');s.id='nxfu-css';
 s.textContent='.nxfu{margin:12px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surf2)}.nxfu h4{margin:0 0 6px}.nxfu .s{min-height:18px;margin:6px 0 10px;font-size:12.5px;line-height:1.5;color:var(--mut)}.nxfu .a{display:flex;gap:8px;flex-wrap:wrap}.nxfu button{border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--surf);color:inherit;cursor:pointer}.nxfu button.pri{border-color:transparent;background:var(--acc);color:var(--accT,#fff)}.nxfu button:disabled{opacity:.5}.nxfu .bar{height:6px;border-radius:3px;background:var(--line);overflow:hidden;margin:6px 0;display:none}.nxfu .bar i{display:block;height:100%;width:0;background:var(--acc);transition:width .2s}';
 doc.head.appendChild(s)}
function panel(p){
 if(p.querySelector('.nxfu'))return;css();
 var b=doc.createElement('section');b.className='nxfu';
 b.innerHTML='<h4>Full update (APK)</h4><p class="s">Gets the newest app from GitHub, including changes small updates cannot carry.</p><div class="bar"><i></i></div><div class="a"><button class="pri" data-a="chk">Check for new app</button><button data-a="get" disabled>Download and install</button><button data-a="inst" hidden>Install again</button></div>';
 var st=b.querySelector('.s'),bar=b.querySelector('.bar'),fill=bar.firstChild,chk=b.querySelector('[data-a=chk]'),get=b.querySelector('[data-a=get]'),inst=b.querySelector('[data-a=inst]'),rel=null,U=plug();
 function say(t){st.textContent=t}
 if(!U||!window.Capacitor||!Capacitor.isNativePlatform||!Capacitor.isNativePlatform()){say('Full updates work inside the installed Android app.');chk.disabled=true}
 else if(U.addListener)U.addListener('progress',function(e){if(e&&e.total>0){bar.style.display='block';fill.style.width=Math.min(100,e.done*100/e.total)+'%';say('Downloading '+mb(e.done)+' of '+mb(e.total)+'...')}});
 function openInst(){return U.install().then(function(r){inst.hidden=false;say(r&&r.needPermission?'Allow "Install unknown apps" for NexOS, come back, then press Install again.':'The Android installer is open. Confirm to update.')})}
 chk.addEventListener('click',function(){chk.disabled=true;get.disabled=true;say('Checking GitHub...');
  Promise.all([U.info(),fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{cache:'no-store'}).then(function(r){if(r.status===404)throw new Error('No release has been published yet');if(!r.ok)throw new Error('GitHub answered '+r.status);return r.json()})]).then(function(a){
   var info=a[0],r=a[1],as=(r.assets||[]).filter(function(x){return/\.apk$/i.test(x.name)})[0];
   if(!as)throw new Error('The latest release has no APK file');
   rel={url:as.browser_download_url,size:as.size,name:r.name||r.tag_name};
   var newer=Date.parse(r.published_at)>(+info.lastUpdate||0)+60000;
   if(newer){say('New app available: '+rel.name+' ('+mb(as.size)+').');get.disabled=false}else say('You already have the newest app.');
   if(info.cached>0)inst.hidden=false}).catch(function(e){say(e.message||'Could not check. Try again when online.')}).then(function(){chk.disabled=false})});
 get.addEventListener('click',function(){if(!rel)return;get.disabled=true;chk.disabled=true;say('Starting download...');bar.style.display='block';fill.style.width='0';
  U.download({url:rel.url}).then(function(){fill.style.width='100%';return openInst()}).catch(function(e){say((e.message||e)+'. Nothing was changed.');get.disabled=false}).then(function(){chk.disabled=false})});
 inst.addEventListener('click',function(){openInst().catch(function(e){say(String(e.message||e))})});
 var h=p.querySelector('.nxhu')||p.querySelector('.nxu .uw')||p.querySelector('.nxu')||p.querySelector('h3');
 if(h&&h.parentNode)h.parentNode.insertBefore(b,h.nextSibling);else p.appendChild(b)}
function page(){var p=doc.getElementById('spg');if(!p)return;var h=p.querySelector('h3');if(p.querySelector('.nxu,.nxhu')||h&&(h.textContent||'').trim()==='Update')panel(p)}
function boot(){page();new MutationObserver(page).observe(doc.body||doc.documentElement,{childList:true,subtree:true})}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
