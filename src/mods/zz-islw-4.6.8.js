/* ISLW-4.6.8 - Nex Island: the little grip marks on the island are gone (the edges still drag to stretch), and Settings > Nex Island gets an "Island width" slider next to "Island size". */
(function(){'use strict';var doc=document;
var st=doc.createElement('style');st.id='nx-islw-css';st.textContent='.nxd-rs:after{display:none!important}.nxd-rs{opacity:0!important}';doc.head.appendChild(st);
function mount(){var box=doc.querySelector('#spg .nxd-set');if(!box||box.querySelector('.nx-island-width')||!window.NXISLRS)return;var ref=box.querySelector('.nxl-row');if(!ref)return;
 var row=doc.createElement('div');row.className='nx-island-size nx-island-width';
 row.innerHTML='<label for="nxIslandWidth">Island width</label><input id="nxIslandWidth" type="range" min="0" max="600" step="10"><output for="nxIslandWidth"></output>';
 var s=row.querySelector('input'),o=row.querySelector('output');s.value=Math.max(0,NXISLRS.get());o.textContent=s.value+' px';
 s.addEventListener('input',function(){NXISLRS.set(+s.value);o.textContent=s.value+' px'});
 ref.parentNode.insertBefore(row,ref)}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;mount()})}).observe(doc.body,{childList:true,subtree:true});
})();
