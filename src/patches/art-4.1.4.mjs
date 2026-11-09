// ART-4.1.4: expose the cover-art reader so the File Manager can show music covers.
export default [
  { name: "ART-4.1.4 expose", mod: "zz-zfix-4.2.0.js", find: "var AM={};\n", replace: "var AM={};window.NXART={load:function(s){return load(s)}};\n" }
];
