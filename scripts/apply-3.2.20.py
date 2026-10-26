#!/usr/bin/env python3
# NexOS 3.2.19 -> 3.2.20  (section 3: home screen)
#  1) "New folder" on the desktop context menu (real folder + desktop shortcut)
#  2) drag apps (taskbar / Start menu) onto the desktop, "Send to Desktop" for files/folders in Explorer
#  3) Recycle Bin for desktop shortcuts, apps and programs (restore / delete / empty all work)
# Run from the repo root:  python3 scripts/apply-3.2.20.py
import json, os, re, subprocess, shutil, sys, tempfile

ROOT = os.getcwd()
IDX = os.path.join(ROOT, 'src', 'index.html')
PKG = os.path.join(ROOT, 'package.json')
MARK = '/* NX-3.2.20 */'
OLD_V, NEW_V = '3.2.19', '3.2.20'


def rd(p):
    with open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()


def wr(p, s):
    with open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)


def rep(s, old, new, n=1, what=''):
    c = s.count(old)
    assert c == n, 'anchor "%s": expected %d match(es), found %d' % (what or old[:60], n, c)
    return s.replace(old, new)


NEWJS = r"""
/* NX-3.2.20 */
var ADD=jl('aur.dapps',[]);if(!Array.isArray(ADD))ADD=[];ADD=ADD.filter(function(i){return typeof i==='string'&&A[i]&&i!=='trash'});
ADD.forEach(function(i){if(!DESK.some(function(d){return d[0]===i}))DESK.push([i])});
var DDIR='/storage/emulated/0/Desktop';
var saveAdd=function(){ls('aur.dapps',JSON.stringify(ADD))},saveHid=function(){ls('aur.dhide',JSON.stringify(HID))},saveDesk=function(){ls('aur.desk',JSON.stringify(DESK.map(dkey)))};
function pushTr(e){e.id=e.k.charAt(0)+Date.now().toString(36)+Math.random().toString(36).slice(2,5);e.t=Date.now();TR.push(e);trSave();return e}
function relnk(l,pos){if(!LNKS.some(function(q){return q.id===l.id}))LNKS.push(l);if(!DESK.some(function(d){return d[0]==='lnk'&&d[2]===l.id}))DESK.push(['lnk',l.n,l.id]);if(pos)DP['lnk|'+l.id]=pos;saveL();saveDP()}
function cellAt(x,y){var g=geom(),r=$('#icons').getBoundingClientRect();return[Math.max(0,Math.min(g.cols-1,Math.round((x-43-r.left-PX)/CW))),Math.max(0,Math.min(g.rows-1,Math.round((y-47-r.top-PY)/CH)))]}
function overDesk(x,y){var t=doc.elementFromPoint(x,y);if(!t||!t.closest)return false;if(t.closest('.win,#dock,#start,#ctx,#trf,#mnpc,#pwm,#tbpv,#np,#npc,.dlg,.dkm'))return false;return!!t.closest('#desk')}
/* desktop item -> Recycle Bin (shortcuts, apps, programs). returns false for items handled elsewhere (websites, the bin itself) */
function trashDesk(b){var k=b.dataset.k||'',kk=k.split('|')[0];
 if(b.dataset.s||kk==='trash')return false;
 if(b.dataset.l){var id=b.dataset.l,l=LNKS.find(function(q){return q.id===id});if(!l)return false;
  var snap=JSON.parse(JSON.stringify(l)),pos=DP[k]||null;
  LNKS=LNKS.filter(function(q){return q.id!==id});var i=DESK.findIndex(function(d){return d[0]==='lnk'&&d[2]===id});if(i>=0)DESK.splice(i,1);delete DP[k];saveL();saveDP();
  if(l.own&&typeof trashFiles==='function'){
   trashFiles([{path:l.p,name:l.f||l.n,isDirectory:!!l.d}]).then(function(n){
    if(!n){relnk(snap,pos);buildIcons(true);toast('Could not move the folder');return}
    var e=TR.find(function(q){return q.k==='file'&&q.o===l.p});if(e){e.dsk=1;trSave()}else buildIcons(true)
   }).catch(function(){relnk(snap,pos);buildIcons(true);toast('Could not move the folder')});
   return true}
  pushTr({k:'lnk',n:l.n,o:l.p,dir:!!l.d,l:snap,pos:pos});toast('Moved to Recycle Bin');return true}
 if(b.dataset.e){var eid=b.dataset.e,ex=EXES.find(function(q){return q.id===eid}),de=DESK.find(function(d){return d[0]==='exe'&&d[2]===eid});
  if(!ex)return false;
  var sn=JSON.parse(JSON.stringify(ex)),dn=de?de.slice():['exe','',eid],pos2=DP[k]||null;
  removeExe(eid);delete DP[k];saveDP();
  pushTr({k:'exe',n:dn[1]||(ex.p?String(ex.p).split('/').pop():'')||'Program',o:ex.p||'Program',ex:sn,de:dn,pos:pos2});toast('Moved to Recycle Bin');return true}
 if(A[kk]&&kk!=='site'&&kk!=='exe'&&kk!=='lnk'){
  var added=ADD.indexOf(kk)>=0,dd=DESK.find(function(d){return d[0]===kk}),pos3=DP[k]||null;
  if(added){ADD.splice(ADD.indexOf(kk),1);saveAdd();var j=DESK.indexOf(dd);if(j>=0)DESK.splice(j,1);saveDesk()}
  else{if(HID.indexOf(k)<0)HID.push(k);saveHid()}
  delete DP[k];saveDP();
  pushTr({k:'app',n:(dd&&dd[1])||A[kk].n,o:'Desktop icon',app:kk,add:added,key:k,de:dd?dd.slice():[kk],pos:pos3});toast('Moved to Recycle Bin');return true}
 return false}
function restoreOne(e){
 if(e.k==='lnk'){relnk(e.l,e.pos)}
 else if(e.k==='exe'){var xid=e.ex&&e.ex.id;if(!xid)return;if(!EXES.some(function(q){return q.id===xid}))EXES.push(e.ex);
  var d0=e.de||['exe','',xid];if(!DESK.some(function(d){return d[0]==='exe'&&d[2]===xid}))DESK.push(d0);
  try{saveExes()}catch(x){}saveDesk();if(e.pos)DP[dkey(d0)]=e.pos;saveDP()}
 else if(e.k==='app'){
  if(e.add){if(ADD.indexOf(e.app)<0)ADD.push(e.app);saveAdd();if(!DESK.some(function(d){return d[0]===e.app}))DESK.push(e.de||[e.app])}
  else{var ix=HID.indexOf(e.key);if(ix>=0)HID.splice(ix,1);saveHid()}
  saveDesk();if(e.pos)DP[e.key]=e.pos;saveDP()}}
var NEWK={lnk:1,app:1,exe:1};
var _trR=trRestore,_trP=trPurge;
trRestore=async function(ids){ids=ids||[];
 var mine=TR.filter(function(e){return ids.indexOf(e.id)>=0&&NEWK[e.k]});
 var rest=ids.filter(function(i){return!mine.some(function(e){return e.id===i})});
 var dsk=TR.filter(function(e){return rest.indexOf(e.id)>=0&&e.k==='file'&&e.dsk});
 var r;if(rest.length)r=await _trR(rest);
 mine.forEach(function(e){try{restoreOne(e)}catch(x){}var i=TR.indexOf(e);if(i>=0)TR.splice(i,1)});
 if(mine.length)trSave();
 for(var q=0;q<dsk.length;q++){var f=dsk[q];try{await NF.info({path:f.o});addLnk([{path:f.o,name:f.n,isDirectory:!!f.dir}],0,0);var z=LNKS.find(function(w){return w.p===f.o});if(z){z.own=true;saveL()}}catch(x){}}
 if(mine.length&&!rest.length)toast(mine.length+' item'+(mine.length>1?'s':'')+' restored');
 return r};
trPurge=async function(ids){ids=ids||[];
 var mine=TR.filter(function(e){return ids.indexOf(e.id)>=0&&NEWK[e.k]});
 var rest=ids.filter(function(i){return!mine.some(function(e){return e.id===i})});
 mine.forEach(function(e){var i=TR.indexOf(e);if(i>=0)TR.splice(i,1)});
 var r;if(rest.length)r=await _trP(rest);
 if(mine.length)trSave();
 return r};
/* new folder: a real folder in /Desktop plus a shortcut icon on the desktop */
function newFolder(x,y){ask('New folder','New folder',async function(v){
 v=v.replace(/[\\\/:*?"<>|]/g,'').trim();if(!v||v==='.'||v==='..'){toast('Invalid folder name');return}
 try{
  try{await NF.mkdir({path:'/storage/emulated/0',name:'Desktop'})}catch(e){}
  var have=[];try{have=((await NF.list({path:DDIR})).items||[]).map(function(i){return i.name})}catch(e){}
  var nm=v,n=2;while(have.indexOf(nm)>=0)nm=v+' ('+(n++)+')';
  await NF.mkdir({path:DDIR,name:nm});
  var p=DDIR+'/'+nm;addLnk([{path:p,name:nm,isDirectory:true}],x,y);
  var q=LNKS.find(function(z){return z.p===p});if(q){q.own=true;saveL()}
 }catch(err){toast('Could not create the folder')}})}
/* apps dropped / sent to the desktop */
function addDeskApp(id,x,y){if(!A[id]||id==='trash'||id==='site'||id==='exe'||id==='lnk')return 0;
 var ex=DESK.find(function(d){return d[0]===id}),key=ex?dkey(ex):id+'|',hidden=HID.indexOf(key)>=0;
 if(ex&&!hidden){toast('Already on the desktop');return 0}
 if(!ex){DESK.push([id]);if(ADD.indexOf(id)<0)ADD.push(id);saveAdd()}
 if(hidden){HID.splice(HID.indexOf(key),1);saveHid()}
 var occ={};items().forEach(function(b){var p=DP[b.dataset.k];if(p)occ[p[0]+','+p[1]]=1});
 var c0=cellAt(x,y);DP[key]=free(geom(),occ,c0[0],c0[1]);
 saveDesk();saveDP();buildIcons(true);toast('Added to the desktop: '+A[id].n);return 1}
function addIts(its){return addLnk((its||[]).map(function(i){return{path:i.path,name:i.name,isDirectory:!!i.isDirectory}}),0,0)}
window.DSKX2={dropApp:function(id,e){if(!A[id]||id==='trash')return false;if(!overDesk(e.clientX,e.clientY))return false;addDeskApp(id,e.clientX,e.clientY);return true},addIts:addIts};
/* drag an app out of the Start menu onto the desktop (touch: press and hold, mouse / virtual mouse: drag) */
(function(){var d=null,tm=0,sup=false,ra=0,le=null,cell=null;
 var SEL='#start button,#start [data-id],#start [data-app]';
 var appOf=function(t){var b=t&&t.closest&&t.closest(SEL);if(!b)return null;var c=[b.dataset.id,b.dataset.app,b.dataset.a,b.dataset.k],i,v;for(i=0;i<c.length;i++){v=c[i]?String(c[i]).split('|')[0]:'';if(v&&A[v]&&v!=='trash')return{b:b,id:v}}return null};
 var stop=function(){clearTimeout(tm);tm=0;if(ra){cancelAnimationFrame(ra);ra=0}le=null;if(cell){cell.remove();cell=null}if(d&&d.g)d.g.remove();doc.body.classList.remove('pdrag');if(d&&d.go)dragging=false;d=null};
 var frame=function(){ra=0;if(!d||!d.go||!le)return;var e=le;le=null;d.g.style.left=(e.clientX-43)+'px';d.g.style.top=(e.clientY-47)+'px';
  var ok=overDesk(e.clientX,e.clientY);d.g.classList.toggle('bad',!ok);
  if(ok){var c=cellAt(e.clientX,e.clientY);if(!cell){cell=h('div','dcell','');$('#icons').appendChild(cell)}cell.style.display='block';cell.style.left=(PX+c[0]*CW)+'px';cell.style.top=(PY+c[1]*CH)+'px'}else if(cell)cell.style.display='none'};
 var arm=function(){if(d){d.armed=true;try{navigator.vibrate&&navigator.vibrate(14)}catch(x){}}};
 doc.addEventListener('pointerdown',function(e){if(e.button||d)return;var a=appOf(e.target);if(!a)return;var tch=e.pointerType==='touch';
  d={b:a.b,id:a.id,x:e.clientX,y:e.clientY,pid:e.pointerId,touch:tch,armed:!tch,go:false,g:null};if(tch)tm=setTimeout(arm,380)},true);
 addEventListener('pointermove',function(e){if(!d||e.pointerId!==d.pid)return;
  if(!d.go){var mv=Math.hypot(e.clientX-d.x,e.clientY-d.y);if(!d.armed){if(mv>10)stop();return}if(mv<8)return;
   d.go=true;var g=h('button','di ghost','<div class="t">'+tile(d.id)+'</div><span></span>');$('span',g).textContent=A[d.id].n;
   g.style.cssText='position:fixed;pointer-events:none;z-index:99999;width:'+CW+'px;height:94px;left:'+(e.clientX-43)+'px;top:'+(e.clientY-47)+'px';
   doc.body.appendChild(g);d.g=g;doc.body.classList.add('pdrag');dragging=true;sync()}
  le=e;if(!ra)ra=requestAnimationFrame(frame)});
 var end=function(e){if(!d||e.pointerId!==d.pid)return;var s=d;if(!s.go){stop();return}
  var x=e.clientX,y=e.clientY,okc=e.type!=='pointercancel'&&overDesk(x,y);stop();sup=true;setTimeout(function(){sup=false},120);
  if(okc){addDeskApp(s.id,x,y);try{closeMenus()}catch(z){}}sync()};
 addEventListener('pointerup',end);addEventListener('pointercancel',end);
 addEventListener('touchmove',function(e){if(d&&d.touch&&d.armed&&e.cancelable)e.preventDefault()},{passive:false});
 doc.addEventListener('click',function(e){if(sup&&e.target.closest&&e.target.closest('#start')){e.stopPropagation();e.preventDefault()}},true);
 addEventListener('keydown',function(e){if(e.key==='Escape'&&d&&d.go){stop();sup=true;setTimeout(function(){sup=false},120);sync()}})})();
"""

EXE_MENU = (" if(di&&di.dataset.e){var eid=di.dataset.e;ctx(x,y,[['Open',function(){var z=EXES.find(function(q){return q.id===eid});if(z)launchExe(z)}],"
            "null,['Move to Recycle Bin',function(){removeItem(di)}]]);return true}")


def main():
    assert os.path.isfile(IDX) and os.path.isfile(PKG), 'run this from the repo root (the folder that has src/ and package.json)'
    pk = rd(PKG)
    s = rd(IDX)
    if MARK in s:
        print('already applied (marker found) - nothing to do')
        return
    m = re.search(r'"version"\s*:\s*"([^"]+)"', pk)
    assert m and m.group(1) == OLD_V, 'package.json version is %s, expected %s' % (m and m.group(1), OLD_V)
    assert re.search(r'(async\s+)?function\s+trRestore\b', s), 'trRestore is not a plain function declaration'
    assert re.search(r'(async\s+)?function\s+trPurge\b', s), 'trPurge is not a plain function declaration'
    for fn in ('trSave', 'removeExe', 'launchExe', 'trashFiles'):
        assert re.search(r'function\s+' + fn + r'\b', s), fn + ' not found as a function declaration'

    s = rep(s, "'Installed version','%s'" % OLD_V, "'Installed version','%s'" % NEW_V, 2, 'Installed version')
    s = rep(s, '/* ---------- build / menus ---------- */', NEWJS + '/* ---------- build / menus ---------- */', 1, 'build / menus')
    s = rep(s, "function removeItem(b){var k=b.dataset.k||'';", "function removeItem(b){var k=b.dataset.k||'';if(trashDesk(b))return;", 1, 'removeItem')
    s = rep(s, "['Remove shortcut',function(){removeItem(di)}]", "['Move to Recycle Bin',function(){removeItem(di)}]", 1, 'Remove shortcut')
    s = rep(s, "['Remove from desktop',function(){removeItem(di)}]", "['Move to Recycle Bin',function(){removeItem(di)}]", 1, 'Remove from desktop')
    a = "window.DSKX={menu:function(x,y,t,orig){var di=t.closest('.di');"
    s = rep(s, a, a + EXE_MENU, 1, 'DSKX.menu head')
    a = "['Reset icon positions',function(){DP={};saveDP();buildIcons(true)}]];"
    s = rep(s, a, a + "m.unshift(['New folder',function(){newFolder(x,y)}],null);", 1, 'Reset icon positions')
    a = "var id=s.b.dataset.id,from=PIN.indexOf(id),to=idx(e.clientX,s.b);"
    s = rep(s, a, "var id=s.b.dataset.id;if(window.DSKX2&&DSKX2.dropApp(id,e)){sync();return}var from=PIN.indexOf(id),to=idx(e.clientX,s.b);", 1, 'dock reorder')
    a = "['Add to Desktop',()=>addExe({p:it.path})]]:[])"
    s = rep(s, a, a + ",...[['Send to Desktop (shortcut)',()=>window.DSKX2&&DSKX2.addIts(selItems())]]", 1, 'Explorer menu')
    pk, nsub = re.subn(r'("version"\s*:\s*")%s(")' % re.escape(OLD_V), r'\g<1>%s\g<2>' % NEW_V, pk, count=1)
    assert nsub == 1, 'package.json version not replaced'

    # syntax-check the patched script (only when node exists)
    node = shutil.which('node')
    if node:
        for blk in re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s, re.S):
            if MARK in blk:
                with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
                    t.write(blk)
                r = subprocess.run([node, '--check', t.name], capture_output=True, text=True)
                os.unlink(t.name)
                assert r.returncode == 0, 'syntax check failed, nothing written:\n' + r.stderr[:800]
                print('syntax check: OK')
                break
    else:
        print('node not found: syntax check skipped')

    wr(IDX, s)
    wr(PKG, pk)
    print('done: %s -> %s' % (OLD_V, NEW_V))


if __name__ == '__main__':
    try:
        main()
    except AssertionError as e:
        print('STOPPED, nothing changed:', e)
        sys.exit(1)
