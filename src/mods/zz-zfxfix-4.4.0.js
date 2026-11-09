/* FXFIX-4.4.0 - File Explorer spacing + button fix.
   Cause: zz-zfiles has ".fx button{padding:0}" (specificity 0,1,1) which beat every single-class button rule (.fx-ab, .fx-si, .fx-dv, .fx-btn, .fx-cr),
   so sidebar items, the New button and crumbs had no padding (text touching the edges, "New" looked cut). These rules use ".fx .x" so they win. CSS only. */
(function(){'use strict';
var css=[
'.fx .fx-top{padding:12px 16px 10px;gap:8px}',
'.fx .fx-ib{padding:0}',
'.fx .fx-cr{padding:5px 9px}',
'.fx .fx-side{padding:2px 12px 16px 16px}',
'.fx .fx-sh{margin:18px 12px 7px}.fx .fx-sh:first-child{margin-top:8px}',
'.fx .fx-si{padding:8px 12px;gap:12px;margin-bottom:2px;border-radius:12px}',
'.fx .fx-si .tl{width:26px;height:26px;border-radius:9px}',
'.fx .fx-dv{padding:10px 12px;gap:7px;margin:4px 0 6px;border-radius:14px}',
'.fx .fx-dv:not(.on){background:rgba(127,127,127,.09)}.fx .fx-dv .l{display:block;margin-bottom:1px}',
'.fx .fx-bar{height:6px}',
'.fx .fx-pane{margin:0 14px 14px 0}',
'.fx .fx-act{padding:10px 14px;gap:8px;min-height:58px}',
'.fx .fx-ab{padding:0 14px;gap:8px;height:36px;border-radius:12px}',
'.fx .fx-ab.pri{padding:0 18px 0 14px;min-width:88px;justify-content:center}',
'.fx .fx-btn{padding:0 18px}',
'.fx .fx-list{padding:10px 14px 14px}',
'.fx .fx-r{padding:6px 12px}',
'.fx .fx-stat{padding:10px 18px}',
'.fx[data-w=s] .fx-ab{padding:0 11px}.fx[data-w=s] .fx-ab.pri{padding:0 14px}.fx[data-w=s] .fx-pane{margin:0}.fx[data-w=s] .fx-side{padding:8px 12px 16px 14px}',
'.fx[data-w=m] .fx-side{width:204px}'
].join('\n');
var st=document.createElement('style');st.id='nx-fxfix-css';st.textContent=css;document.head.appendChild(st);
})();
