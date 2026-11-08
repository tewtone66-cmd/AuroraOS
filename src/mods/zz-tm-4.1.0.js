/* TM-4.1.0 - Task Manager: Details tab (uptime, windows, threads, memory, screen, network) */
(function(){'use strict';
var doc=document;
var st=doc.createElement('style');st.id='nx-tm-css';st.textContent=[
'.tk .tkd{display:none;padding:14px;gap:10px;flex-wrap:wrap;overflow:auto}.tk[data-tab=d] .tkd{display:flex}.tk[data-tab=d] .tkp,.tk[data-tab=d] .tkf{display:none}',
'.tk .tkd .cd2{flex:1 1 150px;padding:12px;border-radius:12px;background:var(--surf2);border:1px solid var(--line)}.tk .tkd .cd2 b{display:block;font-size:20px;margin-top:4px}.tk .tkd .cd2 span{font-size:12px;opacity:.7}'
].join('\n');doc.head.appendChild(st);
/* ---- Task Manager: Details tab ---- */
var tries=0,iv3=setInterval(function(){tries++;doc.querySelectorAll('.tk').forEach(function(tk){if(tk._d)return;tk._d=1;
  var tabs=tk.querySelector('.tkt'),pn=doc.createElement('div');pn.className='tkd';var b=doc.createElement('button');b.setAttribute('data-t','d');b.textContent='Details';tabs.appendChild(b);tk.appendChild(pn);
  function upd(){if(!tk.isConnected)return;if(tk.dataset.tab!=='d')return;var up=Math.round(performance.now()/1000),h=Math.floor(up/3600),m=Math.floor(up/60)%60,n=navigator,items=[['Uptime',h+'h '+m+'m'],['Windows open',(typeof W!=='undefined'?Object.keys(W).length:0)],['CPU threads',n.hardwareConcurrency||'?'],['Device memory',(n.deviceMemory?n.deviceMemory+' GB':'n/a')],['Screen',innerWidth+'×'+innerHeight+' @'+(window.devicePixelRatio||1)+'x'],['Network',n.onLine?(n.connection&&n.connection.effectiveType||'online'):'offline']];
   var pm=performance.memory;if(pm)items.push(['JS heap',(pm.usedJSHeapSize/1048576|0)+' / '+(pm.jsHeapSizeLimit/1048576|0)+' MB']);
   pn.innerHTML=items.map(function(i){return'<div class="cd2"><span>'+i[0]+'</span><b>'+i[1]+'</b></div>'}).join('')}
  tk.addEventListener('click',function(e){if(e.target.closest('[data-t=d]')){tk.dataset.tab='d';tk.querySelectorAll('.tkt button').forEach(function(x){x.classList.toggle('on',x===b)});upd()}});
  setInterval(upd,1000)});if(tries>600)clearInterval(iv3)},1000);
})();
