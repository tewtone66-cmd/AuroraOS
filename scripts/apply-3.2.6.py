#!/usr/bin/env python3
# NexOS 3.2.6 (part E) - Terminal: && and || (CMD and PowerShell), & in CMD, Tab completion, touch helper bar,
# multi-line paste, clearer prompt/title for CMD vs PowerShell, real cause shown for network errors, hints for programs
# that cannot run here (claude, npm, node, git ...). Run from repo root after 3.2.5.
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'src' / 'index.html'
s = idx.read_text(encoding='utf-8')
if 'TERM-3.2.6' in s:
    print('already applied'); sys.exit(0)
assert 'SYS-3.2.5' in s, 'apply 3.2.5 first'
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, f'expected {count}, found {n}: {old[:90]}'
    s = s.replace(old, new)

# helper bar under the input
rep('autocorrect="off" enterkeyhint="send"></div></div>\';',
    'autocorrect="off" enterkeyhint="send"></div><div class="tmk"><button data-k="tab">Tab</button><button data-k="up">&#8593;</button><button data-k="dn">&#8595;</button><button data-k="c">Ctrl+C</button><button data-k="copy">Copy</button><button data-k="paste">Paste</button><button data-k="cls">Clear</button></div></div>\';')
# error counter (success detection for && and ||)
rep("const T=s=>put(esc(s)),E=s=>put(esc(s),'e');", "let ES=0;/*TERM-3.2.6*/const T=s=>put(esc(s)),E=s=>{ES++;put(esc(s),'e')};")
# prompt + window title show the mode
rep("const prompt=()=>{pr.textContent=(PSM.on?'PS ':'')+win(cwd)+'>'};",
    "const prompt=()=>{pr.textContent=(PSM.on?'PS ':'')+win(cwd)+'>';try{w.setTitle(PSM.on?'Windows PowerShell':'Command Prompt')}catch(e){}};")
# hint for real programs
rep("E((e.cmd?e.cmd+' : ':'')+m)}", "E((e.cmd?e.cmd+' : ':'')+m);if(/is not recognized as the name/.test(m)&&e.cmd&&NOTHERE.test(e.cmd))T(NOTHERE_MSG(e.cmd))}")
rep("""errl=9009;E("'"+toks[0]+"' is not recognized as an internal or external command,\\noperable program or batch file.")}}""",
    """errl=9009;E("'"+toks[0]+"' is not recognized as an internal or external command,\\noperable program or batch file.");if(NOTHERE.test(toks[0]))T(NOTHERE_MSG(toks[0]))}}""")
rep("const NOPATH='The system cannot find the path specified.'",
    "const NOTHERE=/^(claude|claude-code|npm|npx|node|nodejs|yarn|pnpm|git|python3?|pip3?|winget|choco|scoop|docker|cargo|go|java)(\\.exe|\\.cmd)?$/i,NOTHERE_MSG=n=>\"Note: '\"+n+\"' is a real program. The NexOS terminal only emulates Windows commands, so it cannot run it. To use it on your phone, install Termux.\";const NOPATH='The system cannot find the path specified.'")
# network error: show the real cause
rep("if(/Connect|refused|Unreachable|Network is/i.test(m))return'Unable to connect to the remote server';",
    "const cause=m.replace(/^[A-Za-z.]*Exception:\\s*/,'').slice(0,170);if(/SSL|Handshake|certificate|Trust anchor|TLS/i.test(m))return'The underlying connection was closed: Could not establish trust relationship for the SSL/TLS secure channel. ('+cause+')';if(/Connect|refused|Unreachable|Network is|reset|abort|EPIPE|closed/i.test(m))return'Unable to connect to the remote server ('+cause+')';")

# chained commands: split run() into run1() and a chain runner
rep("const run=async line=>{const raw=line.trim();if(!raw)return;",
r"""const splitChain=(line,ps)=>{if(!ps&&/^\s*(if|for)\s/i.test(line))return null;const parts=[];let cur='',q=null,dp=0,op='',n=0;
 for(let i=0;i<line.length;i++){const ch=line[i],n2=line.substr(i,2);
  if(q){cur+=ch;if(ch===q)q=null;continue}
  if((ps&&ch==='`')||(!ps&&ch==='^')){cur+=ch+(line[i+1]||'');i++;continue}
  if(ch==='"'||(ps&&ch==="'")){q=ch;cur+=ch;continue}
  if(ch==='('||ch==='{'||ch==='[')dp++;else if(ch===')'||ch==='}'||ch===']')dp=Math.max(0,dp-1);
  if(!dp){if(n2==='&&'||n2==='||'){parts.push({t:cur,op});op=n2;cur='';i++;n++;continue}
   if(!ps&&ch==='&'&&line[i-1]!=='>'&&line[i+1]!=='&'&&line[i+1]!=='>'){parts.push({t:cur,op});op='&';cur='';n++;continue}}
  cur+=ch}
 if(!n)return null;parts.push({t:cur,op});return parts};
const run=async line=>{const parts=splitChain(line,PSM.on);if(!parts){await run1(line);return}
 let ok=true;for(const p of parts){if(stopBat)break;if(p.op==='&&'&&!ok)continue;if(p.op==='||'&&ok)continue;if(!p.t.trim())continue;const before=ES;PSV['?']=true;errl=0;await run1(p.t);ok=ES===before&&PSV['?']!==false&&errl===0}};
const run1=async line=>{const raw=line.trim();if(!raw)return;""")

# input handling: submit helper, completion, paste, buttons
rep("inp.onkeydown=async e=>{\n", r"""const submitLine=async line=>{if(waitIn){const r=waitIn;waitIn=null;put(esc(line));r(line);return}if(busy)return;stopBat=false;put(esc((PSM.on?pr.textContent+' ':pr.textContent)+line));
if(line.trim()){hist.push(line);if(hist.length>100)hist.shift()}hi=hist.length;busy=true;try{await run(line)}finally{busy=false;prompt();out.scrollTop=out.scrollHeight}};
const CMDS=['help','cls','clear','ver','date','time','pwd','dir','ls','cd','chdir','mkdir','md','type','cat','copy','cp','xcopy','move','mv','ren','rename','del','erase','rm','rmdir','rd','echo','exit','set','pause','timeout','title','color','rem','call','goto','powershell','pwsh','curl','ping','ipconfig','nslookup','hostname','whoami','systeminfo'];
let tc=null;
const names=()=>{const o=new Set(CMDS);if(PSM.on){Object.keys(PSCMD).forEach(k=>{if(k.indexOf('.')<0&&k.indexOf('-')>0)o.add(psCap(k));else o.add(k)});Object.keys(PSALIAS).forEach(k=>o.add(k))}return[...o]};
const complete=async back=>{const v=inp.value,pos=inp.selectionStart==null?v.length:inp.selectionStart;
 if(tc&&tc.val===v&&tc.pos===pos){tc.i=(tc.i+(back?-1:1)+tc.c.length)%tc.c.length;const nv=tc.mk(tc.i);inp.value=nv.v;inp.setSelectionRange(nv.p,nv.p);tc.val=nv.v;tc.pos=nv.p;return}
 const before=v.slice(0,pos),after=v.slice(pos),m=/("?)([^\s"]*)$/.exec(before),tok=m[2],qs=m[1],st=before.length-tok.length-qs.length,first=!/\S/.test(before.slice(0,st));let cands=[];
 try{if(first&&!/[\\\/]/.test(tok)){const lt=tok.toLowerCase();cands=names().filter(n=>n.toLowerCase().startsWith(lt)).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));const dd=cands.filter(n=>n.toLowerCase()===lt);if(dd.length===cands.length)cands=cands.slice(0,1)}
  const ix=Math.max(tok.lastIndexOf('/'),tok.lastIndexOf('\\')),dirPart=tok.slice(0,ix+1),namePart=tok.slice(ix+1).toLowerCase();
  if(!cands.length||!first||/[\\\/]/.test(tok)){await ready;const r=await rp(dirPart||'.');if(r.it&&r.it.isDirectory){const items=await ls(r.path),sep=dirPart.indexOf('/')>=0&&dirPart.indexOf('\\')<0?'/':'\\';const pc=items.filter(x=>x.name.toLowerCase().startsWith(namePart)&&(namePart||x.name[0]!=='.')).map(x=>dirPart+x.name+(x.isDirectory?sep:''));cands=cands.length&&first?cands.concat(pc):pc}}}catch(e){cands=[]}
 if(!cands.length)return;const mk=i=>{let c=cands[i];const q=qs||(/\s/.test(c)?'"':'');const t=q+c;return{v:before.slice(0,st)+t+after,p:st+t.length}};
 tc={val:'',pos:0,c:cands,i:0,mk};const nv=mk(0);inp.value=nv.v;inp.setSelectionRange(nv.p,nv.p);tc.val=nv.v;tc.pos=nv.p;if(cands.length>1&&!first){}};
inp.addEventListener('paste',e=>{const t=(e.clipboardData&&e.clipboardData.getData('text'))||'';if(!/[\r\n]/.test(t.replace(/[\r\n]+$/,'')))return;e.preventDefault();const ls2=t.replace(/\r/g,'').split('\n');if(!ls2[ls2.length-1])ls2.pop();(async()=>{for(let i=0;i<ls2.length;i++){const part=i===0?inp.value.slice(0,inp.selectionStart||0)+ls2[0]+inp.value.slice(inp.selectionEnd||0):ls2[i];inp.value='';await submitLine(part);}})()});
const doCopy=()=>{let t=String(getSelection());if(!t)t=out.innerText;try{navigator.clipboard.writeText(t).then(()=>toast(String(getSelection())?'Copied':'Copied the whole screen')).catch(()=>{document.execCommand('copy')})}catch(x){try{document.execCommand('copy')}catch(y){}}};
const doPaste=async()=>{let t='';try{t=await navigator.clipboard.readText()}catch(x){toast('Allow clipboard access, or long-press the input and choose Paste');return}if(!t)return;inp.focus();const a=inp.selectionStart||0,b=inp.selectionEnd||0;if(/[\r\n]/.test(t.replace(/[\r\n]+$/,''))){const ls2=t.replace(/\r/g,'').split('\n');if(!ls2[ls2.length-1])ls2.pop();for(let i=0;i<ls2.length;i++){const part=i===0?inp.value.slice(0,a)+ls2[0]+inp.value.slice(b):ls2[i];inp.value='';await submitLine(part)}}else{inp.value=inp.value.slice(0,a)+t+inp.value.slice(b);inp.setSelectionRange(a+t.length,a+t.length)}};
const tmk=$('.tmk',B);if(tmk)tmk.addEventListener('pointerdown',e=>e.preventDefault());
if(tmk)tmk.onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;
 if(k==='tab')complete(false);else if(k==='up'&&hi>0){hi--;inp.value=hist[hi]}else if(k==='dn'){if(hi<hist.length-1){hi++;inp.value=hist[hi]}else{hi=hist.length;inp.value=''}}
 else if(k==='c'){if(busy||waitIn){stopBat=true;if(waitIn){const r=waitIn;waitIn=null;r('')}}else{inp.value='';put('^C','e')}}
 else if(k==='copy')doCopy();else if(k==='paste')doPaste();else if(k==='cls')out.innerHTML='';inp.focus()};
inp.onkeydown=async e=>{
if(e.key==='Tab'){e.preventDefault();await complete(e.shiftKey);return}
if(e.ctrlKey&&(e.key==='l'||e.key==='L')){e.preventDefault();out.innerHTML='';return}
if(e.key==='Escape'){inp.value='';return}
""")
# Enter: use the shared helper so the prompt text is right in both modes
rep("if(busy)return;stopBat=false;const line=inp.value;inp.value='';put(esc(win(cwd)+'>'+line));\nif(line.trim()){hist.push(line);if(hist.length>100)hist.shift()}hi=hist.length;busy=true;await run(line);busy=false;prompt();out.scrollTop=out.scrollHeight}",
    "if(busy)return;const line=inp.value;inp.value='';await submitLine(line)}")

rep("</style><!--NEXOS-END--></head>", """/*TERM-3.2.6*/
.tmk{display:flex;gap:6px;padding:0 8px 8px;overflow-x:auto;scrollbar-width:none;touch-action:pan-x;flex:none}
.tmk::-webkit-scrollbar{display:none}
.tmk button{flex:none;border:1px solid #ffffff2a;background:#ffffff14;color:#ddd;border-radius:8px;padding:5px 11px;font:600 11.5px system-ui,sans-serif;cursor:pointer}
.tmk button:active{background:#ffffff33}
</style><!--NEXOS-END--></head>""")
s, n = re.subn(r'Version 3\.2\.5', 'Version 3.2.6', s); assert n >= 1
s = s.replace("['Version','3.2.5']", "['Version','3.2.6']").replace("['Installed version','3.2.5']", "['Installed version','3.2.6']")
s = s.replace("T('NexOS [Version 3.2.5]')", "T('NexOS [Version 3.2.6]')")
rep("var VER='3.2.5'", "var VER='3.2.6'")
a = s.index('var ITEMS=['); b = s.index('];', a) + 2
s = s[:a] + """var ITEMS=[
['⌨️','&& and || work','Chain commands in both Command Prompt and PowerShell (&amp; too in Command Prompt)'],
['↹','Tab completion','Commands and file names; Tab again for the next match, Shift+Tab goes back'],
['📋','Copy and paste','New Copy / Paste / Ctrl+C / Tab buttons under the input; pasting many lines runs them one by one'],
['🪟','Clear modes','Window title and prompt show Command Prompt or PowerShell'],
['🌐','Clearer network errors','Shows the real reason behind "Unable to connect to the remote server"']
];""" + s[b:]
idx.write_text(s, encoding='utf-8')
pj = root / 'package.json'
if pj.exists():
    pj.write_text(re.sub(r'"version":\s*"[^"]*"', '"version": "3.2.6"', pj.read_text(encoding='utf-8'), count=1), encoding='utf-8')
with (root / 'DEV-NOTES.md').open('a', encoding='utf-8') as f:
    f.write("\n- v3.2.6 (TERM-3.2.6، بخش E): ترمینال: splitChain/run/run1 برای && و || (هر دو حالت) و & (فقط CMD)، موفقیت با شمارنده‌ی ES (E) و PSV['?']. Tab completion (complete(): دستورها + مسیرها با rp/ls، چرخشی)، نوار .tmk (Tab، ↑↓، Ctrl+C، Copy، Paste، Clear)، paste چندخطی با submitLine، عنوان پنجره Command Prompt/Windows PowerShell، prompt اکو در PS با 'PS '. psNetMsg علت واقعی خطا را در پرانتز نشان می‌دهد. NOTHERE: برای claude/npm/node/git/... پیام Termux.\n")
with (root / 'NEXT.md').open('a', encoding='utf-8') as f:
    f.write("\n## بعد از v3.2.6\nClaude Code واقعی داخل شبیه‌ساز اجرا نمیشه (برنامه‌ی واقعی Node/ویندوز لازم داره): از Termux (pkg install nodejs; npm i -g @anthropic-ai/claude-code) استفاده شود. اگر خطای شبکه ادامه داشت، متن داخل پرانتز خطا را بفرست.\n")
print('ok')
