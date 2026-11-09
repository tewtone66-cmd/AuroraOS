// THUMBFAST-4.6.2: File Manager photos use small cached thumbnails (falls back to the full file).
export default [
  { name: "THUMBFAST-4.6.2 img", mod: "zz-zfiles-4.3.0.js",
    find: "if(k==='img'){if(it.size>40e6)return;TQ.push(function(d){var i=new Image();i.decoding='async';i.onload=function(){put2(i);d()};i.onerror=d;i.src=fsrc(it.path)})}",
    replace: "if(k==='img'){if(it.size>40e6)return;TQ.push(function(d){var i=new Image(),u=fsrc(it.path),fb=0;i.decoding='async';i.onload=function(){put2(i);d()};i.onerror=function(){if(!fb){fb=1;i.src=u}else d()};if(window.NXTHUMB)NXTHUMB.small(u).then(function(s){i.src=s},function(){i.src=u});else i.src=u})}" }
];
