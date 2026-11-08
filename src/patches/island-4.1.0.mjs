// ISLAND-4.1.0: always-on battery beside the idle clock, play state hook for the music animation.
const M = "zz-island-3.9.0.js";
export default [
  { name: "ISL-4.1 default", mod: M, find: "clock:'1',top:'8'}", replace: "clock:'1',batp:'0',top:'8'}" },
  { name: "ISL-4.1 setting", mod: M, find: "row('Clock when idle','clock',ONOFF)+", replace: "row('Clock when idle','clock',ONOFF)+row('Battery always on island','batp',ONOFF)+" },
  { name: "ISL-4.1 markup", mod: M, find: "<div class=\"nxd-v v-idle\"><span class=\"nxd-clk\"></span></div>", replace: "<div class=\"nxd-v v-idle\"><span class=\"nxd-clk\"></span><span class=\"nxd-bp\"></span></div>" },
  { name: "ISL-4.1 always visible", mod: M, find: "else if(mode==='always')v='idle'}", replace: "else if(mode==='always'||C('batp')==='1')v='idle'}" },
  { name: "ISL-4.1 idle render", mod: M, find: "if(v==='idle'){q('.nxd-clk').textContent=C('clock')==='1'?new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):''}", replace: "if(v==='idle'){q('.nxd-clk').textContent=C('clock')==='1'?new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'';var bt=C('batp')==='1'&&ST.bat,bp=q('.nxd-bp');bp.innerHTML=bt?batIc(ST.bat.level,ST.bat.charging,ST.bat.level<=.2)+'<b>'+Math.round(ST.bat.level*100)+'%</b>':'';el.setAttribute('data-bp',bt?'1':'0')}" },
  { name: "ISL-4.1 play state live", mod: M, find: "el.setAttribute('data-two',it.length>1&&!window.NXSAT?'1':'0')}", replace: "el.setAttribute('data-two',it.length>1&&!window.NXSAT?'1':'0');el.setAttribute('data-pl',playing?'1':'0')}" },
  { name: "ISL-4.1 play state music", mod: M, find: "q('[data-nxdc=pp]').innerHTML=playing?IC.pause:IC.play}", replace: "q('[data-nxdc=pp]').innerHTML=playing?IC.pause:IC.play;el.setAttribute('data-pl',playing?'1':'0')}" }
];
