// ISLAND-3.9.1 patches (see src/mods/zz-island-fix-3.9.1.js)
export default [
  {
    // two new Settings pages: Nex Island and Notifications (their content is filled by the island / notify mods)
    name: 'ISLAND-3.9.1 settings nav entries',
    find: "['task','Taskbar']]],['Devices'",
    replace: "['task','Taskbar'],['island','Nex Island'],['notif','Notifications']]],['Devices'",
  },
  {
    name: 'ISLAND-3.9.1 settings page bodies',
    find: "function nav(){$('#snv',B)",
    replace: "PGS.island=()=>'<h3>Nex Island</h3>';PGS.notif=()=>'<h3>Notifications</h3>';\nfunction nav(){$('#snv',B)",
  },
  {
    // expose internals so the timer / battery bubbles can sit next to the island
    name: 'ISLAND-3.9.1 expose island state',
    mod: 'zz-island-3.9.0.js', optional: true,
    find: 'window.NXISLAND={timer:startTimer,',
    replace: 'window.NXISLAND={ST:ST,C:C,pin:pin,decide:decide,trans:trans,timer:startTimer,',
  },
  {
    // battery alerts become a small bubble next to the island instead of covering the clock
    name: 'ISLAND-3.9.1 battery alerts as bubble',
    mod: 'zz-island-3.9.0.js', optional: true,
    find: "function trans(t){if(C('mode')==='off')return;ST.q.push(t)",
    replace: "function trans(t){if(C('mode')==='off')return;if(t.view==='batt'&&!t.raw&&window.NXSAT&&window.NXSAT.batt(t))return;ST.q.push(t)",
  },
  {
    // with music playing the timer is shown as its own bubble, not squeezed into the pill
    name: 'ISLAND-3.9.1 timer bubble (pill text)',
    mod: 'zz-island-3.9.0.js', optional: true,
    find: "R=it.length>1?'<span class=\"tm\">'+fmt(t.end-now)+'</span>':'<span class=\"mu-bars'",
    replace: "R=it.length>1&&!window.NXSAT?'<span class=\"tm\">'+fmt(t.end-now)+'</span>':'<span class=\"mu-bars'",
  },
  {
    name: 'ISLAND-3.9.1 timer bubble (pill width)',
    mod: 'zz-island-3.9.0.js', optional: true,
    find: "el.setAttribute('data-two',it.length>1?'1':'0')",
    replace: "el.setAttribute('data-two',it.length>1&&!window.NXSAT?'1':'0')",
  },
];
