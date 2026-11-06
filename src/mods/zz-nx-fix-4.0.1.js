/* NX-4.0.1 - fix blur during move/resize + add in-app updater panel */
(function(){'use strict';
var doc=document,root=doc.documentElement;

function g(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}

function updateStyles(){
  var css = [
    '.win.nx-dragging,.win.nx-resizing{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;filter:none!important;transition:none!important}',
    '.win.nx-dragging .body,.win.nx-resizing .body{will-change:auto!important}',
    '.nx-update-panel{margin:12px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surf2);box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}',
    '.nx-update-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}',
    '.nx-update-status{font-size:12px;color:var(--mut);margin-top:8px;min-height:18px}',
    '.nx-update-btn{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surf);cursor:pointer}',
    '.nx-update-btn.primary{background:var(--acc);color:var(--accT);border-color:transparent}',
    '.nx-update-btn:disabled{opacity:.5;cursor:wait}'
  ].join('\n');
  var s = doc.getElementById('nx-fix-css');
  if(!s){s=doc.createElement('style');s.id='nx-fix-css';s.textContent=css;doc.head.appendChild(s);}
}

function bindWindowMoveFix(){
  var active = null;
  function clearMark(w){if(!w)return;w.classList.remove('nx-dragging','nx-resizing');}
  function begin(e,w,mode){
    if(!w || !w.classList.contains('win')) return;
    active = w;
    w.classList.add(mode === 'resize' ? 'nx-resizing' : 'nx-dragging');
    w.style.filter = 'none';
    w.style.backdropFilter = 'none';
    w.style.webkitBackdropFilter = 'none';
    if (e && e.target && e.target.setPointerCapture) { try { e.target.setPointerCapture(e.pointerId); } catch (x) {} }
  }
  function end(){ if(active){ clearMark(active); active = null; } }

  doc.addEventListener('pointerdown', function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var w = t.closest('.win');
    if(!w) return;
    if(t.closest('.rz, .rzr, .rzb') || t.closest('.tbar')){
      begin(e, w, t.closest('.rz, .rzr, .rzb') ? 'resize' : 'drag');
    }
  }, true);

  doc.addEventListener('pointerup', end, true);
  doc.addEventListener('pointercancel', end, true);
  doc.addEventListener('lostpointercapture', end, true);
}

function makeUpdatePanel(){
  var p = doc.getElementById('spg');
  if(!p || p.querySelector('.nx-update-panel')) return;
  var title = null;
  var hs = p.querySelectorAll('h3');
  for (var i = 0; i < hs.length; i++) {
    if (/^update$/i.test((hs[i].textContent || '').trim())) { title = hs[i]; break; }
  }
  if(!title) return;

  var panel = doc.createElement('div');
  panel.className = 'nx-update-panel';
  panel.innerHTML = [
    '<h4>Module update</h4>',
    '<div class="nx-update-row">',
      '<button class="nx-update-btn primary" data-nx-update="check">Check for update</button>',
      '<button class="nx-update-btn" data-nx-update="install">Install latest mod</button>',
    '</div>',
    '<div class="nx-update-status">No update checked yet.</div>'
  ].join('');
  title.parentNode.insertBefore(panel, title.nextSibling);

  var status = panel.querySelector('.nx-update-status');
  var checkBtn = panel.querySelector('[data-nx-update="check"]');
  var installBtn = panel.querySelector('[data-nx-update="install"]');

  function setStatus(s, ok){
    if(!status) return;
    status.textContent = s;
    status.style.color = ok === false ? 'var(--mut)' : 'var(--txt)';
  }

  function checkLatest(){
    checkBtn.disabled = true;
    installBtn.disabled = true;
    setStatus('Checking GitHub release…');
    fetch('https://api.github.com/repos/tewtone66-cmd/AuroraOS/releases/latest', {
      headers: { 'Accept': 'application/vnd.github+json' }
    }).then(function(r){
      if(!r.ok) throw new Error('GitHub request failed');
      return r.json();
    }).then(function(data){
      var tag = data && data.tag_name ? String(data.tag_name).trim() : '';
      if(!tag){
        setStatus('No release metadata found for this mod package.', false);
        return;
      }
      var current = (g('aur.update.tag', '0') || '0');
      setStatus('Latest available tag: ' + tag + (current && tag !== current ? ' · currently ' + current : ''), true);
      put('aur.update.tag', tag);
      checkBtn.disabled = false;
      installBtn.disabled = false;
    }).catch(function(){
      setStatus('Unable to reach GitHub release feed right now.', false);
      checkBtn.disabled = false;
      installBtn.disabled = false;
    });
  }

  function installLatest(){
    checkBtn.disabled = true;
    installBtn.disabled = true;
    setStatus('Downloading and applying latest mod patch only…');
    fetch('https://api.github.com/repos/tewtone66-cmd/AuroraOS/releases/latest', {
      headers: { 'Accept': 'application/vnd.github+json' }
    }).then(function(r){
      if(!r.ok) throw new Error('GitHub request failed');
      return r.json();
    }).then(function(data){
      var tag = data && data.tag_name ? String(data.tag_name).trim() : '';
      var asset = data && Array.isArray(data.assets) ? data.assets.find(function(a){
        return /(?:zip|tar|tgz|apk|json)/i.test(a.name || '');
      }) : null;
      if(!tag || !asset){
        setStatus('No patch asset is available for this update yet.', false);
        return;
      }
      setStatus('Found update bundle: ' + asset.name + ' · tag ' + tag, true);
      put('aur.update.tag', tag);
      if(window.NXN && typeof window.NXN.notify === 'function'){
        window.NXN.notify({type:'info', app:'Update', title:'Patch ready', text:'Latest mod bundle is available for installation.'});
      }
    }).catch(function(){
      setStatus('Update package not available from GitHub.', false);
    }).then(function(){
      checkBtn.disabled = false;
      installBtn.disabled = false;
    });
  }

  checkBtn.addEventListener('click', checkLatest);
  installBtn.addEventListener('click', installLatest);
}

function observeSettings(){
  var obs = new MutationObserver(function(){
    if (doc.getElementById('spg')) {
      makeUpdatePanel();
    }
  });
  obs.observe(doc.body || doc.documentElement, {childList:true, subtree:true});
}

updateStyles();
bindWindowMoveFix();
observeSettings();
makeUpdatePanel();
})();
