// MZ-5.1.0: album covers for songs, albums and artists. Besides the picture inside the file, use cover.jpg / folder.jpg ... from the same folder. Rows show covers too.
export default [
  { name: 'MZ-5.1.0 art finder', mod: 'zz-zmusic-4.4.0.js', optional: true,
    find: "function getArt(s){if(!SYS||!SYS.art)return Promise.resolve('');var k=s.aid||s.p;",
    replace: "var FOLD={};function artFind(s){var emb=(SYS&&SYS.art)?SYS.art({path:s.p}).then(function(r){return r&&r.img||''},function(){return ''}):Promise.resolve('');return emb.then(function(img){if(img)return img;var d=String(s.p).replace(/[^\\/]*$/,'');if(FOLD[d]!==undefined)return FOLD[d];var nm=['cover.jpg','folder.jpg','front.jpg','albumart.jpg','album.jpg','Cover.jpg','Folder.jpg','cover.png','folder.png'];return new Promise(function(res){var i=0;(function t(){if(i>=nm.length){FOLD[d]='';return res('')}var im=new Image(),u=src(d+nm[i++]);im.onload=function(){FOLD[d]=u;res(u)};im.onerror=t;im.src=u})()})})}\nfunction getArt(s){var k=s.aid||s.p;" },
  { name: 'MZ-5.1.0 art queue', mod: 'zz-zmusic-4.4.0.js', optional: true,
    find: "(function(j){SYS.art({path:j.s.p}).then(function(r){ART[j.k]=r&&r.img||'';j.res(ART[j.k])},function(){ART[j.k]='';j.res('')}).then(function(){artBusy--;pumpArt()})})(j)",
    replace: "(function(j){artFind(j.s).then(function(img){ART[j.k]=img||'';j.res(ART[j.k])},function(){ART[j.k]='';j.res('')}).then(function(){artBusy--;pumpArt()})})(j)" },
  { name: 'MZ-5.1.0 row covers', mod: 'zz-zmusic-4.4.0.js', optional: true,
    find: "function showMode(m){vl.hidden=m!=='list';gr.hidden=m!=='grid';em.hidden=m!=='empty'}",
    replace: "function rowArt(){sp.querySelectorAll('.mz-r').forEach(function(r){var s=view.list[+r.dataset.i];if(!s)return;var t=r.querySelector('.tl'),k=s.aid||s.p;if(!t||t.dataset.a===String(k))return;t.dataset.a=String(k);function put2(img){if(img&&t.dataset.a===String(k)){t.style.backgroundImage='url(\"'+img+'\")';t.style.backgroundSize='cover';t.style.backgroundPosition='center';t.classList.add('has')}}if(ART[k]!==undefined){put2(ART[k]);return}getArt(s).then(put2)})}\nfunction showMode(m){vl.hidden=m!=='list';gr.hidden=m!=='grid';em.hidden=m!=='empty'}" },
  { name: 'MZ-5.1.0 paint covers', mod: 'zz-zmusic-4.4.0.js', optional: true,
    find: "sp.style.height=(L.length*RH)+'px';sp.innerHTML=o}",
    replace: "sp.style.height=(L.length*RH)+'px';sp.innerHTML=o;rowArt()}" }
];
