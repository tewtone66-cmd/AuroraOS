/* FX-3.4.2 - button feedback animation: the button you just changed pops and gets a light sweep (CSS in index.html: .nxk) */
(function(){'use strict';
var skip={pg:1,back:1,go:1,wall:0};
function calm(){var c=document.body.classList;return c.contains('perf')||c.contains('rm')}
function esc(v){return String(v).replace(/["\\]/g,'\\$&')}
document.addEventListener('click',function(e){
  var t=e.target;if(!t||!t.closest)return;
  var b=t.closest('button[data-k],button[data-q]');if(!b||calm())return;
  var k=b.dataset.k,v=b.dataset.v,q=b.dataset.q;if(k&&skip[k])return;
  var root=b.closest('.win,#trf,#start')||document;
  var sel=q?'button[data-q="'+esc(q)+'"]':'button[data-k="'+esc(k)+'"]'+(v!=null?'[data-v="'+esc(v)+'"]':'');
  setTimeout(function(){
    var n=null;try{n=root.querySelector(sel)}catch(x){}
    if(!n)return;
    n.classList.remove('nxk');void n.offsetWidth;n.classList.add('nxk');
    setTimeout(function(){n.classList.remove('nxk')},750);
  },0);
},true);
})();
