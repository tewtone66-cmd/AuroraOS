// WALL-4.6.1: centred bloom compositions, no slow gradient transitions (cause of glitches), vkb dock insert fix.
export default [
  { name: "WALL-4.6.1 comp0", mod: "zz-zwall-4.6.0.js", find: "{seed:11,cx:1060,cy:740,n:17,a0:-112,a1:48,L0:430,L1:820,gx:.62,gy:.72,", replace: "{seed:11,cx:800,cy:760,n:17,a0:-82,a1:82,L0:430,L1:800,gx:.5,gy:.78," },
  { name: "WALL-4.6.1 comp1", mod: "zz-zwall-4.6.0.js", find: "{seed:27,cx:540,cy:760,n:19,a0:-86,a1:86,L0:380,L1:760,gx:.34,gy:.74,", replace: "{seed:27,cx:800,cy:770,n:19,a0:-90,a1:90,L0:380,L1:760,gx:.5,gy:.8," },
  { name: "WALL-4.6.1 comp2", mod: "zz-zwall-4.6.0.js", find: "{seed:43,cx:1200,cy:790,n:15,a0:-176,a1:-6,L0:470,L1:860,gx:.72,gy:.8,", replace: "{seed:43,cx:800,cy:790,n:15,a0:-86,a1:86,L0:430,L1:820,gx:.5,gy:.84," },
  { name: "WALL-4.6.1 no transition", mod: "zz-zwall-4.6.0.js", find: "'#nxbl stop{transition:stop-color 30s linear}#nxbl.fast stop{transition-duration:1.2s}',\n", replace: "" },
  { name: "WALL-4.6.1 vkb", mod: "zz-input-4.0.2.js", find: "dk.insertBefore(b,clk||null)", replace: "dk.insertBefore(b,clk&&clk.parentNode===dk?clk:null)" }
];
