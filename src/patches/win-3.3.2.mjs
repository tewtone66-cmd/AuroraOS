// WIN-3.3.2 patches (see src/mods/win-3.3.2.js)
export default [
  {
    // right-click (button 2), the R button of the virtual mouse and the context-menu key must NOT open the app
    name: 'WIN-3.3.2 tapEl ignores non-primary buttons',
    find: "el.addEventListener('pointerdown',e=>{seen=Date.now();s={id:e.pointerId,x:e.clientX,y:e.clientY,t:Date.now()}});el.addEventListener('pointerup',e=>{if(!s||e.pointerId!==s.id)return;",
    replace: "el.addEventListener('pointerdown',e=>{seen=Date.now();s=e.button?null:{id:e.pointerId,x:e.clientX,y:e.clientY,t:Date.now()}});el.addEventListener('pointerup',e=>{if(!s||e.pointerId!==s.id||e.button)return;",
  },
];
