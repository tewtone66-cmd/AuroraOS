// UX-4.0.3: class collision (.nxd) fixes, settings nav without flicker, 4.0.0 version/update info, simpler logo.
const NEWN = 'M136 392 136 120 188 120 324 322 324 120 376 120 376 392 324 392 188 190 188 392Z';
const OLDN = 'M130.7 395.2 130.7 116.8 195.7 116.8 321.0 297.8 321.0 116.8 381.3 116.8 381.3 395.2 316.3 395.2 191.0 214.2 191.0 395.2Z';
export default [
  { name: 'UX-4.0.3 icon preview class (was clashing with the island)', mod: 'ui-3.7.0.js', find: "'<span class=\"nxd\">'", replace: "'<span class=\"nxpd\">'" },
  { name: 'UX-4.0.3 icon preview css', mod: 'ui-3.7.0.js', find: '}.nxd{position:absolute;left:50%', replace: '}.nxpd{position:absolute;left:50%' },
  { name: 'UX-4.0.3 perf box only on Performance/Battery pages', mod: 'zz-perf-3.8.0.js', find: "if(h)h.parentNode.insertBefore(b,h.nextSibling);else{var t=p.querySelector('.nxs,.nxc,.nxt');if(!t)return;t.appendChild(b)}}", replace: "if(h)h.parentNode.insertBefore(b,h.nextSibling)}" },
  { name: 'UX-4.0.3 performance icon', mod: 'zz-icons-3.6.0.js', find: " ['about',/^(about|info)/,'gray',", replace: " ['perf',/^performance/,'green','<path d=\"M4.5 17a7.5 7.5 0 1115 0\"/><path d=\"M12 17l3.6-5.2M7 17h.01M17 17h.01\"/>'],\n ['about',/^(about|info)/,'gray'," },
  { name: 'UX-4.0.3 settings nav keeps its DOM', find: "function nav(){$('#snv',B).innerHTML=NAV.map(", replace: "function nav(){const sv=$('#snv',B);if(sv.querySelector('button')&&sv.dataset.nq===(q?'1':'0')){sv.querySelectorAll('button[data-k=pg]').forEach(b=>b.classList.toggle('sel',b.dataset.v===pg&&!q));return}sv.dataset.nq=q?'1':'0';$('#snv',B).innerHTML=NAV.map(" },
  { name: 'UX-4.0.3 version', find: "var VER='3.2.6',B=document.body;", replace: "var VER='4.0.0',B=document.body;" },
  { name: 'UX-4.0.3 whats new list', find: "ITEMS.map(function(r,i){", replace: "(window.NXWN||ITEMS).map(function(r,i){" },
  { name: 'UX-4.0.3 about version', find: '<p>Version 3.2.6</p>', replace: '<p>Version 4.0.0</p>' },
  { name: 'UX-4.0.3 about version row', find: "['Version','3.2.6']", replace: "['Version','4.0.0']" },
  { name: 'UX-4.0.3 about update rows', find: "['Installed version','3.2.20'],['Updates','Installed manually from GitHub']", replace: "['Installed version','4.0.0'],['Updates','Installed manually from GitHub']" },
  { name: 'UX-4.0.3 update page version', find: "['Installed version','3.2.20'],['Status',", replace: "['Installed version','4.0.0'],['Status'," },
  { name: 'UX-4.0.3 about whats new', find: '<h4>What is new in 3.0.0</h4><ul><li>New virtual mouse with cursor states and motion blur</li><li>New taskbar and Start menu with search</li><li>Recycle Bin that really keeps deleted items</li><li>Settings with categories and search</li></ul>', replace: '<h4>What is new in 4.0.0</h4><ul><li>Better virtual mouse and on-screen keyboard</li><li>Window button styles: Mac or Classic</li><li>Nex Island downloads and a calmer Settings</li><li>Simpler logo</li></ul>' },
  { name: 'UX-4.0.3 new logo', find: OLDN, replace: NEWN, all: true }
];
