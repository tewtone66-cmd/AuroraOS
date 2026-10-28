/* CODE-3.5.0 - VS Code style Code Editor (part 1: explorer, tabs, editor, panel, runners, palette, settings).
   Replaces the UI of appCode at runtime (A.code.f); on any error the old editor opens instead.
   Public API for extensions: window.CX (themes, langs, snippets, formatters, runners, views, commands). */
(function(){'use strict';
var B=document.body,K='code',did=0;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function jget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function nf(){return typeof NF!=='undefined'&&NF&&NF.list?NF:null}
function base(p){return p.split('/').pop()}
function dirOf(p){var i=p.lastIndexOf('/');return i>0?p.slice(0,i):'/'}
function join(a,b){return a.replace(/\/+$/,'')+'/'+b}
function norm(p){var o=[];p.split('/').forEach(function(s){if(s==='..')o.pop();else if(s&&s!=='.')o.push(s)});return '/'+o.join('/')}
function ext(n){var i=n.lastIndexOf('.');return i>0?n.slice(i+1).toLowerCase():''}
function tst(m){if(typeof toast==='function')toast(m)}
function rxEsc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function toSet(s){var o={};(s||'').split(/\s+/).forEach(function(w){if(w)o[w]=1});return o}
function narrow(){return window.innerWidth<640}

/* ---------- registries (extension API) ---------- */
var LM=null;
var CX=window.CX={ver:'3.5.0',themes:{},langs:{},snippets:{},formatters:{},runners:{},views:[],cmds:{},keys:{},inst:[],
 addTheme:function(id,name,dark,v){CX.themes[id]={name:name,dark:!!dark,v:v}},
 removeTheme:function(id){delete CX.themes[id]},
 addLang:function(id,o){CX.langs[id]=o;LM=null},
 addSnippets:function(lang,map){var s=CX.snippets[lang]||(CX.snippets[lang]={});for(var k in map)s[k]=map[k]},
 addFormatter:function(lang,fn){CX.formatters[lang]=fn},
 addRunner:function(lang,fn){CX.runners[lang]=fn},
 addView:function(v){CX.views=CX.views.filter(function(x){return x.id!==v.id});CX.views.push(v);CX.inst.forEach(function(i){i.buildAct()})},
 addCommand:function(id,title,fn,key){CX.cmds[id]={id:id,title:title,fn:fn,key:key};if(key)CX.keys[key]=id},
 removeCommand:function(id){var c=CX.cmds[id];if(c&&c.key)delete CX.keys[c.key];delete CX.cmds[id]},
 menu:null,hl:null,icon:null};

/* ---------- languages ---------- */
var KJ='break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await static get set from as null true false undefined NaN Infinity';
function L(id,name,exts,o){o=o||{};o.name=name;o.exts=exts;CX.langs[id]=o}
L('js','JavaScript',['js','mjs','cjs','jsx'],{kw:KJ,lc:'//',bc:['/*','*/'],tpl:1,cmt:'//'});
L('ts','TypeScript',['ts','tsx','mts','cts'],{kw:KJ+' interface type enum implements private public protected readonly namespace declare abstract keyof infer is unknown never any',ty:'string number boolean void object symbol bigint',lc:'//',bc:['/*','*/'],tpl:1,cmt:'//'});
L('html','HTML',['html','htm','xhtml','vue','svelte'],{ml:'html'});
L('xml','XML',['xml','svg','xsl','xaml','plist'],{ml:'html'});
L('css','CSS',['css','scss','less'],{ml:'css'});
L('json','JSON',['json','jsonc','webmanifest','map'],{kw:'true false null',lc:'//',ml:'json'});
L('md','Markdown',['md','markdown','mdx'],{ml:'md'});
L('py','Python',['py','pyw'],{kw:'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield None True False self print',lc:'#',tq:1,cmt:'#',caps:1});
L('java','Java',['java'],{kw:'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long new null package private protected public return short static super switch synchronized this throw throws try void volatile while true false var',lc:'//',bc:['/*','*/'],cmt:'//',caps:1});
L('kt','Kotlin',['kt','kts'],{kw:'as break class continue do else false for fun if in interface is null object package return super this throw true try typealias val var when while override open data sealed private public protected internal',lc:'//',bc:['/*','*/'],cmt:'//',caps:1});
L('c','C',['c','h'],{kw:'auto break case char const continue default do double else enum extern float for goto if inline int long register return short signed sizeof static struct switch typedef union unsigned void volatile while NULL true false',lc:'//',bc:['/*','*/'],cmt:'//'});
L('cpp','C++',['cpp','cc','cxx','hpp','hh'],{kw:'alignas auto bool break case catch char class const constexpr continue default delete do double else enum explicit extern false float for friend goto if inline int long mutable namespace new noexcept nullptr operator private protected public return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void volatile while',lc:'//',bc:['/*','*/'],cmt:'//',caps:1});
L('cs','C#',['cs'],{kw:'abstract as async await base bool break byte case catch char class const continue decimal default delegate do double else enum event false finally float for foreach if in int interface internal is lock long namespace new null object out override private protected public readonly ref return sealed short static string struct switch this throw true try typeof uint ulong using var virtual void while',lc:'//',bc:['/*','*/'],cmt:'//',caps:1});
L('go','Go',['go'],{kw:'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil',ty:'int int8 int16 int32 int64 uint float32 float64 string bool byte rune error',lc:'//',bc:['/*','*/'],tpl:1,cmt:'//'});
L('rs','Rust',['rs'],{kw:'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while',ty:'i8 i16 i32 i64 u8 u16 u32 u64 usize isize f32 f64 bool str String Vec Option Result',lc:'//',bc:['/*','*/'],cmt:'//',nosq:1});
L('php','PHP',['php'],{kw:'abstract and array as break case catch class clone const continue declare default do echo else elseif empty endfor endforeach endif endwhile extends final finally for foreach function global if implements include include_once instanceof interface isset list namespace new null or print private protected public require require_once return static switch throw trait try unset use var while true false',lc:['//','#'],bc:['/*','*/'],cmt:'//',caps:1});
L('rb','Ruby',['rb','rake','gemspec'],{kw:'alias and begin break case class def defined do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield puts require',lc:'#',cmt:'#',caps:1});
L('lua','Lua',['lua'],{kw:'and break do else elseif end false for function goto if in local nil not or repeat return then true until while',lc:'--',cmt:'--'});
L('sh','Shell',['sh','bash','zsh','fish','mk'],{kw:'if then else elif fi for while do done case esac in function select until echo exit export local return source cd ls rm cp mv mkdir cat grep sed awk',lc:'#',cmt:'#'});
L('bat','Batch',['bat','cmd'],{kw:'echo set if else for goto call exit pause timeout title cd dir copy move del mkdir rmdir type start errorlevel exist not',lc:['REM ','::'],cmt:'REM ',nosq:1});
L('sql','SQL',['sql'],{kw:'select from where and or not insert into values update set delete create table drop alter add index join left right inner outer on group by order having limit as distinct union all null is in like between primary key foreign references default unique count sum avg min max',lc:'--',bc:['/*','*/'],cmt:'--'});
L('yaml','YAML',['yml','yaml'],{kw:'true false null yes no',lc:'#',cmt:'#'});
L('ini','Config',['ini','toml','cfg','conf','env','properties','gitignore'],{lc:['#',';'],cmt:'#'});
L('txt','Plain text',['txt','log','csv','text'],{ml:'none'});
function langOf(name){var n=name.toLowerCase();if(!LM){LM={};Object.keys(CX.langs).forEach(function(id){(CX.langs[id].exts||[]).forEach(function(e){LM[e]=id})})}
 if(n==='dockerfile'||n==='makefile')return 'sh';if(n==='.gitignore'||n==='.env')return 'ini';return LM[ext(n)]||'txt'}

/* ---------- syntax highlighting ---------- */
function span(c,t){return '<span class="'+c+'">'+esc(t)+'</span>'}
function mkRe(Lg){var s=[];if(Lg.tq)s.push('"""[\\s\\S]*?(?:"""|$)',"'''[\\s\\S]*?(?:'''|$)");s.push('"(?:\\\\.|[^"\\\\\\n])*"?');if(!Lg.nosq)s.push("'(?:\\\\.|[^'\\\\\\n])*'?");if(Lg.tpl)s.push('`(?:\\\\[\\s\\S]|[^`\\\\])*`?');
 var lc=Lg.lc?(Array.isArray(Lg.lc)?Lg.lc:[Lg.lc]).map(rxEsc).join('|'):'';
 return new RegExp([Lg.bc?'('+rxEsc(Lg.bc[0])+'[\\s\\S]*?(?:'+rxEsc(Lg.bc[1])+'|$))':'((?!))',lc?'((?:'+lc+').*)':'((?!))','('+s.join('|')+')','(\\b(?:0[xX][\\da-fA-F]+|\\d[\\d_]*\\.?\\d*(?:[eE][+-]?\\d+)?)\\b)','([A-Za-z_$][\\w$]*)'].join('|'),'g')}
function hlGen(t,Lg){var re=Lg._re||(Lg._re=mkRe(Lg)),kw=Lg._kw||(Lg._kw=toSet(Lg.kw)),ty=Lg._ty||(Lg._ty=toSet(Lg.ty)),o='',last=0,m;re.lastIndex=0;
 while((m=re.exec(t))){if(m.index>last)o+=esc(t.slice(last,m.index));var s=m[0];
  if(m[1]||m[2])o+=span('tc',s);else if(m[3])o+=(Lg.ml==='json'&&/^\s*:/.test(t.slice(re.lastIndex,re.lastIndex+6))?span('tpr',s):span('ts',s));
  else if(m[4])o+=span('tn',s);else{if(kw[s])o+=span('tk',s);else if(ty[s])o+=span('tt',s);else if(t.charAt(re.lastIndex)==='(')o+=span('tf',s);else if(Lg.caps&&/^[A-Z]/.test(s))o+=span('tt',s);else o+=esc(s)}
  last=re.lastIndex}
 return o+esc(t.slice(last))}
function hlAttrs(a){var o='',last=0,re=/([^\s=\/"'<>]+)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s"'>]+)?/g,m;while((m=re.exec(a))){o+=esc(a.slice(last,m.index))+span('ta',m[1])+(m[2]?span('tp',m[2]):'')+(m[3]?span('ts',m[3]):'');last=re.lastIndex}return o+esc(a.slice(last))}
function hlHtml(t){var re=/(<!--[\s\S]*?(?:-->|$))|(<\/?)([A-Za-z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)(\/?>?)/g,lo=t.toLowerCase(),o='',last=0,m;
 while((m=re.exec(t))){o+=esc(t.slice(last,m.index));
  if(m[1])o+=span('tc',m[1]);else{o+=span('tp',m[2])+span('tg',m[3])+hlAttrs(m[4])+span('tp',m[5]);var nm=m[3].toLowerCase();
   if((nm==='script'||nm==='style')&&m[5]==='>'){var end=lo.indexOf('</'+nm,re.lastIndex);if(end<0)end=t.length;o+=hl(t.slice(re.lastIndex,end),nm==='script'?'js':'css');re.lastIndex=end}}
  last=re.lastIndex}
 return o+esc(t.slice(last))}
function hlCss(t){var re=/(\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(@[\w-]+)|(#[\da-fA-F]{3,8}\b|-?\d*\.?\d+[a-z%]*)|([A-Za-z_-][\w-]*)|([{}:;])/g,d=0,v=0,o='',last=0,m;
 while((m=re.exec(t))){o+=esc(t.slice(last,m.index));var s=m[0];
  if(m[1])o+=span('tc',s);else if(m[2])o+=span('ts',s);else if(m[3])o+=span('tk',s);else if(m[4])o+=d>0?span('tn',s):esc(s);
  else if(m[5])o+=d===0?span('tg',s):v?(t.charAt(re.lastIndex)==='('?span('tf',s):esc(s)):span('tpr',s);
  else{if(s==='{'){d++;v=0}else if(s==='}'){d=Math.max(0,d-1);v=0}else if(s===':'&&d>0)v=1;else if(s===';')v=0;o+=span('tp',s)}
  last=re.lastIndex}
 return o+esc(t.slice(last))}
function hlMd(t){var inC=0;return t.split('\n').map(function(l){if(/^\s*```/.test(l)){inC=!inC;return span('tc',l)}if(inC)return span('ts',l);var m=/^(#{1,6})(\s.*)$/.exec(l);if(m)return span('tk',m[1])+'<span class="tk tb">'+esc(m[2])+'</span>';if(/^\s*>/.test(l))return span('tc',l);
 return esc(l).replace(/`([^`]+)`/g,'<span class="ts">`$1`</span>').replace(/\*\*([^*]+)\*\*/g,'<span class="tt tb">**$1**</span>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<span class="tf">[$1]</span><span class="tc">($2)</span>').replace(/^(\s*)([-*+]|\d+\.)(\s)/,'$1<span class="tn">$2</span>$3')}).join('\n')}
function hl(t,id){var Lg=CX.langs[id];if(!Lg||t.length>2e5||Lg.ml==='none')return esc(t);return Lg.ml==='html'?hlHtml(t):Lg.ml==='css'?hlCss(t):Lg.ml==='md'?hlMd(t):hlGen(t,Lg)}
CX.hl=hl;

/* ---------- editor color themes ---------- */
function TH(id,name,dark,a){CX.addTheme(id,name,dark,{bg:a[0],fg:a[1],gut:a[2],line:a[3],sel:a[4],k:a[5],s:a[6],n:a[7],c:a[8],f:a[9],t:a[10],p:a[11],tg:a[12],at:a[13],pr:a[14]})}
TH('nexos-dark','NexOS Dark',1,['#14171f','#d7dce6','#586075','#ffffff0d','#4f7cff55','#c792ea','#c3e88d','#f78c6c','#637083','#82aaff','#ffcb6b','#89ddff','#f07178','#c792ea','#80cbc4']);
TH('nexos-light','NexOS Light',0,['#fbfbfd','#2b3040','#a0a6b8','#00000008','#4f7cff33','#8250df','#0a7d4a','#c25a1c','#8a93a6','#0b64d8','#9a6700','#47506a','#c9293f','#8250df','#0b7a75']);
TH('monokai','Monokai',1,['#272822','#f8f8f2','#75715e','#3e3d32','#49483e','#f92672','#e6db74','#ae81ff','#75715e','#a6e22e','#66d9ef','#f8f8f2','#f92672','#a6e22e','#66d9ef']);
TH('one-dark','One Dark',1,['#282c34','#abb2bf','#4b5263','#2c313c','#3e4451','#c678dd','#98c379','#d19a66','#5c6370','#61afef','#e5c07b','#56b6c2','#e06c75','#d19a66','#e06c75']);
TH('solarized-dark','Solarized Dark',1,['#002b36','#93a1a1','#586e75','#073642','#274642','#859900','#2aa198','#d33682','#586e75','#268bd2','#b58900','#839496','#268bd2','#b58900','#268bd2']);
TH('github-light','GitHub Light',0,['#ffffff','#24292f','#8c959f','#f6f8fa','#add6ff','#cf222e','#0a3069','#0550ae','#6e7781','#8250df','#953800','#24292f','#116329','#0550ae','#0550ae']);

/* ---------- settings ---------- */
var DEF={theme:'auto',font:'ui-monospace,"JetBrains Mono",Menlo,Consolas,"Roboto Mono","Courier New",monospace',size:13,tab:2,spaces:true,auto:true,mini:true,ln:true,brk:true,clear:true};
var SET=Object.assign({},DEF,jget('aur.cx.set',{}));
function saveSet(){jset('aur.cx.set',SET);CX.inst.forEach(function(i){i.applySet()})}
CX.SET=SET;CX.saveSet=saveSet;

/* ---------- icons (Material-icon style) ---------- */
function bd(c,t,fg){return '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="3" fill="'+c+'"/><text x="8" y="'+(t.length>2?10.6:11.4)+'" text-anchor="middle" font-size="'+(t.length>2?5.4:t.length>1?6.8:8.4)+'" font-weight="700" font-family="system-ui,sans-serif" fill="'+(fg||'#fff')+'">'+t+'</text></svg>'}
var FI={js:['#f5de19','JS','#222'],jsx:['#20c5e8','JSX','#102a30'],ts:['#3178c6','TS'],tsx:['#3178c6','TSX'],mjs:['#f5de19','JS','#222'],py:['#3b78a8','PY'],java:['#e76f00','JV'],kt:['#a97bff','KT'],c:['#5c6bc0','C'],h:['#7986cb','H'],cpp:['#00599c','C+'],cc:['#00599c','C+'],hpp:['#7986cb','H+'],cs:['#6a3ea0','C#'],go:['#00add8','GO'],rs:['#c98a5a','RS'],php:['#777bb4','PHP'],rb:['#cc342d','RB'],sh:['#4eaa25','SH'],bash:['#4eaa25','SH'],bat:['#4eaa25','BAT'],cmd:['#4eaa25','BAT'],sql:['#e38c00','SQL'],yml:['#cb171e','YML'],yaml:['#cb171e','YML'],toml:['#9c6b3a','TML'],ini:['#8a8f9c','INI'],env:['#d4b73c','ENV'],lua:['#2c2d72','LUA'],md:['#4a90c2','MD'],txt:['#7d8596','TXT'],zip:['#e0a31a','ZIP'],pdf:['#e53935','PDF'],lock:['#8a8f9c','LCK'],log:['#7d8596','LOG'],csv:['#4caf50','CSV'],scss:['#cd6799','SC'],less:['#2b5b9a','LS'],vue:['#41b883','VUE'],svelte:['#ff3e00','SV'],apk:['#3ddc84','APK'],exe:['#5b6a8a','EXE'],jar:['#e76f00','JAR']};
var FC={src:'#66bb6a',source:'#66bb6a',lib:'#9ccc65',libs:'#9ccc65',assets:'#ffa726',images:'#ffa726',img:'#ffa726',static:'#ffa726',public:'#42a5f5',docs:'#42a5f5',doc:'#42a5f5',test:'#ef5350',tests:'#ef5350',__tests__:'#ef5350',node_modules:'#7cb342','.git':'#f4511e','.github':'#8a93a6',dist:'#ffb300',build:'#ffb300',out:'#ffb300',config:'#26a69a',scripts:'#8d6e63',components:'#26c6da',utils:'#7e57c2',styles:'#ec6ba5',css:'#ec6ba5',api:'#5c9ce6',data:'#26a69a'};
function folder(n,open){var c=FC[n.toLowerCase()]||'#6aa6d9';return open?'<svg viewBox="0 0 16 16"><path d="M1.5 4.2c0-.7.5-1.2 1.2-1.2h3.3l1.3 1.5h5c.7 0 1.2.5 1.2 1.2v.8H3.4L1.5 12z" fill="'+c+'" opacity=".7"/><path d="M3.4 7h11.6l-1.7 6.2c-.1.4-.5.8-1 .8H2.5c-.5 0-.8-.5-.7-.9z" fill="'+c+'"/></svg>':'<svg viewBox="0 0 16 16"><path d="M1.5 4c0-.7.5-1.2 1.2-1.2h3.3l1.3 1.5h6c.7 0 1.2.5 1.2 1.2v6.8c0 .7-.5 1.2-1.2 1.2H2.7c-.7 0-1.2-.5-1.2-1.2z" fill="'+c+'"/></svg>'}
function icon(n,dir,open){if(dir)return folder(n,open);var l=n.toLowerCase(),e=ext(l);
 if(l==='package.json'||l==='package-lock.json')return bd('#6dbb3b','NPM');if(l==='readme.md')return bd('#4a90c2','i');if(l.indexOf('.git')===0)return bd('#f05033','GIT');
 if(e==='html'||e==='htm'||e==='xml')return '<svg viewBox="0 0 16 16" fill="none" stroke="#e8663d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 4.5L1.8 8l3.4 3.5M10.8 4.5L14.2 8l-3.4 3.5"/></svg>';
 if(e==='css')return bd('#3a8dde','#');
 if(e==='json'||e==='jsonc')return '<svg viewBox="0 0 16 16"><text x="8" y="12.2" text-anchor="middle" font-size="12.5" font-weight="700" fill="#e0b73f" font-family="system-ui">{}</text></svg>';
 if(/^(png|jpe?g|gif|webp|ico|bmp|svg)$/.test(e))return '<svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="#26a69a"/><circle cx="5.5" cy="6" r="1.3" fill="#fff"/><path d="M2.5 12.5l4-4 3 3 2-2 2.5 3z" fill="#fff" opacity=".9"/></svg>';
 var f=FI[e];if(f)return bd(f[0],f[1],f[2]);return '<svg viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#8a93a6"/><path d="M9.5 1.5v3h3" fill="#b6bdcc"/></svg>'}
CX.icon=icon;
var ACT={files:'<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 nfile:'<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/></svg>',nfold:'<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10v6M9 13h6"/></svg>',ren:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',del:'<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',ref:'<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',col:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8"/></svg>',play:'<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',cmd:'<svg viewBox="0 0 24 24"><path d="M4 17l6-5-6-5M12 19h8"/></svg>',x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'};
CX.ACT=ACT;

/* ---------- context menu ---------- */
var CM=null;
function closeMenu(){if(CM){var m=CM;CM=null;m.classList.remove('on');setTimeout(function(){m.remove()},150)}}
function menu(x,y,items){closeMenu();var m=el('div','xmenu');items.forEach(function(it){if(!it){return}if(it==='-'){m.appendChild(el('div','sp'));return}var b=el('button','',esc(it.t)+(it.k?'<small>'+esc(it.k)+'</small>':''));if(it.d)b.className='dg';if(it.off)b.disabled=true;b.onclick=function(e){e.stopPropagation();closeMenu();it.f()};m.appendChild(b)});
 B.appendChild(m);var r=m.getBoundingClientRect();m.style.left=Math.max(6,Math.min(x,innerWidth-r.width-6))+'px';m.style.top=Math.max(6,Math.min(y,innerHeight-r.height-6))+'px';requestAnimationFrame(function(){m.classList.add('on')});CM=m}
CX.menu=menu;
addEventListener('pointerdown',function(e){if(CM&&!CM.contains(e.target))closeMenu()},true);

/* ---------- css ---------- */
var st=document.createElement('style');st.textContent=`
.cx{position:absolute;inset:0;display:flex;flex-direction:column;--ph:230px;--sw:250px;font:12.5px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--xfg);background:var(--xbg);overflow:hidden;outline:0;-webkit-user-select:none;user-select:none}
.cx *{box-sizing:border-box}.cx button,.cx input,.cx select,.cx textarea{font:inherit;color:inherit}
.cx{--xb:rgba(128,128,128,.22)}
.cx .xtop,.cx .xact,.cx .xside,.cx .xtabs,.cx .xph{background:var(--xbg);background:color-mix(in srgb,var(--xbg) 91%,#000)}
.cx.xdark .xtop,.cx.xdark .xact,.cx.xdark .xside,.cx.xdark .xtabs,.cx.xdark .xph{background:color-mix(in srgb,var(--xbg) 93%,#fff)}
.cx svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cx .xtop{display:flex;align-items:center;gap:2px;padding:3px 6px;border-bottom:1px solid var(--xb);flex:none}
.cx .xtop button{height:26px;padding:0 9px;border:0;border-radius:6px;background:none;cursor:pointer;color:var(--xfg)}.cx .xtop button:hover{background:rgba(128,128,128,.2)}
.cx .xtop .xsp{flex:1}.cx .xtop .xi{width:28px;padding:0;display:grid;place-items:center}.cx .xi svg{width:16px;height:16px}
.cx .xtop .xrun{background:var(--acc,#4f7cff);color:#fff;display:flex;align-items:center;gap:5px;padding:0 11px}.cx .xtop .xrun:hover{background:var(--acc,#4f7cff);filter:brightness(1.1)}.cx .xrun svg{width:12px;height:12px}
.cx .xmain{position:relative;display:flex;flex:1;min-height:0}
.cx .xact{width:44px;flex:none;display:flex;flex-direction:column;align-items:center;padding:6px 0;gap:2px;border-right:1px solid var(--xb)}
.cx .xact button{position:relative;width:40px;height:40px;border:0;border-radius:8px;background:none;color:var(--xgut);cursor:pointer;display:grid;place-items:center;transition:color .15s,background .15s}
.cx .xact button svg{width:22px;height:22px;stroke-width:1.6}.cx .xact button:hover{color:var(--xfg)}.cx .xact button.on{color:var(--xfg)}
.cx .xact button.on:before{content:"";position:absolute;left:-2px;top:8px;bottom:8px;width:2px;border-radius:2px;background:var(--acc,#4f7cff)}.cx .xact .xsp{flex:1}
.cx .xside{width:var(--sw);flex:none;display:flex;flex-direction:column;border-right:1px solid var(--xb);min-width:0}
.cx .xsh{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:0 6px 0 12px;height:32px;flex:none;color:var(--xgut);font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase}
.cx .xsa{display:flex;gap:1px}.cx .xsa button{width:24px;height:24px;border:0;border-radius:5px;background:none;cursor:pointer;display:grid;place-items:center;color:var(--xfg);opacity:.75}.cx .xsa button:hover{background:rgba(128,128,128,.25);opacity:1}.cx .xsa button:disabled{opacity:.25}.cx .xsa svg{width:15px;height:15px}
.cx .xsv{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}
.cx .xsz{width:5px;margin:0 -2px;cursor:ew-resize;flex:none;z-index:4;background:transparent;transition:background .15s}.cx .xsz:hover,.cx .xsz.d{background:var(--acc,#4f7cff)}
.cx .xcol{flex:1;min-width:0;display:flex;flex-direction:column;position:relative}
.cx .xtabs{display:flex;overflow-x:auto;scrollbar-width:none;height:34px;flex:none;border-bottom:1px solid var(--xb)}.cx .xtabs::-webkit-scrollbar{display:none}
.cx .xt{position:relative;display:flex;align-items:center;gap:6px;padding:0 6px 0 10px;min-width:92px;max-width:200px;border-right:1px solid var(--xb);cursor:pointer;color:var(--xgut);white-space:nowrap;flex:none;transition:background .15s,color .15s}
.cx .xt:hover{color:var(--xfg)}.cx .xt.on{background:var(--xbg);color:var(--xfg)}.cx .xt.on:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--acc,#4f7cff)}
.cx .xt .ic svg{width:15px;height:15px;display:block}.cx .xt .nm{overflow:hidden;text-overflow:ellipsis;flex:1}.cx .xt .cl{width:18px;height:18px;border-radius:4px;display:grid;place-items:center;flex:none}.cx .xt .cl:hover{background:rgba(128,128,128,.3)}
.cx .xt .cl svg{width:12px;height:12px}.cx .xt.dirty .cl svg{display:none}.cx .xt.dirty .cl:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--xfg)}.cx .xt.dirty .cl:hover svg{display:block}.cx .xt.dirty .cl:hover:before{display:none}
.cx .xedw{position:relative;flex:1;min-height:0}
.cx .xed{position:absolute;inset:0;display:none}.cx .xed.on{display:flex}
.cx .xg{width:var(--gw,44px);flex:none;overflow:hidden;position:relative;background:var(--xbg);color:var(--xgut);text-align:right}
.cx.noln .xg{display:none}.cx .xg pre{margin:0;padding:8px 10px 80px 0;font:var(--xfs)/var(--xlh) var(--xff);will-change:transform}
.cx .xc{position:relative;flex:1;min-width:0;overflow:hidden}
.cx .xpre,.cx .xta{position:absolute;left:0;top:0;margin:0;padding:8px 12px 80px;font:var(--xfs)/var(--xlh) var(--xff);tab-size:var(--xtab);-moz-tab-size:var(--xtab);white-space:pre;word-wrap:normal;border:0;letter-spacing:0}
.cx .xpre{min-width:100%;color:var(--xfg);pointer-events:none;will-change:transform}
.cx .xta{width:100%;height:100%;background:transparent;color:transparent;caret-color:var(--xfg);resize:none;outline:0;overflow:auto;-webkit-user-select:text;user-select:text;overscroll-behavior:contain}
.cx .xta::selection{background:var(--xsel);color:transparent}
.cx .xbx{position:absolute;left:0;top:0;width:0;height:0;will-change:transform;pointer-events:none}.cx .xbx i{position:absolute;display:block}
.cx .xbx .bl{left:0;width:60000px;background:var(--xline)}.cx .xbx .bb{background:rgba(128,128,128,.3);box-shadow:inset 0 0 0 1px rgba(128,128,128,.7);border-radius:2px}.cx .xbx .fm{background:rgba(255,200,0,.28);box-shadow:inset 0 0 0 1px rgba(255,200,0,.6);border-radius:2px}.cx .xbx .fm.cu{background:rgba(255,140,0,.45)}
.cx .tk{color:var(--xk)}.cx .ts{color:var(--xs)}.cx .tn{color:var(--xn)}.cx .tc{color:var(--xc);font-style:italic}.cx .tf{color:var(--xf)}.cx .tt{color:var(--xt)}.cx .tp{color:var(--xp)}.cx .tg{color:var(--xtg)}.cx .ta{color:var(--xat)}.cx .tpr{color:var(--xpr)}.cx .tb{font-weight:700}
.cx .xmm{position:relative;width:76px;flex:none;border-left:1px solid var(--xb);cursor:pointer;touch-action:none}.cx.nomm .xmm{display:none}.cx .xmm canvas{position:absolute;inset:0;width:100%;height:100%}.cx .xms{position:absolute;left:0;right:0;top:0;height:30px;background:rgba(128,128,128,.22);pointer-events:none}
.cx .xempty{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--xgut);text-align:center;padding:20px}.cx .xempty.on{display:flex}.cx .xempty b{font-size:20px;font-weight:300;color:var(--xfg)}.cx .xempty button{border:0;border-radius:8px;padding:7px 14px;background:rgba(128,128,128,.2);cursor:pointer}.cx .xempty button:hover{background:rgba(128,128,128,.32)}.cx .xempty small{opacity:.8}
.cx .xpanel{display:none;flex-direction:column;height:var(--ph);flex:none;position:relative;border-top:1px solid var(--xb);background:var(--xbg)}.cx.xp-on .xpanel{display:flex}
.cx .xrz{position:absolute;left:0;right:0;top:-4px;height:9px;cursor:ns-resize;z-index:5;touch-action:none}.cx .xrz:after{content:"";position:absolute;left:0;right:0;top:4px;height:2px;background:transparent;transition:background .15s}.cx .xrz:hover:after,.cx .xrz.d:after{background:var(--acc,#4f7cff)}
.cx .xph{display:flex;align-items:center;height:30px;flex:none;padding:0 4px 0 8px;gap:2px;border-bottom:1px solid var(--xb)}.cx .xph .pt{height:30px;padding:0 10px;border:0;background:none;cursor:pointer;color:var(--xgut);font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;border-bottom:2px solid transparent}.cx .xph .pt.on{color:var(--xfg);border-color:var(--acc,#4f7cff)}
.cx .xph .xsp{flex:1}.cx .xph .pb{width:26px;height:26px;border:0;border-radius:5px;background:none;cursor:pointer;display:grid;place-items:center}.cx .xph .pb:hover{background:rgba(128,128,128,.25)}.cx .xph .pb svg{width:14px;height:14px}.cx .xph .stp{color:#ff6b6b}
.cx .xpb{position:relative;flex:1;min-height:0}.cx .pn{position:absolute;inset:0;display:none;flex-direction:column}.cx .pn.on{display:flex}
.cx .po,.cx .tt2{flex:1;min-height:0;overflow:auto;padding:6px 12px;font:12px/1.5 var(--xff);white-space:pre-wrap;word-break:break-word;-webkit-user-select:text;user-select:text}
.cx .po .err{color:#ff6b6b}.cx .po .warn{color:#e6a817}.cx .po .info{color:#5aa9ff}.cx .po .dim{color:var(--xgut)}.cx .po .ok{color:#3ec46d}
.cx .pp{flex:1;border:0;background:#fff;width:100%;height:100%}
.cx .trm{display:flex;align-items:center;gap:6px;padding:4px 12px;border-top:1px solid var(--xb);font:12px var(--xff)}.cx .trm input{flex:1;min-width:0;border:0;background:none;outline:0;font:12px var(--xff);-webkit-user-select:text;user-select:text}.cx .trm b{color:var(--acc,#4f7cff)}
.cx .xsb{display:flex;align-items:center;height:22px;flex:none;font-size:11.5px;background:var(--acc,#4f7cff);color:#fff;overflow:hidden}.cx .xsb>*{padding:0 9px;height:100%;display:flex;align-items:center;white-space:nowrap;cursor:default}.cx .xsb .sp{flex:1;padding:0}.cx .xsb .cl{cursor:pointer}.cx .xsb .cl:hover{background:rgba(255,255,255,.2)}
.cx.single .xact,.cx.single .xside,.cx.single .xsz,.cx.single .xtabs{display:none}
.cx.nr .xside{position:absolute;left:44px;top:0;bottom:0;z-index:8;box-shadow:6px 0 24px rgba(0,0,0,.4);width:min(var(--sw),calc(100% - 52px))}.cx.nr .xsz{display:none}.cx.nr .xmm{display:none}.cx.nr .xsb .hd{display:none}
.cx.side-off .xside,.cx.side-off .xsz{display:none}
.cx .tr{display:flex;align-items:center;height:24px;cursor:pointer;white-space:nowrap;font-size:12px;color:var(--xfg);padding-right:8px;position:relative}.cx .tr:hover{background:rgba(128,128,128,.16)}.cx .tr.sel{background:rgba(79,124,255,.24)}.cx .tr.act .nm{color:var(--acc,#6c93ff)}
.cx .tr .chv{width:16px;height:16px;flex:none;display:grid;place-items:center}.cx .tr .chv:before{content:"";width:5px;height:5px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(-45deg);transition:transform .15s;opacity:.8}.cx .tr .chv.o:before{transform:rotate(45deg)}.cx .tr .chv.e:before{display:none}
.cx .tr .ic{width:16px;height:16px;flex:none;margin:0 6px 0 2px}.cx .tr .ic svg{width:16px;height:16px;display:block;stroke:none}.cx .tr .nm{overflow:hidden;text-overflow:ellipsis}
.cx .tr.root{font-weight:700;font-size:12.5px;text-transform:uppercase;letter-spacing:.4px;height:26px}.cx .tr.root .nm{flex:1}.cx .tr input{flex:1;min-width:0;height:20px;background:var(--xbg);border:1px solid var(--acc,#4f7cff);outline:0;padding:0 4px;font-size:12px;border-radius:3px;-webkit-user-select:text;user-select:text}
.cx .tr.ld{opacity:.6;font-style:italic}.cx .xnote{padding:14px 14px;color:var(--xgut);line-height:1.55}.cx .xnote button{margin-top:8px;border:0;border-radius:7px;padding:7px 12px;background:var(--acc,#4f7cff);color:#fff;cursor:pointer;display:block}
.cx .xsf{padding:8px 10px;display:flex;flex-direction:column;gap:6px}.cx .xsf input[type=text],.cx .xset input[type=text],.cx .xset input[type=number],.cx .xset select{width:100%;height:28px;padding:0 8px;border-radius:6px;border:1px solid var(--xb);background:var(--xbg);outline:0;-webkit-user-select:text;user-select:text}.cx .xsf input:focus,.cx .xset input:focus,.cx .xset select:focus{border-color:var(--acc,#4f7cff)}
.cx .xtg{display:flex;gap:4px}.cx .xtg button{height:24px;min-width:28px;border:1px solid var(--xb);border-radius:5px;background:none;cursor:pointer;font-size:11.5px}.cx .xtg button.on{background:var(--acc,#4f7cff);color:#fff;border-color:transparent}
.cx .xsr .rf{padding:4px 10px;font-weight:600;display:flex;gap:6px;align-items:center;cursor:pointer}.cx .xsr .rf:hover{background:rgba(128,128,128,.16)}.cx .xsr .rf .ic svg{width:14px;height:14px;display:block;stroke:none}.cx .xsr .rm{padding:2px 10px 2px 30px;font-size:11.5px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--xgut)}.cx .xsr .rm:hover{background:rgba(128,128,128,.16)}.cx .xsr mark{background:rgba(255,200,0,.35);color:var(--xfg);border-radius:2px}
.cx .xset{padding:10px 12px;display:flex;flex-direction:column;gap:12px}.cx .xset label{display:flex;flex-direction:column;gap:4px;color:var(--xgut);font-size:11.5px}.cx .xset .row{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--xfg);font-size:12.5px}
.cx .sw{position:relative;width:34px;height:18px;border-radius:9px;background:rgba(128,128,128,.4);cursor:pointer;flex:none;transition:background .2s}.cx .sw:after{content:"";position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .2s}.cx .sw.on{background:var(--acc,#4f7cff)}.cx .sw.on:after{transform:translateX(16px)}
.cx .xfind{position:absolute;top:6px;right:14px;z-index:6;display:none;flex-direction:column;gap:4px;padding:6px;border-radius:8px;background:var(--xbg);background:color-mix(in srgb,var(--xbg) 88%,#888);border:1px solid var(--xb);box-shadow:0 6px 22px rgba(0,0,0,.35);width:min(360px,calc(100% - 24px))}.cx .xfind.on{display:flex}
.cx .xfind .fr{display:flex;align-items:center;gap:3px}.cx .xfind input{flex:1;min-width:0;height:26px;border-radius:5px;border:1px solid var(--xb);background:var(--xbg);padding:0 7px;outline:0;-webkit-user-select:text;user-select:text}.cx .xfind input:focus{border-color:var(--acc,#4f7cff)}
.cx .xfind button{height:26px;min-width:26px;border:0;border-radius:5px;background:none;cursor:pointer;font-size:11.5px}.cx .xfind button:hover{background:rgba(128,128,128,.25)}.cx .xfind button.on{background:var(--acc,#4f7cff);color:#fff}.cx .xfind small{min-width:54px;text-align:center;color:var(--xgut)}.cx .xfind .rr{display:none}.cx .xfind.rep .rr{display:flex}
.cx .xpal{position:absolute;left:50%;top:40px;transform:translateX(-50%);width:min(560px,94%);z-index:20;display:none;flex-direction:column;border-radius:10px;background:var(--xbg);background:color-mix(in srgb,var(--xbg) 90%,#888);border:1px solid var(--xb);box-shadow:0 14px 44px rgba(0,0,0,.5);overflow:hidden}.cx .xpal.on{display:flex;animation:xpop .16s cubic-bezier(.2,.9,.3,1.2)}
@keyframes xpop{from{opacity:0;transform:translateX(-50%) translateY(-8px) scale(.98)}}
.cx .xpal input{margin:8px;height:32px;border-radius:6px;border:1px solid var(--acc,#4f7cff);background:var(--xbg);padding:0 10px;outline:0;-webkit-user-select:text;user-select:text}.cx .xpl{max-height:min(330px,50vh);overflow:auto;padding-bottom:6px}
.cx .xpl div{display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;white-space:nowrap}.cx .xpl div.on{background:var(--acc,#4f7cff);color:#fff}.cx .xpl .ic svg{width:15px;height:15px;display:block;stroke:none}.cx .xpl .lb{overflow:hidden;text-overflow:ellipsis}.cx .xpl small{margin-left:auto;opacity:.65;padding-left:10px;overflow:hidden;text-overflow:ellipsis}
.cx .xmodal{position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}.cx .xmodal.on{display:flex}.cx .xmodal .bx{width:min(380px,90%);padding:16px;border-radius:12px;background:var(--xbg);border:1px solid var(--xb);box-shadow:0 18px 50px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:14px}
.cx .xmodal .bt{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}.cx .xmodal button{height:30px;padding:0 14px;border:0;border-radius:7px;background:rgba(128,128,128,.25);cursor:pointer}.cx .xmodal button.pr{background:var(--acc,#4f7cff);color:#fff}
.xmenu{position:fixed;z-index:9600;min-width:200px;max-height:70vh;overflow:auto;padding:6px;border-radius:10px;background:var(--pn,var(--surf,#1d2130));color:var(--txt,#e8ecf4);border:1px solid var(--line,rgba(128,128,128,.3));box-shadow:var(--pop-sh,0 14px 40px rgba(0,0,0,.45));font:13px system-ui,sans-serif;opacity:0;transform:scale(.95) translateY(-4px);transform-origin:top left;transition:opacity .13s,transform .18s cubic-bezier(.2,.9,.3,1.2)}
.xmenu.on{opacity:1;transform:none}.xmenu button{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}.xmenu button:hover{background:var(--hov,rgba(128,128,128,.2))}.xmenu button.dg{color:#ff6b6b}.xmenu button:disabled{opacity:.4}.xmenu small{opacity:.55;font-size:11px}.xmenu .sp{height:1px;margin:4px 6px;background:var(--line,rgba(128,128,128,.3))}
html[data-skin="glass"] .xmenu{backdrop-filter:blur(26px) saturate(1.5);-webkit-backdrop-filter:blur(26px) saturate(1.5)}
body.perf .cx *,body.rm .cx *{animation-duration:.01s!important;transition-duration:.01s!important}
`;
document.head.appendChild(st);

/* ---------- formatters ---------- */
function fmtBrace(t,ind){var d=0,out=[];t.split('\n').forEach(function(l){var s=l.trim();if(!s){out.push('');return}var o=(s.match(/^[\]})]+/)||[''])[0].length;var cur=Math.max(0,d-(o?1:0));out.push(ind.repeat(cur)+s);var c=(s.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g,'').match(/[({\[]/g)||[]).length-(s.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g,'').match(/[)}\]]/g)||[]).length;d=Math.max(0,d+c)});return out.join('\n').replace(/[ \t]+$/gm,'')}
function fmtHtml(t,ind){var d=0,V=/^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;return t.replace(/>\s*</g,'>\n<').split('\n').map(function(l){var s=l.trim();if(!s)return '';var m=/^<\/(\w+)/.exec(s);if(m)d=Math.max(0,d-1);var r=ind.repeat(d)+s;var o=/^<(\w+)/.exec(s);if(o&&!V.test(o[1])&&!/\/>$/.test(s)&&!new RegExp('</'+o[1]+'>\\s*$','i').test(s)&&!/^<!/.test(s))d++;return r}).join('\n')}
CX.addFormatter('json',function(t){return JSON.stringify(JSON.parse(t),null,2)+'\n'});
CX.addFormatter('css',function(t,ind){return fmtBrace(t.replace(/\s*\{\s*/g,' {\n').replace(/;\s*(?!\n)/g,';\n').replace(/\s*\}\s*/g,'\n}\n'),ind).replace(/\n{3,}/g,'\n\n').trim()+'\n'});
CX.addFormatter('html',fmtHtml);CX.addFormatter('xml',fmtHtml);
['js','ts','java','c','cpp','cs','go','rs','php','kt'].forEach(function(l){CX.addFormatter(l,fmtBrace)});

/* ---------- snippets ---------- */
CX.addSnippets('js',{log:'console.log($0);',fn:'function ${1:name}() {\n\t$0\n}',for:'for (let i = 0; i < ${1:n}; i++) {\n\t$0\n}',afn:'const ${1:name} = async () => {\n\t$0\n};'});
CX.addSnippets('ts',CX.snippets.js);
CX.addSnippets('html',{'!':'<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>'});
CX.addSnippets('py',{main:'def main():\n\t$0\n\n\nif __name__ == "__main__":\n\tmain()',def:'def ${1:name}():\n\t$0'});

/* ---------- runners ---------- */
var BOOT='(function(){function f(a){return Array.prototype.map.call(a,function(x){if(typeof x==="string")return x;if(x instanceof Error)return x.stack||x.message;try{var j=JSON.stringify(x,null,2);return j===undefined?String(x):j}catch(e){return String(x)}}).join(" ")}var P=function(t,a){self.postMessage({t:t,m:f(a)})};console.log=function(){P("log",arguments)};console.info=function(){P("info",arguments)};console.warn=function(){P("warn",arguments)};console.error=function(){P("err",arguments)};console.debug=console.log;self.onerror=function(m,s,l,c,e){P("err",[e||m]);return true};self.onunhandledrejection=function(e){P("err",[e.reason])}})();\n';
function wmsg(c,m){var d=m.data||{};if(d.t==='done'){c.done();return}c.print(d.m,d.t==='err'?'err':d.t==='warn'?'warn':d.t==='info'?'info':'')}
function runJs(code,c){var url=URL.createObjectURL(new Blob([BOOT+'(async()=>{try{'+code+'\n}catch(e){console.error(e)}})().then(function(){self.postMessage({t:"done"})})'],{type:'text/javascript'})),wk=new Worker(url);wk.onmessage=function(m){wmsg(c,m)};wk.onerror=function(e){c.print(e.message||'Worker error','err');c.done()};return{stop:function(){wk.terminate();URL.revokeObjectURL(url)}}}
var tsLoad=null;
function loadTs(){if(window.ts&&window.ts.transpileModule)return Promise.resolve();return tsLoad||(tsLoad=new Promise(function(res,rej){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/typescript@5.5.4/lib/typescript.js';s.onload=res;s.onerror=function(){tsLoad=null;rej(new Error('Could not load the TypeScript compiler (needs internet).'))};document.head.appendChild(s)}))}
CX.addRunner('js',function(I,d,c){return runJs(d.text,c)});
CX.addRunner('ts',function(I,d,c){var stop=null,dead=0;c.print('Loading TypeScript compiler...','dim');loadTs().then(function(){if(dead)return;var o=window.ts.transpileModule(d.text,{compilerOptions:{target:'ES2020',module:'None'}});stop=runJs(o.outputText,c).stop}).catch(function(e){c.print(e.message,'err');c.done()});return{stop:function(){dead=1;if(stop)stop()}}});
var PYW=null,PYSINK=null,PYSRC='importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");var py=null;self.onmessage=async function(e){try{if(!py){self.postMessage({t:"info",m:"Loading Python runtime (first run needs internet, ~10 MB)..."});py=await loadPyodide();py.setStdout({batched:function(s){self.postMessage({t:"log",m:s})}});py.setStderr({batched:function(s){self.postMessage({t:"err",m:s})}})}await py.loadPackagesFromImports(e.data.code);var r=await py.runPythonAsync(e.data.code);if(e.data.repl&&r!==undefined)self.postMessage({t:"log",m:String(r)});self.postMessage({t:"done"})}catch(err){self.postMessage({t:"err",m:String(err.message||err)});self.postMessage({t:"done"})}};';
function pyRun(code,c,repl){if(!PYW){var u=URL.createObjectURL(new Blob([PYSRC],{type:'text/javascript'}));PYW=new Worker(u);PYW.onmessage=function(m){if(PYSINK)wmsg(PYSINK,m)};PYW.onerror=function(){if(PYSINK){PYSINK.print('Could not start Python (needs internet for the first run).','err');PYSINK.done()}}}PYSINK=c;PYW.postMessage({code:code,repl:!!repl});return{stop:function(){if(PYW){PYW.terminate();PYW=null}}}}
CX.addRunner('py',function(I,d,c){return pyRun(d.text,c)});
function rd(path){return nf().readText({path:path}).then(function(r){return r.text})}
function inlineHtml(html,path){if(!path||!nf())return Promise.resolve(html);var dd=dirOf(path),jobs=[];
 function local(h){return h&&!/^(https?:|data:|\/\/|#)/i.test(h)}
 html.replace(/<link\b[^>]*>/gi,function(tag){var m=/href=["']([^"']+)["']/i.exec(tag);if(m&&/stylesheet/i.test(tag)&&local(m[1]))jobs.push({tag:tag,p:norm(join(dd,m[1].split('?')[0])),k:'css'});return tag});
 html.replace(/<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,function(tag,src){if(local(src))jobs.push({tag:tag,p:norm(join(dd,src.split('?')[0])),k:'js'});return tag});
 return Promise.all(jobs.map(function(j){return rd(j.p).then(function(t){j.t=t}).catch(function(){j.t=null})})).then(function(){jobs.forEach(function(j){if(j.t==null)return;html=html.split(j.tag).join(j.k==='css'?'<style>'+j.t+'</style>':'<script>'+j.t.replace(/<\/script/gi,'<\\/script')+'<\/script>')});return html})}
var HOOK='<script>(function(){function s(t,a){parent.postMessage({cx:1,t:t,m:Array.prototype.map.call(a,function(x){try{return typeof x==="string"?x:JSON.stringify(x)}catch(e){return String(x)}}).join(" ")},"*")}["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k==="error"?"err":k,arguments);o.apply(console,arguments)}});addEventListener("error",function(e){s("err",[e.message])})})()<\/script>';
CX.addRunner('html',function(I,d,c){inlineHtml(d.text,d.path).then(function(h){c.preview(HOOK+h)});return{stop:function(){}}});
CX.addRunner('xml',function(I,d,c){if(!/<svg\b/i.test(d.text)){c.print('Only SVG files can be previewed.','warn');c.done();return}c.preview(d.text);return{stop:function(){}}});
CX.addRunner('css',function(I,d,c){c.preview('<style>body{font:15px system-ui;margin:18px}'+d.text.replace(/<\/style/gi,'')+'</style><h1>Heading 1</h1><h2>Heading 2</h2><p>Paragraph with a <a href="#">link</a>, <b>bold</b> and <i>italic</i> text.</p><button>Button</button> <input placeholder="Input"> <select><option>Select</option></select><ul><li>One</li><li>Two</li></ul><div class="box">.box</div><div id="app">#app</div>');return{stop:function(){}}});
function mdHtml(s){var out=[],inC=0,inL=0;function il(t){return esc(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g,'$1<i>$2</i>').replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img alt="$1" src="$2" style="max-width:100%">').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>')}
 s.split('\n').forEach(function(l){if(/^\s*```/.test(l)){out.push(inC?'</pre>':'<pre>');inC=!inC;return}if(inC){out.push(esc(l));return}var m;
  if((m=/^\s*[-*+]\s+(.*)/.exec(l))){if(!inL){out.push('<ul>');inL=1}out.push('<li>'+il(m[1])+'</li>');return}if(inL){out.push('</ul>');inL=0}
  if((m=/^(#{1,6})\s+(.*)/.exec(l)))out.push('<h'+m[1].length+'>'+il(m[2])+'</h'+m[1].length+'>');else if(/^---+$/.test(l.trim()))out.push('<hr>');else if((m=/^>\s?(.*)/.exec(l)))out.push('<blockquote>'+il(m[1])+'</blockquote>');else if(l.trim())out.push('<p>'+il(l)+'</p>')});
 return out.join('\n')+(inC?'</pre>':'')+(inL?'</ul>':'')}
CX.addRunner('md',function(I,d,c){c.preview('<style>body{font:15px/1.6 system-ui;margin:18px;max-width:760px}code{background:#8882;padding:1px 5px;border-radius:4px}pre{background:#8881;padding:10px;border-radius:8px;overflow:auto}blockquote{border-left:3px solid #8886;margin:0;padding-left:12px;color:#777}</style>'+mdHtml(d.text));return{stop:function(){}}});
CX.addRunner('json',function(I,d,c){try{var v=JSON.parse(d.text);c.print('Valid JSON ('+(Array.isArray(v)?'array of '+v.length:typeof v==='object'&&v?Object.keys(v).length+' keys':typeof v)+')','ok')}catch(e){c.print('Invalid JSON: '+e.message,'err')}c.done();return{stop:function(){}}});
CX.addRunner('bat',function(I,d,c){if(!d.path){c.print('Save the file first, then run it.','warn');c.done();return}I.save(d,true).then(function(){try{openApp('term',{bat:d.path});c.print('Opened in Terminal.','dim')}catch(e){c.print(String(e),'err')}c.done()});return{stop:function(){}}});

/* ---------- commands ---------- */
function C(id,title,fn,key){CX.addCommand(id,title,fn,key)}
C('file.new','File: New File',function(I){I.newDoc()},'Ctrl+N');C('file.save','File: Save',function(I){I.save()},'Ctrl+S');C('file.saveAs','File: Save As...',function(I){I.saveAs()},'Ctrl+Shift+S');C('file.saveAll','File: Save All',function(I){I.docs.forEach(function(d){if(d.path)I.save(d,true)})});
C('file.open','File: Open File...',function(I){I.openDialog()});C('folder.open','File: Open Folder...',function(I){I.folderDialog()});C('tab.close','View: Close Tab',function(I){I.cur&&I.close(I.cur)},'Ctrl+W');C('tab.closeAll','View: Close All Tabs',function(I){I.docs.slice().forEach(function(d){I.close(d)})});
C('pal.files','Go to File...',function(I){I.palette('')},'Ctrl+P');C('pal.cmds','Show All Commands',function(I){I.palette('>')},'Ctrl+Shift+P');C('pal.cmds2','Show All Commands (F1)',function(I){I.palette('>')},'F1');C('edit.goto','Go to Line...',function(I){I.palette(':')},'Ctrl+G');
C('view.sidebar','View: Toggle Sidebar',function(I){I.toggleSide()},'Ctrl+B');C('view.panel','View: Toggle Panel',function(I){I.togglePanel()},'Ctrl+J');C('term.open','View: Toggle Terminal',function(I){I.panelShow('term')},'Ctrl+`');
C('view.explorer','View: Show Explorer',function(I){I.showView('explorer')},'Ctrl+Shift+E');C('view.search','View: Show Search',function(I){I.showView('search')},'Ctrl+Shift+F');C('view.settings','Preferences: Open Settings',function(I){I.showView('settings')},'Ctrl+,');
C('view.minimap','View: Toggle Minimap',function(I){SET.mini=!SET.mini;saveSet()});C('view.zoomIn','View: Increase Font Size',function(I){SET.size=clamp(SET.size+1,9,32);saveSet()},'Ctrl+=');C('view.zoomOut','View: Decrease Font Size',function(I){SET.size=clamp(SET.size-1,9,32);saveSet()},'Ctrl+-');
C('theme.pick','Preferences: Color Theme',function(I){I.pick('Select color theme',[{label:'Auto (follow NexOS)',run:function(){SET.theme='auto';saveSet()}}].concat(Object.keys(CX.themes).map(function(id){return{label:CX.themes[id].name,detail:CX.themes[id].dark?'dark':'light',run:function(){SET.theme=id;saveSet()}}})))});
C('lang.pick','Change Language Mode',function(I){var d=I.cur;if(!d)return;I.pick('Select language',Object.keys(CX.langs).map(function(id){return{label:CX.langs[id].name,detail:id,run:function(){d.lang=id;d.ed.render();I.status()}}}))});
C('indent.pick','Change Tab Size',function(I){I.pick('Tab size',[2,4,8].map(function(n){return{label:String(n),run:function(){SET.tab=n;saveSet()}}}))});
C('auto.toggle','File: Toggle Auto Save',function(I){SET.auto=!SET.auto;saveSet();tst('Auto save '+(SET.auto?'on':'off'))});
C('run.run','Run: Run Code',function(I){I.runDoc()},'F5');C('run.run2','Run: Run Code (Ctrl+Enter)',function(I){I.runDoc()},'Ctrl+Enter');C('run.stop','Run: Stop',function(I){I.stopRun()});
C('edit.find','Edit: Find',function(I){I.find(false)},'Ctrl+F');C('edit.replace','Edit: Replace',function(I){I.find(true)},'Ctrl+H');C('edit.comment','Edit: Toggle Line Comment',function(I){I.edit('comment')},'Ctrl+/');C('edit.format','Edit: Format Document',function(I){I.format()},'Shift+Alt+F');
C('edit.dup','Edit: Duplicate Line',function(I){I.edit('dup')},'Shift+Alt+ArrowDown');C('edit.up','Edit: Move Line Up',function(I){I.edit('up')},'Alt+ArrowUp');C('edit.down','Edit: Move Line Down',function(I){I.edit('down')},'Alt+ArrowDown');C('edit.del','Edit: Delete Line',function(I){I.edit('del')},'Ctrl+Shift+K');
C('edit.undo','Edit: Undo',function(I){I.exec('undo')});C('edit.redo','Edit: Redo',function(I){I.exec('redo')});C('edit.all','Edit: Select All',function(I){I.cur&&I.cur.ed.ta.select()});
C('exp.refresh','Explorer: Refresh',function(I){I.explorer&&I.explorer.refresh()});C('exp.collapse','Explorer: Collapse All',function(I){I.explorer&&I.explorer.collapse()});C('exp.newFile','Explorer: New File',function(I){I.showView('explorer');I.explorer&&I.explorer.create(false)});C('exp.newFolder','Explorer: New Folder',function(I){I.showView('explorer');I.explorer&&I.explorer.create(true)});

/* ---------- editor pane ---------- */
var OP={'(':')','[':']','{':'}'},CLS={')':'(',']':'[','}':'{'},PAIR={'(':')','[':']','{':'}','"':'"',"'":"'",'`':'`'},PX=12,PY=8;
function matchBr(v,s){var i=-1,c;if(OP[v[s-1]]||CLS[v[s-1]])i=s-1;else if(OP[v[s]]||CLS[v[s]])i=s;if(i<0)return null;c=v[i];var dn=1,j;
 if(OP[c]){for(j=i+1;j<v.length&&j<i+30000;j++){var x=v[j];if(x===c)dn++;else if(x===OP[c]&&--dn===0)return[i,j]}}else{for(j=i-1;j>=0&&j>i-30000;j--){var y=v[j];if(y===c)dn++;else if(y===CLS[c]&&--dn===0)return[j,i]}}return null}
function ins(ta,t){ta.focus();var ok=false;try{ok=document.execCommand('insertText',false,t)}catch(e){}if(!ok){ta.setRangeText(t,ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input',{bubbles:true}))}}
function mkEditor(I,d){
 var p=el('div','xed'),E={d:d,p:p};
 p.innerHTML='<div class="xg"><pre></pre></div><div class="xc"><div class="xbx"></div><pre class="xpre"></pre><textarea class="xta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div><div class="xmm"><canvas></canvas><i class="xms"></i></div>';
 var gut=p.querySelector('.xg pre'),bx=p.querySelector('.xbx'),pre=p.querySelector('.xpre'),ta=p.querySelector('.xta'),mmc=p.querySelector('canvas'),mms=p.querySelector('.xms'),mm=p.querySelector('.xmm');
 E.ta=ta;ta.value=d.text;var lh=20,cw=8,n0=-1,rf=0,cf=0,busy=false;E.finds=[];E.cur=-1;
 function metrics(){var cs=getComputedStyle(ta);lh=parseFloat(cs.lineHeight)||SET.size*1.6;var cv=(metrics.cv||(metrics.cv=document.createElement('canvas'))).getContext('2d');cv.font=cs.fontSize+' '+cs.fontFamily;cw=cv.measureText('MMMMMMMMMM').width/10||8}
 function vcol(s){var c=0,t=SET.tab;for(var i=0;i<s.length;i++)c=s.charCodeAt(i)===9?c+t-(c%t):c+1;return c}
 function pos(){var v=ta.value,s=ta.selectionStart,ln=1,i=-1;while((i=v.indexOf('\n',i+1))!==-1&&i<s)ln++;var ls=v.lastIndexOf('\n',s-1)+1;return{ln:ln,col:s-ls+1,ls:ls,s:s}}
 function lnOf(v,ix){var n=1,i=-1;while((i=v.indexOf('\n',i+1))!==-1&&i<ix)n++;return n}
 function boxAt(v,ix,len,cls){var ls=v.lastIndexOf('\n',ix-1)+1;return '<i class="'+cls+'" style="left:'+(PX+vcol(v.slice(ls,ix))*cw)+'px;top:'+(PY+(lnOf(v,ix)-1)*lh)+'px;width:'+(len*cw)+'px;height:'+lh+'px"></i>'}
 function boxes(){var q=pos(),v=ta.value,h='<i class="bl" style="top:'+(PY+(q.ln-1)*lh)+'px;height:'+lh+'px"></i>';
  if(SET.brk&&ta.selectionStart===ta.selectionEnd){var m=matchBr(v,q.s);if(m)h+=boxAt(v,m[0],1,'bb')+boxAt(v,m[1],1,'bb')}
  var vs=ta.scrollTop/lh-2,ve=(ta.scrollTop+ta.clientHeight)/lh+2,k=0;for(var i=0;i<E.finds.length&&k<300;i++){var f=E.finds[i],fl=lnOf(v,f[0]);if(fl>=vs&&fl<=ve){h+=boxAt(v,f[0],Math.min(f[1],200),'fm'+(i===E.cur?' cu':''));k++}}
  bx.innerHTML=h}
 function sync(){var tr='translate('+(-ta.scrollLeft)+'px,'+(-ta.scrollTop)+'px)';pre.style.transform=tr;bx.style.transform=tr;gut.style.transform='translateY('+(-ta.scrollTop)+'px)';mmSl()}
 function mmDraw(){if(!SET.mini||!mm.offsetWidth)return;var w=mmc.clientWidth,h=mmc.clientHeight;if(!w||!h)return;if(mmc.width!==w)mmc.width=w;if(mmc.height!==h)mmc.height=h;var g=mmc.getContext('2d');g.clearRect(0,0,w,h);var ls=ta.value.split('\n'),n=ls.length,sc=Math.min(2,h/n),cs=getComputedStyle(p),fg=cs.getPropertyValue('--xfg').trim()||'#ccc',cc=cs.getPropertyValue('--xc').trim()||'#777',kk=cs.getPropertyValue('--xk').trim()||'#a8f';
  for(var i=0;i<n;i++){var l=ls[i],t=l.replace(/^\s+/,'');if(!t)continue;var ind=(l.length-t.length)*.7,len=Math.min(t.length*.7,w-ind-4);g.fillStyle=/^(\/\/|#|\/\*|\*|--)/.test(t)?cc:/^(function|class|const|let|var|def|import|export|return|if|for)\b/.test(t)?kk:fg;g.globalAlpha=.55;g.fillRect(2+ind,i*sc,len,Math.max(1,sc-.7))}g.globalAlpha=1;E.mmsc=sc}
 function mmSl(){if(!SET.mini)return;var sc=E.mmsc||2,t=ta.scrollTop/lh*sc,h=Math.max(12,ta.clientHeight/lh*sc);mms.style.top=Math.min(t,mm.clientHeight-12)+'px';mms.style.height=h+'px'}
 E.mmGo=function(y){var sc=E.mmsc||2;ta.scrollTop=y/sc*lh-ta.clientHeight/2};
 mm.addEventListener('pointerdown',function(e){e.preventDefault();mm.setPointerCapture(e.pointerId);var r=mm.getBoundingClientRect();E.mmGo(e.clientY-r.top);mm.onpointermove=function(ev){E.mmGo(ev.clientY-r.top)};mm.onpointerup=mm.onpointercancel=function(){mm.onpointermove=null}});
 function render(){rf=0;var v=ta.value,n=1,i=-1;while((i=v.indexOf('\n',i+1))!==-1)n++;pre.innerHTML=hl(v,d.lang)+'\n';if(n!==n0){n0=n;var s='';for(var k=1;k<=n;k++)s+=k+'\n';gut.textContent=s;p.style.setProperty('--gw',(String(n).length*cw+24)+'px')}mmDraw();caret()}
 function sched(){if(!rf)rf=requestAnimationFrame(render)}
 function caret(){cf=0;boxes();sync();if(I.cur===d)I.status()}
 function csched(){if(!cf)cf=requestAnimationFrame(caret)}
 E.render=function(){metrics();n0=-1;render()};E.refresh=E.render;E.caret=csched;E.pos=pos;E.boxes=boxes;
 E.goto=function(line,col){var v=ta.value,ix=0,i=1;while(i<line){var j=v.indexOf('\n',ix);if(j<0)break;ix=j+1;i++}var e=v.indexOf('\n',ix);if(e<0)e=v.length;var s=Math.min(ix+(col?col-1:0),e);ta.focus();ta.setSelectionRange(s,col?s:e);ta.scrollTop=Math.max(0,(line-1)*lh-ta.clientHeight/3);csched()};
 function lineRange(){var v=ta.value,s=ta.selectionStart,e=ta.selectionEnd;if(e>s&&v[e-1]==='\n')e--;var a=v.lastIndexOf('\n',s-1)+1,b=v.indexOf('\n',e);if(b<0)b=v.length;return[a,b]}
 function rep(a,b,t,sa,sb){ta.setSelectionRange(a,b);busy=true;ins(ta,t);busy=false;ta.setSelectionRange(sa==null?a:sa,sb==null?a+t.length:sb)}
 var unit=function(){return SET.spaces?' '.repeat(SET.tab):'\t'};
 E.edit=function(k){var v=ta.value,r=lineRange(),a=r[0],b=r[1],blk=v.slice(a,b),u=unit(),Lg=CX.langs[d.lang]||{},cm=Lg.cmt;
  if(k==='comment'){if(!cm)return;var ls=blk.split('\n'),all=ls.every(function(l){return !l.trim()||l.trim().indexOf(cm)===0});var o=ls.map(function(l){if(!l.trim())return l;var ind=l.match(/^\s*/)[0];return all?ind+l.slice(ind.length).replace(new RegExp('^'+rxEsc(cm)+' ?'),''):ind+cm+' '+l.slice(ind.length)}).join('\n');rep(a,b,o)}
  else if(k==='dup'){rep(b,b,'\n'+blk,b+1,b+1+blk.length)}
  else if(k==='del'){rep(a,Math.min(b+1,v.length),'',a,a)}
  else if(k==='up'&&a>0){var pa=v.lastIndexOf('\n',a-2)+1,pl=v.slice(pa,a-1);rep(pa,b,blk+'\n'+pl,pa,pa+blk.length)}
  else if(k==='down'&&b<v.length){var nb=v.indexOf('\n',b+1);if(nb<0)nb=v.length;var nl=v.slice(b+1,nb);rep(a,nb,nl+'\n'+blk,a+nl.length+1,a+nl.length+1+blk.length)}
  else if(k==='indent'||k==='outdent'){var o2=blk.split('\n').map(function(l){if(k==='indent')return l.length?u+l:l;return l.replace(new RegExp('^(?:'+rxEsc(u)+'|\\t| {1,'+SET.tab+'})'),'')}).join('\n');rep(a,b,o2,a,a+o2.length)}
  ta.focus()};
 E.expand=function(){var v=ta.value,s=ta.selectionStart;if(s!==ta.selectionEnd)return false;var m=/[\w!.-]+$/.exec(v.slice(0,s));if(!m)return false;var sn=(CX.snippets[d.lang]||{})[m[0]]||(CX.snippets['*']||{})[m[0]];if(!sn)return false;
  var ls=v.lastIndexOf('\n',s-1)+1,ind=(v.slice(ls,s).match(/^[ \t]*/)||[''])[0],body=sn.replace(/\t/g,SET.spaces?' '.repeat(SET.tab):'\t').replace(/\n/g,'\n'+ind).replace(/\$\{\d+:([^}]*)\}/g,'$1').replace(/\$\{\d+\}/g,'').replace(/\$(\d)/g,''),ci=body.indexOf('$0');if(ci<0)ci=body.length;body=body.replace('$0','');
  var st=s-m[0].length;ta.setSelectionRange(st,s);busy=true;ins(ta,body);busy=false;ta.setSelectionRange(st+ci,st+ci);return true};
 ta.addEventListener('input',function(){d.text=ta.value;sched();I.changed(d)});
 ta.addEventListener('scroll',function(){sync();if(E.finds.length)csched()});
 ['click','keyup','select','focus'].forEach(function(n){ta.addEventListener(n,csched)});
 ta.addEventListener('beforeinput',function(e){if(busy)return;var t=e.inputType,dt=e.data,s=ta.selectionStart,en=ta.selectionEnd,v=ta.value;
  if(t==='insertLineBreak'||t==='insertParagraph'){var ls=v.lastIndexOf('\n',s-1)+1,ind=(v.slice(ls,s).match(/^[ \t]*/)||[''])[0],pc=v[s-1],nc=v[en],ex=(/[{(\[]/.test(pc)||(pc===':'&&/^(py|yaml)$/.test(d.lang)))?unit():'';e.preventDefault();busy=true;
   if(ex&&PAIR[pc]===nc){ins(ta,'\n'+ind+ex+'\n'+ind);ta.setSelectionRange(s+1+ind.length+ex.length,s+1+ind.length+ex.length)}else ins(ta,'\n'+ind+ex);busy=false;return}
  if(!SET.brk)return;
  if(t==='insertText'&&dt&&dt.length===1){var nx=v[en],pv=v[s-1];
   if((dt===')'||dt===']'||dt==='}'||dt==='"'||dt==="'"||dt==='`')&&s===en&&nx===dt){e.preventDefault();ta.setSelectionRange(s+1,s+1);return}
   if(PAIR[dt]){if(s!==en){e.preventDefault();busy=true;ins(ta,dt+v.slice(s,en)+PAIR[dt]);busy=false;ta.setSelectionRange(s+1,en+1);return}
    var q=dt==='"'||dt==="'"||dt==='`';if(q&&(/\w/.test(pv||'')||/\w/.test(nx||'')))return;if(!nx||/[\s)\]};,.:]/.test(nx)){e.preventDefault();busy=true;ins(ta,dt+PAIR[dt]);busy=false;ta.setSelectionRange(s+1,s+1)}}}
  else if(t==='deleteContentBackward'&&s===en&&v[s-1]&&PAIR[v[s-1]]===v[s]){e.preventDefault();ta.setSelectionRange(s-1,s+1);busy=true;ins(ta,'');busy=false}});
 ta.addEventListener('keydown',function(e){if(e.key==='Tab'&&!e.ctrlKey&&!e.altKey){e.preventDefault();var multi=ta.value.slice(ta.selectionStart,ta.selectionEnd).indexOf('\n')>-1;
   if(e.shiftKey)E.edit('outdent');else if(multi)E.edit('indent');else if(!E.expand()){busy=true;ins(ta,unit());busy=false}}});
 metrics();render();sync();return E}

/* ---------- instance ---------- */
var TPL='<div class="xtop"><button data-m="file">File</button><button data-m="edit">Edit</button><button data-m="view">View</button><button data-m="run">Run</button><span class="xsp"></span><button class="xi" data-a="pal" title="Command Palette (Ctrl+Shift+P)">'+ACT.cmd+'</button><button class="xrun" data-a="run" title="Run (F5)">'+ACT.play+'<span>Run</span></button></div>'+
 '<div class="xmain"><div class="xact"></div><div class="xside"><div class="xsh"><span class="xst"></span><span class="xsa"></span></div><div class="xsv"></div></div><div class="xsz"></div>'+
 '<div class="xcol"><div class="xtabs"></div><div class="xedw"><div class="xempty"><b>NexOS Code</b><small>Open a file from the Explorer, or</small><button data-a="newfile">New File</button><button data-a="openfolder">Open Folder...</button><small>Ctrl+P go to file &middot; Ctrl+Shift+P commands</small></div>'+
 '<div class="xfind"><div class="fr"><input class="fq" placeholder="Find"><button data-f="cs" title="Match case">Aa</button><button data-f="ww" title="Whole word">ab</button><button data-f="rx" title="Regex">.*</button><small class="fc"></small><button data-f="prev">&#8593;</button><button data-f="next">&#8595;</button><button data-f="tog" title="Toggle replace">&#8645;</button><button data-f="x">&#10005;</button></div><div class="fr rr"><input class="fp" placeholder="Replace"><button data-f="rep" title="Replace">&#8629;</button><button data-f="all" title="Replace all">All</button></div></div></div>'+
 '<div class="xpanel"><div class="xrz"></div><div class="xph"><button class="pt" data-pt="out">Output</button><button class="pt" data-pt="prev">Preview</button><button class="pt" data-pt="term">Terminal</button><span class="xsp"></span><button class="pb stp" data-pa="stop" title="Stop">&#9632;</button><button class="pb" data-pa="clear" title="Clear">'+ACT.del+'</button><button class="pb" data-pa="max" title="Maximize">&#9650;</button><button class="pb" data-pa="x" title="Close">'+ACT.x+'</button></div>'+
 '<div class="xpb"><div class="pn" data-pn="out"><div class="po"></div></div><div class="pn" data-pn="prev"><iframe class="pp" sandbox="allow-scripts allow-forms allow-modals allow-popups"></iframe></div><div class="pn" data-pn="term"><div class="tt2 po"></div><div class="trm"><b>&gt;</b><input placeholder="JavaScript, or: py &lt;code&gt;, run, clear, help" spellcheck="false" autocapitalize="off" autocomplete="off"></div></div></div></div></div></div>'+
 '<div class="xpal"><input><div class="xpl"></div></div><div class="xmodal"><div class="bx"><div class="mm"></div><div class="bt"></div></div></div><div class="xsb"></div>';

function build(w,arg){
 var body=w.body instanceof Element?w.body:(w.el&&w.el.querySelector('.body'));if(!body)throw new Error('window body not found');if(body.querySelector('.cx'))return;
 var single=!!(arg&&arg.path),root=el('div','cx'+(single?' single':''));root.tabIndex=-1;root.innerHTML=TPL;
 while(body.firstChild)body.removeChild(body.firstChild);body.style.padding='0';body.style.overflow='hidden';if(getComputedStyle(body).position==='static')body.style.position='relative';body.appendChild(root);
 function $(s){return root.querySelector(s)}
 var I={w:w,root:root,single:single,docs:[],cur:null,rootPath:null,view:null,vi:{},explorer:null,SET:SET},edw=$('.xedw'),tabs=$('.xtabs'),empty=$('.xempty'),sb=$('.xsb'),side=$('.xsv'),act=$('.xact');
 CX.inst.push(I);
 /* theme + settings */
 I.applySet=function(){var id=SET.theme==='auto'?(document.documentElement.getAttribute('data-theme')==='light'?'nexos-light':'nexos-dark'):SET.theme,t=CX.themes[id]||CX.themes['nexos-dark'],s=root.style;for(var k in t.v)s.setProperty('--x'+k,t.v[k]);root.classList.toggle('xdark',!!t.dark);
  s.setProperty('--xff',SET.font);s.setProperty('--xfs',SET.size+'px');s.setProperty('--xlh',Math.round(SET.size*1.6)+'px');s.setProperty('--xtab',SET.tab);root.classList.toggle('nomm',!SET.mini);root.classList.toggle('noln',!SET.ln);I.docs.forEach(function(d){d.ed.refresh()});I.status()};
 try{new MutationObserver(function(){if(SET.theme==='auto'&&root.isConnected)I.applySet()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-skin']})}catch(e){}
 I.toast=tst;I.pick=function(ph,items){palOpen('',{ph:ph,items:items})};I.palette=function(p){palOpen(p)};
 /* modal */
 function ask(msg,btns){var m=$('.xmodal');m.querySelector('.mm').textContent=msg;var bt=m.querySelector('.bt');bt.innerHTML='';btns.forEach(function(b){var x=el('button',b.p?'pr':'',esc(b.t));x.onclick=function(){m.classList.remove('on');if(b.f)b.f()};bt.appendChild(x)});m.classList.add('on')}
 I.ask=ask;
 /* ---- documents ---- */
 function dirty(d){return d.text!==d.saved}
 function title(){var d=I.cur;w.setTitle&&w.setTitle((d&&dirty(d)?'\u25CF ':'')+(d?d.name:'Code Editor')+' - Code Editor')}
 function renderTabs(){tabs.innerHTML=I.docs.map(function(d){return '<div class="xt'+(d===I.cur?' on':'')+(dirty(d)?' dirty':'')+'" data-id="'+d.id+'" title="'+esc(d.path||d.name)+'"><span class="ic">'+icon(d.name)+'</span><span class="nm">'+esc(d.name)+'</span><span class="cl" data-x="1">'+ACT.x+'</span></div>'}).join('');var a=tabs.querySelector('.on');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest',inline:'nearest'});empty.classList.toggle('on',!I.docs.length);title();if(I.explorer)I.explorer.paint()}
 I.renderTabs=renderTabs;
 var asT=0;I.changed=function(d){var t=tabs.querySelector('[data-id="'+d.id+'"]');if(t)t.classList.toggle('dirty',dirty(d));title();if(SET.auto&&d.path){clearTimeout(asT);asT=setTimeout(function(){if(dirty(d))I.save(d,true)},1200)}};
 function addDoc(o,activate){var d={id:++did,path:o.path||null,name:o.name||'untitled',text:o.text||'',lang:langOf(o.name||'untitled')};d.saved=o.path?d.text:'';d.ed=mkEditor(I,d);edw.insertBefore(d.ed.p,edw.firstChild);I.docs.push(d);if(activate!==false)I.show(d);else renderTabs();return d}
 I.show=function(d){if(!d)return;if(I.cur&&I.cur!==d&&SET.auto&&I.cur.path&&dirty(I.cur))I.save(I.cur,true);I.cur=d;I.docs.forEach(function(x){x.ed.p.classList.toggle('on',x===d)});renderTabs();d.ed.render();if(!narrow())d.ed.ta.focus();I.status();if(I.findOn())I.runFind(true)};
 I.newDoc=function(name,text){var n=name||'untitled-'+(I.docs.length+1)+'.js';return addDoc({name:n,text:text||''})};
 I.open=function(path,line){var ex=I.docs.filter(function(d){return d.path===path})[0];if(ex){I.show(ex);if(line)ex.ed.goto(line);return Promise.resolve(ex)}if(!nf()){tst('Opening files needs the Android app');return Promise.resolve(null)}
  return NF.readText({path:path}).then(function(r){var t=r.text||'';if(t.indexOf('\u0000')>-1){tst('Binary file - cannot open in the editor');return null}var d=addDoc({path:path,name:base(path),text:t});if(line)d.ed.goto(line);return d}).catch(function(e){tst((e&&e.message)||'Could not open file');return null})};
 I.close=function(d,force){if(!force&&dirty(d)){ask('Do you want to save the changes you made to '+d.name+'?',[{t:'Save',p:1,f:function(){I.save(d).then(function(ok){if(ok)I.close(d,true)})}},{t:"Don't Save",f:function(){I.close(d,true)}},{t:'Cancel'}]);return}
  var i=I.docs.indexOf(d);if(i<0)return;I.docs.splice(i,1);d.ed.p.remove();if(I.cur===d){I.cur=null;if(I.docs.length)I.show(I.docs[Math.min(i,I.docs.length-1)]);else{renderTabs();I.status()}}else renderTabs();if(single&&!I.docs.length){try{closeW(w.key||w.id)}catch(e){}}};
 function wr(d,path){var t=d.text;return NF.writeText({path:path,text:t}).then(function(){d.path=path;d.name=base(path);d.saved=t;d.lang=langOf(d.name);w.path=path;renderTabs();d.ed.render();I.status();return true}).catch(function(e){tst('Save failed: '+((e&&e.message)||''));return false})}
 I.save=function(d,quiet){d=d||I.cur;if(!d)return Promise.resolve(false);if(!nf()){if(!quiet)tst('Saving needs the Android app');return Promise.resolve(false)}if(!d.path)return quiet?Promise.resolve(false):I.saveAs(d);return wr(d,d.path).then(function(ok){if(ok&&!quiet)tst('Saved '+d.name);return ok})};
 I.saveAs=function(d){d=d||I.cur;if(!d)return Promise.resolve(false);if(!nf()){tst('Saving needs the Android app');return Promise.resolve(false)}return new Promise(function(res){home().then(function(h){dialog(w,{title:'Save as (full path)',def:d.path||join(I.rootPath||h,d.name)},function(p){if(!p){res(false);return}wr(d,p).then(res)})})})};
 function home(){return nf()?NF.roots().then(function(r){return ((r.roots[0]||{}).path||'/storage/emulated/0')+'/Documents'}).catch(function(){return '/storage/emulated/0/Documents'}):Promise.resolve('/')}
 I.openDialog=function(){home().then(function(h){dialog(w,{title:'Open file (full path)',def:(I.rootPath||h)+'/'},function(p){if(p)I.open(p)})})};
 I.folderDialog=function(){home().then(function(h){dialog(w,{title:'Open folder (full path)',def:I.rootPath||h},function(p){if(p)I.setRoot(p)})})};
 I.exec=function(c){var d=I.cur;if(d){d.ed.ta.focus();document.execCommand(c)}};I.edit=function(k){I.cur&&I.cur.ed.edit(k)};
 I.format=function(){var d=I.cur;if(!d)return;var f=CX.formatters[d.lang];if(!f){tst('No formatter for '+(CX.langs[d.lang]||{}).name+'. Install a formatter in Extensions.');return}try{var u=SET.spaces?' '.repeat(SET.tab):'\t',o=f(d.text,u);if(o!==d.text){var ta=d.ed.ta;ta.focus();ta.setSelectionRange(0,ta.value.length);ins(ta,o)}tst('Formatted')}catch(e){tst('Format failed: '+e.message)}};
 /* ---- find / replace ---- */
 var fw=$('.xfind'),fq=fw.querySelector('.fq'),fp=fw.querySelector('.fp'),fo={cs:0,ww:0,rx:0};
 I.findOn=function(){return fw.classList.contains('on')};
 I.find=function(rep){var d=I.cur;if(!d)return;fw.classList.add('on');fw.classList.toggle('rep',!!rep);var s=d.ed.ta.value.slice(d.ed.ta.selectionStart,d.ed.ta.selectionEnd);if(s&&s.indexOf('\n')<0)fq.value=s;fq.focus();fq.select();I.runFind(true)};
 function frx(){var q=fq.value;if(!q)return null;try{var s=fo.rx?q:rxEsc(q);if(fo.ww)s='\\b(?:'+s+')\\b';return new RegExp(s,'g'+(fo.cs?'':'i')+'m')}catch(e){return null}}
 I.runFind=function(jump){var d=I.cur;if(!d)return;var E=d.ed,re=frx(),v=E.ta.value;E.finds=[];E.cur=-1;if(re){var m,n=0;while((m=re.exec(v))&&n<5000){if(!m[0].length){re.lastIndex++;continue}E.finds.push([m.index,m[0].length]);n++}
   var s=E.ta.selectionStart;for(var i=0;i<E.finds.length;i++)if(E.finds[i][0]>=s){E.cur=i;break}if(E.cur<0&&E.finds.length)E.cur=0}
  fw.querySelector('.fc').textContent=E.finds.length?(E.cur+1)+' of '+E.finds.length:(fq.value?'No results':'');if(jump)fjump(E);E.boxes()};
 function fjump(E){var f=E.finds[E.cur];if(!f)return;E.ta.setSelectionRange(f[0],f[0]+f[1]);var ln=1,v=E.ta.value,i=-1;while((i=v.indexOf('\n',i+1))!==-1&&i<f[0])ln++;var lh=parseFloat(getComputedStyle(E.ta).lineHeight)||20;if((ln-1)*lh<E.ta.scrollTop||ln*lh>E.ta.scrollTop+E.ta.clientHeight-40)E.ta.scrollTop=Math.max(0,(ln-1)*lh-E.ta.clientHeight/3)}
 function fstep(dir){var d=I.cur;if(!d)return;var E=d.ed;if(!E.finds.length)return;E.cur=(E.cur+dir+E.finds.length)%E.finds.length;fjump(E);fw.querySelector('.fc').textContent=(E.cur+1)+' of '+E.finds.length;E.boxes()}
 function frep(all){var d=I.cur;if(!d)return;var E=d.ed,re=frx();if(!re)return;var ta=E.ta;if(all){var o=ta.value.replace(re,fp.value);ta.focus();ta.setSelectionRange(0,ta.value.length);ins(ta,o)}else{var f=E.finds[E.cur];if(!f)return;ta.setSelectionRange(f[0],f[0]+f[1]);var one=new RegExp(re.source,re.flags.replace('g',''));ins(ta,ta.value.slice(f[0],f[0]+f[1]).replace(one,fp.value))}I.runFind(true)}
 fw.addEventListener('click',function(e){var b=e.target.closest('[data-f]');if(!b)return;var k=b.dataset.f;if(k==='cs'||k==='ww'||k==='rx'){fo[k]=!fo[k];b.classList.toggle('on',!!fo[k]);I.runFind(true)}else if(k==='next')fstep(1);else if(k==='prev')fstep(-1);else if(k==='tog')fw.classList.toggle('rep');else if(k==='rep')frep(false);else if(k==='all')frep(true);else if(k==='x')closeFind()});
 function closeFind(){fw.classList.remove('on');if(I.cur){I.cur.ed.finds=[];I.cur.ed.boxes();if(!narrow())I.cur.ed.ta.focus()}}
 fq.addEventListener('input',function(){I.runFind(true)});fq.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();fstep(e.shiftKey?-1:1)}else if(e.key==='Escape')closeFind()});fp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();frep(e.ctrlKey)}else if(e.key==='Escape')closeFind()});
 /* ---- panel ---- */
 var panel=$('.xpanel'),po=$('.po'),pp=$('.pp'),term=$('.tt2'),tin=$('.trm input'),run={stop:null,t0:0};
 function pOut(t,c,target){var o=target||po,dv=el('div',c||'');dv.textContent=t;o.appendChild(dv);while(o.childNodes.length>1500)o.removeChild(o.firstChild);o.scrollTop=o.scrollHeight}
 I.panelShow=function(t){root.classList.add('xp-on');[].forEach.call(root.querySelectorAll('.pt'),function(b){b.classList.toggle('on',b.dataset.pt===t)});[].forEach.call(root.querySelectorAll('.pn'),function(p){p.classList.toggle('on',p.dataset.pn===t)});I.ptab=t;if(t==='term')setTimeout(function(){tin.focus()},30)};
 I.togglePanel=function(){if(root.classList.contains('xp-on'))root.classList.remove('xp-on');else I.panelShow(I.ptab||'out')};
 I.print=function(t,c){pOut(t,c)};
 I.stopRun=function(){if(run.stop){try{run.stop()}catch(e){}run.stop=null;pOut('\u25A0 Stopped','dim')}};
 var cx={print:function(t,c){pOut(t,c)},done:function(){if(run.stop){pOut('\u25A0 Finished in '+(Date.now()-run.t0)+' ms','dim');run.stop=null}},preview:function(h){pp.srcdoc=h;I.panelShow('prev')}};
 window.addEventListener('message',function(e){if(e.data&&e.data.cx&&e.source===pp.contentWindow){pOut(e.data.m,e.data.t==='err'?'err':e.data.t==='warn'?'warn':e.data.t==='info'?'info':'');if(I.ptab==='prev'&&SET.clear===false){}}});
 I.runDoc=function(){var d=I.cur;if(!d){tst('Open a file first');return}var fn=CX.runners[d.lang];I.stopRun();root.classList.add('xp-on');if(!fn){I.panelShow('out');pOut('No runner for '+((CX.langs[d.lang]||{}).name||d.lang)+'. Install a runner in Extensions.','warn');return}
  if(SET.clear)po.textContent='';I.panelShow('out');pOut('\u25B6 '+d.name+' ('+(CX.langs[d.lang]||{}).name+')','dim');run.t0=Date.now();var r;try{run.stop=function(){};r=fn(I,d,cx)}catch(e){pOut(String(e&&e.message||e),'err');run.stop=null;return}run.stop=(r&&r.stop)||function(){};var ls=run.stop;run.stop=ls};
 var rz=$('.xrz');rz.addEventListener('pointerdown',function(e){e.preventDefault();rz.setPointerCapture(e.pointerId);rz.classList.add('d');var y0=e.clientY,h0=panel.offsetHeight,col=$('.xcol');rz.onpointermove=function(ev){var h=clamp(h0-(ev.clientY-y0),60,col.clientHeight-100);root.style.setProperty('--ph',h+'px')};rz.onpointerup=rz.onpointercancel=function(){rz.onpointermove=null;rz.classList.remove('d');jset('aur.cx.ph',parseInt(root.style.getPropertyValue('--ph'))||230)}});
 rz.addEventListener('dblclick',function(){var col=$('.xcol'),max=col.clientHeight-100,cur=panel.offsetHeight;root.style.setProperty('--ph',(cur<max-10?max:jget('aur.cx.ph',230))+'px')});root.style.setProperty('--ph',jget('aur.cx.ph',230)+'px');
 $('.xph').addEventListener('click',function(e){var t=e.target.closest('[data-pt]'),a=e.target.closest('[data-pa]');if(t)I.panelShow(t.dataset.pt);else if(a){var k=a.dataset.pa;if(k==='x')root.classList.remove('xp-on');else if(k==='clear'){if(I.ptab==='term')term.textContent='';else if(I.ptab==='prev')pp.srcdoc='';else po.textContent=''}else if(k==='stop')I.stopRun();else if(k==='max')rz.dispatchEvent(new Event('dblclick'))}});
 /* terminal */
 var tw=null,th=[],ti=0;function termJs(code){if(!tw){var u=URL.createObjectURL(new Blob([BOOT+'self.onmessage=function(e){try{var r=(0,eval)(e.data);if(r!==undefined)console.log(r)}catch(x){console.error(x)}self.postMessage({t:"done"})}'],{type:'text/javascript'}));tw=new Worker(u);tw.onmessage=function(m){var d=m.data||{};if(d.t!=='done')pOut(d.m,d.t==='err'?'err':d.t==='warn'?'warn':'',term)}}tw.postMessage(code)}
 tin.addEventListener('keydown',function(e){if(e.key==='ArrowUp'){e.preventDefault();ti=Math.max(0,ti-1);tin.value=th[ti]||''}else if(e.key==='ArrowDown'){e.preventDefault();ti=Math.min(th.length,ti+1);tin.value=th[ti]||''}else if(e.key==='Enter'){var c=tin.value.trim();tin.value='';if(!c)return;th.push(c);ti=th.length;pOut('> '+c,'dim',term);
  if(c==='clear'||c==='cls')term.textContent='';else if(c==='help')pOut('JavaScript runs in a sandboxed worker (state is kept).\npy <code>   run Python (first use downloads the runtime)\nrun          run the active file\nclear        clear this panel','info',term);else if(c==='run')I.runDoc();
  else if(/^py(thon)?\s/.test(c))pyRun(c.replace(/^py(thon)?\s+/,''),{print:function(t,k){pOut(t,k,term)},done:function(){}},true);else termJs(c)}});
 /* ---- status bar ---- */
 I.status=function(){var d=I.cur,q=d?d.ed.pos():null,Lg=d?CX.langs[d.lang]||{name:d.lang}:null,sel=d?d.ed.ta.selectionEnd-d.ed.ta.selectionStart:0;
  sb.innerHTML='<span class="cl" data-s="root">'+esc(I.rootPath?base(I.rootPath):(single?'Single file':'No folder'))+'</span><span class="sp"></span>'+(d?'<span class="cl" data-s="goto">Ln '+q.ln+', Col '+q.col+(sel?' ('+sel+' selected)':'')+'</span><span class="cl hd" data-s="tab">'+(SET.spaces?'Spaces':'Tabs')+': '+SET.tab+'</span><span class="hd">UTF-8</span><span class="cl" data-s="lang">'+esc(Lg.name)+'</span>':'')+'<span class="cl hd" data-s="auto">Auto save: '+(SET.auto?'on':'off')+'</span>';title()};
 sb.addEventListener('click',function(e){var s=e.target.closest('[data-s]');if(!s)return;var k=s.dataset.s;if(k==='goto')I.palette(':');else if(k==='tab')I.cmd('indent.pick');else if(k==='lang')I.cmd('lang.pick');else if(k==='auto')I.cmd('auto.toggle');else if(k==='root'&&!single)I.folderDialog()});
 I.cmd=function(id){var c=CX.cmds[id];if(c)try{c.fn(I)}catch(e){console.error('CODE-3.5.0 command',id,e);tst('Command failed: '+e.message)}};
 /* ---- palette ---- */
 var pal=$('.xpal'),pin=pal.querySelector('input'),pl=pal.querySelector('.xpl'),pm=null,pit=[],psel=0;
 function fz(q,s){q=q.toLowerCase();s=s.toLowerCase();var i=0,sc=0,l=-2;for(var k=0;k<s.length&&i<q.length;k++){if(s[k]===q[i]){sc+=(l===k-1?3:1);l=k;i++}}return i===q.length?sc-s.length*.01:-1}
 function palOpen(pref,picker){pm=picker||null;pal.classList.add('on');pin.value=pref||'';pin.placeholder=picker?picker.ph:'Go to file...  (> commands, : line)';if(!picker&&!pref&&!I.single)I.files(function(){if(pal.classList.contains('on'))palRender()});palRender();setTimeout(function(){pin.focus()},20)}
 function palClose(){pal.classList.remove('on');pm=null;if(I.cur&&!narrow())I.cur.ed.ta.focus()}
 function palRender(){var v=pin.value,items=[],q=v;
  if(pm){items=pm.items}else if(v[0]==='>'){q=v.slice(1).trim();items=Object.keys(CX.cmds).map(function(id){var c=CX.cmds[id];return{label:c.title,detail:c.key||'',run:function(){I.cmd(id)}}})}
  else if(v[0]===':'){var n=parseInt(v.slice(1),10);items=[{label:isNaN(n)?'Type a line number':'Go to line '+n,run:function(){if(!isNaN(n)&&I.cur)I.cur.ed.goto(n)}}];q=''}
  else{var seen={};items=I.docs.filter(function(d){return d.path}).map(function(d){seen[d.path]=1;return{label:d.name,detail:d.path,icon:icon(d.name),run:function(){I.show(d)}}});(I._fi||[]).forEach(function(f){if(!seen[f.path])items.push({label:f.name,detail:f.path.replace(I.rootPath||'','').replace(/^\//,''),icon:icon(f.name),run:function(){I.open(f.path)}})})}
  q=q.trim();if(q){items=items.map(function(it){return{it:it,s:Math.max(fz(q,it.label),fz(q,it.detail||'')-1)}}).filter(function(x){return x.s>=0}).sort(function(a,b){return b.s-a.s}).map(function(x){return x.it})}
  pit=items.slice(0,80);psel=0;pl.innerHTML=pit.map(function(it,i){return '<div data-i="'+i+'" class="'+(i===0?'on':'')+'">'+(it.icon?'<span class="ic">'+it.icon+'</span>':'')+'<span class="lb">'+esc(it.label)+'</span>'+(it.detail?'<small>'+esc(it.detail)+'</small>':'')+'</div>'}).join('')}
 function palGo(i){var it=pit[i];if(!it)return;palClose();it.run()}
 pin.addEventListener('input',palRender);pin.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();palClose()}else if(e.key==='Enter'){e.preventDefault();palGo(psel)}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();psel=clamp(psel+(e.key==='ArrowDown'?1:-1),0,pit.length-1);[].forEach.call(pl.children,function(c,i){c.classList.toggle('on',i===psel)});var c=pl.children[psel];if(c)c.scrollIntoView({block:'nearest'})}});
 pl.addEventListener('click',function(e){var d=e.target.closest('[data-i]');if(d)palGo(+d.dataset.i)});pin.addEventListener('blur',function(){setTimeout(function(){if(document.activeElement!==pin)pal.classList.remove('on')},150)});
 /* ---- file index (project walk) ---- */
 I.files=function(cb){if(I._fi&&!I._fiDirty){cb(I._fi);return}if(!nf()||!I.rootPath){cb([]);return}if(I._fiBusy){I._fiQ=(I._fiQ||[]).concat(cb);return}I._fiBusy=1;var out=[],q=[I.rootPath],skip={node_modules:1,'.git':1,dist:1,build:1,'.gradle':1,'.cache':1};
  (function next(){if(!q.length||out.length>4000){I._fi=out;I._fiDirty=false;I._fiBusy=0;cb(out);(I._fiQ||[]).forEach(function(f){f(out)});I._fiQ=null;return}var dpath=q.shift();NF.list({path:dpath}).then(function(r){(r.items||[]).forEach(function(it){if(it.isDirectory){if(!skip[it.name])q.push(it.path)}else out.push({name:it.name,path:it.path,size:it.size})});next()}).catch(next)})()};
 /* ---- views / activity bar ---- */
 I.buildAct=function(){var tp=CX.views.filter(function(v){return v.pos!=='bottom'}),bt=CX.views.filter(function(v){return v.pos==='bottom'});act.innerHTML=tp.map(function(v){return '<button data-v="'+v.id+'" title="'+esc(v.title)+'" class="'+(I.view===v.id?'on':'')+'">'+v.icon+'</button>'}).join('')+'<span class="xsp"></span>'+bt.map(function(v){return '<button data-v="'+v.id+'" title="'+esc(v.title)+'" class="'+(I.view===v.id?'on':'')+'">'+v.icon+'</button>'}).join('')};
 act.addEventListener('click',function(e){var b=e.target.closest('[data-v]');if(!b)return;if(I.view===b.dataset.v&&!root.classList.contains('side-off'))I.toggleSide();else I.showView(b.dataset.v)});
 I.showView=function(id){var v=CX.views.filter(function(x){return x.id===id})[0];if(!v)return;root.classList.remove('side-off');I.view=id;$('.xst').textContent=v.title;var host=I.vi[id];if(!host){host=I.vi[id]=el('div','xvh');host.style.height='100%';side.appendChild(host);try{host.api=v.mount(host,I)||{}}catch(e){host.innerHTML='<div class="xnote">View failed: '+esc(e.message)+'</div>';host.api={}}}
  [].forEach.call(side.children,function(c){c.style.display=c===host?'':'none'});var ac=$('.xsa');ac.innerHTML='';(host.api.actions||[]).forEach(function(a){var b=el('button','',a.icon);b.title=a.t;b.onclick=function(){a.f()};ac.appendChild(b)});if(host.api.show)host.api.show();I.buildAct()};
 I.toggleSide=function(){root.classList.toggle('side-off')};
 /* ---- shortcuts ---- */
 root.addEventListener('keydown',function(e){var k=e.key;if(k==='Control'||k==='Shift'||k==='Alt'||k==='Meta')return;var kk=k.length===1?k.toUpperCase():k,c=(e.ctrlKey||e.metaKey?'Ctrl+':'')+(e.shiftKey&&!(kk.length===1&&!(e.ctrlKey||e.metaKey||e.altKey))?'Shift+':'')+(e.altKey?'Alt+':'')+kk;
  if(k==='Escape'){if(pal.classList.contains('on')){palClose();return}if(fw.classList.contains('on')){closeFind();return}}
  var id=CX.keys[c];if(!id&&c==='Ctrl+Shift+='||!id&&c==='Ctrl++')id='view.zoomIn';if(id&&CX.cmds[id]){e.preventDefault();e.stopPropagation();I.cmd(id)}},true);
 /* ---- menus ---- */
 function mi(t,id){var c=CX.cmds[id]||{};return{t:t,k:c.key||'',f:function(){I.cmd(id)}}}
 root.querySelector('.xtop').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var r=b.getBoundingClientRect(),m=b.dataset.m,a=b.dataset.a;if(a==='pal'){I.palette('>');return}if(a==='run'){I.runDoc();return}
  var it={file:[mi('New File','file.new'),mi('Open File...','file.open'),mi('Open Folder...','folder.open'),'-',mi('Save','file.save'),mi('Save As...','file.saveAs'),mi('Save All','file.saveAll'),mi('Toggle Auto Save','auto.toggle'),'-',mi('Close Tab','tab.close')],
   edit:[mi('Undo','edit.undo'),mi('Redo','edit.redo'),'-',mi('Find','edit.find'),mi('Replace','edit.replace'),mi('Go to Line...','edit.goto'),'-',mi('Toggle Line Comment','edit.comment'),mi('Format Document','edit.format'),mi('Duplicate Line','edit.dup'),mi('Delete Line','edit.del'),mi('Select All','edit.all')],
   view:[mi('Command Palette...','pal.cmds'),mi('Go to File...','pal.files'),'-',mi('Explorer','view.explorer'),mi('Search','view.search'),mi('Extensions','view.extensions'),mi('Settings','view.settings'),'-',mi('Toggle Sidebar','view.sidebar'),mi('Toggle Panel','view.panel'),mi('Toggle Minimap','view.minimap'),mi('Color Theme...','theme.pick'),mi('Zoom In','view.zoomIn'),mi('Zoom Out','view.zoomOut')],
   run:[mi('Run Code','run.run'),mi('Stop','run.stop'),mi('Open Terminal','term.open')]}[m];if(it)menu(r.left,r.bottom+2,it.filter(function(x){return x==='-'||CX.cmds[x.f&&0]||true}))});
 /* ---- tabs events ---- */
 tabs.addEventListener('click',function(e){var t=e.target.closest('.xt');if(!t)return;var d=I.docs.filter(function(x){return x.id==+t.dataset.id})[0];if(!d)return;if(e.target.closest('[data-x]'))I.close(d);else I.show(d)});
 tabs.addEventListener('auxclick',function(e){if(e.button!==1)return;var t=e.target.closest('.xt');if(!t)return;var d=I.docs.filter(function(x){return x.id==+t.dataset.id})[0];if(d)I.close(d)});
 tabs.addEventListener('contextmenu',function(e){var t=e.target.closest('.xt');if(!t)return;e.preventDefault();var d=I.docs.filter(function(x){return x.id==+t.dataset.id})[0];if(!d)return;menu(e.clientX,e.clientY,[{t:'Close',f:function(){I.close(d)}},{t:'Close Others',f:function(){I.docs.filter(function(x){return x!==d}).forEach(function(x){I.close(x)})}},{t:'Close All',f:function(){I.docs.slice().forEach(function(x){I.close(x)})}},'-',{t:'Copy Path',off:!d.path,f:function(){try{navigator.clipboard.writeText(d.path)}catch(x){}}}])});
 root.addEventListener('click',function(e){var a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='newfile')I.cmd('file.new');else if(a.dataset.a==='openfolder')I.folderDialog()});
 /* ---- sidebar resize ---- */
 var sz=$('.xsz');sz.addEventListener('pointerdown',function(e){e.preventDefault();sz.setPointerCapture(e.pointerId);sz.classList.add('d');var x0=e.clientX,w0=$('.xside').offsetWidth;sz.onpointermove=function(ev){root.style.setProperty('--sw',clamp(w0+ev.clientX-x0,170,Math.max(200,root.clientWidth-300))+'px')};sz.onpointerup=sz.onpointercancel=function(){sz.onpointermove=null;sz.classList.remove('d');jset('aur.cx.sw',parseInt(root.style.getPropertyValue('--sw'))||250)}});root.style.setProperty('--sw',jget('aur.cx.sw',250)+'px');
 /* ---- project root ---- */
 I.setRoot=function(p){I.rootPath=p;jset('aur.cx.root',p);I._fi=null;if(I.explorer)I.explorer.setRoot(p);I.status()};
 function fit(){var n=root.clientWidth<640;root.classList.toggle('nr',n)}
 if(window.ResizeObserver)new ResizeObserver(fit).observe(root);
 /* boot */
 I.applySet();fit();I.buildAct();
 if(single){addDoc({name:'loading',text:''});I.close(I.docs[0],true);I.open(arg.path)}
 else{I.showView('explorer');if(narrow())root.classList.add('side-off');
  var saved=jget('aur.cx.root',null);(saved?Promise.resolve(saved):nf()?NF.roots().then(function(r){return ((r.roots[0]||{}).path||'/storage/emulated/0')+'/AuroraOS/D/Projects'}).catch(function(){return null}):Promise.resolve(null)).then(function(p){if(p)I.setRoot(p);else if(I.explorer)I.explorer.setRoot(null)});renderTabs()}
 I.status();
 return I}

/* ---------- built-in views ---------- */
CX.addView({id:'explorer',title:'Explorer',icon:ACT.files,mount:function(host,I){
 var T={root:null,nodes:{},open:{},sel:null,edit:null,clip:null,ready:false};host.innerHTML='<div class="xtree" tabindex="0" style="min-height:100%;outline:0"></div>';var tree=host.firstChild;I.explorer=T;
 function node(it){return{path:it.path,name:it.name,dir:!!it.isDirectory,open:!!T.open[it.path],kids:null}}
 function sortK(a){return a.sort(function(x,y){return (y.dir-x.dir)||x.name.toLowerCase().localeCompare(y.name.toLowerCase())})}
 function load(n){if(!nf())return Promise.resolve();return NF.list({path:n.path}).then(function(r){n.kids=sortK((r.items||[]).map(node));n.kids.forEach(function(k){T.nodes[k.path]=k});return Promise.all(n.kids.filter(function(k){return k.dir&&k.open}).map(load))}).catch(function(e){n.kids=[];n.err=(e&&e.message)||'Cannot open folder'})}
 function rowH(n,depth){var cur=I.cur&&I.cur.path===n.path;return '<div class="tr'+(n.path===T.sel?' sel':'')+(cur?' act':'')+'" data-p="'+esc(n.path)+'" data-d="'+(n.dir?1:0)+'" style="padding-left:'+(6+depth*12)+'px"><i class="chv'+(n.dir?(n.open?' o':''):' e')+'"></i><span class="ic">'+icon(n.name,n.dir,n.open)+'</span><span class="nm">'+esc(n.name)+'</span></div>'}
 function editH(depth,val,kind){return '<div class="tr" style="padding-left:'+(6+depth*12)+'px"><i class="chv e"></i><span class="ic">'+icon(val||'x',kind==='dir')+'</span><input class="ein" value="'+esc(val||'')+'" spellcheck="false" autocapitalize="off" autocomplete="off"></div>'}
 function walk(n,depth,out){if(!n.open)return;if(n.kids===null){out.push('<div class="tr ld" style="padding-left:'+(6+(depth+1)*12+22)+'px">Loading...</div>');return}
  if(T.edit&&T.edit.mode!=='rename'&&T.edit.parent===n.path)out.push(editH(depth+1,'',T.edit.mode==='dir'?'dir':'file'));
  n.kids.forEach(function(k){if(T.edit&&T.edit.mode==='rename'&&T.edit.path===k.path)out.push(editH(depth+1,k.name,k.dir?'dir':'file'));else out.push(rowH(k,depth+1));if(k.dir)walk(k,depth+1,out)});
  if(!n.kids.length&&!T.edit)out.push('<div class="tr ld" style="padding-left:'+(6+(depth+1)*12+22)+'px">'+(n.err?esc(n.err):'Empty folder')+'</div>')}
 function paint(){if(!T.root){return}var out=['<div class="tr root" data-p="'+esc(T.root.path)+'" data-d="1" data-root="1" style="padding-left:4px"><i class="chv'+(T.root.open?' o':'')+'"></i><span class="nm">'+esc(T.root.name)+'</span></div>'];walk(T.root,0,out);tree.innerHTML=out.join('');var inp=tree.querySelector('.ein');if(inp){inp.focus();var nm=inp.value,dot=nm.lastIndexOf('.');inp.setSelectionRange(0,dot>0?dot:nm.length);inp.onkeydown=function(e){e.stopPropagation();if(e.key==='Enter')commit(inp.value);else if(e.key==='Escape'){T.edit=null;paint()}};inp.onblur=function(){setTimeout(function(){if(T.edit){T.edit=null;paint()}},120)}}}
 T.paint=paint;
 function msg(h){tree.innerHTML='<div class="xnote">'+h+'</div>'}
 T.setRoot=function(p){T.nodes={};T.sel=null;T.edit=null;if(!p){T.root=null;msg('You have not opened a folder yet.<button data-n="open">Open Folder</button>');return}
  if(!nf()){T.root=null;msg('The file explorer needs the NexOS Android app (storage access).');return}
  NF.status().then(function(s){if(s&&s.granted===false){msg('NexOS needs storage access to show your project files.<button data-n="grant">Grant access</button>');return}go()}).catch(go);
  function go(){T.root={path:p,name:base(p)||p,dir:true,open:true,kids:null};T.nodes[p]=T.root;paint();load(T.root).then(paint)}};
 T.refresh=function(){if(!T.root)return;I._fi=null;load(T.root).then(paint)};
 T.collapse=function(){Object.keys(T.nodes).forEach(function(k){if(T.nodes[k]!==T.root)T.nodes[k].open=false});T.open={};paint()};
 function target(){var n=T.sel&&T.nodes[T.sel];if(!n)return T.root;return n.dir?n:(T.nodes[dirOf(n.path)]||T.root)}
 T.create=function(dir){if(!T.root)return;var n=target();n.open=true;T.open[n.path]=1;var go=function(){T.edit={mode:dir?'dir':'file',parent:n.path};paint()};if(n.kids===null)load(n).then(go);else go()};
 function commit(name){var e=T.edit;T.edit=null;name=(name||'').trim();if(!e||!name||/[\/\\]/.test(name)){paint();return}
  if(e.mode==='rename'){var old=T.nodes[e.path];if(!old||old.name===name){paint();return}NF.rename({path:e.path,name:name}).then(function(){var np=join(dirOf(e.path),name);I.docs.forEach(function(d){if(d.path===e.path){d.path=np;d.name=name;d.lang=langOf(name);d.ed.render()}else if(d.path&&d.path.indexOf(e.path+'/')===0)d.path=np+d.path.slice(e.path.length)});I.renderTabs();T.sel=np;T.refresh()}).catch(function(x){tst((x&&x.message)||'Could not rename');paint()});return}
  var np2=join(e.parent,name),pr=e.mode==='dir'?NF.mkdir({path:e.parent,name:name}):NF.writeText({path:np2,text:''});pr.then(function(){T.sel=np2;I._fi=null;var pn=T.nodes[e.parent]||T.root;load(pn).then(function(){paint();if(e.mode!=='dir')I.open(np2)})}).catch(function(x){tst((x&&x.message)||'Could not create');paint()})}
 T.rename=function(){var n=T.sel&&T.nodes[T.sel];if(!n||n===T.root)return;T.edit={mode:'rename',path:n.path};paint()};
 T.del=function(){var n=T.sel&&T.nodes[T.sel];if(!n||n===T.root)return;I.ask('Are you sure you want to delete "'+n.name+'"'+(n.dir?' and its contents':'')+'? This cannot be undone.',[{t:'Delete',p:1,f:function(){NF.remove({paths:[n.path]}).then(function(){I.docs.slice().forEach(function(d){if(d.path===n.path||(d.path&&d.path.indexOf(n.path+'/')===0))I.close(d,true)});T.sel=null;T.refresh()}).catch(function(x){tst((x&&x.message)||'Could not delete')})}},{t:'Cancel'}])};
 T.paste=function(){if(!T.clip)return;var n=target();NF.paste({paths:T.clip.paths,dest:n.path,move:T.clip.move}).then(function(){if(T.clip.move)T.clip=null;n.open=true;T.refresh()}).catch(function(x){tst((x&&x.message)||'Paste failed')})};
 function toggle(n){if(!n.dir)return;n.open=!n.open;T.open[n.path]=n.open;if(n.open&&n.kids===null){paint();load(n).then(paint)}else paint()}
 function menuFor(n,x,y){T.sel=n?n.path:null;paint();var f=n&&!n.dir;menu(x,y,[f?{t:'Open',f:function(){I.open(n.path)}}:null,{t:'New File',f:function(){T.create(false)}},{t:'New Folder',f:function(){T.create(true)}},'-',{t:'Cut',off:!n||n===T.root,f:function(){T.clip={paths:[n.path],move:true}}},{t:'Copy',off:!n||n===T.root,f:function(){T.clip={paths:[n.path],move:false}}},{t:'Paste',off:!T.clip,f:T.paste},'-',{t:'Copy Path',off:!n,f:function(){try{navigator.clipboard.writeText(n.path)}catch(e){}tst('Path copied')}},{t:'Rename',k:'F2',off:!n||n===T.root,f:T.rename},{t:'Delete',k:'Del',d:1,off:!n||n===T.root,f:T.del},'-',{t:'Refresh',f:T.refresh},{t:'Open Folder...',f:function(){I.folderDialog()}}])}
 tree.addEventListener('click',function(e){var nb=e.target.closest('[data-n]');if(nb){if(nb.dataset.n==='open')I.folderDialog();else NF.requestAccess().then(function(){setTimeout(function(){T.setRoot(I.rootPath)},1500)});return}
  var r=e.target.closest('.tr[data-p]');if(!r)return;var n=T.nodes[r.dataset.p];if(!n)return;T.sel=n.path;if(n.dir)toggle(n);else{paint();I.open(n.path).then(function(){if(narrow())I.root.classList.add('side-off')})}});
 tree.addEventListener('contextmenu',function(e){e.preventDefault();var r=e.target.closest('.tr[data-p]');menuFor(r?T.nodes[r.dataset.p]:T.root,e.clientX,e.clientY)});
 var lp=0;tree.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;var r=e.target.closest('.tr[data-p]'),x=e.clientX,y=e.clientY;clearTimeout(lp);lp=setTimeout(function(){menuFor(r?T.nodes[r.dataset.p]:T.root,x,y)},520);tree.__s=[x,y]});tree.addEventListener('pointermove',function(e){var s=tree.__s;if(s&&Math.abs(e.clientX-s[0])+Math.abs(e.clientY-s[1])>10)clearTimeout(lp)});['pointerup','pointercancel'].forEach(function(n){tree.addEventListener(n,function(){clearTimeout(lp)})});
 tree.addEventListener('keydown',function(e){if(e.target.classList.contains('ein'))return;if(e.key==='F2')T.rename();else if(e.key==='Delete')T.del();else if(e.key==='Enter'&&T.sel&&T.nodes[T.sel]){var n=T.nodes[T.sel];if(n.dir)toggle(n);else I.open(n.path)}});
 return{actions:[{t:'New File',icon:ACT.nfile,f:function(){T.create(false)}},{t:'New Folder',icon:ACT.nfold,f:function(){T.create(true)}},{t:'Rename',icon:ACT.ren,f:T.rename},{t:'Delete',icon:ACT.del,f:T.del},{t:'Refresh',icon:ACT.ref,f:T.refresh},{t:'Collapse All',icon:ACT.col,f:T.collapse}],show:function(){}}}});

CX.addView({id:'search',title:'Search',icon:ACT.search,mount:function(host,I){
 host.innerHTML='<div class="xsf"><input type="text" placeholder="Search in project"><div class="xtg"><button data-o="cs" title="Match case">Aa</button><button data-o="rx" title="Regex">.*</button><button data-o="ww" title="Whole word">ab</button></div><small class="sst" style="color:var(--xgut)"></small></div><div class="xsr"></div>';
 var inp=host.querySelector('input'),res=host.querySelector('.xsr'),stt=host.querySelector('.sst'),o={cs:0,rx:0,ww:0},tok=0,TXT=/^(txt|md|js|mjs|cjs|jsx|ts|tsx|json|html|htm|css|scss|less|xml|svg|py|java|kt|c|h|cpp|hpp|cs|go|rs|php|rb|lua|sh|bat|cmd|sql|yml|yaml|toml|ini|env|csv|log|vue|svelte|gitignore)$/i;
 function go(){var q=inp.value,my=++tok;res.innerHTML='';if(!q){stt.textContent='';return}var re;try{var s=o.rx?q:rxEsc(q);if(o.ww)s='\\b(?:'+s+')\\b';re=new RegExp(s,'g'+(o.cs?'':'i'))}catch(e){stt.textContent='Invalid regex';return}
  stt.textContent='Searching...';I._fiDirty=true;I.files(function(files){var list=files.filter(function(f){return TXT.test(ext(f.name))&&(f.size||0)<400000}),i=0,hits=0,nf2=0;
   function one(){if(my!==tok)return;if(i>=list.length||hits>=500){stt.textContent=hits+' results in '+nf2+' files'+(hits>=500?' (limit reached)':'');return}var f=list[i++],open=I.docs.filter(function(d){return d.path===f.path})[0];
    (open?Promise.resolve(open.text):NF.readText({path:f.path}).then(function(r){return r.text})).then(function(t){var ls=t.split('\n'),ms=[];for(var k=0;k<ls.length&&ms.length<50;k++){re.lastIndex=0;var m=re.exec(ls[k]);if(m)ms.push([k+1,ls[k],m.index,m[0].length])}
     if(ms.length){nf2++;hits+=ms.length;var g=el('div','');g.innerHTML='<div class="rf"><span class="ic">'+icon(f.name)+'</span>'+esc(f.name)+' <small style="color:var(--xgut);font-weight:400">'+esc(f.path.replace(I.rootPath||'','').replace(/^\//,''))+'</small></div>'+ms.map(function(x){var l=x[1].trim(),sh=x[1].length-x[1].replace(/^\s+/,'').length;return '<div class="rm" data-p="'+esc(f.path)+'" data-l="'+x[0]+'">'+esc(l.slice(0,x[2]-sh))+'<mark>'+esc(l.substr(Math.max(0,x[2]-sh),x[3]))+'</mark>'+esc(l.slice(Math.max(0,x[2]-sh)+x[3],160))+'</div>'}).join('');res.appendChild(g);stt.textContent=hits+' results...'}one()}).catch(one)}one()})}
 var dt;inp.addEventListener('input',function(){clearTimeout(dt);dt=setTimeout(go,350)});inp.addEventListener('keydown',function(e){if(e.key==='Enter'){clearTimeout(dt);go()}e.stopPropagation()});
 host.querySelector('.xtg').addEventListener('click',function(e){var b=e.target.closest('[data-o]');if(!b)return;o[b.dataset.o]=!o[b.dataset.o];b.classList.toggle('on',!!o[b.dataset.o]);go()});
 res.addEventListener('click',function(e){var r=e.target.closest('.rm,.rf');if(!r)return;var p=r.dataset.p||(r.nextSibling&&r.nextSibling.dataset&&r.nextSibling.dataset.p);if(p)I.open(p,+r.dataset.l||1)});
 return{show:function(){setTimeout(function(){inp.focus()},50)}}}});

CX.addView({id:'settings',title:'Settings',icon:ACT.gear,pos:'bottom',mount:function(host,I){
 var fonts=[['Default monospace',DEF.font],['Consolas','Consolas,monospace'],['Menlo','Menlo,monospace'],['Roboto Mono','"Roboto Mono",monospace'],['Courier New','"Courier New",monospace'],['System monospace','monospace']];
 function build(){host.innerHTML='<div class="xset"><label>Color theme<select data-k="theme"><option value="auto">Auto (follow NexOS theme)</option>'+Object.keys(CX.themes).map(function(id){return '<option value="'+esc(id)+'">'+esc(CX.themes[id].name)+'</option>'}).join('')+'</select></label>'+
  '<label>Font family<select data-k="font">'+fonts.map(function(f){return '<option value="'+esc(f[1])+'">'+esc(f[0])+'</option>'}).join('')+'</select></label>'+
  '<label>Font size<input type="number" min="9" max="32" data-k="size"></label><label>Tab size<select data-k="tab"><option>2</option><option>4</option><option>8</option></select></label>'+
  [['spaces','Insert spaces for tabs'],['auto','Auto save (1.2 s after typing)'],['mini','Minimap'],['ln','Line numbers'],['brk','Bracket matching and auto-close'],['clear','Clear output before each run']].map(function(r){return '<div class="row"><span>'+r[1]+'</span><span class="sw'+(SET[r[0]]?' on':'')+'" data-t="'+r[0]+'"></span></div>'}).join('')+'</div>';
  [].forEach.call(host.querySelectorAll('[data-k]'),function(c){c.value=SET[c.dataset.k]})}
 build();host.addEventListener('change',function(e){var c=e.target.closest('[data-k]');if(!c)return;var k=c.dataset.k;SET[k]=(k==='size'||k==='tab')?clamp(parseInt(c.value,10)||13,k==='size'?9:2,k==='size'?32:8):c.value;saveSet()});
 host.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(!t)return;var k=t.dataset.t;SET[k]=!SET[k];t.classList.toggle('on',!!SET[k]);saveSet()});
 return{show:build}}});

/* ---------- hook into the app system ---------- */
function hook(){var k=K;try{for(var id in A){if(A[id]&&typeof appCode==='function'&&A[id].f===appCode){k=id;break}}}catch(e){}
 K=k;var a;try{a=A[k]}catch(e){}if(!a)return;var orig=a.f;
 a.f=function(w,arg){try{build(w,arg)}catch(e){console.error('CODE-3.5.0 fallback to old editor',e);try{var b=w.body;if(b)while(b.firstChild)b.removeChild(b.firstChild)}catch(x){}CX.inst=CX.inst.filter(function(i){return i.w!==w});if(typeof orig==='function')return orig.apply(this,arguments)}}}
try{hook()}catch(e){console.error('CODE-3.5.0 hook failed',e)}
})();
