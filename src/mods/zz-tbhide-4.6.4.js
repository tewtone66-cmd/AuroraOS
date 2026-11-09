/* TBHIDE-4.6.4 - optional "no title bar" mode: the bar disappears and only the window buttons (close / minimise / maximise / dock) stay as a small floating pill.
   Settings > Themes > Window buttons: switch + corner (top left / top right / bottom left / bottom right). Drag the window by the pill. */
(function(){'use strict';
var doc=document,root=doc.documentElement;
function g(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var ON=g('aur.tbh','0')==='1',POS=/^(tl|tr|bl|br)$/.test(g('aur.tbp','tr'))?g('aur.tbp','tr'):'tr';
function apply(){if(ON)root.setAttribute('data-tbh',POS);else root.removeAttribute('data-tbh')}apply();
var P=':root[data-tbh]:root:root .win .tbar';
var st=doc.createElement('style');st.id='nx-tbh-css';
st.textContent=P+'{position:absolute!important;z-index:40;width:auto!important;height:auto!important;min-height:0!important;padding:5px 8px!important;gap:2px;background:rgba(18,22,30,.6)!important;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12)!important;border-radius:12px!important;box-shadow:0 4px 14px rgba(0,0,0,.35);left:auto;right:auto;top:auto;bottom:auto;cursor:grab}'
+P+' .tt,'+P+'>span{display:none!important}'
+':root[data-tbh=tl]:root:root .win .tbar{top:8px;left:8px}:root[data-tbh=tr]:root:root .win .tbar{top:8px;right:8px}:root[data-tbh=bl]:root:root .win .tbar{bottom:8px;left:8px}:root[data-tbh=br]:root:root .win .tbar{bottom:8px;right:8px}'
+':root[data-tbh]:root:root .win .tbar button{align-self:center!important;height:24px!important}'
+'#tb-sec{margin-top:18px}#tb-sec .nxh{font-weight:700;font-size:13px;margin:0 2px 10px}#tb-sec .tbr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surf2,transparent)}'
+'#tb-sec .tbr b{display:block;font-size:13px}#tb-sec .tbr em{display:block;font-style:normal;font-size:11px;opacity:.65;margin-top:2px}'
+'#tb-sec .sw{flex:none;width:42px;height:24px;border-radius:12px;background:rgba(127,127,127,.4);position:relative;cursor:pointer;transition:background .15s}#tb-sec .sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}#tb-sec.on .sw{background:var(--acc,#6c8cff)}#tb-sec.on .sw::after{transform:translateX(18px)}'
+'#tb-sec .tbp{display:none;gap:8px;margin-top:10px;flex-wrap:wrap}#tb-sec.on .tbp{display:flex}#tb-sec .tbp button{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surf2,transparent);color:var(--txt);font:inherit;font-size:12px;cursor:pointer}#tb-sec .tbp button.sel{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc)}';
doc.head.appendChild(st);
var NAMES={tl:'Top left',tr:'Top right',bl:'Bottom left',br:'Bottom right'};
function html(){return '<div class="nxh">Title bar</div><div class="tbr"><div><b>Hide title bar</b><em>Only the window buttons stay, as a small pill you can drag the window by.</em></div><div class="sw" role="switch" tabindex="0"></div></div><div class="tbp">'+['tl','tr','bl','br'].map(function(k){return '<button data-p="'+k+'" class="'+(k===POS?'sel':'')+'">'+NAMES[k]+'</button>'}).join('')+'</div>'}
function mount(){var wb=doc.getElementById('wb-sec');if(!wb||!wb.isConnected)return;var s=doc.getElementById('tb-sec');if(s&&s.isConnected&&s.previousElementSibling===wb)return;if(s)s.remove();
 s=doc.createElement('div');s.id='tb-sec';s.className=ON?'on':'';s.innerHTML=html();wb.insertAdjacentElement('afterend',s);
 s.addEventListener('click',function(e){e.stopPropagation();var sw=e.target.closest('.sw'),pb=e.target.closest('[data-p]');
  if(sw){ON=!ON;put('aur.tbh',ON?'1':'0');s.classList.toggle('on',ON);apply()}
  else if(pb){POS=pb.dataset.p;put('aur.tbp',POS);apply();[].forEach.call(s.querySelectorAll('[data-p]'),function(b){b.classList.toggle('sel',b===pb)})}})}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;mount()})}).observe(doc.body,{childList:true,subtree:true});
})();
