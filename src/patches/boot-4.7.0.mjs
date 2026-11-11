// BOOT-4.7.0: the boot logo is visible immediately (no stroke-draw delay).
export default [
  { name: "BOOT-4.7.0", find: "#nxb h1{opacity:1!important;animation:none!important;", replace: "#nxb .p{stroke-dashoffset:0!important;fill-opacity:1!important;animation:none!important}#nxb svg{animation:none!important}#nxb h1{opacity:1!important;animation:none!important;" }
];
