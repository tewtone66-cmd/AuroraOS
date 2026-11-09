/* FILES-4.3.0 - File Explorer redesign (new app UI on top of the same NF plugin).
   - Layout: top bar (back / forward / up, clickable breadcrumb path, search, grid/list switch), sidebar (Quick access, Pinned, Storage with usage bars, Android),
     action bar that changes with the selection, list or grid view with colourful file icons, status bar.
   - Real thumbnails for photos, video frames, music covers (NXART) and .exe icons (NW.exeIcon).
   - Select: click, Ctrl/Shift, round checkboxes, touch long-press. Open: double click (or the Open button). Right click menu uses ctx() (New / Sort by / View flyouts come from zz-ctx + zz-zfix).
   - Copy / Cut / Paste with progress and Cancel, Rename, Delete (asks first), New folder / file, Compress, Extract, Properties, Pin folder to sidebar, search (this folder or all storage).
   - Android/data + obb permission cards, storage permission card.
   - The old Explorer is kept as the hidden app "filesold" (menu: More > Open classic Explorer). If this file throws, the old Explorer opens instead.
   Do not write octal escapes or the HTML comment opener in this file (it is inlined into index.html). */
(function(){'use strict';
var doc=document;
if(typeof A==='undefined'||!A.files||typeof NF==='undefined'||typeof openApp!=='function')return;
var OLD=A.files.f;
function g(k,d){var v;try{v=ls(k)}catch(e){}return v==null||v===''?d:v}
function put(k,v){try{ls(k,v)}catch(e){}}
function ok(f){try{return f()}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(t){ok(function(){if(typeof toast==='function')toast(t)})}
function fail(e){say(String((e&&e.message)||e||'Something went wrong').replace(/^\[[A-Z_]+\]\s*/,''))}
var PREF=(function(){try{return JSON.parse(g('aur.fx2','{}'))||{}}catch(e){return{}}})();
if(!PREF.sort||!PREF.sort.k)PREF.sort={k:'name',asc:true};if(PREF.view!=='list')PREF.view='grid';
var PINS=(function(){try{var p=JSON.parse(g('aur.fx.pins','[]'));return Array.isArray(p)?p:[]}catch(e){return[]}})();
function CLIP(v){if(v===undefined)return window.NXFXCLIP||null;window.NXFXCLIP=v;return v}
/* ---------- icons ---------- */
var IS={back:'<path d="M15 5l-7 7 7 7"/>',fwd:'<path d="M9 5l7 7-7 7"/>',up:'<path d="M12 19V6M6.5 11.5L12 6l5.5 5.5"/>',down:'<path d="M12 5v13M6.5 12.5L12 18l5.5-5.5"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',plus:'<path d="M12 5v14M5 12h14"/>',copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/>',cut:'<circle cx="6.5" cy="17" r="2.5"/><circle cx="17.5" cy="17" r="2.5"/><path d="M8 15L18 4M16 15L6 4"/>',paste:'<rect x="6" y="5" width="12" height="15" rx="2"/><path d="M9 5V4h6v1M9 11h6M9 15h4"/>',trash:'<path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13M10 11v6M14 11v6"/>',rename:'<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',zip:'<path d="M6 4h12v16H6zM12 4v10M10.5 7h3M10.5 10h3"/>',info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',x:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',refresh:'<path d="M19 8a7.5 7.5 0 0 0-13-1.5M5 4v4h4M5 16a7.5 7.5 0 0 0 13 1.5M19 20v-4h-4"/>',open:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',sort:'<path d="M7 5v14M4 16l3 3 3-3M17 19V5M14 8l3-3 3 3"/>',home:'<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',download:'<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/>',doc:'<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v4h4M9 12h6M9 16h6"/>',image:'<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-4 4 3 3-2 4 3"/>',camera:'<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',music:'<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="16" r="2.5"/>',film:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M9.5 9.5v5l4.5-2.5z"/>',android:'<path d="M7 9h10v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM8 6L6.5 4M16 6l1.5-2M7 9a5 5 0 0 1 10 0"/>',pin:'<path d="M9 4h6l-1 5 3 3H7l3-3zM12 15v5"/>',folder:'<path d="M3.5 7a2 2 0 0 1 2-2H10l2 2h6.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'};
function sv(k,w){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.8)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IS[k]+'</svg>'}
var EXT={img:/^(jpe?g|png|gif|webp|bmp|avif|heic|svg|ico)$/,vid:/^(mp4|m4v|webm|mkv|mov|3gp|avi)$/,aud:/^(mp3|flac|m4a|aac|ogg|opus|wav|wma)$/,pdf:/^pdf$/,doc:/^(docx?|rtf|odt)$/,xls:/^(xlsx?|csv|ods)$/,ppt:/^(pptx?|odp)$/,code:/^(js|mjs|json|html?|css|java|kt|py|xml|sh|c|cpp|h|ts|tsx|jsx|yml|yaml|php|rs|go|lua|sql|ini|cfg|toml)$/,zip:/^(zip|rar|7z|tar|gz|tgz|xz|bz2)$/,apk:/^(apk|xapk|apks)$/,exe:/^(exe|msi|dll)$/,txt:/^(txt|md|log|nfo)$/,bat:/^(bat|cmd|ps1)$/};
var COL={img:['#ff7ab0','#d9387f'],vid:['#ff8a66','#e0452b'],aud:['#b197fc','#6f4be0'],pdf:['#ff6b78','#d62839'],doc:['#62a8ff','#2f6fe0'],xls:['#4cc98a','#1b9a54'],ppt:['#ffa35c','#e0691d'],code:['#34d6c6','#0f9d90'],zip:['#ffcd4d','#e29a0a'],apk:['#86e070','#3fae2f'],exe:['#6a7ca3','#2f3a55'],txt:['#a3afc4','#6a7790'],bat:['#8a96b0','#3b4560'],oth:['#b3bccd','#7d889d']};
var FC={download:['#2fc98a','#53e0a6'],documents:['#4a90ff','#7ab3ff'],pictures:['#ff6fa8','#ff9cc6'],dcim:['#ff9a4d','#ffbb80'],music:['#8f6bff','#b39bff'],movies:['#ff6a4d','#ff9a85'],videos:['#ff6a4d','#ff9a85'],android:['#5fc04a','#8ad87a']};
function ext(it){var m=/\.([^./]+)$/.exec(it.name);return m?m[1].toLowerCase():''}
function cat(it){if(it.isDirectory)return'dir';var e=ext(it);for(var k in EXT)if(EXT[k].test(e))return k;return'oth'}
function kind(it){if(it.isDirectory)return'dir';var e=ext(it);if(EXT.img.test(e))return'img';if(EXT.vid.test(e))return'vid';if(EXT.aud.test(e))return'aud';if(/^(zip|rar|7z)$/.test(e))return'zip';if(e==='exe')return'exe';if(/^(bat|cmd)$/.test(e))return'bat';if(/^(txt|md|log|csv|ini|cfg|nfo)$/.test(e))return'txt';if(EXT.code.test(e))return'code';return''}
function icon(it){var c=cat(it);
 if(c==='dir'){var f=FC[(it.name||'').toLowerCase()]||['#f0a93a','#ffc653'];return'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 12a4 4 0 0 1 4-4h10l5 5h17a4 4 0 0 1 4 4v1H4z" fill="'+f[0]+'"/><rect x="4" y="16" width="40" height="26" rx="4" fill="'+f[1]+'"/><rect x="4" y="16" width="40" height="8" rx="4" fill="#fff" opacity=".2"/></svg>'}
 var k=COL[c],e=(ext(it)||'file').toUpperCase().slice(0,4);
 return'<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M6 2h20l10 10v32a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="'+k[0]+'"/><path d="M26 2l10 10h-8a2 2 0 0 1-2-2z" fill="#fff" opacity=".42"/><rect x="4" y="28" width="32" height="13" rx="2.5" fill="'+k[1]+'"/><text x="20" y="37.6" text-anchor="middle" font-size="'+(e.length>3?8:9.5)+'" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">'+esc(e)+'</text></svg>'}
function fsize(n){if(n==null||n<0)return'';var u=['B','KB','MB','GB','TB'],i=0;while(n>=1024&&i<4){n/=1024;i++}return(i?n.toFixed(n<10?1:0):n)+' '+u[i]}
function fdate(ms){if(!ms)return'';var d=new Date(ms),n=new Date(),o={day:'numeric',month:'short'};if(d.getFullYear()!==n.getFullYear())o.year='numeric';return d.toLocaleDateString([],o)+', '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function base(p){return String(p).replace(/\/+$/,'').split('/').pop()}
function dirn(p){var s=String(p).replace(/\/+$/,''),i=s.lastIndexOf('/');return i<=0?'/':s.slice(0,i)}
function join(a,b){return String(a).replace(/\/+$/,'')+'/'+b}
function typ(it){return it.isDirectory?'Folder':(ext(it)?ext(it).toUpperCase()+' file':'File')}
/* ---------- css ---------- */
var CSS=[
'.fx{--fxa:var(--acc,#4f7cff);--fxs:rgba(127,127,127,.14);--fxh:var(--hov,rgba(127,127,127,.14));position:relative;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--txt);font-size:13px;outline:0;overflow:hidden}',
'.fx *{box-sizing:border-box}.fx [hidden]{display:none!important}.fx button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}.fx svg{display:block}',
'.fx .nxi,.fx .nxi-in{display:none!important}',
'.fx-top{display:flex;align-items:center;gap:6px;padding:10px 12px 8px;flex:none}',
'.fx-ib{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;flex:none;transition:background-color .15s,transform .12s,opacity .15s}.fx-ib svg{width:18px;height:18px}.fx-ib:hover{background:var(--fxh)}.fx-ib:active{transform:scale(.92)}.fx-ib[disabled]{opacity:.35;pointer-events:none}',
'.fx-mb,.fx-sb{display:none}',
'.fx-path{flex:1;min-width:0;display:flex;align-items:center;height:36px;border-radius:12px;background:var(--surf2);border:1px solid var(--line);padding:0 5px;overflow:hidden;cursor:text}',
'.fx-crumbs{display:flex;align-items:center;gap:1px;min-width:0;overflow-x:auto;scrollbar-width:none;white-space:nowrap}.fx-crumbs::-webkit-scrollbar{display:none}',
'.fx-cr{padding:5px 8px;border-radius:8px;flex:none;max-width:200px;overflow:hidden;text-overflow:ellipsis;transition:background-color .15s}.fx-cr:hover{background:var(--fxh)}.fx-crumbs .fx-cr:last-child{font-weight:650}',
'.fx-sep{color:var(--mut);flex:none;width:12px;height:12px}.fx-sep svg{width:12px;height:12px}',
'.fx-pi{flex:1;min-width:0;background:none;border:0;outline:0;font:inherit;color:inherit;padding:0 6px;-webkit-user-select:text;user-select:text}',
'.fx-search{display:flex;align-items:center;gap:6px;width:200px;flex:0 1 200px;height:36px;border-radius:12px;background:var(--surf2);border:1px solid var(--line);padding:0 10px;transition:border-color .15s,flex-basis .2s}.fx-search:focus-within{border-color:var(--fxa);flex-basis:260px}.fx-search svg{width:16px;height:16px;color:var(--mut);flex:none}.fx-search input{flex:1;min-width:0;background:none;border:0;outline:0;font:inherit;color:inherit;-webkit-user-select:text;user-select:text}',
'.fx-main{flex:1;min-height:0;display:flex;position:relative}',
'.fx-side{width:216px;flex:none;overflow:auto;padding:0 8px 12px 12px;scrollbar-width:thin}',
'.fx-sh{margin:12px 8px 6px;font-size:11px;font-weight:650;letter-spacing:.5px;text-transform:uppercase;color:var(--mut)}',
'.fx-si,.fx-dv{display:flex;width:100%;text-align:left;border-radius:11px;transition:background-color .15s}.fx-si{align-items:center;gap:10px;padding:6px 8px;min-width:0}.fx-si:hover,.fx-dv:hover{background:var(--fxh)}',
'.fx-si.on,.fx-dv.on{background:rgba(79,124,255,.18);background:color-mix(in srgb,var(--fxa) 20%,transparent)}.fx-si.on{font-weight:600}',
'.fx-si .tl{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;color:#fff;flex:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.35)}.fx-si .tl svg{width:14px;height:14px}.fx-si .l{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.fx-dv{flex-direction:column;gap:5px;padding:8px}.fx-dv small{color:var(--mut);font-size:11px}',
'.fx-bar{height:5px;border-radius:99px;background:var(--fxs);overflow:hidden}.fx-bar i{display:block;height:100%;border-radius:inherit;background:var(--fxa);transition:width .2s}',
'.fx-pane{flex:1;min-width:0;display:flex;flex-direction:column;margin:0 10px 10px 0;border-radius:18px;background:var(--surf2);border:1px solid var(--line);overflow:hidden}',
'.fx-act{display:flex;align-items:center;gap:6px;padding:9px 10px;flex:none;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--line);min-height:54px}.fx-act::-webkit-scrollbar{display:none}',
'.fx-ab{display:flex;align-items:center;gap:7px;height:34px;padding:0 12px;border-radius:11px;flex:none;white-space:nowrap;transition:background-color .15s,transform .12s}.fx-ab svg{width:17px;height:17px;flex:none}.fx-ab:hover{background:var(--fxh)}.fx-ab:active{transform:scale(.95)}',
'.fx-ab.pri{background:var(--fxa);color:#fff;font-weight:600}.fx-ab.pri:hover{background:var(--fxa);filter:brightness(1.1)}.fx-ab.dg{color:#ff5d6c}',
'.fx-sp{flex:1}.fx-cnt{color:var(--mut);padding:0 8px;white-space:nowrap}',
'.fx-list{flex:1;min-height:0;overflow:auto;padding:8px 10px 12px;position:relative;scrollbar-width:thin;-webkit-user-select:none;user-select:none}',
'.fx-lh,.fx-r{display:grid;grid-template-columns:22px minmax(0,1fr) 150px 100px 84px;gap:8px;align-items:center}',
'.fx-lh{padding:6px 12px;color:var(--mut);font-size:11.5px;position:sticky;top:-8px;z-index:2;background:var(--surf2)}.fx-lh button{display:flex;align-items:center;gap:4px;font-weight:600;color:inherit;text-align:left;min-width:0}.fx-lh .r{justify-content:flex-end}.fx-lh svg{width:11px;height:11px}',
'.fx-r{padding:5px 12px;border-radius:12px;cursor:default;content-visibility:auto;contain-intrinsic-size:auto 46px;transition:background-color .12s}.fx-r:hover,.fx-t:hover{background:var(--fxh)}',
'.fx-r.sel,.fx-t.sel{background:rgba(79,124,255,.2);background:color-mix(in srgb,var(--fxa) 22%,transparent)}',
'.fx-n{display:flex;align-items:center;gap:12px;min-width:0}.fx-nt{min-width:0;display:flex;flex-direction:column}.fx-nt .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}.fx-nt .sub{color:var(--mut);font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'.fx-ic{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:9px;overflow:hidden;position:relative}.fx-ic svg{width:100%;height:100%}',
'.fx-ic.th{background:var(--fxs)}.fx-ic.th>img,.fx-ic.th>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}.fx-ic.ex>img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}',
'.fx-c{color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fx-c.r{text-align:right}',
'.fx-cb{width:20px;height:20px;border-radius:50%;border:1.8px solid var(--mut);display:grid;place-items:center;flex:none;opacity:0;color:#fff;transition:opacity .12s,background-color .12s}.fx-cb svg{width:12px;height:12px;opacity:0}',
'.fx-r:hover .fx-cb,.fx-t:hover .fx-cb,.fx[data-multi] .fx-cb,.fx-r.sel .fx-cb,.fx-t.sel .fx-cb{opacity:1}.sel .fx-cb{background:var(--fxa);border-color:var(--fxa)}.sel .fx-cb svg{opacity:1}',
'.fx-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}',
'.fx-t{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px 10px;border-radius:16px;cursor:default;content-visibility:auto;contain-intrinsic-size:auto 132px;transition:background-color .12s}',
'.fx-t .fx-ic{width:64px;height:64px;border-radius:14px}.fx-t .fx-cb{position:absolute;left:8px;top:8px}',
'.fx-t .nm{width:100%;text-align:center;font-weight:500;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}.fx-t .sub{color:var(--mut);font-size:11px;margin-top:-4px;min-height:13px}',
'.fx-em{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:56px 20px;color:var(--mut)}.fx-em>svg{width:72px;height:72px}.fx-em b{color:var(--txt);font-size:15px}.fx-em p{margin:0;max-width:340px;line-height:1.45}',
'.fx-btn{height:36px;padding:0 16px;border-radius:11px;background:var(--fxa);color:#fff;font-weight:600;transition:transform .12s,filter .15s}.fx-btn:hover{filter:brightness(1.1)}.fx-btn:active{transform:scale(.95)}.fx-btn.g{background:var(--fxs);color:var(--txt)}.fx-btn.dg{background:#e5484d}',
'.fx-rw{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}',
'.fx-stat{display:flex;justify-content:space-between;gap:12px;padding:8px 16px;border-top:1px solid var(--line);color:var(--mut);font-size:12px;flex:none}',
'.fx-prog{position:absolute;left:50%;bottom:48px;transform:translateX(-50%);width:min(360px,calc(100% - 24px));padding:12px 14px;border-radius:16px;background:var(--pn,var(--surf2));border:1px solid var(--line);box-shadow:0 14px 40px rgba(0,0,0,.35);z-index:6;display:flex;flex-direction:column;gap:8px}.fx-prog .l{display:flex;align-items:center;justify-content:space-between;gap:8px}.fx-prog small{color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'.fx-modal{position:absolute;inset:0;z-index:20;background:rgba(0,0,0,.4);display:grid;place-items:center;padding:16px}',
'.fx-card{width:min(420px,100%);max-height:100%;overflow:auto;padding:18px;border-radius:20px;background:var(--pn,var(--surf2));border:1px solid var(--line);box-shadow:0 24px 70px rgba(0,0,0,.45);animation:fxp .18s ease-out}@keyframes fxp{from{opacity:0;transform:scale(.94)}}',
'.fx-card h3{margin:0 0 12px;font-size:16px;overflow-wrap:anywhere}.fx-card p{margin:0;color:var(--mut);line-height:1.45}',
'.fx-card input{width:100%;height:40px;border-radius:11px;border:1px solid var(--line);background:var(--surf2);padding:0 12px;font:inherit;color:inherit;outline:0;-webkit-user-select:text;user-select:text}.fx-card input:focus{border-color:var(--fxa)}',
'.fx-ph{display:flex;align-items:center;gap:14px;margin-bottom:12px}.fx-ph .fx-ic{width:56px;height:56px;border-radius:14px}.fx-ph h3{margin:0}',
'.fx-kv{display:grid;grid-template-columns:92px 1fr;gap:7px 12px}.fx-kv span:nth-child(odd){color:var(--mut)}.fx-kv span{overflow-wrap:anywhere}',
'.fx-zl{max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:12px}.fx-zr{display:flex;justify-content:space-between;gap:10px;padding:6px 12px;border-bottom:1px solid var(--line)}.fx-zr:last-child{border-bottom:0}.fx-zr span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fx-zr small{color:var(--mut);flex:none}',
'.fx-scrim{display:none}',
/* medium: no Type column; small: sidebar becomes a drawer, no Date column */
'.fx[data-w=m] .ct,.fx[data-w=s] .ct{display:none}.fx[data-w=m] .fx-lh,.fx[data-w=m] .fx-r{grid-template-columns:22px minmax(0,1fr) 140px 84px}',
'.fx[data-w=s] .cd{display:none}.fx[data-w=s] .fx-lh,.fx[data-w=s] .fx-r{grid-template-columns:22px minmax(0,1fr) 78px}',
'.fx[data-w=s] .fx-mb,.fx[data-w=s] .fx-sb{display:grid}',
'.fx[data-w=s] .fx-side{position:absolute;z-index:8;left:0;top:0;bottom:0;width:244px;padding-top:6px;background:var(--pn,var(--surf2));border-right:1px solid var(--line);box-shadow:0 0 40px rgba(0,0,0,.4);transform:translateX(-105%);transition:transform .22s}',
'.fx[data-w=s][data-drawer] .fx-side{transform:none}.fx[data-w=s][data-drawer] .fx-scrim{display:block;position:absolute;inset:0;z-index:7;background:rgba(0,0,0,.35)}',
'.fx[data-w=s] .fx-pane{margin:0;border-radius:0;border-width:1px 0 0 0}',
'.fx[data-w=s] .fx-search{display:none}.fx[data-w=s][data-srch] .fx-search{display:flex;position:absolute;left:10px;right:10px;top:10px;z-index:5;width:auto;flex:none;box-shadow:0 10px 30px rgba(0,0,0,.3)}',
'.fx[data-w=s] .fx-ab span{display:none}.fx[data-w=s] .fx-ab{padding:0 10px}.fx[data-w=s] .fx-ab.pri span,.fx[data-w=s] .fx-ab[data-a=open] span{display:inline}',
'.fx[data-w=s] .fx-g{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}'
].join('\n');
var st=doc.createElement('style');st.id='nx-files-css';st.textContent=CSS;doc.head.appendChild(st);
/* ---------- app ---------- */
function ib(a,ic,t,cls){return'<button class="fx-ib'+(cls?' '+cls:'')+'" data-a="'+a+'" aria-label="'+t+'" title="'+t+'">'+sv(ic)+'</button>'}
var TPL='<div class="fx" tabindex="0"><div class="fx-top">'+ib('menu','menu','Sidebar','fx-mb')+ib('back','back','Back')+ib('fwd','fwd','Forward')+ib('up','up','Up')+'<div class="fx-path"><div class="fx-crumbs"></div><input class="fx-pi" hidden spellcheck="false"></div><div class="fx-search">'+sv('search')+'<input placeholder="Search" spellcheck="false"></div>'+ib('srch','search','Search','fx-sb')+ib('view','list','Switch view')+ib('more','more','More')+'</div><div class="fx-main"><aside class="fx-side"></aside><section class="fx-pane"><div class="fx-act"></div><div class="fx-list"></div><div class="fx-stat"></div></section><div class="fx-scrim" data-a="scrim"></div></div><div class="fx-prog" hidden></div></div>';
function appFx(w,arg){
 var B=w.body,start=typeof arg==='string'?arg:((arg&&arg.path)||'');
 var S={path:'',hist:[],hi:-1,items:[],V:[],sel:new Set(),anchor:-1,multi:false,q:'',res:null,partial:false,err:null,roots:[],tops:null,view:PREF.view,sort:PREF.sort,hid:!!PREF.hid,lt:null,gen:0,sg:0,tm:0};
 B.innerHTML=TPL;var root=B.firstChild;function $(s){return root.querySelector(s)}
 var list=$('.fx-list'),side=$('.fx-side'),actb=$('.fx-act'),stat=$('.fx-stat'),crumbs=$('.fx-crumbs'),pin=$('.fx-pi'),sin=$('.fx-search input'),pg=$('.fx-prog');
 function pref(){PREF.view=S.view;PREF.sort=S.sort;PREF.hid=S.hid;put('aur.fx2',JSON.stringify(PREF))}
 function sorted(a){var k=S.sort.k,d=S.sort.asc?1:-1;return a.slice().sort(function(x,y){if(x.isDirectory!==y.isDirectory)return x.isDirectory?-1:1;var r;if(k==='size')r=(x.size||0)-(y.size||0);else if(k==='date')r=(x.lastModified||0)-(y.lastModified||0);else if(k==='type')r=ext(x).localeCompare(ext(y))||x.name.localeCompare(y.name);else r=x.name.localeCompare(y.name,undefined,{numeric:true,sensitivity:'base'});return r*d})}
 function visible(){return sorted(S.res?S.res:S.items.filter(function(x){return S.hid||!x.hidden}))}
 function selItems(){return S.V.filter(function(x){return S.sel.has(x.path)})}
 function rootOf(p){var rt=null;S.roots.forEach(function(r){if((p===r.path||p.indexOf(r.path+'/')===0)&&(!rt||r.path.length>rt.path.length))rt=r});return rt}
 function isRoot(p){return p==='/'||p==='/storage/emulated/0'||S.roots.some(function(r){return r.path===p})}
 /* ----- navigation ----- */
 function go(p,push){var gen=++S.gen;S.q='';sin.value='';S.res=null;
  return NF.list({path:p}).then(function(r){if(gen!==S.gen)return;S.items=r.items||[];S.err=null}).catch(function(e){if(gen!==S.gen)return;S.items=[];S.err=e}).then(function(){if(gen!==S.gen)return;
   S.path=p;if(push!==false){S.hist=S.hist.slice(0,S.hi+1);if(S.hist[S.hist.length-1]!==p)S.hist.push(p);S.hi=S.hist.length-1}
   S.sel.clear();S.anchor=-1;S.multi=false;w.path=p;ok(function(){if(w.setTitle)w.setTitle(base(p)||'Files')});render();list.scrollTop=0})}
 function reload(){return go(S.path,false)}
 /* ----- render ----- */
 function crumbHtml(){var p=S.path,rt=rootOf(p),segs=[],cur;
  if(rt){segs.push([rt.name,rt.path]);cur=rt.path;p.slice(rt.path.length).split('/').filter(Boolean).forEach(function(s){cur+='/'+s;segs.push([s,cur])})}
  else{cur='';p.split('/').filter(Boolean).forEach(function(s){cur+='/'+s;segs.push([s,cur])});if(!segs.length)segs.push(['/','/'])}
  return segs.map(function(s,i){return(i?'<span class="fx-sep">'+sv('fwd',2)+'</span>':'')+'<button class="fx-cr" data-go="'+esc(s[1])+'">'+esc(s[0])+'</button>'}).join('')}
 function places(){var b=S.roots[0]?S.roots[0].path:'/storage/emulated/0',have=S.tops;
  var P=[['Home','home',b,['#62b4ff','#1f6bff']],['Downloads','download',b+'/Download',['#4fd69a','#1db35b']],['Documents','doc',b+'/Documents',['#74a7ff','#2f6fe0']],['Pictures','image',b+'/Pictures',['#ff8fc0','#d9387f']],['Camera','camera',b+'/DCIM',['#ffb15c','#e0691d']],['Music','music',b+'/Music',['#b39bff','#6f4be0']],['Movies','film',b+'/Movies',['#ff8a73','#e0452b']]];
  return P.filter(function(x){return x[0]==='Home'||!have||have[x[2].split('/').pop().toLowerCase()]})}
 function onPath(p,exact){return S.path===p||(!exact&&S.path.indexOf(p+'/')===0)}
 function sideItem(label,ic,p,col,pinned){return'<button class="fx-si'+(onPath(p,label==='Home')?' on':'')+'" data-go="'+esc(p)+'"'+(pinned?' data-pin="1"':'')+'><span class="tl" style="background:linear-gradient(180deg,'+col[0]+','+col[1]+')">'+sv(ic,2)+'</span><span class="l">'+esc(label)+'</span></button>'}
 function sideHtml(){var h='<div class="fx-sh">Quick access</div>';
  places().forEach(function(x){h+=sideItem(x[0],x[1],x[2],x[3])});
  if(PINS.length){h+='<div class="fx-sh">Pinned</div>';PINS.forEach(function(x){h+=sideItem(x.name,'pin',x.path,['#ff8fa3','#e0455f'],true)})}
  h+='<div class="fx-sh">Storage</div>';
  S.roots.forEach(function(r){var pc=r.total?Math.max(2,Math.round((r.total-r.free)/r.total*100)):0;h+='<button class="fx-dv'+(onPath(r.path,true)?' on':'')+'" data-go="'+esc(r.path)+'"><span class="l" style="font-weight:600">'+esc(r.name)+'</span>'+(r.total?'<span class="fx-bar"><i style="width:'+pc+'%"></i></span><small>'+fsize(r.free)+' free of '+fsize(r.total)+'</small>':'')+'</button>'});
  var b=S.roots[0]?S.roots[0].path:'/storage/emulated/0';
  h+='<div class="fx-sh">Android</div>'+sideItem('Android data','android',b+'/Android/data',['#7bd66a','#2f9e3f'])+sideItem('Android obb','android',b+'/Android/obb',['#9aa7bd','#5f6b82']);
  return h}
 function ab(a,ic,t,cls){return'<button class="fx-ab'+(cls?' '+cls:'')+'" data-a="'+a+'">'+sv(ic)+'<span>'+t+'</span></button>'}
 function actHtml(){var n=S.sel.size,h='';
  if(S.res)return'<span class="fx-cnt">'+S.V.length+(S.partial?'+':'')+' results</span><span class="fx-sp"></span>'+ab('all','search','Search all storage')+ab('clr','x','Clear');
  if(n){h=(n===1?ab('open','open','Open','pri'):'')+ab('copy','copy','Copy')+ab('cut','cut','Cut')+(n===1?ab('ren','rename','Rename'):'')+ab('zip','zip','Compress')+ab('del','trash','Delete','dg')+'<span class="fx-sp"></span><span class="fx-cnt">'+n+' selected</span>'+ab('none','x','Done');return h}
  var c=CLIP();h=ab('new','plus','New','pri')+(c&&c.paths&&c.paths.length?ab('paste','paste','Paste ('+c.paths.length+')'):'')+'<span class="fx-sp"></span>'+ab('sort','sort','Sort')+ab('refresh','refresh','Refresh');return h}
 function empty(t,p,ic,btns){var svg=ic==='folder'?icon({name:'',isDirectory:true}):sv(ic,1.4);return'<div class="fx-em">'+svg+'<b>'+t+'</b><p>'+p+'</p>'+(btns?'<div class="fx-rw" style="margin:6px 0 0;justify-content:center">'+btns+'</div>':'')+'</div>'}
 function errHtml(){var e=S.err,m=String((e&&e.message)||e||'Could not open this folder'),code=String((e&&e.code)||'')+' '+m;
  if(/NEEDS_GRANT_(DATA|OBB)/.test(code)){var wch=/OBB/.test(code)?'obb':'data';return empty('Permission needed','Android keeps Android/'+wch+' private. Choose that folder once to allow access.','lock','<button class="fx-btn" data-a="grant" data-w="'+wch+'">Choose folder</button>')}
  if(/NEEDS_ROOT/.test(code))return empty('Root needed','This folder can only be opened with root access.','lock','');
  if(/not allowed yet/i.test(m))return empty('Allow file access','NexOS needs the All files access permission to show your storage.','lock','<button class="fx-btn" data-a="perm">Open settings</button><button class="fx-btn g" data-a="refresh">I allowed it</button>');
  return empty('Can not open this folder',esc(m.replace(/^\[[A-Z_]+\]\s*/,'')),'folder','<button class="fx-btn g" data-a="refresh">Try again</button><button class="fx-btn g" data-a="classic">Classic Explorer</button>')}
 function row(it,i){return'<div class="fx-r'+(S.sel.has(it.path)?' sel':'')+'" data-i="'+i+'" data-nxi="1"><button class="fx-cb" data-cb="1" tabindex="-1" aria-label="Select">'+sv('check',3)+'</button><div class="fx-n"><span class="fx-ic">'+icon(it)+'</span><span class="fx-nt"><span class="nm">'+esc(it.name)+'</span>'+(S.res?'<span class="sub">'+esc(dirn(it.path))+'</span>':'')+'</span></div><span class="fx-c cd">'+fdate(it.lastModified)+'</span><span class="fx-c ct">'+esc(typ(it))+'</span><span class="fx-c cs r">'+(it.isDirectory?'':fsize(it.size))+'</span></div>'}
 function tile(it,i){return'<div class="fx-t'+(S.sel.has(it.path)?' sel':'')+'" data-i="'+i+'" data-nxi="1"><button class="fx-cb" data-cb="1" tabindex="-1" aria-label="Select">'+sv('check',3)+'</button><span class="fx-ic">'+icon(it)+'</span><span class="nm">'+esc(it.name)+'</span><span class="sub">'+(it.isDirectory?'':fsize(it.size))+'</span></div>'}
 function head(){function c(k,t,cls){return'<button class="'+(cls||'')+'" data-sort="'+k+'">'+t+(S.sort.k===k?sv(S.sort.asc?'up':'down',2.4):'')+'</button>'}return'<div class="fx-lh"><span></span>'+c('name','Name')+c('date','Date modified','cd')+c('type','Type','ct')+c('size','Size','cs r')+'</div>'}
 function listHtml(){
  if(S.err){list.innerHTML=errHtml();return}
  if(!S.V.length){list.innerHTML=S.res?empty('No results','Nothing matched "'+esc(S.q)+'".','search'):empty('This folder is empty','Create something with New, or paste files here.','folder');return}
  var h='';if(S.view==='list'){h=head();S.V.forEach(function(it,i){h+=row(it,i)})}else{h='<div class="fx-g">';S.V.forEach(function(it,i){h+=tile(it,i)});h+='</div>'}
  list.innerHTML=h;thumbs()}
 function statHtml(){var n=S.V.length,s=S.sel.size,l=n+' item'+(n===1?'':'s');
  if(s){var tot=0;S.V.forEach(function(x){if(S.sel.has(x.path)&&!x.isDirectory&&x.size>0)tot+=x.size});l=s+' selected'+(tot?' \u00b7 '+fsize(tot):'')+' of '+l}
  var r=rootOf(S.path);stat.innerHTML='<span>'+l+'</span><span>'+(r&&r.total?fsize(r.free)+' free of '+fsize(r.total):'')+'</span>'}
 function render(){S.V=visible();crumbs.innerHTML=crumbHtml();crumbs.scrollLeft=100000;
  $('[data-a=back]').disabled=S.hi<=0;$('[data-a=fwd]').disabled=S.hi>=S.hist.length-1;$('[data-a=up]').disabled=!S.path||isRoot(S.path);$('[data-a=view]').innerHTML=sv(S.view==='grid'?'list':'grid');
  side.innerHTML=sideHtml();actb.innerHTML=actHtml();listHtml();statHtml();if(S.multi)root.setAttribute('data-multi','');else root.removeAttribute('data-multi')}
 function paint(){var rows=list.querySelectorAll('[data-i]');for(var i=0;i<rows.length;i++){var el=rows[i],it=S.V[+el.getAttribute('data-i')];el.classList.toggle('sel',!!it&&S.sel.has(it.path))}actb.innerHTML=actHtml();statHtml();if(S.multi)root.setAttribute('data-multi','');else root.removeAttribute('data-multi')}
 /* ----- thumbnails ----- */
 var TQ=[],TB=0;
 function tpump(){while(TB<3&&TQ.length){var j=TQ.shift();TB++;(function(j){var done=0,d=function(){if(done)return;done=1;TB--;tpump()};try{j(d)}catch(e){d()}})(j)}}
 function thumb(ic){var row=ic.closest('[data-i]');if(!row)return;var it=S.V[+row.getAttribute('data-i')];if(!it)return;var k=kind(it);
  var put2=function(el,cls){if(!ic.isConnected)return;ic.innerHTML='';ic.className='fx-ic '+(cls||'th');ic.appendChild(el)};
  if(k==='img'){if(it.size>40e6)return;TQ.push(function(d){var i=new Image();i.decoding='async';i.onload=function(){put2(i);d()};i.onerror=d;i.src=fsrc(it.path)})}
  else if(k==='vid'){TQ.push(function(d){var v=doc.createElement('video');v.muted=true;v.preload='auto';v.playsInline=true;var f=function(){put2(v);d()};v.onloadeddata=f;v.onerror=d;v.src=fsrc(it.path)+'#t=0.6';setTimeout(d,6000)})}
  else if(k==='aud'&&window.NXART){TQ.push(function(d){NXART.load(fsrc(it.path)).then(function(r){if(r&&r.url){var i=new Image();i.onload=function(){put2(i);d()};i.onerror=d;i.src=r.url}else d()}).catch(d)})}
  else if(k==='exe'&&typeof NW!=='undefined'&&NW&&NW.exeIcon){TQ.push(function(d){NW.exeIcon({path:it.path}).then(function(r){if(r&&r.png){var i=new Image();i.onload=function(){put2(i,'ex');d()};i.onerror=d;i.src=r.png}else d()}).catch(d)})}
  tpump()}
 var io=(window.IntersectionObserver&&typeof fsrc==='function')?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);ok(function(){thumb(e.target)})}})},{root:list,rootMargin:'160px'}):null;
 function thumbs(){if(!io)return;var n=list.querySelectorAll('.fx-ic');for(var i=0;i<n.length;i++){var row=n[i].closest('[data-i]'),it=row&&S.V[+row.getAttribute('data-i')];if(!it||it.isDirectory)continue;var k=kind(it);if(k==='img'||k==='vid'||k==='aud'||k==='exe')io.observe(n[i])}}
 /* ----- dialogs ----- */
 function modal(html){var m=doc.createElement('div');m.className='fx-modal';m.innerHTML='<div class="fx-card">'+html+'</div>';root.appendChild(m);function close(){m.remove();root.focus({preventScroll:true})}m.addEventListener('click',function(e){if(e.target===m)close()});return{el:m.firstChild,close:close}}
 function ask(title,def,okl,cb){var m=modal('<h3>'+esc(title)+'</h3><input spellcheck="false" value="'+esc(def)+'"><div class="fx-rw"><button class="fx-btn g" data-m="x">Cancel</button><button class="fx-btn" data-m="ok">'+esc(okl)+'</button></div>');
  var inp=m.el.querySelector('input');function done(){var v=inp.value.trim();if(!v)return;m.close();cb(v)}
  m.el.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;if(b.getAttribute('data-m')==='ok')done();else m.close()});
  inp.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter')done();else if(e.key==='Escape')m.close()});
  setTimeout(function(){inp.focus();var dot=def.lastIndexOf('.');inp.setSelectionRange(0,dot>0?dot:def.length)},40)}
 function showPg(on,label){if(!on){pg.hidden=true;return}pg.hidden=false;pg.innerHTML='<div class="l"><b>'+esc(label)+'</b><button class="fx-ab" data-a="cancel">Cancel</button></div><div class="fx-bar"><i style="width:2%"></i></div><small></small>'}
 /* ----- file actions ----- */
 function copy(){var p=Array.from(S.sel);if(!p.length)return;CLIP({paths:p,move:false});say(p.length+(p.length===1?' item copied':' items copied'));paint()}
 function cut(){var p=Array.from(S.sel);if(!p.length)return;CLIP({paths:p,move:true});say(p.length+(p.length===1?' item cut':' items cut'));paint()}
 function paste(){var c=CLIP();if(!c||!c.paths||!c.paths.length)return;showPg(true,c.move?'Moving\u2026':'Copying\u2026');NF.paste({paths:c.paths,dest:S.path,move:c.move}).then(function(){if(c.move)CLIP(null);showPg(false);reload()}).catch(function(e){showPg(false);fail(e);reload()})}
 function ren(){var its=selItems();if(its.length!==1)return;var it=its[0];ask('Rename',it.name,'Rename',function(v){if(v===it.name)return;NF.rename({path:it.path,name:v}).then(reload).catch(fail)})}
 function del(){var its=selItems();if(!its.length)return;var one=its.length===1?its[0].name:its.length+' items';var m=modal('<h3>Delete '+esc(one)+'?</h3><p>This cannot be undone.</p><div class="fx-rw"><button class="fx-btn g" data-m="x">Cancel</button><button class="fx-btn dg" data-m="ok">Delete</button></div>');
  m.el.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;m.close();if(b.getAttribute('data-m')==='ok')NF.remove({paths:its.map(function(x){return x.path})}).then(reload).catch(function(er){fail(er);reload()})})}
 function zipSel(){var its=selItems();if(!its.length)return;var nm=its.length===1?its[0].name.replace(/\.[^./]*$/,'')+'.zip':'Archive.zip';showPg(true,'Compressing\u2026');NF.zipCreate({paths:its.map(function(x){return x.path}),dest:S.path,name:nm}).then(function(){showPg(false);say('Created '+nm);reload()}).catch(function(e){showPg(false);fail(e)})}
 function newFolder(){ask('New folder','New folder','Create',function(v){NF.mkdir({path:S.path,name:v}).then(reload).catch(fail)})}
 function newFile(def){ask('New file',def,'Create',function(v){if(S.items.some(function(x){return x.name===v})){say('A file or folder with this name already exists');return}NF.writeText({path:join(S.path,v),text:''}).then(reload).catch(fail)})}
 function extract(it,custom){var def=join(dirn(it.path),it.name.replace(/\.[^./]*$/,''));var run=function(d){showPg(true,'Extracting\u2026');NF.zipExtract({path:it.path,dest:d,entries:[],unique:true}).then(function(r){showPg(false);say('Extracted '+(r?r.count:'')+' files');reload()}).catch(function(e){showPg(false);fail(e)})};if(custom)ask('Extract to (full path)',def,'Extract',function(v){run(v.replace(/\/+$/,''))});else run(def)}
 function openZip(it){var m=modal('<h3>'+esc(it.name)+'</h3><div class="fx-zl"><div class="fx-zr"><small>Reading\u2026</small></div></div><div class="fx-rw"><button class="fx-btn g" data-m="x">Close</button><button class="fx-btn g" data-m="to">Extract to\u2026</button><button class="fx-btn" data-m="here">Extract here</button></div>');
  var zl=m.el.querySelector('.fx-zl');
  NF.zipList({path:it.path}).then(function(r){var es=r.items||[];zl.innerHTML=es.slice(0,150).map(function(e){return'<div class="fx-zr"><span>'+esc(e.name)+'</span><small>'+(e.dir?'':fsize(e.size))+'</small></div>'}).join('')+(es.length>150?'<div class="fx-zr"><small>+ '+(es.length-150)+' more</small></div>':'')||'<div class="fx-zr"><small>Empty archive</small></div>'}).catch(function(e){zl.innerHTML='<div class="fx-zr"><small>'+esc(String((e&&e.message)||'Could not read this archive'))+'</small></div>'});
  m.el.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;var k=b.getAttribute('data-m');m.close();if(k==='here')extract(it,false);else if(k==='to')extract(it,true)})}
 function props(){var its=selItems();if(!its.length)its=[{name:base(S.path)||'Storage',path:S.path,isDirectory:true,lastModified:0}];
  if(its.length>1){var tot=0,fl=0,fo=0;its.forEach(function(x){if(x.isDirectory)fo++;else{fl++;if(x.size>0)tot+=x.size}});var m2=modal('<h3>'+its.length+' items</h3><div class="fx-kv"><span>Contains</span><span>'+fl+' files, '+fo+' folders</span><span>Size</span><span>'+fsize(tot)+(fo?' (folders not counted)':'')+'</span><span>Location</span><span>'+esc(S.path)+'</span></div><div class="fx-rw"><button class="fx-btn" data-m="x">Close</button></div>');m2.el.addEventListener('click',function(e){if(e.target.closest('[data-m]'))m2.close()});return}
  var it=its[0],m=modal('<div class="fx-ph"><span class="fx-ic">'+icon(it)+'</span><h3>'+esc(it.name)+'</h3></div><div class="fx-kv"><span>Type</span><span>'+esc(typ(it))+'</span><span>Location</span><span>'+esc(dirn(it.path))+'</span><span>Size</span><span class="k-sz">'+(it.isDirectory?'Calculating\u2026':fsize(it.size))+'</span><span>Modified</span><span>'+(fdate(it.lastModified)||'\u2014')+'</span><span>Path</span><span>'+esc(it.path)+'</span></div><div class="fx-rw"><button class="fx-btn" data-m="x">Close</button></div>');
  m.el.addEventListener('click',function(e){if(e.target.closest('[data-m]'))m.close()});
  NF.info({path:it.path}).then(function(r){var s=m.el.querySelector('.k-sz');if(!s)return;var t=r.totalSize!=null?r.totalSize:r.size;s.textContent=fsize(t)+(it.isDirectory?' ('+(r.files||0)+' files, '+(r.folders||0)+' folders'+(r.partial?', partial':'')+')':'')}).catch(function(){var s=m.el.querySelector('.k-sz');if(s)s.textContent='\u2014'})}
 function openIt(it){if(it.isDirectory)return go(it.path);var k=kind(it),sib=function(kk){return S.V.filter(function(x){return!x.isDirectory&&kind(x)===kk}).sort(function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true})}).map(function(x){return x.path})};
  if(k==='img')openApp('photos',{path:it.path,list:sib('img')});else if(k==='vid')openApp('media',{path:it.path,list:sib('vid')});else if(k==='aud')openApp('music',{path:it.path,list:sib('aud')});else if(k==='code')openApp('code',{path:it.path});else if(k==='bat')openApp('term',{bat:it.path});else if(k==='txt')openApp('notes',{path:it.path});else if(k==='zip')openZip(it);else if(k==='exe'&&window.aurora&&window.aurora.openExe)window.aurora.openExe(it.path);else NF.open({path:it.path,mimeType:it.mimeType}).catch(fail)}
 /* ----- selection ----- */
 function toggle(i){var it=S.V[i];if(!it)return;if(S.sel.has(it.path))S.sel.delete(it.path);else S.sel.add(it.path);S.anchor=i;if(!S.sel.size)S.multi=false;paint()}
 function clearSel(){if(!S.sel.size&&!S.multi)return;S.sel.clear();S.multi=false;paint()}
 function click(i,e){var it=S.V[i];if(!it)return;var now=Date.now(),mod=e.ctrlKey||e.metaKey||e.shiftKey;
  if(!mod&&!S.multi&&S.lt&&S.lt.i===i&&now-S.lt.t<450){S.lt=null;openIt(it);return}
  S.lt={i:i,t:now};
  if(e.shiftKey&&S.anchor>=0){var a=Math.min(S.anchor,i),b=Math.max(S.anchor,i);S.sel=new Set();for(var k=a;k<=b;k++)S.sel.add(S.V[k].path)}
  else if(e.ctrlKey||e.metaKey||S.multi){toggle(i);return}
  else{S.sel=new Set([it.path]);S.anchor=i}
  paint()}
 /* ----- menus ----- */
 function isPinned(p){return PINS.some(function(x){return x.path===p})}
 function pinToggle(it){if(isPinned(it.path))PINS=PINS.filter(function(x){return x.path!==it.path});else PINS.push({name:it.name||base(it.path),path:it.path});put('aur.fx.pins',JSON.stringify(PINS));render()}
 function setSort(k){if(S.sort.k===k)S.sort={k:k,asc:!S.sort.asc};else S.sort={k:k,asc:(k==='name'||k==='type')};pref();render()}
 function setView(v){S.view=v;pref();render()}
 function toggleHidden(){S.hid=!S.hid;pref();render()}
 function selAll(){S.sel=new Set(S.V.map(function(x){return x.path}));S.anchor=0;paint()}
 function itemMenu(x,y,it){var n=S.sel.size,one=n===1,k=kind(it),sel=selItems();
  var m=[['Open',function(){openIt(it)},'',!one]];
  if(S.res&&one)m.push(['Open file location',function(){go(dirn(it.path))}]);
  if(one&&!it.isDirectory){m.push(['Open with Notepad',function(){openApp('notes',{path:it.path})}]);m.push(['Open with Code Editor',function(){openApp('code',{path:it.path})}]);if(k==='zip'){m.push(['Extract here',function(){extract(it,false)}]);m.push(['Extract to\u2026',function(){extract(it,true)}])}}
  if(one&&it.isDirectory){m.push(['Open in new window',function(){openApp('files',it.path)}]);m.push([isPinned(it.path)?'Unpin from sidebar':'Pin to sidebar',function(){pinToggle(it)}])}
  m.push(['Compress to ZIP',zipSel]);m.push(['Send to Desktop (shortcut)',function(){if(window.DSKX2&&DSKX2.addIts)DSKX2.addIts(sel)}]);
  m.push(null,['Cut',cut,'Ctrl+X'],['Copy',copy,'Ctrl+C'],null,['Rename',ren,'F2',!one],['Delete',del,'Del'],null,['Properties',props]);ctx(x,y,m)}
 function bgMenu(x,y){var c=CLIP();ctx(x,y,[['New folder',newFolder],['New text document',function(){newFile('New Text Document.txt')}],['New markdown file',function(){newFile('Untitled.md')}],null,['Paste',paste,'Ctrl+V',!(c&&c.paths&&c.paths.length)],null,['Sort by Name',function(){setSort('name')}],['Sort by Date modified',function(){setSort('date')}],['Sort by Size',function(){setSort('size')}],['Sort by Type',function(){setSort('type')}],['View as grid',function(){setView('grid')}],['View as list',function(){setView('list')}],null,['Refresh',reload,'F5'],['Properties',props]])}
 function newMenu(a){var r=a.getBoundingClientRect();ctx(r.left,r.bottom+6,[['Folder',newFolder],['Text document',function(){newFile('New Text Document.txt')}],['Markdown file',function(){newFile('Untitled.md')}],['HTML file',function(){newFile('index.html')}],['JSON file',function(){newFile('data.json')}]])}
 function sortMenu(a){var r=a.getBoundingClientRect(),k=S.sort.k,ck=function(x,t){return(k===x?'\u2713  ':'')+t};ctx(r.left,r.bottom+6,[[ck('name','Name'),function(){setSort('name')}],[ck('date','Date modified'),function(){setSort('date')}],[ck('size','Size'),function(){setSort('size')}],[ck('type','Type'),function(){setSort('type')}],null,[S.sort.asc?'Ascending order \u2713':'Ascending order',function(){if(!S.sort.asc)setSort(S.sort.k)}],[!S.sort.asc?'Descending order \u2713':'Descending order',function(){if(S.sort.asc)setSort(S.sort.k)}]])}
 function moreMenu(a){var r=a.getBoundingClientRect();ctx(Math.max(8,r.right-210),r.bottom+6,[['Select all',selAll,'Ctrl+A'],[S.hid?'Hide hidden files':'Show hidden files',toggleHidden],['Properties',props],null,['Open classic Explorer',function(){openApp('filesold',S.path)}]])}
 /* ----- search + path ----- */
 function search(q,all){q=(q||'').trim();S.q=q;var gen=++S.sg;if(!q){S.res=null;S.partial=false;S.sel.clear();render();return}
  NF.search({q:q,path:all?'':S.path,max:300}).then(function(r){if(gen!==S.sg)return;S.res=r.items||[];S.partial=!!r.partial;S.sel.clear();render()}).catch(function(e){if(gen!==S.sg)return;fail(e)})}
 sin.addEventListener('input',function(){clearTimeout(S.tm);var v=sin.value;S.tm=setTimeout(function(){search(v)},380)});
 sin.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter'){clearTimeout(S.tm);search(sin.value)}else if(e.key==='Escape'){sin.value='';search('')}});
 function endEdit(){pin.hidden=true;crumbs.hidden=false}
 function editPath(){crumbs.hidden=true;pin.hidden=false;pin.value=S.path;pin.focus();pin.select()}
 pin.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter'){var v=pin.value.trim();endEdit();if(v)go(v.replace(/\/+$/,'')||'/')}else if(e.key==='Escape')endEdit()});
 pin.addEventListener('blur',function(){setTimeout(endEdit,120)});
 /* ----- events ----- */
 function doA(a,el){switch(a){
  case'menu':if(root.hasAttribute('data-drawer'))root.removeAttribute('data-drawer');else root.setAttribute('data-drawer','');break;
  case'scrim':root.removeAttribute('data-drawer');break;
  case'back':if(S.hi>0){S.hi--;go(S.hist[S.hi],false)}break;
  case'fwd':if(S.hi<S.hist.length-1){S.hi++;go(S.hist[S.hi],false)}break;
  case'up':if(S.path&&!isRoot(S.path))go(dirn(S.path));break;
  case'view':setView(S.view==='grid'?'list':'grid');break;
  case'more':moreMenu(el);break;
  case'srch':if(root.hasAttribute('data-srch'))root.removeAttribute('data-srch');else{root.setAttribute('data-srch','');sin.focus()}break;
  case'open':var s=selItems();if(s.length===1)openIt(s[0]);break;
  case'copy':copy();break;case'cut':cut();break;case'paste':paste();break;case'ren':ren();break;case'del':del();break;case'zip':zipSel();break;
  case'new':newMenu(el);break;case'sort':sortMenu(el);break;case'refresh':reload();break;case'none':clearSel();break;
  case'clr':sin.value='';search('');break;case'all':search(S.q,true);break;
  case'cancel':ok(function(){NF.cancel()});break;
  case'grant':NF.restrictedGrant({which:el.getAttribute('data-w')}).then(reload).catch(fail);break;
  case'perm':ok(function(){NF.requestAccess()});break;
  case'classic':openApp('filesold',S.path);break}}
 var lp=null,lpd=false;
 root.addEventListener('click',function(e){var t=e.target;
  var a=t.closest('[data-a]');if(a&&root.contains(a)){doA(a.getAttribute('data-a'),a);return}
  var gb=t.closest('[data-go]');if(gb){go(gb.getAttribute('data-go'));root.removeAttribute('data-drawer');return}
  var sb=t.closest('[data-sort]');if(sb){setSort(sb.getAttribute('data-sort'));return}
  var row=t.closest('[data-i]');
  if(row&&list.contains(row)){if(lpd){lpd=false;return}var i=+row.getAttribute('data-i');if(t.closest('[data-cb]')){S.multi=true;toggle(i)}else click(i,e);return}
  if(t.closest('.fx-path')&&!t.closest('.fx-cr')){editPath();return}
  if(t.closest('.fx-list'))clearSel()});
 root.addEventListener('pointerdown',function(e){if(!e.target.closest('input,textarea'))root.focus({preventScroll:true})},true);
 list.addEventListener('pointerdown',function(e){var row=e.target.closest('[data-i]');if(!row||e.pointerType!=='touch')return;lpd=false;lp=setTimeout(function(){lp=null;lpd=true;S.multi=true;toggle(+row.getAttribute('data-i'))},420)},true);
 list.addEventListener('pointermove',function(e){if(lp&&Math.abs(e.movementX)+Math.abs(e.movementY)>3){clearTimeout(lp);lp=null}},true);
 ['pointerup','pointercancel','scroll'].forEach(function(ev){list.addEventListener(ev,function(){if(lp){clearTimeout(lp);lp=null}},true)});
 list.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();var row=e.target.closest('[data-i]');
  if(row){var i=+row.getAttribute('data-i'),it=S.V[i];if(!it)return;if(!S.sel.has(it.path)){S.sel=new Set([it.path]);S.anchor=i;paint()}itemMenu(e.clientX,e.clientY,it)}else{clearSel();bgMenu(e.clientX,e.clientY)}});
 side.addEventListener('contextmenu',function(e){var b=e.target.closest('[data-pin]');if(!b)return;e.preventDefault();e.stopPropagation();var p=b.getAttribute('data-go');ctx(e.clientX,e.clientY,[['Open',function(){go(p)}],['Unpin from sidebar',function(){pinToggle({path:p})}]])});
 root.addEventListener('keydown',function(e){if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;var c=e.ctrlKey||e.metaKey,k=String(e.key||'').toLowerCase();
  if(c&&k==='a'){e.preventDefault();selAll()}else if(c&&k==='c'){e.preventDefault();copy()}else if(c&&k==='x'){e.preventDefault();cut()}else if(c&&k==='v'){e.preventDefault();paste()}
  else if(c&&k==='f'){e.preventDefault();root.removeAttribute('data-drawer');root.setAttribute('data-srch','');sin.focus()}
  else if(c&&e.shiftKey&&k==='n'){e.preventDefault();newFolder()}
  else if(k==='f2'){e.preventDefault();ren()}else if(k==='delete'){e.preventDefault();del()}else if(k==='f5'){e.preventDefault();reload()}
  else if(k==='enter'){var s=selItems();if(s.length===1){e.preventDefault();openIt(s[0])}}
  else if(k==='backspace'||(e.altKey&&k==='arrowup')){e.preventDefault();doA('up')}
  else if(e.altKey&&k==='arrowleft'){e.preventDefault();doA('back')}else if(e.altKey&&k==='arrowright'){e.preventDefault();doA('fwd')}
  else if(k==='escape'){if(S.res){sin.value='';search('')}else clearSel()}});
 var ro=window.ResizeObserver?new ResizeObserver(function(){var wd=root.clientWidth;root.setAttribute('data-w',wd<580?'s':wd<800?'m':'l')}):null;root.setAttribute('data-w','l');if(ro)ro.observe(root);
 var pl=null;
 ok(function(){Promise.resolve(NF.addListener('fprog',function(e){if(pg.hidden||!e)return;var p=e.total>0?Math.min(100,e.done/e.total*100):0,i=pg.querySelector('i'),s=pg.querySelector('small');if(i)i.style.width=Math.max(2,p)+'%';if(s)s.textContent=(e.name||'')+(e.total?' \u00b7 '+fsize(e.done)+' / '+fsize(e.total):'')})).then(function(h){pl=h})});
 w.onclose=function(){if(ro)ro.disconnect();if(io)io.disconnect();if(pl&&pl.remove)ok(function(){pl.remove()})};
 /* ----- start ----- */
 var zipStart=/\.(zip|rar|7z)$/i.test(start)?start:'';var first=zipStart?dirn(zipStart):start;
 NF.roots().then(function(r){S.roots=(r&&r.roots)||[];var p=first||(S.roots[0]&&S.roots[0].path)||'/storage/emulated/0';
  return NF.list({path:S.roots[0]?S.roots[0].path:p}).then(function(l){S.tops={};(l.items||[]).forEach(function(i){if(i.isDirectory)S.tops[i.name.toLowerCase()]=1})},function(){S.tops=null}).then(function(){return go(p)})}).catch(function(){S.roots=[];return go(first||'/storage/emulated/0')}).then(function(){if(zipStart)openZip({name:base(zipStart),path:zipStart})});
 render()}
/* ---------- register ---------- */
A.filesold=Object.assign({},A.files,{n:'Classic Explorer',hid:1,f:OLD,kw:'explorer classic old files'});
ok(function(){if(typeof IC!=='undefined'&&IC.files)IC.filesold=IC.files});
A.files.f=function(w,arg){if(g('aur.fm','new')==='classic')return OLD(w,arg);try{return appFx(w,arg)}catch(e){try{console.error('FILES-4.3.0',e);w.body.innerHTML=''}catch(_){}return OLD(w,arg)}};
window.NXFX={use:function(m){put('aur.fm',m==='classic'?'classic':'new')}};
})();
