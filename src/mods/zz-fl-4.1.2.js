/* FL-4.1.2 - Explorer detail list: the icon span was a 5th grid cell (pushed Name/Date/Type/Size one column right, size wrapped).
   Move it into the Name cell, replacing the plain icon. */
(function(){'use strict';
var doc=document,st=doc.createElement('style');st.id='nx-fl-css';
st.textContent='.elist .row>.nm>.nxi.fl{display:inline-flex;flex:none;width:20px;height:20px;align-items:center;justify-content:center;margin:0 8px 0 0}.elist .row>.nm>.nxi.fl svg,.elist .row>.nm>.nxi.fl img{width:100%;height:100%}.elist .row>.nm{display:flex;align-items:center;min-width:0}';
doc.head.appendChild(st);
function fix(){var l=doc.querySelectorAll('.elist .row>.nxi.fl');for(var i=0;i<l.length;i++){var ic=l[i],row=ic.parentElement,nm=row.querySelector(':scope>.nm');if(!nm)continue;
 var old=nm.querySelector(':scope>svg');if(old)old.remove();nm.insertBefore(ic,nm.firstChild)}}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;fix()})}).observe(doc.body,{childList:true,subtree:true});fix();
})();
