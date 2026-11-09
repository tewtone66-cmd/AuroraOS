// LOGO-4.0.1: new NexOS mark (clean solid N, no gradient / glow) everywhere in the app
const OLD = 'M130.7 395.2 130.7 116.8 195.7 116.8 321.0 297.8 321.0 116.8 381.3 116.8 381.3 395.2 316.3 395.2 191.0 214.2 191.0 395.2Z';
const NEW = 'M148 392V120H192L320 290V120H364V392H320L192 222V392Z';
const OLDATTR = 'fill="url(#nxg)" stroke="url(#nxg)" stroke-width="12" stroke-linejoin="round"';
export default [
  {
    name: 'LOGO-4.0.1 STAR constant (dock, About)',
    find: `const STAR='<svg class="star" viewBox="0 0 512 512"><path d="${OLD}" ${OLDATTR}/></svg>';`,
    replace: `const STAR='<svg class="star" viewBox="0 0 512 512"><path d="${NEW}" fill="#f3f4f6"/></svg>';`,
  },
  {
    name: 'LOGO-4.0.1 boot screen mark',
    find: `<path class="p" pathLength="100" d="${OLD}" ${OLDATTR}/>`,
    replace: `<path class="p" pathLength="100" d="${NEW}" fill="#f3f4f6" stroke="#f3f4f6" stroke-width="6" stroke-linejoin="round"/>`,
  },
  {
    name: 'LOGO-4.0.1 shutdown screen mark',
    find: `<svg class="lg" viewBox="0 0 512 512"><path d="${OLD}" ${OLDATTR}/>`,
    replace: `<svg class="lg" viewBox="0 0 512 512"><path d="${NEW}" fill="#f3f4f6"/>`,
  },
  {
    name: 'LOGO-4.0.1 start button tile',
    find: '--g:linear-gradient(150deg,#232b63,#0c1130 55%,#04060f)',
    replace: '--g:linear-gradient(150deg,#1c1e23,#0b0c0f)',
  },
  {
    name: 'LOGO-4.0.1 path constant (N)',
    find: `var N="${OLD}";`,
    replace: `var N="${NEW}";`,
  },
  {
    name: 'LOGO-4.0.1 nlogo()',
    find: `function nlogo(){return '<svg viewBox="0 0 512 512"><path d="${OLD}" ${OLDATTR}/></svg>'}`,
    replace: `function nlogo(){return '<svg viewBox="0 0 512 512"><path d="${NEW}" fill="#f3f4f6"/></svg>'}`,
  },
  {
    name: 'LOGO-4.0.1 setup-wizard logo',
    find: `<svg class="ol" viewBox="0 0 512 512"><path d="${OLD}" ${OLDATTR}/></svg>`,
    replace: `<svg class="ol" viewBox="0 0 512 512"><path d="${NEW}" fill="#f3f4f6"/></svg>`,
  },
];
