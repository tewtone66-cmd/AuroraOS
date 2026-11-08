/* ISLAND-4.1.0 - idle clock no longer leaks into other island views, always-on battery, Samsung-style music animation */
(function(){'use strict';
var s=document.createElement('style');s.id='nx-isl-410';
s.textContent=[
'.nxd:not([data-v=idle]) .v-idle{opacity:0!important;visibility:hidden!important;pointer-events:none}',
'.nxd .nxd-v{will-change:opacity,transform}',
'.nxd .ic{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;flex:none}.nxd .ic svg{width:17px;height:17px;display:block;margin:0;color:#fff}.nxd .ic.o{box-shadow:0 2px 8px rgba(249,115,22,.45)}',
'.v-idle{gap:8px}.nxd-bp{display:none;align-items:center;gap:5px;font:700 11px system-ui}.nxd[data-bp="1"] .nxd-bp{display:inline-flex}.nxd-bp svg{width:22px;height:13px}',
'.nxd[data-v=idle][data-bp="1"]{width:132px}',
/* music: art pops when playing and settles when paused, soft glow like One UI */
'.nxd .mu-art,.nxd-l .art{transition:transform .45s cubic-bezier(.34,1.56,.64,1),box-shadow .45s,filter .45s}',
'.nxd[data-pl="0"] .mu-art,.nxd[data-pl="0"] .nxd-l .art{transform:scale(.88);filter:saturate(.55) brightness(.85);box-shadow:none}',
'.nxd[data-pl="1"] .mu-art{transform:scale(1);box-shadow:0 8px 26px rgba(160,110,255,.45);animation:nxdArt 2.6s ease-in-out infinite}',
'.nxd[data-pl="1"] .nxd-l .art{animation:nxdArtS 2.2s ease-in-out infinite}',
'@keyframes nxdArt{0%,100%{transform:scale(1)}50%{transform:scale(1.06);box-shadow:0 10px 32px rgba(160,110,255,.6)}}',
'@keyframes nxdArtS{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}',
'.nxd[data-v=music]{transition-timing-function:cubic-bezier(.34,1.4,.64,1)}'
].join('\n');
document.head.appendChild(s);
})();
