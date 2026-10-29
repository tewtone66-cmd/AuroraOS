/* CODE-3.5.0 - Code Editor rewrite (VS Code style). Replaces appCode through A.code.f.
   Project mode (opened from Start/desktop): activity bar, explorer, tabs, output panel, extensions, AI, settings.
   Single-file mode (opened with a file path): clean editor, no sidebar.
   Storage keys: aur.ced (settings) aur.cai (AI) aur.cplug / aur.cplugx (plugins) aur.cproj (folder) aur.cph / aur.csw (panel / sidebar size).
   Avoid the HTML comment opener and the script close tag as literal text in this file (it is inlined into index.html). */
(function(){'use strict';
if(typeof A==='undefined'||!A.code)return;
const HAS=typeof NF!=='undefined'&&!!NF;
const q=(s,r)=>(r||document).querySelector(s),qa=(s,r)=>Array.from((r||document).querySelectorAll(s));
const E=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const jget=(k,d)=>{try{const v=ls(k);return v?JSON.parse(v):d}catch(e){return d}},jset=(k,v)=>ls(k,JSON.stringify(v));
const base=p=>p.split('/').pop(),dirOf=p=>p.slice(0,p.lastIndexOf('/'))||'/',ext=n=>{const i=n.lastIndexOf('.');return i>0?n.slice(i+1).toLowerCase():''};
const msg=e=>(e&&e.message)||String(e||'Error');

/* ---------------- settings / plugin state ---------------- */
const SET=Object.assign({theme:'auto',font:'',fs:+(typeof ls==='function'&&ls('aur.cfs'))||13,tab:2,auto:'delay',mini:1,ln:1},jget('aur.ced',{}));
const AI=Object.assign({prov:'anthropic',key:'',model:'',url:''},jget('aur.cai',{}));
let INST=jget('aur.cplug',[]),CUSTOM=jget('aur.cplugx',[]),INSTANCES=[],langCache=null;

/* ---------------- themes ---------------- */
const TH=(n,d,bg,fg,side,bar,sb,acc,kw,str,com,num,fn,typ,tag)=>({n,d,bg,fg,side,bar,sb,acc,kw,str,com,num,fn,typ,tag});
const DARKP=TH('Dark+',1,'#1e1e1e','#d4d4d4','#252526','#2d2d2d','#007acc','#3794ff','#569cd6','#ce9178','#6a9955','#b5cea8','#dcdcaa','#4ec9b0','#569cd6');
const LIGHTP=TH('Light+',0,'#ffffff','#1f1f1f','#f3f3f3','#e8e8e8','#007acc','#0066b8','#0000ff','#a31515','#008000','#098658','#795e26','#267f99','#800000');

/* ---------------- languages ---------------- */
const JSK='break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await get set true false null undefined NaN Infinity';
const TSK=' interface type enum implements namespace declare readonly abstract public private protected as is keyof infer unknown any never string number boolean object symbol bigint satisfies override';
const LANGS={
 js:{n:'JavaScript',x:['js','mjs','cjs','jsx'],k:JSK,lc:'//',bc:1,q:'"\'`',cm:'//'},
 ts:{n:'TypeScript',x:['ts','tsx','mts','cts'],k:JSK+TSK,lc:'//',bc:1,q:'"\'`',cm:'//'},
 json:{n:'JSON',x:['json','jsonc','webmanifest'],k:'true false null',q:'"',m:'json'},
 css:{n:'CSS',x:['css','scss','less'],m:'css',cm:'/*'},
 html:{n:'HTML',x:['html','htm','xhtml','vue'],m:'html',cm:'<'},
 xml:{n:'XML',x:['xml','svg','xsl','plist'],m:'html',cm:'<'},
 bat:{n:'Batch',x:['bat','cmd'],k:'echo set if else goto call exit for in do pause title cd dir copy del not exist errorlevel',lc:'::',q:'"',ci:1,cm:'::'},
 txt:{n:'Plain Text',x:['txt','log','text','ini','cfg','conf','env','']}
};
function allLangs(){if(langCache)return langCache;const o=Object.assign({},LANGS);activeP('language').forEach(p=>{if(p.lang&&p.lang.id)o[p.lang.id]=p.lang});return langCache=o}
function langOf(name){const e=ext(name)||name.toLowerCase(),L=allLangs();for(const id in L)if(L[id].x&&L[id].x.includes(e))return id;return 'txt'}

/* ---------------- highlighter ---------------- */
const qre=c=>c+'(?:\\\\[\\s\\S]|[^'+c+'\\\\'+(c==='`'?'':'\\n')+'])*(?:'+c+(c==='`'?'':'|(?=\\n)')+'|$)';
function rxOf(L){if(L._r)return L._r;const p=[];
 if(L.bc)p.push('\\/\\*[\\s\\S]*?(?:\\*\\/|$)');
 L._l=(L.lc||'').split(' ').filter(Boolean);
 if(L._l.length)p.push('(?:'+L._l.map(s=>s.replace(/[\/#*+?.\-]/g,'\\$&')).join('|')+')[^\\n]*');
 if(L.tri)p.push('"""[\\s\\S]*?(?:"""|$)',"'''[\\s\\S]*?(?:'''|$)");
 for(const c of (L.q||''))p.push(qre(c));
 p.push('\\b(?:0[xX][\\da-fA-F_]+|\\d[\\d_]*\\.?\\d*(?:[eE][+-]?\\d+)?)\\b','[A-Za-z_$][\\w$]*');
 L._k=new Set((L.ci?(L.k||'').toLowerCase():(L.k||'')).split(/\s+/).filter(Boolean));
 return L._r=new RegExp(p.join('|'),'g')}
function tokG(src,L){const re=rxOf(L);let out='',last=0,m;re.lastIndex=0;
 while((m=re.exec(src))){if(!m[0]){re.lastIndex++;continue}
  out+=E(src.slice(last,m.index));const t=m[0],c0=t[0];let c='';
  if(L.bc&&t.startsWith('/*'))c='c';
  else if(L._l.some(s=>t.startsWith(s)))c='c';
  else if(c0==='"'||c0==="'"||c0==='`')c=(L.m==='json'&&/^\s*:/.test(src.slice(re.lastIndex,re.lastIndex+20)))?'t':'s';
  else if(c0>='0'&&c0<='9')c='n';
  else{const w=L.ci?t.toLowerCase():t;if(L._k.has(w))c='k';else if(/^\s*\(/.test(src.slice(re.lastIndex,re.lastIndex+30)))c='f';else if(/^[A-Z][a-z]/.test(t))c='t'}
  out+=c?'<i class="'+c+'">'+E(t)+'</i>':E(t);last=re.lastIndex}
 return out+E(src.slice(last))}
function tokCss(src){const re=/\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|--[\w-]+|#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|pt)?\b|@[\w-]+|[{}]|[.#]?-?[A-Za-z_][\w-]*/g;
 let out='',last=0,d=0,m;
 while((m=re.exec(src))){out+=E(src.slice(last,m.index));const t=m[0];let c='';
  if(t.startsWith('/*'))c='c';else if(t[0]==='"'||t[0]==="'")c='s';else if(t==='{')d++;else if(t==='}')d=Math.max(0,d-1);
  else if(t[0]==='@')c='k';
  else if(d>0){if(/^#[0-9a-fA-F]{3,8}$/.test(t)||/^-?\.?\d/.test(t))c='n';else if(/^(--|-?[A-Za-z_])/.test(t)&&/^\s*:/.test(src.slice(re.lastIndex,re.lastIndex+20)))c='f'}
  else if(/^[.#A-Za-z]/.test(t))c='t';
  out+=c?'<i class="'+c+'">'+E(t)+'</i>':E(t);last=re.lastIndex}
 return out+E(src.slice(last))}
function tagHtml(t){const m=/^(<\/?)([\w:.-]+)([\s\S]*?)(\/?>?)$/.exec(t);if(!m)return E(t);
 const re=/([\w:@.-]+)(\s*=\s*)?("[^"]*"?|'[^']*'?|[^\s"'>]+)?/g;let a='',last=0,x;const s=m[3];
 while((x=re.exec(s))){if(!x[0]){re.lastIndex++;continue}a+=E(s.slice(last,x.index))+'<i class="f">'+E(x[1])+'</i>'+(x[2]?E(x[2]):'')+(x[3]?'<i class="s">'+E(x[3])+'</i>':'');last=re.lastIndex}
 return E(m[1])+'<i class="t">'+E(m[2])+'</i>'+a+E(s.slice(last))+E(m[4])}
function tokHtml(src){const re=/<\!--[\s\S]*?(?:--\x3e|$)|<\/?[A-Za-z][^>]*>?|&#?\w+;/g;let out='',last=0,m;
 while((m=re.exec(src))){out+=E(src.slice(last,m.index));const t=m[0];last=re.lastIndex;
  if(t[0]==='&')out+='<i class="n">'+E(t)+'</i>';
  else if(t[1]==='!')out+='<i class="c">'+E(t)+'</i>';
  else{out+=tagHtml(t);const nm=/^<(script|style)\b/i.exec(t);
   if(nm&&!/\/>$/.test(t)&&t.slice(-1)==='>'){const cl=new RegExp('<\\/'+nm[1],'i');cl.lastIndex=0;const rest=src.slice(re.lastIndex),i=rest.search(cl),body=i<0?rest:rest.slice(0,i);
    out+=nm[1].toLowerCase()==='script'?tokG(body,allLangs().js):tokCss(body);re.lastIndex+=body.length;last=re.lastIndex}}}
 return out+E(src.slice(last))}
function tokMd(src){let f=false;return src.split('\n').map(l=>{if(/^\s*```/.test(l)){f=!f;return '<i class="s">'+E(l)+'</i>'}if(f)return '<i class="s">'+E(l)+'</i>';
 if(/^#{1,6}\s/.test(l))return '<i class="t">'+E(l)+'</i>';if(/^>/.test(l))return '<i class="c">'+E(l)+'</i>';
 return E(l).replace(/(`[^`]+`)/g,'<i class="s">$1</i>').replace(/(\*\*[^*]+\*\*)/g,'<i class="k">$1</i>').replace(/(\[[^\]]*\]\([^)]*\))/g,'<i class="f">$1</i>').replace(/^(\s*(?:[-*+]|\d+\.)\s)/,'<i class="n">$1</i>')}).join('\n')}
function hl(src,id){const L=allLangs()[id];if(!L||id==='txt')return E(src);try{return L.m==='css'?tokCss(src):L.m==='html'?tokHtml(src):L.m==='md'?tokMd(src):tokG(src,L)}catch(e){return E(src)}}

/* ---------------- markdown preview, formatters, snippets ---------------- */
function mdHtml(src){let o='',f=false,ul=false,m;const inl=s=>E(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\*([^*]+)\*/g,'<i>$1</i>').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank">$1</a>');
 for(const l of src.replace(/\r/g,'').split('\n')){
  if(/^```/.test(l)){o+=f?'</pre>':'<pre>';f=!f;continue}if(f){o+=E(l)+'\n';continue}
  if(ul&&!/^\s*[-*+]\s/.test(l)){o+='</ul>';ul=false}
  if((m=/^(#{1,6})\s+(.*)/.exec(l)))o+='<h'+m[1].length+'>'+inl(m[2])+'</h'+m[1].length+'>';
  else if(/^\s*[-*+]\s/.test(l)){if(!ul){o+='<ul>';ul=true}o+='<li>'+inl(l.replace(/^\s*[-*+]\s/,''))+'</li>'}
  else if(/^>\s?/.test(l))o+='<blockquote>'+inl(l.replace(/^>\s?/,''))+'</blockquote>';
  else if(/^(-{3,}|\*{3,})$/.test(l.trim()))o+='<hr>';
  else if(l.trim())o+='<p>'+inl(l)+'</p>'}
 return o+(ul?'</ul>':'')+(f?'</pre>':'')}
const fmtJson=(s,tab)=>JSON.stringify(JSON.parse(s),null,tab);
function fmtBraces(s,tab){const ind=' '.repeat(tab),out=[];let d=0,blank=0;
 s.replace(/\r/g,'').split('\n').forEach(l=>{const t=l.trim();if(!t){if(!blank&&out.length)out.push('');blank=1;return}blank=0;
  const code=t.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*$|\/\*.*?\*\//g,''),op=(code.match(/[{(\[]/g)||[]).length,cl=(code.match(/[})\]]/g)||[]).length,lead=(/^[})\]]+/.exec(code)||[''])[0].length;
  out.push(ind.repeat(Math.max(0,d-lead))+t);d=Math.max(0,d+op-cl)});
 while(out.length&&out[out.length-1]==='')out.pop();return out.join('\n')+'\n'}
function fmtMarkup(s,tab){const ind=' '.repeat(tab),VOID=/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr|!doctype)$/i,out=[];let d=0,blank=0;
 s.replace(/\r/g,'').split('\n').forEach(l=>{const t=l.trim();if(!t){if(!blank&&out.length)out.push('');blank=1;return}blank=0;let net=0,m;const re=/<(\/?)([A-Za-z!][\w:-]*)[^>]*?(\/?)>/g;
  while((m=re.exec(t))){if(m[1])net--;else if(!VOID.test(m[2])&&!m[3])net++}
  out.push(ind.repeat(Math.max(0,d-(/^<\//.test(t)?1:0)))+t);d=Math.max(0,d+net)});
 while(out.length&&out[out.length-1]==='')out.pop();return out.join('\n')+'\n'}
const FMT={json:fmtJson,braces:fmtBraces,markup:fmtMarkup};
function snipParse(b,ind){const s=b.replace(/\n/g,'\n'+ind),re=/\$\{(\d+)(?::([^}]*))?\}|\$(\d)/g;let out='',last=0,pos=-1,best=99,m;
 while((m=re.exec(s))){out+=s.slice(last,m.index);const n=+(m[1]!==undefined?m[1]:m[3]),k=n===0?98:n;if(k<best){best=k;pos=out.length}if(m[1]!==undefined)out+=(m[2]||'');last=re.lastIndex}
 out+=s.slice(last);return{text:out,pos:pos<0?out.length:pos}}

/* ---------------- icons ---------------- */
const ico=p=>'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const IC={
 newf:'<path d="M9 1.5H4v13h8V5z"/><path d="M9 1.5V5h3.5"/><path d="M8 8v4M6 10h4"/>',
 newd:'<path d="M1.5 3.5h4l1.2 1.5h7.8v8h-13z"/><path d="M8 7.5v3.5M6.3 9.2h3.4"/>',
 refresh:'<path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2.5v3h-3"/>',
 collapse:'<path d="M2.5 2.5h11v11h-11z"/><path d="M5 8h6"/>',
 pen:'<path d="M2.5 13.5l.7-3L11 2.7l2.3 2.3-7.8 7.8z"/>',
 trash:'<path d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.6 9h5.8l.6-9"/>',
 files:'<path d="M5 1.5h5l3 3v8H5z"/><path d="M10 1.5v3h3"/><path d="M3 4v10.5h8"/>',
 ext:'<rect x="2" y="8" width="5.5" height="5.5"/><rect x="8.5" y="8" width="5.5" height="5.5"/><rect x="2" y="2" width="5.5" height="5.5"/><path d="M10 1.5l3.3 3.3L10 8.1 6.7 4.8z"/>',
 ai:'<path d="M8 1.5l1.6 4.2 4.2 1.6-4.2 1.6L8 13.1 6.4 8.9 2.2 7.3l4.2-1.6z"/>',
 gear:'<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>',
 play:'<path d="M4 2.5v11l9-5.5z" fill="currentColor"/>',stop:'<rect x="4" y="4" width="8" height="8" fill="currentColor"/>',
 x:'<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>',term:'<path d="M2 4l4 4-4 4M8 12h6"/>',panel:'<rect x="2" y="2.5" width="12" height="11"/><path d="M2 9.5h12"/>',
 save:'<path d="M2.5 2.5h9l2 2v9h-11z"/><path d="M5 2.5v4h5v-4M5 13.5v-4h6v4"/>',send:'<path d="M2 8l12-5.5L9.5 14 8 9z"/>'
};
const CHEV=o=>'<svg class="ch'+(o?' o':'')+'" viewBox="0 0 16 16"><path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const FI={js:['#f7df1e','JS','#222'],mjs:['#f7df1e','JS','#222'],cjs:['#f7df1e','JS','#222'],jsx:['#61dafb','JSX','#222'],ts:['#3178c6','TS','#fff'],tsx:['#3178c6','TSX','#fff'],
 html:['#e44d26','<>','#fff'],htm:['#e44d26','<>','#fff'],css:['#42a5f5','#','#fff'],scss:['#cd6799','S','#fff'],less:['#1d365d','L','#fff'],json:['#cbcb41','{}','#222'],
 py:['#3776ab','Py','#ffd43b'],md:['#519aba','M','#fff'],txt:['#90a4ae','T','#fff'],java:['#e76f00','J','#fff'],c:['#5c6bc0','C','#fff'],h:['#5c6bc0','H','#fff'],cpp:['#0277bd','C+','#fff'],
 go:['#00add8','Go','#fff'],rs:['#dea584','Rs','#222'],php:['#777bb3','php','#fff'],sh:['#4eaa25','$_','#fff'],sql:['#e0e0e0','DB','#333'],xml:['#8bc34a','<>','#222'],
 yml:['#cb171e','Y','#fff'],yaml:['#cb171e','Y','#fff'],svg:['#ffb13b','S','#222'],bat:['#c1f12e','>_','#222'],cmd:['#c1f12e','>_','#222'],lock:['#78909c','L','#fff'],
 png:['#26a69a','IMG','#fff'],jpg:['#26a69a','IMG','#fff'],jpeg:['#26a69a','IMG','#fff'],gif:['#26a69a','IMG','#fff'],webp:['#26a69a','IMG','#fff'],zip:['#ffa000','ZIP','#222'],apk:['#3ddc84','APK','#222']};
const FN={'package.json':['#cb3837','npm','#fff'],'.gitignore':['#f4511e','git','#fff'],'.env':['#ecd53f','.e','#222'],'readme.md':['#42a5f5','i','#fff'],'dockerfile':['#0db7ed','D','#fff']};
function fileIcon(name){const f=FN[name.toLowerCase()]||FI[ext(name)];if(!f)return '<svg viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9.5H4z" fill="#8a949e"/><path d="M9.5 1.5V5H13z" fill="#c4cbd2"/></svg>';
 return '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="3" fill="'+f[0]+'"/><text x="8" y="'+(f[1].length>2?10.4:11.2)+'" font-size="'+(f[1].length>2?5.6:f[1].length>1?7.2:9)+'" font-weight="700" font-family="Arial,sans-serif" text-anchor="middle" fill="'+f[2]+'">'+E(f[1])+'</text></svg>'}
const FC={src:'#42a5f5',node_modules:'#8bc34a',assets:'#ffb74d',images:'#ffb74d',img:'#ffb74d',css:'#7e57c2',styles:'#7e57c2',js:'#ffd54f',scripts:'#ffd54f','.git':'#f4511e',public:'#26a69a',www:'#26a69a',docs:'#29b6f6',test:'#66bb6a',tests:'#66bb6a',lib:'#ec407a',components:'#26c6da'};
function folderIcon(name,o){const c=FC[name.toLowerCase()]||'#90a4ae';return o?'<svg viewBox="0 0 16 16"><path d="M1.5 3h4.2l1.4 1.5h7.4v1.2H4.3L1.5 12.5z" fill="'+c+'" opacity=".7"/><path d="M4.3 6h10.4L12.2 13H1.5z" fill="'+c+'"/></svg>':'<svg viewBox="0 0 16 16"><path d="M1.5 3h4.2l1.4 1.5h7.4V13h-13z" fill="'+c+'"/></svg>'}

/* ---------------- plugin catalog (declarative only: no plugin runs code) ---------------- */
const P=(id,type,name,desc,o)=>Object.assign({id,type,name,desc,by:'NexOS'},o);
const SN=(l,p,b,d)=>({l,p,b,d:d||p});
const CAT=[
 P('theme-monokai','theme','Monokai','Warm, high-contrast dark theme.',{t:TH('Monokai',1,'#272822','#f8f8f2','#21221d','#1e1f1c','#75715e','#a6e22e','#f92672','#e6db74','#88846f','#ae81ff','#a6e22e','#66d9ef','#f92672')}),
 P('theme-dracula','theme','Dracula','Dark theme with vivid purple and pink.',{t:TH('Dracula',1,'#282a36','#f8f8f2','#21222c','#191a21','#6272a4','#bd93f9','#ff79c6','#f1fa8c','#6272a4','#bd93f9','#50fa7b','#8be9fd','#ff79c6')}),
 P('theme-nord','theme','Nord','Calm arctic blue palette.',{t:TH('Nord',1,'#2e3440','#d8dee9','#292e39','#242933','#5e81ac','#88c0d0','#81a1c1','#a3be8c','#616e88','#b48ead','#88c0d0','#8fbcbb','#81a1c1')}),
 P('theme-onedark','theme','One Dark','Atom One Dark colours.',{t:TH('One Dark',1,'#282c34','#abb2bf','#21252b','#1b1d23','#4d78cc','#61afef','#c678dd','#98c379','#5c6370','#d19a66','#61afef','#e5c07b','#e06c75')}),
 P('theme-solarized','theme','Solarized Dark','Low-contrast teal and yellow.',{t:TH('Solarized Dark',1,'#002b36','#839496','#073642','#00212b','#268bd2','#268bd2','#859900','#2aa198','#586e75','#d33682','#268bd2','#b58900','#268bd2')}),
 P('theme-ghlight','theme','GitHub Light','Clean light theme like github.com.',{t:TH('GitHub Light',0,'#ffffff','#24292f','#f6f8fa','#eaeef2','#0969da','#0969da','#cf222e','#0a3069','#6e7781','#0550ae','#8250df','#953800','#116329')}),
 P('lang-python','language','Python','Highlighting for Python. Run it from the editor (needs internet the first time).',{lang:{id:'py',n:'Python',x:['py','pyw'],k:'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None self',lc:'#',q:'"\'',tri:1,cm:'#'}}),
 P('lang-markdown','language','Markdown','Highlighting and live preview for Markdown.',{lang:{id:'md',n:'Markdown',x:['md','markdown'],m:'md',cm:'<'}}),
 P('lang-shell','language','Shell Script','Highlighting for sh, bash and zsh.',{lang:{id:'sh',n:'Shell',x:['sh','bash','zsh'],k:'if then else elif fi for while do done case esac function in echo cd ls export local return exit source alias set unset true false',lc:'#',q:'"\'',cm:'#'}}),
 P('lang-sql','language','SQL','Highlighting for SQL.',{lang:{id:'sql',n:'SQL',x:['sql'],k:'select from where insert into values update set delete create table drop alter add join left right inner outer on group by order having limit as and or not null primary key foreign references index distinct union all case when then else end like in is count sum avg min max',lc:'--',bc:1,q:'"\'',ci:1,cm:'--'}}),
 P('lang-c','language','C / C++','Highlighting for C, C++ and headers.',{lang:{id:'c',n:'C / C++',x:['c','h','cpp','hpp','cc','cxx'],k:'auto break case char const continue default do double else enum extern float for goto if inline int long register return short signed sizeof static struct switch typedef union unsigned void volatile while class namespace template typename public private protected virtual new delete this using bool true false nullptr include define',lc:'//',bc:1,q:'"\'',cm:'//'}}),
 P('lang-java','language','Java / Kotlin','Highlighting for Java and Kotlin.',{lang:{id:'java',n:'Java',x:['java','kt','kts'],k:'abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long new package private protected public return short static super switch this throw throws try void volatile while true false null fun val var when object',lc:'//',bc:1,q:'"\'',cm:'//'}}),
 P('lang-go','language','Go','Highlighting for Go.',{lang:{id:'go',n:'Go',x:['go'],k:'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil',lc:'//',bc:1,q:'"\'`',cm:'//'}}),
 P('lang-rust','language','Rust','Highlighting for Rust.',{lang:{id:'rs',n:'Rust',x:['rs'],k:'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while',lc:'//',bc:1,q:'"',cm:'//'}}),
 P('lang-php','language','PHP','Highlighting for PHP.',{lang:{id:'php',n:'PHP',x:['php'],k:'abstract and array as break case catch class clone const continue declare default do echo else elseif empty extends final finally for foreach function global if implements include interface isset namespace new or private protected public require return static switch throw trait try use var while true false null',lc:'// #',bc:1,q:'"\'',cm:'//'}}),
 P('lang-yaml','language','YAML & TOML','Highlighting for YAML and TOML.',{lang:{id:'yaml',n:'YAML',x:['yml','yaml','toml'],k:'true false null yes no on off',lc:'#',q:'"\'',cm:'#'}}),
 P('fmt-json','formatter','JSON Formatter','Format Document for JSON (Shift+Alt+F).',{fmt:{k:'json',l:['json']}}),
 P('fmt-braces','formatter','Code Formatter (braces)','Re-indents JS, TS, CSS, Java, C, Go, Rust and PHP by bracket depth.',{fmt:{k:'braces',l:['js','ts','css','c','java','go','rs','php']}}),
 P('fmt-markup','formatter','HTML Formatter','Re-indents HTML and XML by tag depth.',{fmt:{k:'markup',l:['html','xml']}}),
 P('snip-js','snippets','JavaScript Snippets','clg, fn, af, for, forof, if, try, fetch, timeout.',{snips:[].concat(['js','ts'].map(l=>[SN(l,'clg','console.log($1);','console.log'),SN(l,'fn','function ${1:name}(${2}) {\n  $0\n}','function'),SN(l,'af','const ${1:name} = (${2}) => {\n  $0\n};','arrow function'),SN(l,'for','for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n  $0\n}','for loop'),SN(l,'forof','for (const ${1:item} of ${2:items}) {\n  $0\n}','for of'),SN(l,'if','if (${1:cond}) {\n  $0\n}','if'),SN(l,'try','try {\n  $0\n} catch (e) {\n  console.error(e);\n}','try catch'),SN(l,'fetch','const res = await fetch(${1:url});\nconst data = await res.json();\n$0','fetch json'),SN(l,'timeout','setTimeout(() => {\n  $0\n}, ${1:1000});','setTimeout')]).reduce((a,b)=>a.concat(b),[]))}),
 P('snip-html','snippets','HTML Snippets','! (boilerplate), div, a, ul, link, script.',{snips:[SN('html','!','\x3c!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${1:Document}</title>\n</head>\n<body>\n  $0\n</body>\n</html>','HTML5 boilerplate'),SN('html','div','<div class="$1">$0</div>'),SN('html','a','<a href="$1">$0</a>'),SN('html','ul','<ul>\n  <li>$0</li>\n</ul>'),SN('html','link','<link rel="stylesheet" href="$1">'),SN('html','script','\x3cscript src="$1">\x3c/script>')]}),
 P('snip-python','snippets','Python Snippets','def, class, main, for, try, with.',{snips:[SN('py','def','def ${1:name}(${2}):\n    $0'),SN('py','class','class ${1:Name}:\n    def __init__(self${2}):\n        $0'),SN('py','main','if __name__ == "__main__":\n    $0'),SN('py','for','for ${1:i} in range(${2:10}):\n    $0'),SN('py','try','try:\n    $0\nexcept Exception as e:\n    print(e)'),SN('py','with','with open(${1:"file.txt"}) as f:\n    $0')]}),
 P('snip-css','snippets','CSS Snippets','flex, grid, center.',{snips:[SN('css','flex','display: flex;\nalign-items: center;\njustify-content: center;\n$0'),SN('css','grid','display: grid;\ngrid-template-columns: repeat(${1:3}, 1fr);\ngap: ${2:8px};\n$0'),SN('css','center','position: absolute;\ninset: 0;\nmargin: auto;\n$0')]})
];
const allP=()=>CAT.concat(CUSTOM),isInst=id=>INST.includes(id),activeP=t=>allP().filter(p=>isInst(p.id)&&(!t||p.type===t));
function plugNotify(){langCache=null;INSTANCES=INSTANCES.filter(x=>x.alive());INSTANCES.forEach(x=>x.plugChanged())}
function plugInstall(id){if(!isInst(id)){INST.push(id);jset('aur.cplug',INST)}plugNotify()}
function plugRemove(id){INST=INST.filter(x=>x!==id);jset('aur.cplug',INST);const p=allP().find(x=>x.id===id);
 if(p&&p.type==='theme'&&SET.theme===id){SET.theme='auto';jset('aur.ced',SET)}
 if(CUSTOM.some(x=>x.id===id)){CUSTOM=CUSTOM.filter(x=>x.id!==id);jset('aur.cplugx',CUSTOM)}plugNotify()}
function plugAdd(txt){let o=JSON.parse(txt);if(!Array.isArray(o))o=[o];
 o.forEach(p=>{if(!p||typeof p.id!=='string'||!/^[\w.-]{2,40}$/.test(p.id)||typeof p.name!=='string')throw new Error('Plugin needs "id" and "name"');
  if(CAT.some(x=>x.id===p.id))throw new Error('id already used: '+p.id);
  if(p.type==='theme'){if(!p.t||typeof p.t!=='object')throw new Error('theme needs "t" with colours');p.t=Object.assign({},DARKP,p.t,{n:p.t.n||p.name})}
  else if(p.type==='language'){if(!p.lang||!p.lang.id||!Array.isArray(p.lang.x))throw new Error('language needs lang:{id,n,x:[...],k,lc,q}')}
  else if(p.type==='snippets'){if(!Array.isArray(p.snips))throw new Error('snippets needs "snips":[{l,p,b}]')}
  else if(p.type==='formatter'){if(!p.fmt||!FMT[p.fmt.k]||!Array.isArray(p.fmt.l))throw new Error('formatter needs fmt:{k:"json|braces|markup",l:[lang ids]}')}
  else throw new Error('type must be theme, language, snippets or formatter');
  p.desc=String(p.desc||'Custom plugin');p.by='You';CUSTOM=CUSTOM.filter(x=>x.id!==p.id).concat(p);if(!isInst(p.id))INST.push(p.id)});
 jset('aur.cplugx',CUSTOM);jset('aur.cplug',INST);plugNotify()}

/* ---------------- run workers ---------------- */
const WJS='function f(a){return Array.prototype.map.call(a,function(x){if(typeof x==="string")return x;if(x instanceof Error)return x.stack||x.message;try{var j=JSON.stringify(x,null,2);return j===undefined?String(x):j}catch(e){return String(x)}}).join(" ")}'+
 'function s(t,a){postMessage({t:t,m:f(a)})}console.log=function(){s("l",arguments)};console.info=console.log;console.debug=console.log;console.warn=function(){s("w",arguments)};console.error=function(){s("e",arguments)};'+
 'onmessage=async function(ev){var d=ev.data;try{var code=d.code;if(d.lang==="ts"){postMessage({t:"i",m:"Loading TypeScript compiler (needs internet)..."});importScripts("https://cdnjs.cloudflare.com/ajax/libs/typescript/5.4.5/typescript.min.js");code=ts.transpileModule(code,{compilerOptions:{target:99,module:99}}).outputText.replace(/^export /gm,"")}'+
 'var AF=Object.getPrototypeOf(async function(){}).constructor;await new AF(code)();postMessage({t:"done"})}catch(e){postMessage({t:"e",m:(e&&e.stack)||String(e)});postMessage({t:"done",err:1})}};';
const WPY='importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");var py=null;'+
 'async function init(){postMessage({t:"i",m:"Loading Python runtime (about 10 MB, first run only)..."});py=await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"});py.setStdout({batched:function(s){postMessage({t:"l",m:s})}});py.setStderr({batched:function(s){postMessage({t:"e",m:s})}})}'+
 'onmessage=async function(ev){try{if(!py)await init();await py.loadPackagesFromImports(ev.data.code);await py.runPythonAsync(ev.data.code);postMessage({t:"done"})}catch(e){postMessage({t:"e",m:String(e&&e.message||e)});postMessage({t:"done",err:1})}};';
const HOOK='\x3cscript>(function(){function f(a){return Array.prototype.map.call(a,function(x){if(typeof x==="string")return x;try{return JSON.stringify(x)}catch(e){return String(x)}}).join(" ")}["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){parent.postMessage({nx:"cx",k:k,m:f(arguments)},"*");o.apply(console,arguments)}});addEventListener("error",function(e){parent.postMessage({nx:"cx",k:"error",m:e.message+" (line "+e.lineno+")"},"*")})})();\x3c/script>';
const PREV_CSS='body{font:15px/1.6 system-ui,sans-serif;margin:16px;color:#222;background:#fff}pre{background:#f3f3f3;padding:10px;border-radius:6px;overflow:auto}code{background:#f3f3f3;padding:1px 4px;border-radius:3px}blockquote{border-left:3px solid #ccc;margin:8px 0;padding-left:12px;color:#555}a{color:#06c}h1,h2{border-bottom:1px solid #ddd;padding-bottom:4px}';
const BINX=new Set('png jpg jpeg gif webp bmp ico zip rar 7z apk mp3 mp4 mkv wav ogg pdf exe dll so db'.split(' '));

/* ---------------- css ---------------- */
const CSS='.cwp{--line:color-mix(in srgb,var(--fg) 15%,transparent);--dim:color-mix(in srgb,var(--fg) 55%,transparent);--hov:color-mix(in srgb,var(--fg) 9%,transparent);--sel:color-mix(in srgb,var(--acc) 32%,transparent);display:flex;flex-direction:column;width:100%;height:100%;background:var(--bg);color:var(--fg);font:13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden;position:relative;user-select:none;-webkit-user-select:none}'+
'.cwp *{box-sizing:border-box}.cwp [hidden]{display:none!important}.cwp button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}.cwp svg{width:16px;height:16px;display:block;flex:none}.cwp .fl{flex:1}'+
'.cwp input,.cwp select,.cwp textarea.ta2{font:inherit;color:var(--fg);background:color-mix(in srgb,var(--fg) 8%,var(--bg));border:1px solid var(--line);border-radius:4px;padding:5px 7px;outline:0;min-width:0;user-select:text;-webkit-user-select:text}.cwp input:focus,.cwp select:focus,.cwp textarea.ta2:focus{border-color:var(--acc)}'+
'.cxm{flex:1;display:flex;min-height:0}.cxa{width:42px;flex:none;display:flex;flex-direction:column;align-items:center;background:var(--bar);padding:2px 0}'+
'.cxab{width:42px;height:42px;display:grid;place-items:center;color:var(--dim);position:relative}.cxab svg{width:22px;height:22px}.cxab:hover,.cxab.on{color:var(--fg)}.cxab.on:before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:2px;background:var(--acc)}'+
'.cxs{width:var(--sw,220px);flex:none;position:relative;background:var(--side);border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0}.cxsv{flex:1;display:flex;flex-direction:column;min-height:0}'+
'.cxv{position:absolute;top:0;bottom:0;right:-3px;width:7px;cursor:ew-resize;z-index:6;touch-action:none}.cxv:hover,.cxv.on{background:var(--acc);opacity:.6}'+
'.cxsh{display:flex;align-items:center;gap:2px;height:32px;padding:0 6px 0 14px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--dim);flex:none}.cxsh b{font-weight:400;flex:1}'+
'.cxsh button,.cxph button,.cxta button{width:28px;height:28px;display:grid;place-items:center;border-radius:4px;color:var(--dim)}.cxsh button:hover,.cxph button:hover,.cxta button:hover{background:var(--hov);color:var(--fg)}'+
'.cxtree{flex:1;overflow:auto;min-height:0;padding-bottom:20px}.cxr{display:flex;align-items:center;gap:4px;height:24px;padding:0 8px 0 calc(8px + var(--d,0)*12px);white-space:nowrap;cursor:pointer;font-size:12px}'+
'.cxr:hover{background:var(--hov)}.cxr.act{background:color-mix(in srgb,var(--acc) 16%,transparent)}.cxr.sel{background:var(--sel)}.cxr .ch{width:16px;height:16px;color:var(--dim);transition:transform .1s}.cxr .ch.o{transform:rotate(90deg)}.cxr .sp{width:16px;flex:none}.cxr .ic{width:15px;height:15px;flex:none;display:block}.cxr .ic svg{width:15px;height:15px}.cxr span{overflow:hidden;text-overflow:ellipsis}'+
'.cxr.root{--d:0;height:26px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;padding-left:4px}.cxr.root .ic{display:none}.cxempty{padding:14px;color:var(--dim);line-height:1.6}.cxempty button,.cxset button.pri,.cxmd button.pri{background:var(--acc);color:#fff;border-radius:4px;padding:6px 12px;margin:4px 4px 0 0}'+
'.cxk{flex:1;display:flex;flex-direction:column;min-width:0;position:relative}.cxt{display:flex;align-items:stretch;height:36px;flex:none;background:var(--bar);border-bottom:1px solid var(--line)}.cxtl{display:flex;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}.cxtl::-webkit-scrollbar{display:none}'+
'.cxtb{display:flex;align-items:center;gap:6px;padding:0 6px 0 10px;min-width:90px;max-width:200px;flex:none;border-right:1px solid var(--line);color:var(--dim);cursor:pointer;border-top:2px solid transparent;font-size:12px}.cxtb .ic svg{width:15px;height:15px}.cxtb span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}'+
'.cxtb.on{background:var(--bg);color:var(--fg);border-top-color:var(--acc)}.cxtb .x{width:18px;height:18px;border-radius:4px;display:grid;place-items:center;opacity:.6;font-style:normal}.cxtb .x:before{content:"\\00d7";font-size:16px;line-height:1}.cxtb:hover .x,.cxtb.on .x{opacity:1}.cxtb .x:hover{background:var(--hov)}.cxtb.dirty .x:before{content:"\\25cf";font-size:11px}.cxtb.dirty:hover .x:before{content:"\\00d7";font-size:16px}'+
'.cxnm{align-self:center;padding:0 12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cxnm.d:after{content:" \\25cf";color:var(--acc)}.cxta{display:flex;align-items:center;padding:0 4px;gap:1px;flex:none}'+
'.cxf{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:6px 8px;background:var(--side);border-bottom:1px solid var(--line);flex:none}.cxf input{flex:1;min-width:90px;max-width:220px;height:28px}.cxf button{min-width:28px;height:28px;border-radius:4px;padding:0 6px;color:var(--dim)}.cxf button:hover,.cxf button.on{background:var(--hov);color:var(--fg)}.cxf button.on{outline:1px solid var(--acc)}.cxf .fc{color:var(--dim);font-size:12px;min-width:56px}'+
'.cxe{flex:1;display:flex;min-height:0;position:relative}.cxg{flex:none;min-width:46px;padding:8px 10px 40px 12px;text-align:right;color:var(--dim);font:var(--fs) var(--ff);line-height:var(--lh);white-space:pre;overflow:hidden;background:var(--bg)}.noln .cxg{display:none}'+
'.cxc{flex:1;position:relative;min-width:0;overflow:hidden}.cxc pre,.cxc textarea{position:absolute;inset:0;margin:0;padding:8px 12px 40px 12px;border:0;font:var(--fs) var(--ff);line-height:var(--lh);tab-size:var(--tab);-moz-tab-size:var(--tab);white-space:pre;overflow:auto;letter-spacing:0}'+
'.cxc pre{overflow:hidden;pointer-events:none;color:var(--fg)}.cxc .bm{color:transparent}.cxc .bm mark{background:color-mix(in srgb,var(--acc) 28%,transparent);color:transparent;border-radius:2px}.cxc .bm mark.mc{background:color-mix(in srgb,#f90 55%,transparent)}.cxc .bm mark.b{background:none;outline:1px solid var(--acc)}'+
'.cxc textarea{background:transparent;color:transparent;caret-color:var(--fg);resize:none;outline:0;user-select:text;-webkit-user-select:text}.cxc textarea::selection{background:var(--sel)}'+
'.cxc i{font-style:normal}.cwp .k{color:var(--tk)}.cwp .s{color:var(--ts)}.cwp .c{color:var(--tc);font-style:italic}.cwp .n{color:var(--tn)}.cwp .f{color:var(--tf)}.cwp .t{color:var(--tt)}'+
'.cxmm{width:84px;flex:none;position:relative;border-left:1px solid var(--line);background:var(--bg);touch-action:none}.cxmm canvas{position:absolute;inset:0;width:100%;height:100%}.cxmv{position:absolute;left:0;right:0;background:color-mix(in srgb,var(--fg) 14%,transparent);pointer-events:none}.nomini .cxmm,.narrow .cxmm{display:none}'+
'.cxset{position:absolute;inset:0;z-index:5;background:var(--bg);overflow:auto;padding:16px 20px;user-select:text;-webkit-user-select:text}.cxset h2{font-size:18px;margin:0 0 12px;font-weight:600}.cxset h3{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--dim);margin:18px 0 6px}.cxset label{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)}.cxset label>span{flex:1}.cxset label small{display:block;color:var(--dim)}.cxset input[type=checkbox]{width:18px;height:18px;accent-color:var(--acc)}.cxset input[type=number]{width:70px}.cxset input[type=text],.cxset input[type=password],.cxset select{width:min(230px,50%)}'+
'.cxp{height:var(--ph,200px);flex:none;display:flex;flex-direction:column;border-top:1px solid var(--line);background:var(--bg);position:relative}.cxh{position:absolute;left:0;right:0;top:-4px;height:9px;cursor:ns-resize;z-index:7;touch-action:none}.cxh:hover,.cxh.on{background:var(--acc);opacity:.55;height:4px;top:-2px}'+
'.cxph{display:flex;align-items:center;height:30px;flex:none;padding:0 6px;gap:2px}.cxph button[data-pt]{width:auto;padding:0 10px;font-size:11px;letter-spacing:.4px;border-bottom:1px solid transparent;border-radius:0}.cxph button[data-pt].on{color:var(--fg);border-bottom-color:var(--acc)}'+
'.cxo{flex:1;overflow:auto;padding:4px 12px 8px;font:12px/1.5 var(--ff);user-select:text;-webkit-user-select:text}.cxo .ln{white-space:pre-wrap;word-break:break-word}.cxo .e{color:#f85149}.cxo .w{color:#d29922}.cxo .m{color:var(--dim)}.cxo .ok{color:#3fb950}.cxpv{flex:1;min-height:0;background:#fff}.cxpv iframe{width:100%;height:100%;border:0;background:#fff}.cxdrag iframe{pointer-events:none}'+
'.cxst{height:24px;flex:none;display:flex;align-items:center;background:var(--sb);color:#fff;font-size:12px;padding:0 4px;gap:2px;white-space:nowrap;overflow:hidden}.cxst .sb{padding:0 8px;height:24px;display:flex;align-items:center;gap:5px;color:#fff;opacity:.95}.cxst button.sb:hover{background:rgba(255,255,255,.18)}.cxst svg{width:13px;height:13px}.cxst .pos{padding:0 8px}'+
'.cxov{position:absolute;inset:0;z-index:30}.cxov.dim{background:rgba(0,0,0,.4);display:grid;place-items:center}.cxpal,.cxmd{background:var(--side);border:1px solid var(--line);box-shadow:0 10px 40px rgba(0,0,0,.45);border-radius:8px;color:var(--fg)}.cxpal{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:min(560px,94%);padding:6px;max-height:80%;display:flex;flex-direction:column}'+
'.cxpal input{width:100%;height:34px}.cxpl{overflow:auto;margin-top:6px}.cxpi{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:13px}.cxpi.on{background:var(--sel)}.cxpi small{margin-left:auto;color:var(--dim);font-size:11px;padding-left:12px;overflow:hidden;text-overflow:ellipsis}'+
'.cxmd{width:min(420px,92%);padding:16px}.cxmd h4{margin:0 0 10px;font-size:14px;font-weight:600}.cxmd p{margin:0 0 12px;line-height:1.5;user-select:text}.cxmd input{width:100%}.cxmd textarea.ta2{width:100%;height:170px;font:12px/1.4 var(--ff);resize:vertical}.cxmd .mb{display:flex;justify-content:flex-end;gap:6px;margin-top:12px;flex-wrap:wrap}.cxmd .mb button{padding:6px 12px;border-radius:4px;background:var(--hov)}.cxmd .mb button.pri{background:var(--acc);color:#fff}'+
'.cxcard{display:flex;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}.cxcard .bd{width:34px;height:34px;border-radius:6px;display:grid;place-items:center;font-weight:700;color:#fff;flex:none}.cxcard .bi{flex:1;min-width:0}.cxcard b{display:block}.cxcard small{display:block;color:var(--dim);margin:2px 0 6px;line-height:1.4}.cxcard button{padding:3px 10px;border-radius:4px;background:var(--acc);color:#fff;font-size:12px;margin-right:4px}.cxcard button.g{background:var(--hov);color:var(--fg)}.cxsr{margin:0 10px 8px;width:calc(100% - 20px)}.cxsec{padding:6px 14px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--dim);background:var(--hov)}'+
'.cxai{flex:1;overflow:auto;padding:8px 10px;user-select:text;-webkit-user-select:text}.cxam{margin:0 0 10px;line-height:1.5;white-space:pre-wrap;word-break:break-word}.cxam.u{background:var(--hov);padding:6px 8px;border-radius:6px}.cxam.e{color:#f85149}.cxcb{margin:6px 0;border:1px solid var(--line);border-radius:6px;overflow:hidden}.cxcb pre{margin:0;padding:6px 8px;font:12px/1.4 var(--ff);overflow:auto;background:color-mix(in srgb,var(--fg) 6%,var(--bg))}.cxcb div{display:flex;gap:4px;padding:4px}.cxcb button{padding:2px 8px;border-radius:4px;background:var(--hov);font-size:12px}'+
'.cxaq{display:flex;gap:4px;padding:4px 8px;flex-wrap:wrap}.cxaq button{padding:3px 8px;border-radius:12px;background:var(--hov);font-size:12px}.cxai2{display:flex;gap:4px;padding:6px 8px;border-top:1px solid var(--line)}.cxai2 textarea{flex:1;height:54px;resize:none}.cxai2 button{width:34px;border-radius:4px;background:var(--acc);color:#fff;display:grid;place-items:center}'+
'.cxsg{position:absolute;left:12px;right:12px;bottom:10px;z-index:8;background:var(--side);border:1px solid var(--acc);border-radius:6px;padding:6px 8px;font:12px/1.4 var(--ff);display:flex;gap:8px;align-items:center}.cxsg pre{flex:1;margin:0;max-height:70px;overflow:auto;white-space:pre-wrap;color:var(--dim)}.cxsg button{padding:3px 8px;border-radius:4px;background:var(--hov)}.cxsg button.pri{background:var(--acc);color:#fff}'+
'.simple .cxt{height:34px}@media (pointer:coarse){.cxr{height:30px}.cxr.root{height:32px}}';
let cssDone=0;
function ensureCss(){if(cssDone)return;cssDone=1;const s=document.createElement('style');s.id='cx-css';s.textContent=CSS;document.head.appendChild(s);
 try{new MutationObserver(()=>INSTANCES.forEach(x=>x.alive()&&x.applySet())).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-skin']})}catch(e){}}

/* ---------------- the app ---------------- */
function codeApp(w,arg){
 ensureCss();
 const B=w.body,proj=!(arg&&arg.path),inst={};INSTANCES.push(inst);
 let tabs=[],cur=null,tid=0,untitled=0,sideOn=proj,view='explorer',root=proj?(ls('aur.cproj')||''):'',sel='',running=false,wk=null,pyw=null,sug=null,palEl=null,mk=0;
 let findOn=false,fCase=false,fRe=false,rf=0,nLines=0,saveT=0,miniT=0,ptab='out',aiMsgs=[],aiBusy=false,lp=0,rootOpen=true;
 const kids=new Map(),open=new Set(),actv=(id,t,svg)=>'<button class="cxab" data-v="'+id+'" title="'+t+'">'+ico(svg)+'</button>';
 B.innerHTML='<div class="cwp'+(proj?'':' simple')+'"><div class="cxm">'+
  (proj?'<div class="cxa">'+actv('explorer','Explorer',IC.files)+actv('ext','Extensions',IC.ext)+actv('ai','AI Assistant',IC.ai)+'<i class="fl"></i>'+actv('settings','Settings',IC.gear)+'</div><div class="cxs"><div class="cxsv"></div><i class="cxv"></i></div>':'')+
  '<div class="cxk"><div class="cxt"></div>'+
  '<div class="cxf" hidden><input class="fi" placeholder="Find"><button data-f="case" title="Match case">Aa</button><button data-f="re" title="Regex">.*</button><span class="fc"></span><button data-f="prev">&#8593;</button><button data-f="next">&#8595;</button><button data-f="x">'+ico(IC.x)+'</button><input class="ri" placeholder="Replace"><button data-f="rep">Replace</button><button data-f="all">All</button></div>'+
  '<div class="cxe"><div class="cxg"></div><div class="cxc"><pre class="bm"></pre><pre class="hl"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div><div class="cxmm"><canvas></canvas><i class="cxmv"></i></div><div class="cxset" hidden></div><div class="cxsg" hidden></div></div>'+
  '<div class="cxp" hidden><i class="cxh"></i><div class="cxph"><button data-pt="out" class="on">OUTPUT</button><button data-pt="pv">PREVIEW</button><span class="fl"></span><button data-a="clear" title="Clear output">'+ico(IC.trash)+'</button><button data-a="panel" title="Close panel">'+ico(IC.x)+'</button></div><div class="cxo"></div><div class="cxpv" hidden></div></div></div></div>'+
  '<div class="cxst"><button class="sb" data-a="panel">'+ico(IC.panel)+'Output</button><span class="fl"></span><span class="pos">Ln 1, Col 1</span><button class="sb" data-a="spaces"></button><span class="sb">UTF-8</span><button class="sb" data-a="lang"></button><button class="sb" data-a="aiq">'+ico(IC.ai)+'AI</button></div></div>';
 const cw=q('.cwp',B),ta=q('textarea',B),pre=q('.hl',B),bm=q('.bm',B),gut=q('.cxg',B),tabsEl=q('.cxt',B),side=q('.cxs',B),sv=q('.cxsv',B),col=q('.cxk',B),panel=q('.cxp',B),pout=q('.cxo',B),ppv=q('.cxpv',B),setEl=q('.cxset',B),sgEl=q('.cxsg',B),findEl=q('.cxf',B),fi=q('.fi',B),ri=q('.ri',B),mm=q('.cxmm',B),mmc=q('canvas',mm),mmv=q('.cxmv',mm),posEl=q('.pos',B);
 const dirty=t=>!t.special&&(t===cur?ta.value:t.text)!==t.saved,tabStr=()=>' '.repeat(SET.tab);
 inst.alive=()=>B.isConnected;

 /* theme + settings */
 const themeObj=()=>{const id=SET.theme;if(id==='dark')return DARKP;if(id==='light')return LIGHTP;if(id!=='auto'){const p=activeP('theme').find(x=>x.id===id);if(p)return p.t}return document.documentElement.getAttribute('data-theme')==='light'?LIGHTP:DARKP};
 const fontStack=()=>(SET.font?SET.font+',':'')+'ui-monospace,"SFMono-Regular",Menlo,Consolas,"Roboto Mono","DejaVu Sans Mono",monospace';
 inst.applySet=()=>{const th=themeObj(),s=cw.style,v={'--bg':th.bg,'--fg':th.fg,'--side':th.side,'--bar':th.bar,'--sb':th.sb,'--acc':th.acc,'--tk':th.kw,'--ts':th.str,'--tc':th.com,'--tn':th.num,'--tf':th.fn,'--tt':th.typ,'--fs':SET.fs+'px','--lh':Math.round(SET.fs*1.55)+'px','--ff':fontStack(),'--tab':SET.tab};
  for(const k in v)s.setProperty(k,v[k]);s.colorScheme=th.d?'dark':'light';cw.classList.toggle('nomini',!SET.mini);cw.classList.toggle('noln',!SET.ln);
  q('[data-a=spaces]',B).textContent='Spaces: '+SET.tab;nLines=0;render();if(cur&&cur.special==='settings')drawSettings()};
 inst.plugChanged=()=>{if(cur&&!cur.special)cur.lang=langOf(cur.name);tabs.forEach(t=>{if(!t.special)t.lang=langOf(t.name)});inst.applySet();if(proj&&(view==='ext'))drawSide()};
 const saveSet=()=>{jset('aur.ced',SET);INSTANCES.forEach(x=>x.alive()&&x.applySet())};

 /* modals */
 function modal(html,init,onx){const o=document.createElement('div');o.className='cxov dim';o.innerHTML='<div class="cxmd">'+html+'</div>';cw.appendChild(o);const close=()=>o.remove();
  o.addEventListener('mousedown',e=>{if(e.target===o){close();onx&&onx()}});init(o,close);return close}
 const ask=(title,def,ph)=>new Promise(res=>{modal('<h4>'+E(title)+'</h4><input class="mi" value="'+E(def||'')+'" placeholder="'+E(ph||'')+'"><div class="mb"><button data-m="0">Cancel</button><button data-m="1" class="pri">OK</button></div>',(o,close)=>{const i=q('.mi',o);setTimeout(()=>{i.focus();i.select()},40);
   o.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b){close();res(b.dataset.m==='1'?i.value:null)}});i.addEventListener('keydown',e=>{if(e.key==='Enter'){close();res(i.value)}else if(e.key==='Escape'){close();res(null)}})},()=>res(null))});
 const choose=(text,btns)=>new Promise(res=>{modal('<p>'+E(text)+'</p><div class="mb">'+btns.map((b,i)=>'<button data-m="'+i+'"'+(b[1]?' class="pri"':'')+'>'+E(b[0])+'</button>').join('')+'</div>',(o,close)=>{o.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b){close();res(+b.dataset.m)}})},()=>res(-1))});

 /* editor core */
 const ins=(text,s,e)=>{ta.focus();ta.setSelectionRange(s,e==null?s:e);let ok=false;try{ok=text===''?document.execCommand('delete'):document.execCommand('insertText',false,text)}catch(x){}
  if(!ok){ta.setRangeText(text,ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input',{bubbles:true}))}};
 const syncScroll=()=>{pre.scrollTop=bm.scrollTop=gut.scrollTop=ta.scrollTop;pre.scrollLeft=bm.scrollLeft=ta.scrollLeft;miniView()};
 function bracket(v,p){const O='([{',C=')]}';let i=-1,ch;if(p>0&&(O+C).includes(v[p-1]))i=p-1;else if(p<v.length&&(O+C).includes(v[p]))i=p;if(i<0)return null;ch=v[i];
  const o=O.indexOf(ch),open=o>=0,pair=open?C[o]:O[C.indexOf(ch)];let d=0;
  if(open){for(let j=i,n=0;j<v.length&&n<30000;j++,n++){if(v[j]===ch)d++;else if(v[j]===pair&&--d===0)return[i,j]}}
  else{for(let j=i,n=0;j>=0&&n<30000;j--,n++){if(v[j]===ch)d++;else if(v[j]===pair&&--d===0)return[j,i]}}return null}
 function findAll(){const f=fi.value;if(!f)return[];let re;try{re=new RegExp(fRe?f:f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'+(fCase?'':'i'))}catch(e){return[]}
  const v=ta.value,r=[];let m;while((m=re.exec(v))&&r.length<5000){if(!m[0]){re.lastIndex++;continue}r.push([m.index,m.index+m[0].length])}return r}
 function marks(){if(!cur||cur.special)return;const v=ta.value;if(v.length>3e5){bm.innerHTML='';return}const rg=[];
  if(findOn&&fi.value){const a=ta.selectionStart,b=ta.selectionEnd;findAll().forEach(r=>rg.push([r[0],r[1],r[0]===a&&r[1]===b?'mc':'m']))}
  const p=ta.selectionStart;if(p===ta.selectionEnd){const bp=bracket(v,p);if(bp){rg.push([bp[0],bp[0]+1,'b'],[bp[1],bp[1]+1,'b'])}}
  if(!rg.length){bm.innerHTML='';return}rg.sort((a,b)=>a[0]-b[0]);let o='',last=0;
  for(const r of rg){if(r[0]<last)continue;o+=E(v.slice(last,r[0]))+'<mark class="'+r[2]+'">'+E(v.slice(r[0],r[1]))+'</mark>';last=r[1]}
  bm.innerHTML=o+E(v.slice(last))+'\n'}
 function stat(){if(!cur||cur.special){posEl.textContent='';q('[data-a=lang]',B).textContent='';return}const s=ta.selectionStart,v=ta.value.slice(0,s).split('\n'),n=ta.selectionEnd-s;
  posEl.textContent='Ln '+v.length+', Col '+(v[v.length-1].length+1)+(n?' ('+n+' selected)':'');const L=allLangs()[cur.lang];q('[data-a=lang]',B).textContent=L?L.n:'Plain Text'}
 const title=()=>{const nm=cur?cur.name:'Code Editor';w.setTitle((cur&&dirty(cur)?'*':'')+nm+(proj&&root?' - '+base(root):'')+' - Code Editor')};
 function render(){rf=0;if(!cur||cur.special)return;const v=ta.value;pre.innerHTML=(v.length>3e5?E(v):hl(v,cur.lang))+'\n';const n=v.split('\n').length;
  if(n!==nLines){nLines=n;let s='';for(let i=1;i<=n;i++)s+=i+'\n';gut.textContent=s}syncScroll();marks();stat();paintTab();clearTimeout(miniT);miniT=setTimeout(paintMini,140)}
 const sched=()=>{if(!rf)rf=requestAnimationFrame(render)};
 function paintTab(){title();const t=q('.cxtb.on',tabsEl),n=q('.cxnm',tabsEl);if(t)t.classList.toggle('dirty',dirty(cur));if(n)n.classList.toggle('d',dirty(cur))}
 function miniView(){if(!cur||cur.special||!SET.mini)return;const H=mm.clientHeight,tot=ta.scrollHeight||1,h=Math.min(H,mmH||H);mmv.style.top=(ta.scrollTop/tot*h)+'px';mmv.style.height=Math.max(12,ta.clientHeight/tot*h)+'px'}
 let mmH=0;
 function paintMini(){if(!SET.mini||!cur||cur.special||!mm.offsetWidth)return;const W=mm.clientWidth,H=mm.clientHeight;if(!W||!H)return;mmc.width=W;mmc.height=H;const g=mmc.getContext('2d'),ls2=ta.value.split('\n'),lh=Math.max(1,Math.min(3,H/Math.max(1,ls2.length))),max=Math.min(ls2.length,Math.floor(H/lh),4000);
  g.fillStyle=cw.style.getPropertyValue('--fg')||'#ccc';g.globalAlpha=.42;for(let i=0;i<max;i++){const re=/\S+/g;let m;const l=ls2[i];while((m=re.exec(l))&&m.index<W/.8)g.fillRect(4+m.index*.8,i*lh,Math.min(m[0].length*.8,W-8-m.index*.8),Math.max(1,lh-.7))}
  mmH=max*lh;miniView()}
 function reveal(p){const line=ta.value.slice(0,p).split('\n').length-1,lh=parseFloat(getComputedStyle(ta).lineHeight)||20,top=line*lh+8;if(top<ta.scrollTop+lh||top>ta.scrollTop+ta.clientHeight-2*lh)ta.scrollTop=Math.max(0,top-ta.clientHeight/2)}
 const mmGo=e=>{const r=mm.getBoundingClientRect(),y=Math.max(0,Math.min(1,(e.clientY-r.top)/(mmH||r.height)));ta.scrollTop=y*ta.scrollHeight-ta.clientHeight/2};
 let mmd=0;mm.addEventListener('pointerdown',e=>{mmd=e.pointerId;e.preventDefault();mmGo(e)});
 const gp=(ev,fn)=>addEventListener(ev,x=>{fn(x)},true);
 gp('pointermove',e=>{if(mmd&&e.pointerId===mmd)mmGo(e)});gp('pointerup',e=>{if(e.pointerId===mmd)mmd=0});

 /* tabs */
 function stash(){if(cur&&!cur.special){cur.text=ta.value;cur.st=ta.scrollTop;cur.sl=ta.scrollLeft;cur.ss=ta.selectionStart;cur.se=ta.selectionEnd}}
 function newTab(o){const t=Object.assign({id:++tid,name:'untitled',path:null,text:'',saved:'',lang:'txt',st:0,sl:0,ss:0,se:0},o);if(!t.special)t.lang=langOf(t.name);tabs.push(t);return t}
 function activate(t){stash();cur=t||null;dropSug();setEl.hidden=true;
  if(!cur){showWelcome();renderTabs();title();return}
  if(cur.special==='settings'){drawSettings();setEl.hidden=false;renderTabs();title();return}
  ta.value=cur.text;nLines=0;render();ta.scrollTop=cur.st;ta.scrollLeft=cur.sl;try{ta.setSelectionRange(cur.ss,cur.se)}catch(e){}syncScroll();
  if(!proj&&cur.path)w.path=cur.path;renderTabs();drawTreeSel();title();const t0=cur;if(!matchMedia('(pointer:coarse)').matches)setTimeout(()=>{if(cur===t0&&!palEl&&setEl.hidden&&!q('.cxmd',cw))ta.focus()},30)}
 const actions=()=>'<div class="cxta"><button data-a="run" title="Run (F5)">'+ico(running?IC.stop:IC.play)+'</button><button data-a="save" title="Save (Ctrl+S)">'+ico(IC.save)+'</button><button data-a="panel" title="Output panel (Ctrl+J)">'+ico(IC.panel)+'</button><button data-a="pal" title="Command palette (Ctrl+Shift+P)">'+ico(IC.term)+'</button>'+(proj?'':'<button data-a="settings" title="Settings">'+ico(IC.gear)+'</button>')+'</div>';
 function renderTabs(){if(!proj){tabsEl.innerHTML=(cur&&!cur.special?'<span class="cxnm'+(dirty(cur)?' d':'')+'">'+E(cur.name)+'</span>':'<span class="cxnm">Settings</span>')+'<span class="fl"></span>'+actions();return}
  tabsEl.innerHTML='<div class="cxtl">'+tabs.map(t=>'<div class="cxtb'+(t===cur?' on':'')+(dirty(t)?' dirty':'')+'" data-t="'+t.id+'" title="'+E(t.path||t.name)+'"><i class="ic">'+(t.special?ico(IC.gear):fileIcon(t.name))+'</i><span>'+E(t.name)+'</span><i class="x" data-x="'+t.id+'"></i></div>').join('')+'</div>'+actions();
  const on=q('.cxtb.on',tabsEl);if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest',inline:'nearest'})}
 function showWelcome(){setEl.hidden=false;setEl.innerHTML='<h2>NexOS Code</h2><p style="color:var(--dim);line-height:1.7">Open a file from the Explorer, or press <b>Ctrl+Shift+P</b> for the command palette, <b>Ctrl+P</b> to open a file by name, <b>F5</b> to run.</p><button class="pri" data-a="newtab">New file</button><button class="pri" data-a="openfolder">Open folder</button><button class="pri" data-a="pal">Command palette</button>'}
 async function closeTab(t,force){if(!t)return;if(!force&&dirty(t)){const r=await choose('Do you want to save the changes to '+t.name+'?',[['Save',1],['Don\'t save',0],['Cancel',0]]);if(r<0||r===2)return;if(r===0&&!(await save(t)))return}
  const i=tabs.indexOf(t);tabs.splice(i,1);if(t===cur){cur=null;const n=tabs[Math.min(i,tabs.length-1)];if(!proj&&!n){closeW(w.id);return}activate(n)}else renderTabs()}
 function newUntitled(){const t=newTab({name:'untitled-'+(++untitled)+'.js'});activate(t);ta.focus()}
 async function openFile(p){if(BINX.has(ext(p))){toast('Binary file: '+base(p)+' cannot be edited here');return}const ex=tabs.find(t=>t.path===p);if(ex){activate(ex);return}
  if(!HAS){toast('Opening files needs the Android app');return}
  try{const r=await NF.readText({path:p});const t=newTab({path:p,name:base(p),text:r.text,saved:r.text});activate(t)}catch(e){toast(msg(e))}}
 async function home(){try{return((await NF.roots()).roots[0]||{}).path+'/Documents'}catch(e){return '/storage/emulated/0/Documents'}}
 async function save(t,as,quiet){t=t||cur;if(!t||t.special)return false;if(t===cur)t.text=ta.value;if(!HAS){toast('Saving needs the Android app');return false}
  if(!t.path||as){const d=t.path||((root||await home())+'/'+t.name),p=await ask('Save as (full path)',d);if(!p||!p.trim())return false;t.path=p.trim();t.name=base(t.path);t.lang=langOf(t.name)}
  try{await NF.writeText({path:t.path,text:t.text});t.saved=t.text;if(t===cur){if(!proj)w.path=t.path;render()}renderTabs();if(!quiet)toast('Saved '+t.name);if(proj&&root&&dirOf(t.path)===root)refreshDir(root);return true}catch(e){toast(msg(e));return false}}

 /* explorer */
 async function loadDir(p,force){if(!force&&kids.has(p))return kids.get(p);if(!HAS)return[];
  try{const r=await NF.list({path:p}),it=(r.items||[]).filter(x=>x.name!=='.AuroraTrash').sort((a,b)=>(b.isDirectory?1:0)-(a.isDirectory?1:0)||a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));kids.set(p,it);return it}catch(e){kids.set(p,[]);toast(msg(e));return[]}}
 const rowH=(x,d)=>{const isd=x.isDirectory,o=open.has(x.path);return '<div class="cxr'+(sel===x.path?' sel':'')+(cur&&cur.path===x.path?' act':'')+'" data-p="'+E(x.path)+'" data-d="'+(isd?1:0)+'" style="--d:'+d+'">'+(isd?CHEV(o):'<i class="sp"></i>')+'<i class="ic">'+(isd?folderIcon(x.name,o):fileIcon(x.name))+'</i><span>'+E(x.name)+'</span></div>'};
 function rowsOf(p,d,out){const it=kids.get(p);if(!it)return;for(const x of it){out.push(rowH(x,d));if(x.isDirectory&&open.has(x.path))rowsOf(x.path,d+1,out)}}
 function drawTree(){const t=q('.cxtree',sv);if(!t)return;if(!root){t.innerHTML='<div class="cxempty">'+(HAS?'No folder opened.':'File access needs the Android app.')+'<br><button data-a="openfolder">Open folder</button></div>';return}
  const out=['<div class="cxr root'+(sel===root?' sel':'')+'" data-p="'+E(root)+'" data-d="1" data-root="1" style="--d:0">'+CHEV(rootOpen)+'<span>'+E(base(root)||root)+'</span></div>'];if(rootOpen)rowsOf(root,1,out);
  if(rootOpen&&kids.has(root)&&!kids.get(root).length)out.push('<div class="cxempty">This folder is empty.</div>');t.innerHTML=out.join('')}
 const drawTreeSel=()=>{if(proj&&view==='explorer'&&sideOn)drawTree()};
 async function refreshDir(p){if(p===root||open.has(p)){await loadDir(p,true);drawTreeSel()}}
 async function refreshAll(){if(!root)return;await loadDir(root,true);for(const p of Array.from(open))await loadDir(p,true);drawTreeSel()}
 async function openRoot(p){if(!p)return;p=p.trim().replace(/\/+$/,'')||'/';if(HAS){try{await NF.list({path:p})}catch(e){toast('Cannot open folder: '+msg(e));return}}root=p;ls('aur.cproj',p);kids.clear();open.clear();sel='';rootOpen=true;await loadDir(root);view='explorer';sideOn=true;drawSide();title()}
 const targetDir=()=>{if(!sel)return root;const it=findItem(sel);return it&&it.isDirectory?sel:(sel===root?root:dirOf(sel))};
 function findItem(p){for(const [d,it] of kids){const x=it.find(y=>y.path===p);if(x)return x}return null}
 async function newEntry(isDir,parent){if(!root){toast('Open a folder first');return}parent=parent||targetDir();const n=await ask(isDir?'New folder name':'New file name','');if(!n)return;const nm=n.trim();if(!nm||/[\/\\]/.test(nm)){toast('Invalid name');return}
  const it=await loadDir(parent,true);if(it.some(x=>x.name===nm)){toast(nm+' already exists');return}
  try{if(isDir)await NF.mkdir({path:parent,name:nm});else await NF.writeText({path:parent+'/'+nm,text:''});if(parent===root)rootOpen=true;else open.add(parent);await loadDir(parent,true);sel=parent+'/'+nm;drawTreeSel();if(!isDir)openFile(sel)}catch(e){toast(msg(e))}}
 async function renameEntry(p){if(!p||p===root)return;const n=await ask('Rename',base(p));if(!n||n.trim()===base(p))return;const nm=n.trim();if(/[\/\\]/.test(nm)){toast('Invalid name');return}
  try{await NF.rename({path:p,name:nm});const np=dirOf(p)+'/'+nm;tabs.forEach(t=>{if(t.path&&(t.path===p||t.path.startsWith(p+'/'))){t.path=np+t.path.slice(p.length);t.name=base(t.path);t.lang=langOf(t.name)}});
   Array.from(open).forEach(o=>{if(o===p||o.startsWith(p+'/')){open.delete(o);open.add(np+o.slice(p.length))}});sel=np;await loadDir(dirOf(p),true);for(const o of Array.from(kids.keys()))if(o===p||o.startsWith(p+'/'))kids.delete(o);
   for(const o of Array.from(open))if(!kids.has(o))await loadDir(o,true);drawTreeSel();renderTabs();title()}catch(e){toast(msg(e))}}
 async function deleteEntry(p){if(!p||p===root)return;const r=await choose('Delete "'+base(p)+'"? This cannot be undone.',[['Cancel',0],['Delete',1]]);if(r!==1)return;
  try{try{await NF.remove({path:p})}catch(e1){await NF.remove({paths:[p]})}
   for(const t of tabs.filter(t=>t.path&&(t.path===p||t.path.startsWith(p+'/'))))await closeTab(t,true);open.delete(p);for(const o of Array.from(kids.keys()))if(o===p||o.startsWith(p+'/'))kids.delete(o);if(sel===p)sel='';await loadDir(dirOf(p),true);drawTreeSel();toast('Deleted '+base(p))}catch(e){toast(msg(e))}}
 const copyText=t=>{try{navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>toast(t))}catch(e){toast(t)}};
 function treeMenu(x,y,p,isDir){const it=[];if(p){if(!isDir)it.push(['Open',()=>openFile(p)]);if(isDir){it.push(['New file',()=>newEntry(false,p)],['New folder',()=>newEntry(true,p)],null)}
   if(p!==root)it.push(['Rename',()=>renameEntry(p)],['Delete',()=>deleteEntry(p)],null);it.push(['Copy path',()=>copyText(p)])}
  else it.push(['New file',()=>newEntry(false,root)],['New folder',()=>newEntry(true,root)]);it.push(null,['Refresh',()=>refreshAll()],['Collapse all',()=>{open.clear();rootOpen=true;drawTree()}],['Open folder…',()=>ACT.openfolder()]);ctx(x,y,it)}
 function bindTree(){const t=q('.cxtree',sv);if(!t)return;let lt=0,sx=0,sy=0;
  t.addEventListener('click',async e=>{if(lp){lp=0;return}const r=e.target.closest('.cxr');if(!r)return;const p=r.dataset.p,isd=r.dataset.d==='1';sel=p;
   if(isd){if(r.dataset.root)rootOpen=!rootOpen;else if(open.has(p))open.delete(p);else{open.add(p);await loadDir(p)}drawTree()}else{drawTree();openFile(p)}});
  t.addEventListener('contextmenu',e=>{e.preventDefault();const r=e.target.closest('.cxr');if(r){sel=r.dataset.p;drawTree()}treeMenu(e.clientX,e.clientY,r?r.dataset.p:'',r?r.dataset.d==='1':false)});
  t.addEventListener('pointerdown',e=>{lp=0;sx=e.clientX;sy=e.clientY;clearTimeout(lt);const r=e.target.closest('.cxr'),cx=e.clientX,cy=e.clientY;if(e.pointerType==='mouse'&&e.button!==0)return;lt=setTimeout(()=>{lp=1;if(r){sel=r.dataset.p}treeMenu(cx,cy,r?r.dataset.p:'',r?r.dataset.d==='1':false)},520)});
  const cl=e=>{if(Math.abs((e.clientX||0)-sx)>8||Math.abs((e.clientY||0)-sy)>8||e.type!=='pointermove')clearTimeout(lt)};['pointerup','pointercancel','pointermove','scroll'].forEach(n=>t.addEventListener(n,cl))}

 /* sidebar views */
 function drawSide(){if(!proj)return;side.hidden=!sideOn;qa('.cxab',B).forEach(b=>b.classList.toggle('on',sideOn&&b.dataset.v===view));if(!proj||!sideOn)return;
  if(view==='explorer'){sv.innerHTML='<div class="cxsh"><b>Explorer</b><button data-a="nf" title="New file">'+ico(IC.newf)+'</button><button data-a="nd" title="New folder">'+ico(IC.newd)+'</button><button data-a="rn" title="Rename">'+ico(IC.pen)+'</button><button data-a="del" title="Delete">'+ico(IC.trash)+'</button><button data-a="rf" title="Refresh">'+ico(IC.refresh)+'</button><button data-a="ca" title="Collapse all">'+ico(IC.collapse)+'</button></div><div class="cxtree"></div>';bindTree();drawTree()}
  else if(view==='ext')drawExt();else drawAI()}
 function drawExt(qs){const f=(qs||'').toLowerCase(),list=allP().filter(p=>!f||(p.name+' '+p.type+' '+p.desc).toLowerCase().includes(f)),ins2=list.filter(p=>isInst(p.id)),av=list.filter(p=>!isInst(p.id)),colr={theme:'#8e44ad',language:'#2e8b57',formatter:'#d2691e',snippets:'#2f6fdb'};
  const card=p=>'<div class="cxcard"><div class="bd" style="background:'+colr[p.type]+'">'+E(p.name[0])+'</div><div class="bi"><b>'+E(p.name)+'</b><small>'+E(p.type)+' &middot; '+E(p.by)+'<br>'+E(p.desc)+'</small>'+(isInst(p.id)?(p.type==='theme'?'<button data-pa="apply" data-id="'+p.id+'">'+(SET.theme===p.id?'Applied':'Apply')+'</button>':'')+'<button class="g" data-pa="rm" data-id="'+p.id+'">Uninstall</button>':'<button data-pa="add" data-id="'+p.id+'">Install</button>')+'</div></div>';
  sv.innerHTML='<div class="cxsh"><b>Extensions</b><button data-pa="custom" title="Add custom plugin (JSON)">'+ico(IC.newf)+'</button></div><input class="cxsr" placeholder="Search extensions" value="'+E(qs||'')+'"><div class="cxtree">'+(ins2.length?'<div class="cxsec">Installed ('+ins2.length+')</div>'+ins2.map(card).join(''):'')+(av.length?'<div class="cxsec">Available ('+av.length+')</div>'+av.map(card).join(''):'')+(!list.length?'<div class="cxempty">No extensions found.</div>':'')+'</div>';
  const si=q('.cxsr',sv);si.addEventListener('input',()=>{drawExt(si.value);const n=q('.cxsr',sv);n.focus();n.setSelectionRange(n.value.length,n.value.length)});
  sv.onclick=e=>{const b=e.target.closest('[data-pa]');if(!b)return;const k=b.dataset.pa,id=b.dataset.id;
   if(k==='add'){plugInstall(id);const p=allP().find(x=>x.id===id);if(p&&p.type==='theme'){SET.theme=id;saveSet()}toast('Installed '+(p?p.name:id))}
   else if(k==='rm'){plugRemove(id);saveSet();toast('Uninstalled')}else if(k==='apply'){SET.theme=id;saveSet();drawExt(q('.cxsr',sv).value)}else if(k==='custom')customPlugin()}}
 function customPlugin(){modal('<h4>Add custom plugin</h4><p style="color:var(--dim)">Paste a JSON manifest. Types: theme (t), language (lang), snippets (snips), formatter (fmt). Plugins are data only and never run code.</p><textarea class="ta2" spellcheck="false">{\n  "id": "my-theme",\n  "name": "My Theme",\n  "type": "theme",\n  "desc": "Custom colours",\n  "t": {"bg":"#101820","fg":"#e6edf3","kw":"#ff7b72","str":"#a5d6ff"}\n}</textarea><div class="mb"><button data-m="0">Cancel</button><button data-m="1" class="pri">Install</button></div>',(o,close)=>{o.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;if(b.dataset.m==='0'){close();return}try{plugAdd(q('textarea',o).value);close();toast('Plugin installed');drawExt()}catch(x){toast(msg(x))}})})}

 /* settings page */
 function drawSettings(){const th=activeP('theme'),opts=[['auto','Follow NexOS theme'],['dark','Dark+'],['light','Light+']].concat(th.map(p=>[p.id,p.name]));
  setEl.innerHTML='<h2>Settings</h2><h3>Appearance</h3>'+
  '<label><span>Color theme<small>More themes: Extensions panel</small></span><select data-s="theme">'+opts.map(o=>'<option value="'+E(o[0])+'"'+(SET.theme===o[0]?' selected':'')+'>'+E(o[1])+'</option>').join('')+'</select></label>'+
  '<label><span>Font family<small>Any font installed on the device</small></span><input type="text" data-s="font" value="'+E(SET.font)+'" placeholder="monospace"></label>'+
  '<label><span>Font size</span><input type="number" min="9" max="32" data-s="fs" value="'+SET.fs+'"></label>'+
  '<label><span>Tab size</span><select data-s="tab">'+[2,4,8].map(n=>'<option'+(SET.tab===n?' selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
  '<label><span>Minimap</span><input type="checkbox" data-s="mini"'+(SET.mini?' checked':'')+'></label><label><span>Line numbers</span><input type="checkbox" data-s="ln"'+(SET.ln?' checked':'')+'></label>'+
  '<h3>Files</h3><label><span>Auto save</span><select data-s="auto"><option value="off"'+(SET.auto==='off'?' selected':'')+'>Off</option><option value="delay"'+(SET.auto==='delay'?' selected':'')+'>After 1 second</option><option value="blur"'+(SET.auto==='blur'?' selected':'')+'>When focus leaves the editor</option></select></label>'+
  '<h3>AI assistant</h3><label><span>Provider<small>Custom = any OpenAI-compatible server (OpenRouter, Groq, Ollama...)</small></span><select data-ai="prov">'+[['anthropic','Anthropic (Claude)'],['openai','OpenAI'],['gemini','Google Gemini'],['custom','Custom (OpenAI-compatible)']].map(o=>'<option value="'+o[0]+'"'+(AI.prov===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></label>'+
  '<label><span>API key<small>Stored only on this device (plain text)</small></span><input type="password" data-ai="key" value="'+E(AI.key)+'" autocomplete="off"></label><label><span>Model<small>Empty = provider default</small></span><input type="text" data-ai="model" value="'+E(AI.model)+'"></label>'+
  (AI.prov==='custom'?'<label><span>Base URL<small>e.g. https://openrouter.ai/api/v1</small></span><input type="text" data-ai="url" value="'+E(AI.url)+'"></label>':'')}
 setEl.addEventListener('change',e=>{const s=e.target.dataset.s,a=e.target.dataset.ai;if(s){let v=e.target.type==='checkbox'?(e.target.checked?1:0):e.target.value;if(s==='fs')v=Math.max(9,Math.min(32,+v||13));if(s==='tab')v=+v;SET[s]=v;saveSet()}
  else if(a){AI[a]=e.target.value;jset('aur.cai',AI);if(a==='prov')drawSettings()}});

 /* find / replace */
 function openFind(rep){if(!cur||cur.special)return;findOn=true;findEl.hidden=false;ri.hidden=!rep;q('[data-f=rep]',B).hidden=!rep;q('[data-f=all]',B).hidden=!rep;const s=ta.value.slice(ta.selectionStart,ta.selectionEnd);if(s&&!s.includes('\n'))fi.value=s;fi.focus();fi.select();marks();fcount()}
 function closeFind(){findOn=false;findEl.hidden=true;marks();ta.focus()}
 function fcount(){const r=findAll(),a=ta.selectionStart,i=r.findIndex(x=>x[0]===a);q('.fc',B).textContent=fi.value?(r.length?(i>=0?(i+1)+' of ':'')+r.length:'No results'):''}
 function findStep(dir){const r=findAll();if(!r.length){fcount();return}let m;if(dir>0)m=r.find(x=>x[0]>=ta.selectionEnd)||r[0];else{m=null;for(const x of r)if(x[1]<=ta.selectionStart)m=x;m=m||r[r.length-1]}
  ta.focus();ta.setSelectionRange(m[0],m[1]);reveal(m[0]);marks();fcount()}
 function repOne(){const r=findAll(),a=ta.selectionStart,b=ta.selectionEnd;if(r.some(x=>x[0]===a&&x[1]===b)){let t=ri.value;if(fRe){try{t=ta.value.slice(a,b).replace(new RegExp(fi.value,fCase?'':'i'),ri.value)}catch(e){}}ins(t,a,b)}findStep(1)}
 function repAll(){if(!fi.value)return;let re;try{re=new RegExp(fRe?fi.value:fi.value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'+(fCase?'':'i'))}catch(e){toast('Invalid regex');return}
  const v=ta.value,n=(v.match(re)||[]).length;if(!n){fcount();return}const nv=fRe?v.replace(re,ri.value):v.replace(re,()=>ri.value);ta.focus();ta.select();ins(nv,0,v.length);toast(n+' replaced')}
 findEl.addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;const k=b.dataset.f;if(k==='case'){fCase=!fCase;b.classList.toggle('on',fCase);marks();fcount()}else if(k==='re'){fRe=!fRe;b.classList.toggle('on',fRe);marks();fcount()}
  else if(k==='next')findStep(1);else if(k==='prev')findStep(-1);else if(k==='x')closeFind();else if(k==='rep')repOne();else if(k==='all')repAll()});
 fi.addEventListener('input',()=>{marks();fcount()});fi.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findStep(e.shiftKey?-1:1)}else if(e.key==='Escape')closeFind()});ri.addEventListener('keydown',e=>{if(e.key==='Enter')repOne();else if(e.key==='Escape')closeFind()});

 /* editing helpers */
 function toggleComment(){if(!cur||cur.special)return;const L=allLangs()[cur.lang]||{},cm=L.cm;if(!cm){toast('No comment syntax for this language');return}const v=ta.value,s=ta.selectionStart,e=ta.selectionEnd,a=v.lastIndexOf('\n',s-1)+1;let b=v.indexOf('\n',e>s?e-1:e);if(b<0)b=v.length;
  const lines=v.slice(a,b).split('\n'),wrap=cm==='/*'?['/* ',' */']:cm==='<'?['\x3c!-- ',' --\x3e']:[cm+' ',''],ne=lines.filter(l=>l.trim());
  const all=ne.length&&ne.every(l=>l.trim().startsWith(wrap[0].trim())),min=Math.min.apply(null,ne.map(l=>l.match(/^\s*/)[0].length).concat([999]));
  const res=lines.map(l=>{if(!l.trim())return l;if(all){const i=l.indexOf(wrap[0].trim()),rest=l.slice(i+wrap[0].trim().length).replace(/^ /,'');return l.slice(0,i)+(wrap[1]?rest.replace(new RegExp('\\s?'+wrap[1].trim().replace(/[*\/]/g,'\\$&')+'\\s*$'),''):rest)}return l.slice(0,min)+wrap[0]+l.slice(min)+wrap[1]}).join('\n');
  ins(res,a,b);ta.setSelectionRange(a,a+res.length)}
 function indentSel(out){const v=ta.value,s=ta.selectionStart,e=ta.selectionEnd,a=v.lastIndexOf('\n',s-1)+1;let b=v.indexOf('\n',e>s?e-1:e);if(b<0)b=v.length;
  const res=v.slice(a,b).split('\n').map(l=>out?l.replace(new RegExp('^( {1,'+SET.tab+'}|\\t)'),''):tabStr()+l).join('\n');ins(res,a,b);ta.setSelectionRange(a,a+res.length)}
 function moveLine(dn){const v=ta.value,s=ta.selectionStart,e=ta.selectionEnd,a=v.lastIndexOf('\n',s-1)+1;let b=v.indexOf('\n',e>s?e-1:e);if(b<0)b=v.length;const blk=v.slice(a,b);
  if(dn){if(b>=v.length)return;let c=v.indexOf('\n',b+1);if(c<0)c=v.length;const nx=v.slice(b+1,c);ins(nx+'\n'+blk,a,c);ta.setSelectionRange(a+nx.length+1,a+nx.length+1+blk.length)}
  else{if(a===0)return;const pa=v.lastIndexOf('\n',a-2)+1,pv=v.slice(pa,a-1);ins(blk+'\n'+pv,pa,b);ta.setSelectionRange(pa,pa+blk.length)}}
 function newline(){const v=ta.value,s=ta.selectionStart,e=ta.selectionEnd,l0=v.lastIndexOf('\n',s-1)+1,line=v.slice(l0,s),ind=line.match(/^\s*/)[0],prev=line.trimEnd().slice(-1),nx=v[e];let extra='';
  if('{(['.includes(prev)||(cur.lang==='py'&&prev===':'))extra=tabStr();
  if(extra&&nx&&'})]'.includes(nx)&&'{(['.includes(prev)){ins('\n'+ind+extra+'\n'+ind,s,e);const p=s+1+ind.length+extra.length;ta.setSelectionRange(p,p)}else ins('\n'+ind+(prev&&extra?extra:''),s,e)}
 function expandSnippet(){const s=ta.selectionStart;if(s!==ta.selectionEnd)return false;const v=ta.value,l0=v.lastIndexOf('\n',s-1)+1,m=/[\w!.-]+$/.exec(v.slice(l0,s));if(!m)return false;
  const sn=activeP('snippets').reduce((a,p)=>a.concat(p.snips||[]),[]).find(x=>x.l===cur.lang&&x.p===m[0]);if(!sn)return false;const ind=v.slice(l0,s).match(/^\s*/)[0],r=snipParse(sn.b,ind),a=s-m[0].length;ins(r.text,a,s);ta.setSelectionRange(a+r.pos,a+r.pos);return true}
 const PAIR={'(':')','[':']','{':'}','"':'"',"'":"'",'`':'`'};
 ta.addEventListener('beforeinput',e=>{if(!cur||cur.special)return;const v=ta.value,s=ta.selectionStart,en=ta.selectionEnd;
  if(e.inputType==='insertLineBreak'||e.inputType==='insertParagraph'){e.preventDefault();newline();return}
  if(e.inputType==='insertText'&&e.data&&e.data.length===1&&!e.isComposing){const c=e.data;
   if(s===en&&')]}"\'`'.includes(c)&&v[s]===c&&!(c.match(/["'`]/)&&/\w/.test(v[s-1]||''))){e.preventDefault();ta.setSelectionRange(s+1,s+1);return}
   if(PAIR[c]){if(s!==en){e.preventDefault();const t=v.slice(s,en);ins(c+t+PAIR[c],s,en);ta.setSelectionRange(s+1,s+1+t.length);return}
    if(/["'`]/.test(c)&&(/\w/.test(v[s-1]||'')||(v[s]&&/\w/.test(v[s]))))return;if(v[s]&&/[\w]/.test(v[s]))return;e.preventDefault();ins(c+PAIR[c],s,en);ta.setSelectionRange(s+1,s+1)}}});
 ta.addEventListener('input',()=>{if(cur){cur.text=ta.value}dropSug();sched();clearTimeout(saveT);if(SET.auto==='delay'&&cur&&cur.path){const t=cur;saveT=setTimeout(()=>{if(dirty(t))save(t,0,1)},1000)}});
 ta.addEventListener('blur',()=>{if(SET.auto==='blur'&&cur&&cur.path&&dirty(cur))save(cur,0,1)});
 ['keyup','click','focus'].forEach(n=>ta.addEventListener(n,()=>{stat();marks()}));ta.addEventListener('scroll',syncScroll);
 ta.addEventListener('keydown',e=>{if(!cur||cur.special)return;const c=e.ctrlKey||e.metaKey,k=e.key,kl=k.length===1?k.toLowerCase():k;
  if(sug&&k==='Tab'){e.preventDefault();acceptSug();return}if(sug&&k==='Escape'){dropSug();return}
  if(k==='F5'||(c&&k==='Enter')){e.preventDefault();ACT.run();return}
  if(c&&e.shiftKey&&kl==='p'||k==='F1'){e.preventDefault();palette('>');return}
  if(c&&!e.shiftKey&&kl==='p'){e.preventDefault();palette('');return}
  if(c&&kl==='s'){e.preventDefault();save(cur,e.shiftKey);return}
  if(c&&kl==='f'){e.preventDefault();openFind(false);return}if(c&&kl==='h'){e.preventDefault();openFind(true);return}
  if(c&&k==='/'){e.preventDefault();toggleComment();return}if(c&&kl==='j'){e.preventDefault();ACT.panel();return}if(c&&kl==='b'&&proj){e.preventDefault();ACT.side();return}
  if(c&&k===' '||(e.altKey&&k==='\\')){e.preventDefault();aiComplete();return}
  if(e.altKey&&e.shiftKey&&kl==='f'){e.preventDefault();formatDoc();return}
  if(e.altKey&&(k==='ArrowUp'||k==='ArrowDown')){e.preventDefault();moveLine(k==='ArrowDown');return}
  if(k==='Tab'){e.preventDefault();if(e.shiftKey)indentSel(true);else if(ta.value.slice(ta.selectionStart,ta.selectionEnd).includes('\n'))indentSel(false);else if(!expandSnippet())ins(tabStr(),ta.selectionStart,ta.selectionEnd)}});

 /* output panel + run */
 function showPanel(t){panel.hidden=false;ptabSet(t||ptab)}
 function ptabSet(t){ptab=t;qa('[data-pt]',panel).forEach(b=>b.classList.toggle('on',b.dataset.pt===t));pout.hidden=t!=='out';ppv.hidden=t!=='pv'}
 function out(m,c){const d=document.createElement('div');d.className='ln '+(c||'');d.textContent=m;pout.appendChild(d);while(pout.childNodes.length>2000)pout.removeChild(pout.firstChild);pout.scrollTop=pout.scrollHeight}
 function setRunning(v){running=v;const b=q('[data-a=run]',tabsEl);if(b)b.innerHTML=ico(v?IC.stop:IC.play)}
 function stopRun(silent){if(wk){if(wk===pyw)pyw=null;wk.terminate();wk=null}if(running&&!silent)out('Stopped.','m');setRunning(false)}
 function workerRun(src,t,keep){const t0=Date.now();let w2;if(keep&&pyw)w2=pyw;else{w2=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));if(keep)pyw=w2}wk=w2;setRunning(true);
  w2.onmessage=ev=>{const d=ev.data;if(d.t==='l')out(d.m);else if(d.t==='w')out(d.m,'w');else if(d.t==='e')out(d.m,'e');else if(d.t==='i')out(d.m,'m');else if(d.t==='done'){out((d.err?'Finished with errors':'Finished')+' in '+(Date.now()-t0)+' ms','m');if(!keep){w2.terminate()}wk=null;setRunning(false)}};
  w2.onerror=e=>{out((e&&e.message)||'Could not start the runtime (internet needed for TypeScript / Python).','e');if(keep)pyw=null;wk=null;setRunning(false)};w2.postMessage({code:t.text,lang:t.lang})}
 async function inlineLocal(html,bd){if(!HAS||!bd)return html;const re=/<link[^>]+href=["']([^"':]+\.css)["'][^>]*>|<script[^>]+src=["']([^"':]+\.js)["'][^>]*>\s*<\/script>/gi,hits=[];let m;while((m=re.exec(html)))hits.push([m[0],m[1]||m[2],!!m[1]]);
  for(const h of hits){try{const r=await NF.readText({path:bd+'/'+h[1].replace(/^\.\//,'')});html=html.replace(h[0],()=>h[2]?'<style>'+r.text+'</style>':'\x3cscript>'+r.text+'\x3c/script>')}catch(e){out('Could not load '+h[1],'w')}}return html}
 function preview(doc){ppv.innerHTML='';const f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-popups');f.srcdoc=/<head[^>]*>/i.test(doc)?doc.replace(/<head[^>]*>/i,m=>m+HOOK):HOOK+doc;ppv.appendChild(f);showPanel('pv')}
 window.addEventListener('message',e=>{const d=e.data;if(d&&d.nx==='cx'&&B.isConnected){const f=q('iframe',ppv);if(f&&e.source===f.contentWindow)out(d.m,d.k==='error'?'e':d.k==='warn'?'w':'')}});
 async function runCode(){const t=cur;if(!t||t.special)return;if(running){stopRun();return}t.text=ta.value;const L=t.lang,x=ext(t.name);pout.innerHTML='';showPanel('out');
  if(t.path&&dirty(t))await save(t,0,1);out('> '+t.name,'m');
  if(L==='js'||L==='ts')workerRun(WJS,t,0);
  else if(L==='py')workerRun(WPY,t,1);
  else if(L==='html'&&x!=='xml'&&x!=='svg'){preview(await inlineLocal(t.text,t.path?dirOf(t.path):''));out('Opened preview. console output appears here.','m')}
  else if(x==='svg'){preview('<body style="margin:0;display:grid;place-items:center;min-height:100vh">'+t.text+'</body>')}
  else if(L==='css'){preview('<style>'+t.text+'</style><h1>Heading</h1><h2>Subheading</h2><p>Paragraph with <a href="#">a link</a> and <b>bold</b> text.</p><button>Button</button> <input placeholder="Input"><ul><li>One</li><li>Two</li></ul>');out('Previewing CSS on a sample page.','m')}
  else if(L==='md'){preview('<style>'+PREV_CSS+'</style>'+mdHtml(t.text))}
  else if(L==='json'){try{const j=JSON.parse(t.text);out('Valid JSON ('+(Array.isArray(j)?j.length+' items':typeof j==='object'&&j?Object.keys(j).length+' keys':typeof j)+'). Use Format Document to prettify.','ok')}catch(e){out(msg(e),'e')}}
  else if(L==='bat'){if(!t.path){out('Save the file first.','e');return}openApp('term',{bat:t.path})}
  else out('Run is not available for '+((allLangs()[L]||{}).n||'this file type')+'. Supported: JavaScript, TypeScript, Python (install the Python extension), HTML, CSS, SVG, Markdown, JSON, Batch.','w')}
 function formatDoc(){if(!cur||cur.special)return;const f=activeP('formatter').find(p=>p.fmt.l.includes(cur.lang));if(!f){toast('No formatter for '+((allLangs()[cur.lang]||{}).n||'this file')+'. Install one in Extensions.');return}
  try{const v=ta.value,r=FMT[f.fmt.k](v,SET.tab);if(r!==v){const s=ta.selectionStart;ins(r,0,v.length);ta.setSelectionRange(Math.min(s,r.length),Math.min(s,r.length))}toast('Formatted')}catch(e){toast('Format failed: '+msg(e))}}

 /* resizing: output panel (top edge) and sidebar */
 let sideDrag=0;
 function dragger(el,cls,onmove,onend){let id=0,st=null;el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();id=e.pointerId;st={x:e.clientX,y:e.clientY};el.classList.add('on');cw.classList.add('cxdrag');sideDrag=1});
  gp('pointermove',e=>{if(id&&e.pointerId===id)onmove(e,st)});const end=e=>{if(id&&e.pointerId===id){id=0;el.classList.remove('on');cw.classList.remove('cxdrag');sideDrag=0;onend&&onend()}};gp('pointerup',end);gp('pointercancel',end)}
 let ph0=0;dragger(q('.cxh',B),'',(e,st)=>{if(!ph0)ph0=panel.offsetHeight;const mx=Math.max(100,col.clientHeight-120);cw.style.setProperty('--ph',Math.max(80,Math.min(mx,ph0+(st.y-e.clientY)))+'px')},()=>{ph0=0;ls('aur.cph',String(panel.offsetHeight))});
 if(+ls('aur.cph'))cw.style.setProperty('--ph',Math.max(80,+ls('aur.cph'))+'px');
 if(proj){let sw0=0;dragger(q('.cxv',B),'',(e,st)=>{if(!sw0)sw0=side.offsetWidth;cw.style.setProperty('--sw',Math.max(140,Math.min(Math.max(160,col.parentNode.clientWidth-200),sw0+(e.clientX-st.x)))+'px')},()=>{sw0=0;ls('aur.csw',String(side.offsetWidth))});if(+ls('aur.csw'))cw.style.setProperty('--sw',Math.max(140,+ls('aur.csw'))+'px')}
 try{new ResizeObserver(()=>{cw.classList.toggle('narrow',B.clientWidth<480);paintMini()}).observe(B)}catch(e){}

 /* palette */
 function palette(init,items,ph){closePal();const o=document.createElement('div');o.className='cxov';o.innerHTML='<div class="cxpal"><input placeholder="'+E(ph||'Type > for commands, or a file name')+'"><div class="cxpl"></div></div>';cw.appendChild(o);palEl=o;const inp=q('input',o),pl=q('.cxpl',o);let list=[],on=0;inp.value=init||'';
  const fuzzy=(arr,s)=>{const t=s.toLowerCase().split(/\s+/).filter(Boolean);return arr.filter(x=>t.every(z=>(x.label+' '+(x.desc||'')).toLowerCase().includes(z))).slice(0,80)};
  const files=()=>{const m=new Map();tabs.forEach(t=>{if(t.path)m.set(t.path,{label:t.name,desc:t.path,run:()=>activate(t)})});for(const [d,it] of kids)it.forEach(x=>{if(!x.isDirectory&&!m.has(x.path))m.set(x.path,{label:x.name,desc:x.path.replace(root,''),run:()=>openFile(x.path)})});return Array.from(m.values())};
  const refill=()=>{const v=inp.value;list=items?fuzzy(items,v):v[0]==='>'?fuzzy(cmds(),v.slice(1)):fuzzy(files(),v);on=Math.min(on,Math.max(0,list.length-1));
   pl.innerHTML=list.length?list.map((x,i)=>'<div class="cxpi'+(i===on?' on':'')+'" data-i="'+i+'"><span>'+E(x.label)+'</span><small>'+E(x.desc||'')+'</small></div>').join(''):'<div class="cxpi"><span style="color:var(--dim)">No results</span></div>';const a=q('.on',pl);if(a)a.scrollIntoView({block:'nearest'})};
  const go=i=>{const x=list[i];if(!x)return;closePal();setTimeout(()=>x.run(),0)};
  inp.addEventListener('input',()=>{on=0;refill()});inp.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();on=Math.min(list.length-1,on+1);refill()}else if(e.key==='ArrowUp'){e.preventDefault();on=Math.max(0,on-1);refill()}else if(e.key==='Enter'){e.preventDefault();go(on)}else if(e.key==='Escape'){closePal()}});
  pl.addEventListener('click',e=>{const r=e.target.closest('[data-i]');if(r)go(+r.dataset.i)});o.addEventListener('mousedown',e=>{if(e.target===o)closePal()});refill();setTimeout(()=>inp.focus(),30)}
 function closePal(){if(palEl){palEl.remove();palEl=null;if(cur&&!cur.special)ta.focus()}}
 const pick=(items,ph)=>palette('',items,ph);
 function cmds(){const c=(label,run,desc)=>({label,run,desc}),a=[];
  a.push(c('File: New Untitled File',newUntitled,'Ctrl+N'),c('File: Save',()=>save(cur),'Ctrl+S'),c('File: Save As...',()=>save(cur,1)),c('File: Save All',async()=>{for(const t of tabs)if(!t.special&&t.path&&dirty(t))await save(t,0,1);toast('Saved all')}),c('File: Close Editor',()=>closeTab(cur)));
  if(proj)a.push(c('File: New File in Folder...',()=>newEntry(false)),c('File: New Folder...',()=>newEntry(true)),c('File: Open Folder...',()=>ACT.openfolder()),c('Explorer: Refresh',refreshAll),c('Explorer: Collapse All',()=>{open.clear();drawTree()}),c('View: Toggle Sidebar',()=>ACT.side(),'Ctrl+B'),c('View: Show Explorer',()=>{view='explorer';sideOn=true;drawSide()}),c('View: Show Extensions',()=>{view='ext';sideOn=true;drawSide()}),c('View: Show AI Assistant',()=>{view='ai';sideOn=true;drawSide()}));
  a.push(c('Edit: Find',()=>openFind(false),'Ctrl+F'),c('Edit: Replace',()=>openFind(true),'Ctrl+H'),c('Edit: Format Document',formatDoc,'Shift+Alt+F'),c('Edit: Toggle Line Comment',toggleComment,'Ctrl+/'),c('Edit: Indent Line',()=>indentSel(false)),c('Edit: Outdent Line',()=>indentSel(true)),c('Edit: Undo',()=>{ta.focus();document.execCommand('undo')}),c('Edit: Redo',()=>{ta.focus();document.execCommand('redo')}),c('Edit: Select All',()=>{ta.focus();ta.select()}),
   c('Edit: Insert Snippet...',()=>{const sn=activeP('snippets').reduce((x,p)=>x.concat(p.snips||[]),[]).filter(x=>cur&&x.l===cur.lang);if(!sn.length){toast('No snippets for this language. Install a snippets extension.');return}pick(sn.map(x=>({label:x.p,desc:x.d,run:()=>{const s=ta.selectionStart,r=snipParse(x.b,ta.value.slice(ta.value.lastIndexOf('\n',s-1)+1,s).match(/^\s*/)[0]);ins(r.text,s,ta.selectionEnd);ta.setSelectionRange(s+r.pos,s+r.pos)}})),'Select a snippet')}),
   c('Run: Run Code',()=>ACT.run(),'F5'),c('Run: Stop',()=>stopRun(),''),c('Run: Open Terminal App',()=>openApp('term')),c('View: Toggle Output Panel',()=>ACT.panel(),'Ctrl+J'),c('View: Clear Output',()=>ACT.clear()),c('View: Toggle Minimap',()=>{SET.mini=SET.mini?0:1;saveSet()}),c('View: Toggle Line Numbers',()=>{SET.ln=SET.ln?0:1;saveSet()}),c('View: Increase Font Size',()=>{SET.fs=Math.min(32,SET.fs+1);saveSet()}),c('View: Decrease Font Size',()=>{SET.fs=Math.max(9,SET.fs-1);saveSet()}),
   c('Preferences: Color Theme',()=>{const o=[['auto','Follow NexOS theme'],['dark','Dark+'],['light','Light+']].concat(activeP('theme').map(p=>[p.id,p.name]));pick(o.map(x=>({label:x[1],desc:SET.theme===x[0]?'current':'',run:()=>{SET.theme=x[0];saveSet()}})),'Select color theme')}),
   c('Preferences: Open Settings',()=>ACT.settings()),c('Preferences: Auto Save',()=>pick([['off','Off'],['delay','After 1 second'],['blur','On focus change']].map(x=>({label:x[1],desc:SET.auto===x[0]?'current':'',run:()=>{SET.auto=x[0];saveSet()}})),'Auto save')),
   c('Language: Change Mode',()=>ACT.lang()),c('Extensions: Add Custom Plugin...',customPlugin),
   c('AI: Complete at Cursor',aiComplete,'Ctrl+Space'),c('AI: Explain Selection',()=>aiAction('explain')),c('AI: Fix Selection or File',()=>aiAction('fix')),c('AI: Improve Selection or File',()=>aiAction('improve')));return a}

 /* AI */
 const aiSys='You are a concise coding assistant inside the NexOS Code Editor. When you return code, use fenced code blocks.';
 function aiCtx(){if(!cur||cur.special)return{text:'',s:0,e:0,sel:false};const v=ta.value,s=ta.selectionStart,e=ta.selectionEnd,sl=e>s;return{text:(sl?v.slice(s,e):v).slice(0,12000),s:sl?s:0,e:sl?e:v.length,sel:sl}}
 async function aiReq(system,msgs){const P=AI.prov,key=(AI.key||'').trim();if(!key&&P!=='custom')throw new Error('Add your API key: Settings > AI assistant');
  if(P==='anthropic'){const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:AI.model||'claude-sonnet-5-5',max_tokens:2048,system,messages:msgs})}),j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||('HTTP '+r.status));return(j.content||[]).map(c=>c.text||'').join('')}
  if(P==='gemini'){const m=AI.model||'gemini-2.0-flash',r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(m)+':generateContent?key='+encodeURIComponent(key),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:msgs.map(x=>({role:x.role==='assistant'?'model':'user',parts:[{text:x.content}]}))})}),j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||('HTTP '+r.status));return((j.candidates||[{}])[0].content||{parts:[]}).parts.map(p=>p.text||'').join('')}
  const url=P==='custom'?(AI.url||'').trim().replace(/\/+$/,'')+'/chat/completions':'https://api.openai.com/v1/chat/completions';if(P==='custom'&&!AI.url)throw new Error('Set the Base URL in Settings > AI assistant');
  const hd={'content-type':'application/json'};if(key)hd.authorization='Bearer '+key;const r=await fetch(url,{method:'POST',headers:hd,body:JSON.stringify({model:AI.model||(P==='openai'?'gpt-4o-mini':'default'),messages:[{role:'system',content:system}].concat(msgs)})}),j=await r.json();if(!r.ok)throw new Error((j.error&&(j.error.message||j.error))||('HTTP '+r.status));return(j.choices&&j.choices[0]&&j.choices[0].message.content)||''}
 async function aiSend(text,range){if(aiBusy||!text.trim())return;const c=aiCtx();aiMsgs.push({r:'user',text});aiMsgs.push({r:'assistant',text:'Thinking...',tmp:1,range:range||null});aiBusy=true;drawAIList();
  try{const hist=aiMsgs.filter(m=>!m.tmp&&!m.err).slice(-12).map(m=>({role:m.r,content:m.text})),ctxt=cur&&!cur.special?'\n\nCurrent file: '+cur.name+' ('+cur.lang+')'+(c.sel?' - selected code:':':')+'\n```\n'+c.text+'\n```':'';
   hist[hist.length-1]={role:'user',content:text+ctxt};const ans=await aiReq(aiSys,hist);const m=aiMsgs[aiMsgs.length-1];m.text=ans||'(empty answer)';m.tmp=0}
  catch(e){const m=aiMsgs[aiMsgs.length-1];m.text=msg(e);m.tmp=0;m.err=1}
  aiBusy=false;drawAIList()}
 function aiAction(kind){if(!cur||cur.special){toast('Open a file first');return}const c=aiCtx(),pr={explain:'Explain what this code does, briefly and clearly.',fix:'Find bugs in this code and return the corrected code in one fenced code block, followed by a short explanation of the changes.',improve:'Improve this code (readability, performance, best practices). Return the full improved code in one fenced code block, then briefly list the changes.'}[kind];
  view='ai';sideOn=true;if(proj)drawSide();else toast('AI assistant is available in the full editor (open it from the Start menu)');if(proj)aiSend(pr,kind==='explain'?null:{s:c.s,e:c.e,id:cur.id})}
 function aiBlocks(t){const parts=t.split(/```[\w+#.-]*\n?/),blocks=[];let h2='';parts.forEach((p,i)=>{if(i%2){blocks.push(p.replace(/\n$/,''));h2+='@@B'+(blocks.length-1)+'@@'}else h2+=E(p).replace(/`([^`\n]+)`/g,'<code>$1</code>')});return{html:h2,blocks}}
 function drawAIList(){const l=q('.cxai',sv);if(!l)return;l.innerHTML=aiMsgs.length?aiMsgs.map((m,mi)=>{if(m.r==='user')return '<div class="cxam u">'+E(m.text)+'</div>';const b=aiBlocks(m.text);m.blocks=b.blocks;
   return '<div class="cxam'+(m.err?' e':'')+'">'+b.html.replace(/@@B(\d+)@@/g,(x,i)=>'<div class="cxcb"><pre>'+E(b.blocks[i])+'</pre><div><button data-ab="copy" data-m="'+mi+'" data-b="'+i+'">Copy</button><button data-ab="ins" data-m="'+mi+'" data-b="'+i+'">Insert</button>'+(m.range?'<button data-ab="rep" data-m="'+mi+'" data-b="'+i+'">Apply</button>':'')+'</div></div>')+'</div>'}).join(''):'<div class="cxempty">Ask about your code, or use the buttons above. The current file or selection is sent as context.'+(AI.key||AI.prov==='custom'?'':'<br><br>Set your provider and API key in Settings first.')+'</div>';l.scrollTop=l.scrollHeight}
 function drawAI(){sv.innerHTML='<div class="cxsh"><b>AI Assistant</b><button data-a="settings" title="AI settings">'+ico(IC.gear)+'</button><button data-ab="clr" title="Clear chat">'+ico(IC.trash)+'</button></div><div class="cxaq"><button data-ab="q" data-k="explain">Explain</button><button data-ab="q" data-k="fix">Fix</button><button data-ab="q" data-k="improve">Improve</button><button data-ab="q" data-k="complete">Complete</button></div><div class="cxai"></div><div class="cxai2"><textarea class="ta2" placeholder="Ask AI..."></textarea><button data-ab="send">'+ico(IC.send)+'</button></div>';drawAIList();
  const t=q('textarea',sv);t.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();const v=t.value;t.value='';aiSend(v)}})}
 sv&&sv.addEventListener('click',e=>{const b=e.target.closest('[data-ab]');if(!b)return;const k=b.dataset.ab;
  if(k==='clr'){aiMsgs=[];drawAIList()}else if(k==='q'){b.dataset.k==='complete'?aiComplete():aiAction(b.dataset.k)}else if(k==='send'){const t=q('textarea',sv),v=t.value;t.value='';aiSend(v)}
  else{const m=aiMsgs[+b.dataset.m],code=m&&m.blocks&&m.blocks[+b.dataset.b];if(code==null)return;if(k==='copy')copyText(code);else if(k==='ins'&&cur&&!cur.special)ins(code,ta.selectionStart,ta.selectionEnd);
   else if(k==='rep'&&cur&&cur.id===m.range.id){const n=ta.value.length;ins(code,Math.min(m.range.s,n),Math.min(m.range.e,n));toast('Applied')}}});
 async function aiComplete(){if(!cur||cur.special)return;const s=ta.selectionStart,v=ta.value;toast('AI completing...',1500);
  try{let ans=await aiReq('You are a code completion engine. Return ONLY the code to insert at <CURSOR>. No explanations, no markdown fences.',[{role:'user',content:'File: '+cur.name+'\n'+v.slice(Math.max(0,s-3000),s)+'<CURSOR>'+v.slice(s,s+1000)}]);
   ans=ans.replace(/^```[\w+#.-]*\n?/,'').replace(/\n?```\s*$/,'');if(!ans.trim()){toast('No suggestion');return}sug={text:ans,pos:s};sgEl.hidden=false;sgEl.innerHTML='<pre>'+E(ans.slice(0,400))+'</pre><button class="pri" data-sg="1">Accept (Tab)</button><button data-sg="0">Dismiss</button>'}catch(e){toast(msg(e))}}
 function acceptSug(){if(!sug)return;const t=sug;dropSug();ins(t.text,t.pos,t.pos)}
 function dropSug(){sug=null;sgEl.hidden=true}
 sgEl.addEventListener('click',e=>{const b=e.target.closest('[data-sg]');if(b)b.dataset.sg==='1'?acceptSug():dropSug()});

 /* actions */
 const ACT={run:()=>runCode(),save:()=>save(cur),panel:()=>{panel.hidden=!panel.hidden;if(!panel.hidden)ptabSet(ptab)},pal:()=>palette('>'),clear:()=>{pout.innerHTML=''},settings:()=>{let t=tabs.find(x=>x.special==='settings');if(!t)t=newTab({special:'settings',name:'Settings'});activate(t)},
  side:()=>{sideOn=!sideOn;drawSide()},nf:()=>newEntry(false),nd:()=>newEntry(true),rn:()=>renameEntry(sel),del:()=>deleteEntry(sel),rf:()=>refreshAll(),ca:()=>{open.clear();drawTree()},newtab:newUntitled,
  openfolder:async()=>{const p=await ask('Open folder (full path)',root||await home());if(p)openRoot(p)},
  lang:()=>{if(!cur||cur.special)return;const L=allLangs();pick(Object.keys(L).map(id=>({label:L[id].n,desc:id===cur.lang?'current':'',run:()=>{cur.lang=id;nLines=0;render()}})),'Select language mode')},
  spaces:()=>pick([2,4,8].map(n=>({label:'Spaces: '+n,desc:SET.tab===n?'current':'',run:()=>{SET.tab=n;saveSet()}})),'Tab size'),aiq:()=>{if(proj){view='ai';sideOn=true;drawSide()}else toast('Open the editor from the Start menu for the AI assistant')}};
 B.addEventListener('click',e=>{const x=e.target.closest('[data-x]');if(x){e.stopPropagation();closeTab(tabs.find(t=>t.id==x.dataset.x));return}
  const tb=e.target.closest('[data-t]');if(tb){const t=tabs.find(y=>y.id==tb.dataset.t);if(t&&t!==cur)activate(t);return}
  const v=e.target.closest('[data-v]');if(v){const id=v.dataset.v;if(id==='settings'){ACT.settings();return}if(sideOn&&view===id)sideOn=false;else{view=id;sideOn=true}drawSide();return}
  const pt=e.target.closest('[data-pt]');if(pt){ptabSet(pt.dataset.pt);return}
  const a=e.target.closest('[data-a]');if(a&&ACT[a.dataset.a])ACT[a.dataset.a](a,e)});
 B.addEventListener('keydown',e=>{if(e.defaultPrevented)return;const c=e.ctrlKey||e.metaKey,kl=(e.key||'').toLowerCase();if(c&&e.shiftKey&&kl==='p'||e.key==='F1'){e.preventDefault();palette('>')}else if(c&&!e.shiftKey&&kl==='p'){e.preventDefault();palette('')}else if(c&&kl==='n'&&e.target===ta){e.preventDefault();newUntitled()}else if(c&&kl==='s'&&e.target!==ta){e.preventDefault();save(cur)}else if(e.key==='F5'&&e.target!==ta){e.preventDefault();ACT.run()}});

 /* start */
 inst.applySet();drawSide();
 if(proj){(async()=>{if(!root&&HAS)root=await home();if(root&&HAS){await loadDir(root);if(view==='explorer')drawTree()}else drawTree();title();if(!tabs.length){activate(null)}})()}
 else{renderTabs();ta.disabled=true;(async()=>{try{const r=await NF.readText({path:arg.path}),t=newTab({path:arg.path,name:base(arg.path),text:r.text,saved:r.text});ta.disabled=false;activate(t)}catch(e){toast(msg(e));ta.disabled=false;newUntitled()}})()}
 if(!HAS&&!proj){ta.disabled=false;newUntitled()}
 if(proj&&!HAS){newUntitled()}
}

A.code.f=codeApp;try{appCode=codeApp}catch(e){}
if(typeof module!=='undefined'&&module.exports)module.exports={hl,langOf,fmtBraces,fmtMarkup,fmtJson,mdHtml,snipParse,plugAdd,CAT,allLangs,codeApp};
})();
