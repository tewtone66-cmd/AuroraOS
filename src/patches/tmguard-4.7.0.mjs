// TMGUARD-4.7.0: the Task Manager "Details" tab hook ran on any .tk element (the Clock app has one) and threw on a missing .tkt.
export default [
  { name: "TMGUARD-4.7.0", mod: "zz-tm-4.1.0.js", find: "var tabs=tk.querySelector('.tkt'),pn=doc.createElement('div');", replace: "var tabs=tk.querySelector('.tkt'),pn=doc.createElement('div');if(!tabs)return;" }
];
