/* THUMBFAST-4.6.2 - File Manager photo thumbnails: decode each picture once at 192px (instead of full 2 MB+ size = lag) and cache the small version. */
(function(){'use strict';
if(!window.createImageBitmap)return;
var doc=document,SZ=192,cache=new Map();
function small(src){var hit=cache.get(src);if(hit){cache.delete(src);cache.set(src,hit);return Promise.resolve(hit)}
 return fetch(src).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){return createImageBitmap(b,{resizeWidth:SZ,resizeQuality:'low'})}).then(function(bm){
  var c=doc.createElement('canvas');c.width=bm.width;c.height=bm.height;c.getContext('2d').drawImage(bm,0,0);if(bm.close)bm.close();
  return new Promise(function(ok,no){c.toBlob(function(bl){if(!bl)return no();var u=URL.createObjectURL(bl);cache.set(src,u);if(cache.size>500){var k=cache.keys().next().value;URL.revokeObjectURL(cache.get(k));cache.delete(k)}ok(u)},'image/jpeg',.8)})})}
window.NXTHUMB={small:small};
})();
