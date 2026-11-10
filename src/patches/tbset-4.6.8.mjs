// TBSET-4.6.8: the "Taskbar & notifications" block was injected into every Settings page (Performance, Battery, Themes, ...). Only the Taskbar page gets it.
export default [
  { name: "TBSET-4.6.8", mod: "zz-ztaskbar-4.4.0.js", find: "if(h)h.parentNode.insertBefore(b,h.nextSibling);else{var t=p.querySelector('.nxf,.nxs,.nxc,.nxt');if(!t)return;t.insertBefore(b,t.firstChild)}}", replace: "if(h)h.parentNode.insertBefore(b,h.nextSibling)}" }
];
