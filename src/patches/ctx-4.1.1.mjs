// CTX-4.1.1: the taskbar swatch class .nxm (22x22px) collided with the right-click menu class .nxm and made the menu 22px tall
// (no background). The swatch is renamed to .nxsw. The Add/New flyout now opens on hover and stays open (mouse and virtual mouse).
export default [
  { name: "CTX-4.1.1 swatch markup", mod: "ui-3.7.0.js", find: "<i class=\"nxm\" style=", replace: "<i class=\"nxsw\" style=" },
  { name: "CTX-4.1.1 swatch css", mod: "ui-3.7.0.js", find: ".nxm{display:block;width:22px", replace: ".nxsw{display:block;width:22px" },
  { name: "CTX-4.1.1 swatch svg css", mod: "ui-3.7.0.js", find: ".nxm svg{width:100%", replace: ".nxsw svg{width:100%" },
  { name: "CTX-4.1.1 hover fn", mod: "zz-ctx-4.1.0.js", find: "doc.addEventListener('pointerover',function(e){var t=e.target;", replace: "function hov(e){var t=e.target;" },
  { name: "CTX-4.1.1 hover listeners", mod: "zz-ctx-4.1.0.js", find: "ct=setTimeout(function(){closeAll(it.parentNode)},160)}},true);", replace: "ct=setTimeout(function(){closeAll(it.parentNode)},160)}}\ndoc.addEventListener('pointerover',hov,true);doc.addEventListener('mouseover',hov,true);doc.addEventListener('mousemove',function(e){var t=e.target;if(t&&t.closest){var p=t.closest('.nxm-parent');if(p&&!p.querySelector(':scope>.nxm-sub.open'))openSub(p)}},true);" },
  { name: "CTX-4.1.1 click only opens", mod: "zz-ctx-4.1.0.js", find: "if(s&&s.classList.contains('open'))s.classList.remove('open');else openSub(p)},true);", replace: "openSub(p)},true);" },
  { name: "CTX-4.1.1 hover css", mod: "zz-ctx-4.1.0.js", find: "'.nxm-sub.open{opacity:1;transform:none;pointer-events:auto}',", replace: "'.nxm-sub.open{opacity:1;transform:none;pointer-events:auto}',\n'.nxm-parent:hover>.nxm-sub{opacity:1;transform:none;pointer-events:auto}',\n'.nxm .nxm-it,.nxm-sub .nxm-si{justify-content:flex-start!important;text-align:left!important}'," }
];
