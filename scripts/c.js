/* SET-3.2.4 - battery page data, night light, dim, reduce motion, auto performance */
(function(){'use strict';
S.ap=ls('aur.ap')==='1';S.rm=ls('aur.rm')==='1';S.nl=+ls('aur.nl')||0;S.dm=+ls('aur.dm')||0;
var nlx=document.createElement('div'),dmx=document.createElement('div');nlx.id='nlx';dmx.id='dmx';document.body.appendChild(nlx);document.body.appendChild(dmx);
var autoOn=false,B0=null;
function apply(){document.body.classList.toggle('rm',!!S.rm);
 nlx.style.display=S.nl?'block':'none';nlx.style.setProperty('--nla',(S.nl/100).toFixed(2));
 dmx.style.display=S.dm?'block':'none';dmx.style.setProperty('--dma',(S.dm/100).toFixed(2));autoPerf()}
function autoPerf(){if(!S.ap||!B0){if(autoOn&&!S.ap){autoOn=false}return}
 var low=B0.level<=.15&&!B0.charging;
 if(low&&!S.perf){setPerf(true);autoOn=true;toast('Battery low: Performance mode turned on')}
 else if(!low&&autoOn&&(B0.charging||B0.level>.2)){setPerf(false);autoOn=false}}
try{if(navigator.getBattery)navigator.getBattery().then(function(b){B0=b;['levelchange','chargingchange'].forEach(function(n){b.addEventListener(n,autoPerf)});autoPerf()}).catch(function(){})}catch(e){}
function hs(n){return({2:['Good','ok'],3:['Overheated','bad'],4:['Dead','bad'],5:['Over voltage','bad'],6:['Failure','bad'],7:['Too cold','warn']})[n]||['Unknown','']}
function plug(n){var o=[];if(n&1)o.push('AC charger');if(n&2)o.push('USB');if(n&4)o.push('Wireless');if(n&8)o.push('Dock');return o.join(' + ')||'Not plugged in'}
function card(l,v,c){return '<div class="bc'+(c?' '+c:'')+'"><small>'+l+'</small><b>'+v+'</b></div>'}
function bat(el){if(!el)return;
 function tick(){if(!el.isConnected)return;
  Promise.all([navigator.getBattery?navigator.getBattery().catch(function(){return null}):null,(typeof NF!=='undefined'&&NF&&NF.sysInfo)?NF.sysInfo().catch(function(){return null}):null]).then(function(r){
   if(!el.isConnected)return;var b=r[0],si=r[1],has=si&&si.batLevel!=null&&si.batLevel>=0;
   var lvl=b?Math.round(b.level*100):(has?Math.round(si.batLevel/(si.batScale||100)*100):null);
   if(lvl==null){el.innerHTML='<div class="bnote">Battery information is not available on this device.</div>';setTimeout(tick,4000);return}
   var ch=b?!!b.charging:!!(si&&si.batPlug>0),tm=b?(ch?b.chargingTime:b.dischargingTime):NaN,hr=Math.floor(tm/3600),mn=Math.round(tm%3600/60),
    ts=(isFinite(tm)&&tm>0)?((hr?hr+' h ':'')+mn+' min '+(ch?'until full':'remaining')):'',stt=(lvl>=100&&ch)?'Fully charged':(ch?'Charging':'On battery'),
    cls=(ch?' ch':'')+((lvl<20&&!ch)?' lo':((lvl<45&&!ch)?' mid':''));
   var h='<div class="bhero'+cls+'"><div class="bbar"><div class="bfill" style="width:'+Math.max(2,lvl)+'%"></div></div><div class="bpc"><b>'+lvl+'<small>%</small></b><span>'+stt+(ts?'<em>'+ts+'</em>':'')+'</span></div></div><div class="bgrid">';
   if(has){var H=hs(si.batHealth);h+=card('Health',H[0],H[1]);
    if(si.batTemp)h+=card('Temperature',si.batTemp.toFixed(1)+' °C',si.batTemp>=45?'bad':(si.batTemp>=40?'warn':''));
    if(si.batVolt)h+=card('Voltage',(si.batVolt/1000).toFixed(2)+' V');
    h+=card('Power source',plug(si.batPlug));
    if(si.batCurrent){var ma=Math.abs(si.batCurrent)/1000;if(ma>=1&&ma<=12000)h+=card(ch?'Charging current':'Current draw',Math.round(ma)+' mA')}
    if(si.batCounter>0&&lvl>=15){var cap=si.batCounter/(lvl/100)/1000;if(cap>500&&cap<30000)h+=card('Estimated capacity',Math.round(cap)+' mAh')}
    if(si.batTech)h+=card('Technology',si.batTech)}
   else{h+=card('Status',stt)+card('Level',lvl+'%')}
   h+='</div>'+(has?'<div class="bnote">Android reports the health state (good, overheated …). It does not give apps the original battery capacity, so a wear percentage cannot be shown.</div>':'<div class="bnote">Health, temperature and voltage need the updated app build.</div>');
   el.innerHTML=h;setTimeout(tick,2500)})}
 tick()}
window.NX3={apply:apply,bat:bat};apply();
})();
