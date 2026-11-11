/* DOCKFIX-4.6.6 - dock layout order: Start (N), separator, apps. (Search button removed.) */
(function(){'use strict';var s=document.createElement('style');s.id='nx-dockfix-css';
s.textContent='html body.lay-dock #startBtn{order:-4!important}html body.lay-dock #srchBtn{display:none!important}html body.lay-dock #nxdkSep{order:-2!important}html body.lay-dock #tasks{order:1!important}html body.lay-dock #nxkbBtn{order:6!important}';
document.head.appendChild(s)})();
