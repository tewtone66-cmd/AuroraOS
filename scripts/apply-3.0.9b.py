#!/usr/bin/env python3
"""NexOS 3.0.9 part 2: run .bat/.cmd files (batch interpreter in the Terminal) + Run button for code files
(.html preview, .js in a Worker, .json check, .bat in the terminal). Every find is asserted."""
import os, sys, re, shutil, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'src', 'index.html')
s = open(P, encoding='utf-8').read()
if 'BAT-3.0.9' in s:
    print('already applied (BAT-3.0.9 found) - nothing to do')
    sys.exit(0)


def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, 'FIND FAILED (%d found, %d expected): %r' % (n, cnt, old[:90])
    s = s.replace(old, new)


# ================================================================ CSS
CSS = r'''/* CODE-3.0.9 */
.crun{flex:none;height:40%;min-height:70px;display:flex;flex-direction:column;border-top:1px solid var(--line);background:var(--surf)}
.crh{display:flex;align-items:center;gap:4px;padding:2px 8px;background:var(--surf2);flex:none;font-size:12px}
.crh b{flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cro{flex:1;min-height:0;overflow:auto;padding:6px 10px;font:12px/1.5 Consolas,"Cascadia Mono",ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;user-select:text;direction:ltr;text-align:left}
.cro .e{color:#e5484d}.cro .w{color:#d97706}.cro .m{color:var(--mut)}
'''
rep('</style><!--NEXOS-END-->', CSS + '</style><!--NEXOS-END-->')

# ================================================================ file types / opening
rep("txt:'txt md csv log ini conf properties srt tsv cfg bat'", "txt:'txt md csv log ini conf properties srt tsv cfg bat cmd'")

# File Explorer: double click / tap on .bat/.cmd runs it (Open with Notepad / Code Editor stay in the context menu)
rep("else if(k==='code')openApp('code',{path:it.path});else if(k==='txt')openApp('notes',{path:it.path});",
    "else if(k==='code')openApp('code',{path:it.path});else if(/\\.(bat|cmd)$/i.test(it.name))openApp('term',{bat:it.path});else if(k==='txt')openApp('notes',{path:it.path});")
# Search results
rep("else if(/^(js|json|html?|css|java|kt|py|xml|sh|bat|c|cpp|h|ts)$/.test(e))openApp('code',{path:p});",
    "else if(/^(bat|cmd)$/.test(e))openApp('term',{bat:p});\n else if(/^(js|json|html?|css|java|kt|py|xml|sh|bat|c|cpp|h|ts)$/.test(e))openApp('code',{path:p});")
# Downloads list
rep("if(k==='txt')return openApp('notes',{path:p});",
    "if(/\\.(bat|cmd)$/i.test(p))return openApp('term',{bat:p});if(k==='txt')return openApp('notes',{path:p});")

# ================================================================ Terminal
rep("function appTerm(w){", "function appTerm(w,arg){")
rep("let root='/storage/emulated/0',cwd=root,busy=false,hist=[],hi=0;",
    "let root='/storage/emulated/0',cwd=root,busy=false,hist=[],hi=0,errl=0,waitIn=null,stopBat=false;")

BAT = r'''/* BAT-3.0.9 batch interpreter (ECHO/SET/IF/FOR/GOTO/CALL/PAUSE/TIMEOUT/TITLE/EXIT) */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const readLine=()=>new Promise(r=>{waitIn=r;inp.focus()});
const ENV={};let batDepth=0;
const hasEnv=k=>Object.prototype.hasOwnProperty.call(ENV,k);
const mkFr=(lines,args,path,file)=>{const labels={};lines.forEach((l,i)=>{const m=/^\s*:([^\s:]\S*)/.exec(l);if(m&&!hasOwn(labels,m[1].toLowerCase()))labels[m[1].toLowerCase()]=i});return{lines,labels,pc:0,inj:[],args:args||[''],stack:[],echo:!!file,file:!!file,path:path||''}};
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const pathMods=(p,mods)=>{const wp=String(p).replace(/\//g,'\\');if(/f/.test(mods))return wp;const dm=/^[A-Za-z]:/.exec(wp),drv=dm?dm[0]:'',i=wp.lastIndexOf('\\'),dir=i>=0?wp.slice(drv.length,i+1):'',base=wp.slice(i+1),j=base.lastIndexOf('.'),nm=j>0?base.slice(0,j):base,ex=j>0?base.slice(j):'';let o='';if(/d/.test(mods))o+=drv;if(/p/.test(mods))o+=dir;if(/n/.test(mods))o+=nm;if(/x/.test(mods))o+=ex;return o||wp};
const expand=(l,fr)=>l.replace(/%%|%(\d|\*)|%~([a-z]*)(\d)|%([A-Za-z_][\w.\-]*)%/gi,(m,a,mods,d,nm)=>{
if(m==='%%')return fr&&fr.file?'%':m;
if(a!==undefined){if(a==='*')return fr?fr.args.slice(1).join(' '):'';return fr&&fr.args[+a]!==undefined?fr.args[+a]:''}
if(mods!==undefined&&d!==undefined){const v=fr?(d==='0'&&fr.path?win(fr.path):fr.args[+d]):undefined;return v===undefined?'':pathMods(v,mods)}
const k=nm.toUpperCase(),dd=new Date();
if(k==='CD')return win(cwd);
if(k==='DATE')return pad2(dd.getMonth()+1)+'/'+pad2(dd.getDate())+'/'+dd.getFullYear();
if(k==='TIME')return pad2(dd.getHours())+':'+pad2(dd.getMinutes())+':'+pad2(dd.getSeconds());
if(k==='RANDOM')return String(Math.floor(Math.random()*32768));
if(k==='ERRORLEVEL')return String(errl);
if(hasEnv(k))return ENV[k];
return fr&&fr.file?'':m});
const arith=src=>{let i=0;const s=src;const ws=()=>{while(s[i]===' ')i++};
const ap=(o,a,b)=>{switch(o){case'|':return a|b;case'^':return a^b;case'&':return a&b;case'<<':return a<<b;case'>>':return a>>b;case'+':return(a+b)|0;case'-':return(a-b)|0;case'*':return Math.imul(a,b);case'/':if(!b)throw new Error('Divide by zero error.');return Math.trunc(a/b);case'%':if(!b)throw new Error('Divide by zero error.');return a%b}};
const L=[['|'],['^'],['&'],['<<','>>'],['+','-'],['*','/','%']];
const un=()=>{ws();const t=s[i];if(t==='('){i++;const v=lvl(0);ws();if(s[i]!==')')throw new Error('Missing operator.');i++;return v}
if(t==='-'){i++;return -un()|0}if(t==='+'){i++;return un()}if(t==='~'){i++;return ~un()}if(t==='!'){i++;return un()?0:1}
const m=/^(0x[0-9a-f]+|\d+)/i.exec(s.slice(i));if(!m)throw new Error('Missing operand.');i+=m[0].length;return /^0[0-7]+$/.test(m[0])?parseInt(m[0],8):Number(m[0])|0};
const lvl=k=>{if(k===L.length)return un();let v=lvl(k+1);for(;;){ws();const o=L[k].find(x=>s.startsWith(x,i));if(!o)return v;i+=o.length;v=ap(o,v,lvl(k+1))}};
const v=lvl(0);ws();if(i<s.length)throw new Error('Missing operator.');return v};
const envInt=t=>t.replace(/(?<![\w.])[A-Za-z_]\w*/g,v=>{const n=parseInt(ENV[v.toUpperCase()],10);return String(isNaN(n)?0:n)});
const setA=(expr,fr)=>{let last=0;for(const part of expr.split(',')){const p=part.trim();if(!p)continue;const m=/^([A-Za-z_]\w*)\s*(<<|>>|[+\-*\/%&^|])?=\s*(.*)$/.exec(p);
if(m){const k=m[1].toUpperCase(),cur=parseInt(ENV[k],10)||0;let v=arith(envInt(m[3]));if(m[2])v=arith(cur+' '+m[2]+' ('+v+')');ENV[k]=String(v);last=v}else last=arith(envInt(p))}
if(!fr.file)T(String(last))};
const nextLine=fr=>fr.inj.length?fr.inj.shift():(fr.pc<fr.lines.length?fr.lines[fr.pc++]:null);
const retFrame=fr=>{if(fr.stack.length){const st=fr.stack.pop();fr.pc=st.pc;fr.args=st.args;fr.inj=st.inj}else{fr.inj.length=0;fr.pc=fr.lines.length}};
const readBlock=fr=>{let depth=1,body=[],els=null,cur=body;for(;;){const l=nextLine(fr);if(l===null)break;const t=l.trim(),op=/\($/.test(t)&&!/^\)/.test(t),cl=/^\)/.test(t),mid=cl&&/\($/.test(t);
if(mid&&depth===1){els=[];cur=els;continue}
if(op)depth++;else if(cl&&!mid){depth--;if(!depth)break}
cur.push(l)}return{body,els}};
const unq=x=>String(x).replace(/^"(.*)"$/,'$1');
async function doIf(line,fr){let r=line.slice(2).trim(),ci=false,neg=false,cond=false,m;
if(/^\/i\s/i.test(r)){ci=true;r=r.slice(2).trim()}
if(/^not\s/i.test(r)){neg=true;r=r.slice(3).trim()}
if((m=/^exist\s+("[^"]*"|\S+)\s*(.*)$/i.exec(r))){let ex=false;try{ex=!!(await rp(unq(m[1]))).it}catch(e){}cond=ex;r=m[2]}
else if((m=/^defined\s+(\S+)\s*(.*)$/i.exec(r))){cond=hasEnv(m[1].toUpperCase());r=m[2]}
else if((m=/^errorlevel\s+(\d+)\s*(.*)$/i.exec(r))){cond=errl>=+m[1];r=m[2]}
else if((m=/^("[^"]*"|[^\s=]+)\s*==\s*("[^"]*"|\S+)\s*(.*)$/.exec(r))){let a=m[1],b=m[2];if(ci){a=a.toLowerCase();b=b.toLowerCase()}cond=a===b;r=m[3]}
else if((m=/^("[^"]*"|\S+)\s+(equ|neq|lss|leq|gtr|geq)\s+("[^"]*"|\S+)\s*(.*)$/i.exec(r))){let a=unq(m[1]),b=unq(m[3]);const op=m[2].toLowerCase(),na=Number(a),nb=Number(b);let c;if(a!==''&&b!==''&&!isNaN(na)&&!isNaN(nb)){c=na-nb}else{if(ci){a=a.toLowerCase();b=b.toLowerCase()}c=a<b?-1:a>b?1:0}
cond=op==='equ'?c===0:op==='neq'?c!==0:op==='lss'?c<0:op==='leq'?c<=0:op==='gtr'?c>0:c>=0;r=m[4]}
else throw new Error('The syntax of the command is incorrect.');
if(neg)cond=!cond;r=r.trim();if(!r)throw new Error('The syntax of the command is incorrect.');
let thenB,elseB=null;
if(r==='('){const b=readBlock(fr);thenB=b.body;elseB=b.els}
else if((m=/^\((.*)\)\s*else\s*\((.*)\)$/i.exec(r))){thenB=[m[1]];elseB=[m[2]]}
else if((m=/^\((.*)\)$/.exec(r)))thenB=[m[1]];
else thenB=[r];
fr.inj.unshift(...(cond?thenB:(elseB||[])))}
async function doFor(line,fr){if(/^for\s+\/[fdr]\b/i.test(line))throw new Error('FOR /F, /D and /R are not supported yet. FOR and FOR /L work.');
const m=/^for\s+(\/l\s+)?%%?(\w)\s+in\s+\(([^)]*)\)\s+do\s+(.*)$/i.exec(line);if(!m)throw new Error('The syntax of the command is incorrect.');
const L=m[2];let vals=[];
if(m[1]){const n=m[3].split(',').map(x=>parseInt(x,10));if(n.length!==3||n.some(isNaN)||!n[1])throw new Error('The syntax of the command is incorrect.');for(let v=n[0];(n[1]>0?v<=n[2]:v>=n[2])&&vals.length<10000;v+=n[1])vals.push(String(v))}
else{for(const t of(m[3].match(/"[^"]*"|[^\s,;]+/g)||[])){const u=unq(t);if(/[*?]/.test(u)){try{(await tg(u)).forEach(x=>vals.push(x.name))}catch(e){}}else vals.push(u)}}
const r=m[4].trim();let body,inline=true;
if(r==='('){body=readBlock(fr).body;inline=false}
if(inline){const mm=/^\((.*)\)$/.exec(m[4].trim());body=[mm?mm[1]:m[4].trim()]}
const re=new RegExp((inline?'(?<!%)%':'%%')+L+'(?!\\w)','g'),all=[];
for(const v of vals)for(const b of body)all.push(b.replace(re,()=>v));
fr.inj.unshift(...all)}
async function batLine(raw,fr){let line=raw.trim();if(!line)return;let quiet=false;
while(line[0]==='@'){quiet=true;line=line.slice(1).trim()}
if(!line||line[0]===':'||/^rem(\s|$)/i.test(line))return;
line=expand(line,fr);
if(fr.echo&&!quiet)put(esc(win(cwd)+'>'+line));
if(/^echo[.:(\/]/i.test(line)){T(line.slice(5));return}
const sp=line.search(/[\s\/]/),cmd=(sp<0?line:line.slice(0,sp)).toLowerCase(),rest=sp<0?'':line.slice(sp);
switch(cmd){
case'echo':{const r=rest.trim();if(/^off$/i.test(r)){fr.echo=false;return}if(/^on$/i.test(r)){fr.echo=true;return}if(!r){T('ECHO is '+(fr.echo?'on':'off')+'.');return}await cmdEcho(line);return}
case'setlocal':case'endlocal':case'chcp':case'mode':case'prompt':case'path':case'color':case'break':case'verify':return;
case'title':w.setTitle(rest.trim()||'Terminal');return;
case'set':{const r=rest.trim();
if(/^\/a(\s|$)/i.test(r)){setA(r.slice(2),fr);return}
if(/^\/p(\s|$)/i.test(r)){const m=/^\/p\s+"?([A-Za-z_]\w*)=(.*?)"?$/i.exec(r);if(!m)throw new Error('The syntax of the command is incorrect.');put(esc(m[2]));ENV[m[1].toUpperCase()]=await readLine();return}
if(!r){Object.keys(ENV).sort().forEach(k=>T(k+'='+ENV[k]));return}
const q=r.replace(/^"(.*)"$/,'$1'),i=q.indexOf('=');
if(i<0){const ks=Object.keys(ENV).filter(k=>k.startsWith(q.toUpperCase())).sort();if(!ks.length)E('Environment variable '+q+' not defined');ks.forEach(k=>T(k+'='+ENV[k]));return}
const k=q.slice(0,i).trim().toUpperCase(),v=q.slice(i+1);if(!k)throw new Error('The syntax of the command is incorrect.');if(v==='')delete ENV[k];else ENV[k]=v;return}
case'pause':T('Press Enter to continue . . .');await readLine();return;
case'timeout':{const mm=/\/t\s+(-?\d+)/i.exec(rest)||/(-?\d+)/.exec(rest);if(!mm)throw new Error('ERROR: Invalid syntax. Default option is not allowed more than 1 time(s).');const n=parseInt(mm[1],10);
if(n<0){T('Waiting for a key press ...');await readLine();return}
T('Waiting for '+n+' seconds');for(let t=0;t<Math.min(n,60)*10;t++){if(stopBat||!W[w.id])return;await sleep(100)}return}
case'goto':{if(!fr.file){E('GOTO works inside a batch file only.');return}
const lb=rest.trim().split(/\s/)[0].replace(/^:/,'').toLowerCase();
if(lb==='eof'){retFrame(fr);return}
if(!hasOwn(fr.labels,lb)){E('The system cannot find the batch label specified - '+lb);return'exit'}
fr.inj.length=0;fr.pc=fr.labels[lb]+1;return}
case'call':{const parts=rest.trim().match(/"[^"]*"|\S+/g)||[];if(!parts.length)throw new Error('The syntax of the command is incorrect.');
if(parts[0][0]===':'){if(!fr.file){E('CALL :label works inside a batch file only.');return}
const lb=parts[0].slice(1).toLowerCase();if(!hasOwn(fr.labels,lb)){E('The system cannot find the batch label specified - '+lb);return}
fr.stack.push({pc:fr.pc,args:fr.args,inj:fr.inj});fr.inj=[];fr.args=[parts[0]].concat(parts.slice(1).map(unq));fr.pc=fr.labels[lb]+1;return}
try{await runBat(unq(parts[0]),parts.slice(1).map(unq))}catch(e){if(e&&e.message==='^C')throw e;errl=1;E((e&&e.message)||String(e))}return}
case'exit':{const m=/^\s*\/b\s*(\d*)/i.exec(rest);if(m){if(m[1])errl=+m[1];if(fr.file)retFrame(fr);return}closeW(w.id,true);return'exit'}
case'if':await doIf(line,fr);return;
case'for':await doFor(line,fr);return}
await run(line)}
async function execBat(fr){let steps=0;for(;;){if(!W[w.id])return;if(stopBat)throw new Error('^C');const raw=nextLine(fr);if(raw===null)break;
if(++steps>50000){E('Batch stopped after 50000 steps (endless loop?).');break}
if(await batLine(raw,fr)==='exit')break;
if(steps%100===0)await sleep(0)}}
async function runBat(file,bargs){if(++batDepth>16){batDepth--;throw new Error('Batch files are nested too deep.')}
try{let path=null;
if(file.startsWith('/')&&!(file===root||file.startsWith(root+'/')))path=file;
else for(const c of[file,file+'.bat',file+'.cmd']){try{const r=await rp(c);if(r.it&&!r.it.isDirectory&&/\.(bat|cmd)$/i.test(r.it.name)){path=r.path;break}}catch(e){}}
if(!path)throw new Error('The system cannot find the batch file specified.');
let txt='';try{txt=(await NF.readText({path})).text||''}catch(e){throw new Error('The batch file could not be read.')}
await execBat(mkFr(txt.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n'),[win(path)].concat(bargs||[]),path,true))}
finally{batDepth--}}
'''
rep("const HELP=[", BAT + "const HELP=[")

rep("'VER  DATE  TIME  PWD  EXIT','','Real Windows",
    "'VER  DATE  TIME  PWD  EXIT','CALL file.bat         Run a batch file (or type its name)','SET  IF  FOR  GOTO  PAUSE  TIMEOUT  TITLE  work in batch files','Ctrl+C                Stop a running batch file','','Real Windows")

# errorlevel bookkeeping (before the new default branch is inserted)
rep("}catch(e){E((e&&e.message)||String(e))}};\ninp.onkeydown", "}catch(e){errl=1;E(e&&e.message==='^C'?'^C':((e&&e.message)||String(e)))}};\ninp.onkeydown")

rep("const run=async line=>{const raw=line.trim();if(!raw)return;",
    "const run=async line=>{const raw=line.trim();if(!raw)return;\n"
    "if(/^(set|pause|timeout|title|color|rem|if|for|call|goto|setlocal|endlocal)(\\s|$)/i.test(raw)){try{await ready;await execBat(mkFr([raw],[''],'',false))}catch(e){E(e&&e.message==='^C'?'^C':((e&&e.message)||String(e)))}return}\n"
    "errl=0;")

rep('''default:E("'"+toks[0]+"' is not recognized as an internal or external command,\\noperable program or batch file.")}''',
    '''default:{let bf=null;for(const cnd of[toks[0],toks[0]+'.bat',toks[0]+'.cmd']){try{const r0=await rp(cnd);if(r0.it&&!r0.it.isDirectory&&/\\.(bat|cmd)$/i.test(r0.it.name)){bf=r0.path;break}}catch(e0){}}
if(bf){await runBat(bf,a);break}
errl=9009;E("'"+toks[0]+"' is not recognized as an internal or external command,\\noperable program or batch file.")}}''')

rep("inp.onkeydown=async e=>{\nif(e.key==='Enter'||e.keyCode===13){e.preventDefault();if(busy)return;const line=inp.value;inp.value='';put(esc(win(cwd)+'>'+line));",
    "inp.onkeydown=async e=>{\n"
    "if(e.ctrlKey&&(e.key==='c'||e.key==='C')&&busy&&!String(getSelection())){e.preventDefault();stopBat=true;if(waitIn){const r=waitIn;waitIn=null;r('')}return}\n"
    "if(e.key==='Enter'||e.keyCode===13){e.preventDefault();if(waitIn){const v=inp.value;inp.value='';put(esc(v));const r=waitIn;waitIn=null;r(v);return}if(busy)return;stopBat=false;const line=inp.value;inp.value='';put(esc(win(cwd)+'>'+line));")

rep("prompt();setTimeout(()=>inp.focus(),380);",
    "prompt();setTimeout(()=>inp.focus(),380);\n"
    "if(arg&&arg.bat){ready.then(async()=>{const bp=arg.bat,bn=bp.split('/').pop();cwd=bp.slice(0,bp.lastIndexOf('/'))||'/';prompt();w.setTitle(bn+' - Terminal');put(esc(win(cwd)+'>'+bn));busy=true;stopBat=false;try{await runBat(bp,[])}catch(e){E(e&&e.message==='^C'?'^C':((e&&e.message)||String(e)))}busy=false;prompt();inp.focus()})}")

# ================================================================ Code editor: Run
rep('<button class="ib" data-m="view">View</button><span class="lang"></span></div><div class="cb">',
    '<button class="ib" data-m="view">View</button><button class="ib" data-m="run" title="Run (F5)">&#9654; Run</button><span class="lang"></span></div><div class="cb">')

RUN = r'''/* CODE-3.0.9 run */
let rpane=null,wk=null;
const closeRun=()=>{if(wk){try{wk.terminate()}catch(e){}wk=null}if(rpane){rpane.remove();rpane=null}};
const say=(p,t,c)=>{const o=$('.cro',p);if(!o)return;const d=h('div',c||'');d.textContent=t;o.appendChild(d);o.scrollTop=o.scrollHeight};
const runPane=(title,stop,tall)=>{closeRun();const p=h('div','crun','<div class="crh"><b></b>'+(stop?'<button class="ib" data-r="stop">Stop</button>':'')+'<button class="ib" data-r="clr">Clear</button><button class="ib" data-r="x" aria-label="Close">&#10005;</button></div><div class="cro"></div>');$('b',p).textContent=title;if(tall)p.style.height='55%';$('.cw',B).insertBefore(p,$('.nf',B));rpane=p;
p.addEventListener('click',e=>{const x=e.target.closest('[data-r]');if(!x)return;const k=x.dataset.r;if(k==='x')closeRun();else if(k==='clr'){const o=$('.cro',p);if(o)o.textContent=''}else if(k==='stop'&&wk){wk.terminate();wk=null;say(p,'Stopped.','m')}});return p};
const runJs=()=>{const p=runPane('Output - JavaScript',true,false);
const boot='(function(){function f(a){return Array.prototype.map.call(a,function(x){if(typeof x==="string")return x;if(x instanceof Error)return x.stack||x.message;try{var j=JSON.stringify(x,null,2);return j===undefined?String(x):j}catch(e){return String(x)}}).join(" ")}function s(t,a){postMessage({t:t,m:f(a)})}console.log=function(){s("l",arguments)};console.info=console.log;console.debug=console.log;console.warn=function(){s("w",arguments)};console.error=function(){s("e",arguments)};self.addEventListener("unhandledrejection",function(ev){s("e",["Unhandled promise rejection: "+(ev.reason&&ev.reason.message||ev.reason)])})})();\n';
try{const url=URL.createObjectURL(new Blob([boot+ta.value],{type:'text/javascript'}));wk=new Worker(url);const me=wk;
wk.onmessage=e=>say(p,e.data.m,e.data.t==='e'?'e':e.data.t==='w'?'w':'');
wk.onerror=ev=>{ev.preventDefault();say(p,'Uncaught '+(ev.message||'error')+(ev.lineno>1?'  (line '+(ev.lineno-1)+')':''),'e');if(/document|window|alert|localStorage/.test(ev.message||''))say(p,'Tip: JavaScript runs in a background thread without a page. Put it inside an .html file and run that to use document and window.','m')};
setTimeout(()=>{if(wk===me&&!p.querySelector('.cro>div'))say(p,'(no output yet - use console.log to print)','m')},1500)}
catch(e){say(p,'Could not start: '+((e&&e.message)||e),'e')}};
const runHtml=()=>{const p=runPane('Preview - HTML',false,true),fr=document.createElement('iframe');fr.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-popups');fr.style.cssText='flex:1;min-height:0;border:0;background:#fff;width:100%';fr.srcdoc=ta.value;p.replaceChild(fr,$('.cro',p))};
const runIt=async()=>{const x=extOf(st.name);
if(x==='html'||x==='htm')return runHtml();
if(x==='js'||x==='mjs')return runJs();
if(x==='json'){const p=runPane('Check - JSON',false,false);try{JSON.parse(ta.value);say(p,'Valid JSON.','m')}catch(e){say(p,String(e.message||e),'e')}return}
if(x==='bat'||x==='cmd'){if(!st.path){toast('Save the file first (File > Save as...), then run it');return}if(dirty()&&!(await save()))return;openApp('term',{bat:st.path});return}
toast('Run works for .html, .js and .bat files (other languages cannot run inside NexOS yet)')};
w.onclose=closeRun;
'''
rep("w.dirty=dirty;w.ask=proceed=>dialog(w,{title:'Code Editor'", RUN + "w.dirty=dirty;w.ask=proceed=>dialog(w,{title:'Code Editor'")

rep("if(b.dataset.m==='file')ctx(r.left,r.bottom+2,[['New',()=>openApp('code',{}),'Ctrl+N']",
    "if(b.dataset.m==='run')return runIt();\nif(b.dataset.m==='file')ctx(r.left,r.bottom+2,[['New',()=>openApp('code',{}),'Ctrl+N']")

rep("if(c&&e.key.toLowerCase()==='s'){e.preventDefault();save()}else if(e.key==='Tab')",
    "if(e.key==='F5'||(c&&e.key==='Enter')){e.preventDefault();runIt()}else if(c&&e.key.toLowerCase()==='s'){e.preventDefault();save()}else if(e.key==='Tab')")

# ================================================================ syntax check
if shutil.which('node'):
    for i, m in enumerate(re.finditer(r'<script(?:\s[^>]*)?>(.*?)</script>', s, re.S)):
        body = m.group(1)
        if not body.strip():
            continue
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
            t.write(body)
        r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True)
        os.unlink(t.name)
        assert r.returncode == 0, 'SYNTAX ERROR in script block %d:\n%s' % (i, r.stderr[:800])
    print('syntax check ok')
else:
    print('node not found: syntax check skipped')

open(P, 'w', encoding='utf-8').write(s)


def append(path, text):
    p = os.path.join(ROOT, path)
    old = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    open(p, 'w', encoding='utf-8').write(old.rstrip('\n') + '\n' + text)


append('DEV-NOTES.md', '''
- v3.0.9 part 2 (bat + code run): ترمینال appTerm(w,arg): `arg.bat` = مسیر فایل .bat که خودکار اجرا میشه (File Explorer، سرچ و Downloads روی .bat/.cmd میرن به `openApp('term',{bat:path})`). مفسر batch با کامنت BAT-3.0.9 قبل از `const HELP`: mkFr/expand (%VAR% %1 %* %~dp0 %CD% %DATE% %RANDOM% %ERRORLEVEL%)، batLine/execBat (صف `fr.inj` برای بلاک‌های ( ) و FOR)، doIf (== equ neq lss leq gtr geq exist defined errorlevel not /i)، doFor (FOR و FOR /L؛ /F /D /R نه)، set /a با پارسر عددی (بدون eval)، set /p، pause، timeout، goto/call :label/exit /b، title، ENV مشترک بین دستورها. Ctrl+C = توقف (`stopBat`)، سقف ۵۰۰۰۰ قدم. اسم فایل .bat/.cmd بدون پسوند هم توی ترمینال اجرا میشه (default سوییچ run). ادیتور کد: دکمه‌ی Run و F5/Ctrl+Enter (runIt): .html پیش‌نمایش iframe سندباکس، .js توی Web Worker با console.log و دکمه‌ی Stop، .json اعتبارسنجی، .bat/.cmd توی ترمینال؛ بقیه‌ی زبان‌ها پیام «پشتیبانی نمیشه». CSS با کامنت CODE-3.0.9.''')
open(os.path.join(ROOT, 'NEXT.md'), 'w', encoding='utf-8').write('''# NEXT (بعد از v3.0.9)
همه‌ی آیتم‌های چت ۹ نوشته شدند ولی روی گوشی تست نشده‌اند. اگه بیلد خطا داد، متن خطا رو بفرست.

## v3.0.9 چی اضافه شد
- پنجره‌ی exe: کارت پیشرفت ۴ مرحله‌ای (Download runtime ← Install ← Setup ← Open window) با رویدادهای واقعی جاوا. «Download runtime» در واقع باز کردن runtime از داخل APK هست و فقط بار اول طول می‌کشه.
- فیکس جا موندن پنجره‌ی برنامه: بعد از exeStarted/launching/running، بعد از نمایش دوباره و بعد از برگشت از بکگراند rect دوباره فرستاده میشه (علت: جاوا قبل از ساخته شدن Activity بی‌صدا رد می‌کرد).
- اجرای .bat/.cmd توی ترمینال (دوبار لمس توی فایل‌منیجر) و دکمه‌ی Run توی ادیتور کد (.html .js .json .bat).

## محدودیت‌ها / کارهای مونده
- ترمینال: FOR /F /D /R، `%VAR:a=b%`، `!var!` (delayed expansion)، `start`، `&`/`&&`/`|` و اجرای exe از ترمینال پشتیبانی نمیشه. `pause` با Enter ادامه میده. Ctrl+C فقط با کیبورد فیزیکی.
- Run: فقط html/js/json/bat. python/java/kotlin و ... اجرا نمیشن. اسکریپت js داخل Worker اجرا میشه، پس document/window نداره (برای اون html بنویس). html داخل iframe سندباکس هست؛ حلقه‌ی بی‌نهایت توی html کل UI رو قفل می‌کنه.
- اگه پنجره‌ی برنامه هنوز جا می‌مونه، ویدیو بگیر یا بگو دقیقا کی (شروع برنامه، درگ، مینیمایز، برگشت از بکگراند).
- از قبل: ماوس Aurora داخل exe با عکس لحظه‌ی شروع ساخته میشه؛ پنجره‌ی exe وقتی زیر پنجره‌ی دیگه‌ست مخفی میشه (نه اینکه واقعا بینشون قرار بگیره). لاگ Wine پر از خطای d3d هست (گرافیک)، ربطی به لانچ نداره.
''')
print('OK: src/index.html patched, DEV-NOTES.md and NEXT.md updated')
