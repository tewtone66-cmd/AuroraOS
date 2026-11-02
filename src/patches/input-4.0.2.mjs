// INPUT-4.0.2: native web view is clipped above the on-screen keyboard; keyboard keys reach native pages.
export default [
  { name: "INPUT-4.0.2 sync key", find: "const key=[best.id,r.left|0,r.top|0,r.width|0,r.height|0,S.pw].join();", replace: "const nkh=window.nxKbClip?nxKbClip(r):r.height;const key=[best.id,r.left|0,r.top|0,r.width|0,nkh|0,S.pw].join();" },
  { name: "INPUT-4.0.2 sync show", find: "NB.show({id:best.id,x:r.left,y:r.top,w:r.width,h:r.height,cw:innerWidth,ref:S.pw})", replace: "NB.show({id:best.id,x:r.left,y:r.top,w:r.width,h:nkh,cw:innerWidth,ref:S.pw})" },
  { name: "INPUT-4.0.2 vkb native keys", mod: "zz-vkb-3.5.0.js", find: "function act(c,rep){var el=doc.activeElement||doc.body,m=mods(),ch=charFor(c),key=ch!=null?ch:(NK[c]||c);", replace: "function act(c,rep){var el=doc.activeElement||doc.body,m=mods(),ch=charFor(c),key=ch!=null?ch:(NK[c]||c);if(window.NXNAT&&NXNAT.on(el)){NXNAT.send(c,key,ch,m);return key}" }
];
