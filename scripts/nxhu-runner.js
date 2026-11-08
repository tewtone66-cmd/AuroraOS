/* NXHU-1: runs the injected mods in order. A saved "live update" replaces the built-in copy of that mod.
   Rules: overrides are tied to one APK build (new APK = overrides dropped), a failing override falls back to the
   built-in mod, and an override that stops the app from starting is removed on the next start. */
(function(){'use strict';
var W=window,D=document,IDX='aur.hu.idx',PRE='aur.hu.m.',BOOT='aur.hu.boot',NOTE='aur.hu.note';
function get(k){try{return W.localStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{W.localStorage.setItem(k,v);return W.localStorage.getItem(k)===v}catch(e){return false}}
function del(k){try{W.localStorage.removeItem(k)}catch(e){}}
var info={build:'',base:'',mods:{}};
try{var ie=D.getElementById('nxhu-info');if(ie)info=JSON.parse(ie.textContent)}catch(e){}
var idx=null;
try{idx=JSON.parse(get(IDX)||'null')}catch(e){idx=null}
if(!idx||typeof idx!=='object'||!idx.mods||typeof idx.mods!=='object')idx=null;
function persist(){if(idx&&Object.keys(idx.mods).length)set(IDX,JSON.stringify(idx));else del(IDX)}
function dropAll(){if(idx)for(var n in idx.mods)del(PRE+n);del(IDX);idx=null}
if(get(BOOT)==='1'){dropAll();del(BOOT);set(NOTE,'A small update stopped NexOS from starting, so it was removed.')}
else if(idx&&idx.build!==info.build)dropAll();

var NXHU={
  base:info.base,build:info.build,builtIn:info.mods,
  sha:function(n){if(idx&&idx.mods[n])return idx.mods[n];return info.mods[n]?info.mods[n].sha:''},
  installed:function(){return idx?Object.keys(idx.mods).length:0},
  note:function(){var n=get(NOTE);del(NOTE);return n||''},
  clear:function(){dropAll()},
  save:function(files){
    var names=Object.keys(files),i,n,f;
    if(!names.length)return 0;
    for(i=0;i<names.length;i++){n=names[i];f=files[n];
      if(!/^[A-Za-z0-9][A-Za-z0-9._-]*\.js$/.test(n)||!f||typeof f.code!=='string'||!f.code||f.code.length>300000||!/^[0-9a-f]{40}$/.test(f.sha||''))throw new Error('Bad module '+n);
      try{new Function(f.code)}catch(e){throw new Error('Syntax error in '+n)}}
    var oldIdx=idx?JSON.parse(JSON.stringify(idx)):null,prev={},ni=idx||{build:info.build,mods:{}};
    function rollback(){for(var k in prev){if(prev[k]===null)del(PRE+k);else set(PRE+k,prev[k])}idx=oldIdx;persist()}
    for(i=0;i<names.length;i++){n=names[i];prev[n]=get(PRE+n);
      if(!set(PRE+n,files[n].code)){rollback();throw new Error('Not enough storage space')}
      ni.mods[n]=files[n].sha}
    ni.build=info.build;idx=ni;
    if(!set(IDX,JSON.stringify(idx))){rollback();throw new Error('Not enough storage space')}
    return names.length}
};
W.NXHU=NXHU;

var running=false,failed=false;
W.addEventListener('error',function(){if(running)failed=true},true);
function exec(name,code){
  var s=D.createElement('script');s.setAttribute('data-nxrun',name);s.text=code;failed=false;running=true;
  try{(D.head||D.documentElement).appendChild(s)}catch(e){failed=true}
  running=false;
  try{if(s.parentNode)s.parentNode.removeChild(s)}catch(e){}
  return !failed}
function badOverride(n){del(PRE+n);if(idx){delete idx.mods[n];persist()}set(NOTE,'A small update for '+n+' failed and was removed.')}

var ov={},n;
if(idx){var gone=[];for(n in idx.mods){var c=get(PRE+n);if(typeof c==='string'&&c)ov[n]=c;else gone.push(n)}
  for(var g=0;g<gone.length;g++)delete idx.mods[gone[g]];if(gone.length)persist()}
var any=Object.keys(ov).length>0;
if(any)set(BOOT,'1');
var els=D.querySelectorAll('script[type="text/x-nxmod"]'),seen={},i,el,name;
for(i=0;i<els.length;i++){el=els[i];name=el.getAttribute('data-nxmod');seen[name]=1;
  if(Object.prototype.hasOwnProperty.call(ov,name)){if(!exec(name,ov[name])){badOverride(name);exec(name,el.textContent)}}
  else exec(name,el.textContent)}
Object.keys(ov).sort().forEach(function(k){if(!seen[k]&&!exec(k,ov[k]))badOverride(k)});
if(any)setTimeout(function(){del(BOOT)},12000);
})();
