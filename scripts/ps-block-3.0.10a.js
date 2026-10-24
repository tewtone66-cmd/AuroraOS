/* PS-3.0.10a  PowerShell emulation: statements, pipeline, cmdlets, HTTP/ping/DNS via AuroraNet plugin */
const PSV=PSM.vars,PSFN=PSM.funcs,PSVER='5.1.19041.4648';
const psIsO=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Date);
const psArr=v=>v==null?[]:Array.isArray(v)?v:[v];
const psLo=s=>String(s).toLowerCase();
const psErr=m=>{const e=new Error(m);e.ps=1;return e};
const psEsc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const psWc=(p,f)=>new RegExp('^'+String(p).replace(/[.+^${}()|\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$',f||'i');
const PSMON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const PSDAY=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const psH12=d=>d.getHours()%12||12;
const psTT=d=>d.getHours()<12?'AM':'PM';
const psFmtDT=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear()+' '+psH12(d)+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds())+' '+psTT(d);
const psFmtLong=d=>PSDAY[d.getDay()]+', '+PSMON[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear()+' '+psH12(d)+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds())+' '+psTT(d);
const psFmtD=(d,f)=>f.replace(/yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|fff|tt/g,t=>{switch(t){case'yyyy':return d.getFullYear();case'yy':return pad2(d.getFullYear()%100);case'MMMM':return PSMON[d.getMonth()];case'MMM':return PSMON[d.getMonth()].slice(0,3);case'MM':return pad2(d.getMonth()+1);case'M':return d.getMonth()+1;case'dddd':return PSDAY[d.getDay()];case'ddd':return PSDAY[d.getDay()].slice(0,3);case'dd':return pad2(d.getDate());case'd':return d.getDate();case'HH':return pad2(d.getHours());case'H':return d.getHours();case'hh':return pad2(psH12(d));case'h':return psH12(d);case'mm':return pad2(d.getMinutes());case'm':return d.getMinutes();case'ss':return pad2(d.getSeconds());case's':return d.getSeconds();case'fff':return String(d.getMilliseconds()).padStart(3,'0');case'tt':return psTT(d)}return t});
function psStr(v){if(v==null)return'';if(typeof v==='string')return v;if(typeof v==='boolean')return v?'True':'False';if(v instanceof Date)return psFmtDT(v);if(Array.isArray(v))return v.map(psStr).join(' ');if(psIsO(v)){if(v.__str!==undefined)return String(v.__str);if(v.__ht)return'System.Collections.Hashtable';return v.FullName||v.Name||'System.Object'}return String(v)}
const psTruthy=v=>v==null?false:Array.isArray(v)?(v.length>1||(v.length===1&&psTruthy(v[0]))):typeof v==='string'?v.length>0:typeof v==='number'?v!==0:!!v;
const psNum=v=>{if(typeof v==='number')return v;if(typeof v==='boolean')return v?1:0;if(v==null||v==='')return 0;const n=Number(typeof v==='string'?v.trim():v);if(isNaN(n))throw psErr('Cannot convert value "'+psStr(v)+'" to type "System.Int32". Error: "Input string was not in a correct format."');return n};
const psRound=(x,d)=>{const m=Math.pow(10,d||0),y=x*m,f=Math.floor(y),r=y-f;let z;if(Math.abs(r-.5)<1e-9)z=f%2===0?f:f+1;else z=Math.round(y);return z/m};
function psCmpv(a,b){if(a==null||b==null)return(a==null&&b==null)?0:(a==null?-1:1);
if(a instanceof Date||b instanceof Date){const x=+new Date(a),y=+new Date(b);return x<y?-1:x>y?1:0}
if(typeof a==='boolean'){const y=psTruthy(b);return a===y?0:(a?1:-1)}
if(typeof a==='number'){const y=psNum(b);return a<y?-1:a>y?1:0}
const x=psLo(psStr(a)),y=psLo(psStr(b));return x<y?-1:x>y?1:0}
function psProp(o,n){if(o==null)return null;const k=psLo(n);
if(Array.isArray(o)){if(k==='count'||k==='length')return o.length;const r=[];for(const x of o){const y=psProp(x,n);if(y!=null)r.push(y)}return r.length?r:null}
if(typeof o==='string'){return k==='length'?o.length:null}
if(o instanceof Date){switch(k){case'year':return o.getFullYear();case'month':return o.getMonth()+1;case'day':return o.getDate();case'hour':return o.getHours();case'minute':return o.getMinutes();case'second':return o.getSeconds();case'millisecond':return o.getMilliseconds();case'dayofweek':return PSDAY[o.getDay()];case'dayofyear':return Math.floor((o-new Date(o.getFullYear(),0,0))/864e5);case'date':return new Date(o.getFullYear(),o.getMonth(),o.getDate());case'ticks':return o.getTime()*1e4}return null}
if(typeof o==='number'||typeof o==='boolean'){return k==='count'||k==='length'?1:null}
if(psIsO(o)){for(const x of Object.keys(o)){if(psLo(x)===k&&x.slice(0,2)!=='__')return o[x]}
if(o.__ht){if(k==='keys')return Object.keys(o).filter(x=>x.slice(0,2)!=='__');if(k==='values')return Object.keys(o).filter(x=>x.slice(0,2)!=='__').map(x=>o[x]);if(k==='count')return Object.keys(o).filter(x=>x.slice(0,2)!=='__').length}
if(k==='count')return 1}
return null}
function psSetProp(o,n,v){if(!psIsO(o))throw psErr("The property '"+n+"' cannot be found on this object.");const k=psLo(n);for(const x of Object.keys(o)){if(psLo(x)===k){o[x]=v;return}}o[n]=v}
function psIdx(v,ix){if(v==null)throw psErr('Cannot index into a null array.');if(Array.isArray(ix))return ix.map(i=>psIdx(v,i));
if(Array.isArray(v)||typeof v==='string'){let i=psNum(ix);if(i<0)i+=v.length;const r=v[i];return r===undefined?null:r}
if(psIsO(v)){const k=psLo(psStr(ix));for(const x of Object.keys(v))if(psLo(x)===k&&x.slice(0,2)!=='__')return v[x];return null}
throw psErr('Unable to index into an object of this type.')}
function psKeys(o){return Object.keys(o).filter(k=>k.slice(0,2)!=='__')}
function psFmtV(v,fm){if(v instanceof Date)return psFmtD(v,fm);const k=/^([NnFfDdPpXx])(\d*)$/.exec(fm);if(k&&v!=null&&v!==''&&!isNaN(Number(v))){const n=Number(v),d=k[2]===''?null:+k[2];switch(k[1].toUpperCase()){case'N':return n.toLocaleString('en-US',{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d});case'F':return n.toFixed(d==null?2:d);case'D':return String(Math.trunc(n)).padStart(d||0,'0');case'P':return(n*100).toFixed(d==null?2:d)+' %';case'X':{let s=Math.trunc(n).toString(16);if(k[1]==='X')s=s.toUpperCase();return s.padStart(d||0,'0')}}}return psStr(v)}
function psFmt(f,a){return f.replace(/\{\{|\}\}|\{(\d+)(?:,(-?\d+))?(?::([^}]*))?\}/g,(m,i,al,fm)=>{if(m==='{{')return'{';if(m==='}}')return'}';const v=a[+i];let s=fm?psFmtV(v,fm):psStr(v);if(al){const n=+al;s=n<0?s.padEnd(-n):s.padStart(n)}return s})}
async function psCallM(o,n,a){const k=psLo(n);
if(psIsO(o)&&o.__sb){if(k==='invoke'||k==='invokereturnasis'){const acc=[];await psStmts(o.sb,acc);return acc.length===1?acc[0]:acc.length?acc:null}}
if(typeof o==='string'){switch(k){
case'toupper':case'toupperinvariant':return o.toUpperCase();case'tolower':case'tolowerinvariant':return o.toLowerCase();
case'trim':case'trimstart':case'trimend':{if(!a.length)return k==='trim'?o.trim():k==='trimstart'?o.trimStart():o.trimEnd();const cs=psArr(a[0]).flat().map(x=>psEsc(psStr(x))).join('');const L=new RegExp('^['+cs+']+'),R=new RegExp('['+cs+']+$');return k==='trim'?o.replace(L,'').replace(R,''):k==='trimstart'?o.replace(L,''):o.replace(R,'')}
case'replace':return o.split(psStr(a[0])).join(a.length>1?psStr(a[1]):'');
case'split':{const s=a[0];if(s==null)return o.split(/\s+/);const seps=psArr(s).flat().map(psStr).filter(x=>x!=='');if(!seps.length)return o.split(/\s+/);return o.split(new RegExp(seps.map(psEsc).join('|')))}
case'contains':return o.includes(psStr(a[0]));case'startswith':return o.startsWith(psStr(a[0]));case'endswith':return o.endsWith(psStr(a[0]));
case'substring':return a.length>1?o.substr(psNum(a[0]),psNum(a[1])):o.substring(psNum(a[0]));
case'indexof':return o.indexOf(psStr(a[0]));case'lastindexof':return o.lastIndexOf(psStr(a[0]));
case'padleft':return o.padStart(psNum(a[0]),a.length>1?psStr(a[1]):' ');case'padright':return o.padEnd(psNum(a[0]),a.length>1?psStr(a[1]):' ');
case'insert':return o.slice(0,psNum(a[0]))+psStr(a[1])+o.slice(psNum(a[0]));case'remove':return a.length>1?o.slice(0,psNum(a[0]))+o.slice(psNum(a[0])+psNum(a[1])):o.slice(0,psNum(a[0]));
case'tochararray':return[...o];case'tostring':return o;case'equals':return o===psStr(a[0]);case'compareto':return psCmpv(o,a[0]);case'gettype':return'System.String'}}
if(Array.isArray(o)){switch(k){case'contains':return o.some(x=>psCmpv(x,a[0])===0);case'indexof':return o.findIndex(x=>psCmpv(x,a[0])===0);case'clone':return o.slice();case'add':o.push(a[0]);return o.length-1;case'tostring':return psStr(o);case'foreach':{const r=[];for(const x of o){const sv=PSV._;PSV._=x;try{const acc=[];await psStmts(a[0].sb,acc);for(const y of acc)r.push(y)}finally{PSV._=sv}}return r}case'where':{const r=[];for(const x of o){const sv=PSV._;PSV._=x;try{const acc=[];await psStmts(a[0].sb,acc);if(psTruthy(acc.length===1?acc[0]:acc))r.push(x)}finally{PSV._=sv}}return r}}}
if(o instanceof Date){switch(k){case'tostring':return a.length?psFmtD(o,psStr(a[0])):psFmtDT(o);case'adddays':return new Date(+o+psNum(a[0])*864e5);case'addhours':return new Date(+o+psNum(a[0])*36e5);case'addminutes':return new Date(+o+psNum(a[0])*6e4);case'addseconds':return new Date(+o+psNum(a[0])*1e3);case'addmonths':{const d=new Date(o);d.setMonth(d.getMonth()+psNum(a[0]));return d}case'addyears':{const d=new Date(o);d.setFullYear(d.getFullYear()+psNum(a[0]));return d}case'toshortdatestring':return psFmtD(o,'M/d/yyyy');case'toshorttimestring':return psFmtD(o,'h:mm tt');case'tolongdatestring':return PSDAY[o.getDay()]+', '+PSMON[o.getMonth()]+' '+o.getDate()+', '+o.getFullYear();case'touniversaltime':return new Date(+o+o.getTimezoneOffset()*6e4)}}
if(typeof o==='number'){if(k==='tostring')return a.length?psFmtV(o,psStr(a[0])):String(o);if(k==='equals')return o===psNum(a[0])}
if(psIsO(o)&&o.__ht){switch(k){case'containskey':return psKeys(o).some(x=>psLo(x)===psLo(psStr(a[0])));case'add':o[psStr(a[0])]=a[1];return null;case'remove':{for(const x of psKeys(o))if(psLo(x)===psLo(psStr(a[0])))delete o[x];return null}}}
if(k==='tostring')return psStr(o);
throw psErr("Method invocation failed because ["+(o==null?'null':typeof o)+"] does not contain a method named '"+n+"'.")}
async function psStatic(tn,name,a){const t=psLo(tn).replace(/^system\./,'').split('.').pop(),k=psLo(name);
switch(t){
case'math':{const f=a||[];switch(k){case'pi':return Math.PI;case'e':return Math.E;case'round':return psRound(psNum(f[0]),f.length>1?psNum(f[1]):0);case'floor':return Math.floor(psNum(f[0]));case'ceiling':return Math.ceil(psNum(f[0]));case'abs':return Math.abs(psNum(f[0]));case'sqrt':return Math.sqrt(psNum(f[0]));case'pow':return Math.pow(psNum(f[0]),psNum(f[1]));case'max':return Math.max(psNum(f[0]),psNum(f[1]));case'min':return Math.min(psNum(f[0]),psNum(f[1]));case'truncate':return Math.trunc(psNum(f[0]));case'sin':return Math.sin(psNum(f[0]));case'cos':return Math.cos(psNum(f[0]));case'tan':return Math.tan(psNum(f[0]));case'log':return Math.log(psNum(f[0]));case'log10':return Math.log10(psNum(f[0]));case'sign':return Math.sign(psNum(f[0]))}break}
case'datetime':switch(k){case'now':return new Date();case'today':{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}case'utcnow':{const d=new Date();return new Date(+d+d.getTimezoneOffset()*6e4)}case'parse':{const d=new Date(psStr(a[0]));if(isNaN(d))throw psErr('String was not recognized as a valid DateTime.');return d}}break;
case'environment':switch(k){case'newline':return'\n';case'machinename':return'NEXOS-PC';case'username':return'user';case'currentdirectory':return win(cwd);case'getenvironmentvariable':return psEnv(psStr(a[0]));case'osversion':return'Microsoft Windows NT 10.0.22631.0';case'processorcount':return navigator.hardwareConcurrency||4;case'is64bitoperatingsystem':return true}break;
case'string':switch(k){case'join':return psArr(a[1]).flat().map(psStr).join(psStr(a[0]));case'isnullorempty':return a[0]==null||psStr(a[0])==='';case'isnullorwhitespace':return a[0]==null||psStr(a[0]).trim()==='';case'format':return psFmt(psStr(a[0]),a.slice(1).length===1&&Array.isArray(a[1])?a[1]:a.slice(1));case'concat':return a.map(psStr).join('');case'empty':return''}break;
case'convert':switch(k){case'toint32':case'toint64':case'toint16':return Math.trunc(psNum(a[0]));case'todouble':case'todecimal':return psNum(a[0]);case'tostring':return a.length>1?psNum(a[0]).toString(psNum(a[1])):psStr(a[0]);case'toboolean':return psTruthy(a[0]);case'tochar':return String.fromCharCode(psNum(a[0]))}break;
case'int':case'int32':case'int64':case'double':switch(k){case'parse':return psNum(a[0]);case'maxvalue':return t==='double'?Number.MAX_VALUE:2147483647;case'minvalue':return t==='double'?-Number.MAX_VALUE:-2147483648}break;
case'guid':if(k==='newguid')return{__str:(crypto&&crypto.randomUUID?crypto.randomUUID():'00000000-0000-4000-8000-'+String(Date.now()).padStart(12,'0'))};break;
case'console':if(k==='writeline'){T(a&&a.length?psStr(a[0]):'');return null}break;
case'path':{const s=psStr(a&&a[0]);switch(k){case'combine':return a.map(psStr).join('\\').replace(/[\\\/]+/g,'\\');case'getfilename':return s.split(/[\\\/]/).pop();case'getextension':{const f=s.split(/[\\\/]/).pop(),i=f.lastIndexOf('.');return i<0?'':f.slice(i)}case'getdirectoryname':{const i=Math.max(s.lastIndexOf('\\'),s.lastIndexOf('/'));return i<0?'':s.slice(0,i)}case'getfilenamewithoutextension':{const f=s.split(/[\\\/]/).pop(),i=f.lastIndexOf('.');return i<0?f:f.slice(0,i)}}break}
case'file':{const s=psStr(a&&a[0]);switch(k){case'exists':{try{const r=await rp(s);return!!r.it&&!r.it.isDirectory}catch(e){return false}}case'readalltext':{const r=await rp(s);if(!r.it)throw psErr("Could not find file '"+psWin(s)+"'.");return(await NF.readText({path:r.path})).text||''}case'readalllines':{const r=await rp(s);if(!r.it)throw psErr("Could not find file '"+psWin(s)+"'.");const L=((await NF.readText({path:r.path})).text||'').replace(/\r/g,'').split('\n');if(L.length&&L[L.length-1]==='')L.pop();return L}case'writealltext':{const r=await rp(s);await NF.writeText({path:r.path,text:psStr(a[1])});return null}}break}
case'directory':{const s=psStr(a&&a[0]);if(k==='exists'){try{const r=await rp(s);return!!r.it&&!!r.it.isDirectory}catch(e){return false}}break}
}
throw psErr("Unable to find type or member ["+tn+"]::"+name+".")}
function psCast(tn,v){const t=psLo(tn).replace(/^system\./,'');switch(t){
case'int':case'int32':case'int64':case'long':case'int16':case'byte':return psRound(psNum(v),0);
case'double':case'float':case'single':case'decimal':return psNum(v);
case'string':return psStr(v);case'bool':case'boolean':return psTruthy(v);
case'char':return typeof v==='number'?String.fromCharCode(v):psStr(v).charAt(0);
case'array':case'object[]':case'string[]':case'int[]':return psArr(v);
case'datetime':{const d=new Date(psStr(v));if(isNaN(d))throw psErr('Cannot convert value "'+psStr(v)+'" to type "System.DateTime".');return d}
case'pscustomobject':{if(psIsO(v)){const o={};for(const k of psKeys(v))o[k]=v[k];return o}return v}
case'ordered':case'hashtable':case'object':case'psobject':case'switch':case'regex':case'scriptblock':return v;
case'xml':case'void':return v}
throw psErr('Unable to find type ['+tn+'].')}
const PSE=['USERNAME','COMPUTERNAME','OS','USERPROFILE','HOMEDRIVE','HOMEPATH','SYSTEMROOT','WINDIR','PATH','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS','TEMP','TMP','PATHEXT'];
function psEnv(n){const k=String(n).toUpperCase();if(hasEnv(k))return ENV[k];switch(k){case'USERNAME':return'user';case'COMPUTERNAME':return'NEXOS-PC';case'OS':return'Windows_NT';case'USERPROFILE':return win(root);case'HOMEDRIVE':return'C:';case'HOMEPATH':return'\\';case'SYSTEMROOT':case'WINDIR':return'C:\\Windows';case'PATH':return'C:\\Windows\\System32;C:\\Windows';case'PROCESSOR_ARCHITECTURE':return'AMD64';case'NUMBER_OF_PROCESSORS':return String(navigator.hardwareConcurrency||4);case'TEMP':case'TMP':return win(root)+(win(root).endsWith('\\')?'':'\\')+'Download';case'PATHEXT':return'.COM;.EXE;.BAT;.CMD;.PS1'}return null}
function psVar(n){const k=psLo(n).replace(/^(global|script|local|private):/,'');
if(k.slice(0,4)==='env:')return psEnv(k.slice(4));
switch(k){case'true':return true;case'false':return false;case'null':return null;case'pwd':return{__str:win(cwd),Path:win(cwd)};case'home':case'userprofile':return win(root);case'pshome':return'C:\\Windows\\System32\\WindowsPowerShell\\v1.0';case'psscriptroot':return win(cwd);case'lastexitcode':return errl;case'error':return PSV.error||[];case'args':return PSV.args||[];case'?':return PSV['?']!==false;case'psversiontable':return{__ht:1,PSVersion:PSVER,PSEdition:'Desktop',BuildVersion:'10.0.19041.4648',CLRVersion:'4.0.30319.42000',Platform:'Win32NT'};case'psitem':return PSV._===undefined?null:PSV._;case'host':return{Name:'ConsoleHost',Version:PSVER};case'pid':return 4242;case'verbosepreference':case'erroractionpreference':return'Continue'}
const v=PSV[k];return v===undefined?null:v}
function psWs(P){while(P.i<P.s.length&&/\s/.test(P.s[P.i]))P.i++}
function psClose(s,i){const o=s[i],c={'(':')','{':'}','[':']'}[o];let d=0,q=null;for(let j=i;j<s.length;j++){const ch=s[j];
if(q){if(ch==='`'&&q==='"'){j++;continue}if(ch===q){if(s[j+1]===q){j++;continue}q=null}continue}
if(ch==='"'||ch==="'"){q=ch;continue}
if(ch===o)d++;else if(ch===c){d--;if(!d)return j}}
throw psErr("Missing closing '"+c+"' in expression or statement.")}
function psSplit(t,seps){const out=[];let d=0,q=null,s=0;for(let j=0;j<t.length;j++){const ch=t[j];
if(q){if(ch==='`'&&q==='"'){j++;continue}if(ch===q){if(t[j+1]===q){j++;continue}q=null}continue}
if(ch==='"'||ch==="'"){q=ch;continue}
if(ch==='#'&&d===0&&(j===0||/\s/.test(t[j-1]))){const k=t.indexOf('\n',j);j=(k<0?t.length:k)-1;continue}
if(ch==='('||ch==='['||ch==='{')d++;else if(ch===')'||ch===']'||ch==='}')d--;
else if(d===0&&seps.indexOf(ch)>=0){if(ch==='|'&&t[j+1]==='|'){j++;continue}out.push(t.slice(s,j));s=j+1}}
out.push(t.slice(s));return out}
function psParts(text){const parts=[];for(const p of psSplit(text,';\n')){const t=p.trim();if(!t||t[0]==='#')continue;
if(parts.length){const pv=parts[parts.length-1];if(/^(else|elseif|catch|finally)\b/i.test(t)||(t[0]==='{'&&/^(if|elseif|else|foreach|for|while|try|catch|finally|function|filter|do|switch)\b/i.test(pv)&&!/\}\s*$/.test(pv))||(/^(while|until)\s*\(/i.test(t)&&/^do\b/i.test(pv)&&/\}\s*$/.test(pv))){parts[parts.length-1]=pv+' '+t;continue}}
parts.push(t)}return parts}
async function psExpr(src){const P={s:src,i:0};const v=await psOr(P);psWs(P);if(P.i<P.s.length)throw psErr("Unexpected token '"+P.s.slice(P.i).split(/\s/)[0]+"' in expression or statement.");return v}
function psOp(P,list){psWs(P);if(P.s[P.i]!=='-')return null;const m=/^-([a-z]+)(?![\w-])/i.exec(P.s.slice(P.i,P.i+14));if(!m)return null;const o=m[1].toLowerCase();if(list.indexOf(o)<0)return null;P.i+=m[0].length;return o}
async function psOr(P){let l=await psAnd(P);for(;;){const o=psOp(P,['or','xor']);if(!o)return l;const r=await psAnd(P);l=o==='or'?(psTruthy(l)||psTruthy(r)):(psTruthy(l)!==psTruthy(r))}}
async function psAnd(P){let l=await psCmp(P);for(;;){if(!psOp(P,['and']))return l;const r=await psCmp(P);l=psTruthy(l)&&psTruthy(r)}}
const PSCMP=['eq','ne','gt','lt','ge','le','like','notlike','match','notmatch','contains','notcontains','in','notin','replace','split','join','f'];
async function psCmp(P){let l=await psAdd(P);for(;;){const o=psOp(P,PSCMP);if(!o)return l;const r=await psAdd(P);l=psBin(o,l,r)}}
function psBin(o,l,r){switch(o){
case'eq':case'ne':case'gt':case'lt':case'ge':case'le':{const t=x=>{const c=psCmpv(x,r);return o==='eq'?c===0:o==='ne'?c!==0:o==='gt'?c>0:o==='lt'?c<0:o==='ge'?c>=0:c<=0};return Array.isArray(l)?l.filter(t):t(l)}
case'like':case'notlike':{const re=psWc(psStr(r));const t=x=>re.test(psStr(x))===(o==='like');return Array.isArray(l)?l.filter(t):t(l)}
case'match':case'notmatch':{const re=new RegExp(psStr(r),'i');const t=x=>{const m=re.exec(psStr(x));if(m&&o==='match'){const hm={__ht:1};m.forEach((g,i)=>{hm[i]=g});if(m.groups)Object.assign(hm,m.groups);PSV.matches=hm}return!!m===(o==='match')};return Array.isArray(l)?l.filter(t):t(l)}
case'contains':return psArr(l).some(x=>psCmpv(x,r)===0);case'notcontains':return!psArr(l).some(x=>psCmpv(x,r)===0);
case'in':return psArr(r).some(x=>psCmpv(x,l)===0);case'notin':return!psArr(r).some(x=>psCmpv(x,l)===0);
case'replace':{const a=psArr(r),re=new RegExp(psStr(a[0]),'gi'),rep=a.length>1?psStr(a[1]):'';const f=x=>psStr(x).replace(re,rep);return Array.isArray(l)?l.map(f):f(l)}
case'split':return psStr(l).split(new RegExp(psStr(psArr(r)[0]),'i'));
case'join':return psArr(l).map(psStr).join(r==null?'':psStr(r));
case'f':return psFmt(psStr(l),psArr(r))}return null}
function psPlus(l,r){if(l==null)return r;if(Array.isArray(l))return l.concat(Array.isArray(r)?r:[r]);if(typeof l==='string')return l+psStr(r);if(l instanceof Date&&typeof r==='number')return new Date(+l+r*864e5);return psNum(l)+psNum(r)}
async function psAdd(P){let l=await psMul(P);for(;;){psWs(P);const c=P.s[P.i];if(c==='+'&&P.s[P.i+1]!=='='){P.i++;l=psPlus(l,await psMul(P))}else if(c==='-'&&!/[A-Za-z=]/.test(P.s[P.i+1]||'')){P.i++;l=psNum(l)-psNum(await psMul(P))}else return l}}
async function psMul(P){let l=await psRange(P);for(;;){psWs(P);const c=P.s[P.i];if((c==='*'||c==='/'||c==='%')&&P.s[P.i+1]!=='='){P.i++;const r=await psRange(P);if(c==='*'){if(typeof l==='string')l=l.repeat(psNum(r));else if(Array.isArray(l)){let o=[];for(let i=0;i<psNum(r);i++)o=o.concat(l);l=o}else l=psNum(l)*psNum(r)}else{const d=psNum(r);if(d===0)throw psErr('Attempted to divide by zero.');l=c==='/'?psNum(l)/d:psNum(l)%d}}else return l}}
async function psRange(P){const l=await psUnary(P);psWs(P);if(P.s[P.i]==='.'&&P.s[P.i+1]==='.'){P.i+=2;const r=await psUnary(P);const a=Math.trunc(psNum(l)),b=Math.trunc(psNum(r));if(Math.abs(b-a)>1000000)throw psErr('The range is too large.');const o=[];if(a<=b)for(let i=a;i<=b;i++)o.push(i);else for(let i=a;i>=b;i--)o.push(i);return o}return l}
async function psUnary(P){psWs(P);const c=P.s[P.i];
if(c==='!'&&P.s[P.i+1]!=='='){P.i++;return!psTruthy(await psUnary(P))}
if(c==='-'){const o=psOp(P,['not','bnot','join','split']);if(o){const v=await psUnary(P);if(o==='not')return!psTruthy(v);if(o==='bnot')return~psNum(v);if(o==='join')return psArr(v).map(psStr).join('');return psStr(v).trim().split(/\s+/)}
if(/[\d.$(\[]/.test(P.s[P.i+1]||'')){P.i++;return-psNum(await psUnary(P))}}
if(c==='+'&&/[\d.$(]/.test(P.s[P.i+1]||'')){P.i++;return psNum(await psUnary(P))}
return await psComma(P)}
async function psComma(P){const f=await psPostfix(P);if(P.nc)return f;psWs(P);if(P.s[P.i]!==',')return f;const a=[f];for(;;){psWs(P);if(P.s[P.i]!==',')break;P.i++;a.push(await psPostfix(P))}return a}
async function psArgs(P){const a=[],sv=P.nc;P.nc=1;try{for(;;){psWs(P);if(P.s[P.i]===')'){P.i++;return a}a.push(await psOr(P));psWs(P);if(P.s[P.i]===','){P.i++;continue}if(P.s[P.i]===')'){P.i++;return a}throw psErr("Missing ')' in method call.")}}finally{P.nc=sv}}
async function psPostfix(P){let v=await psPrimary(P);for(;;){const c=P.s[P.i];
if(c==='.'&&P.s[P.i+1]!=='.'){P.i++;const m=/[A-Za-z_]\w*/y;m.lastIndex=P.i;const r=m.exec(P.s);if(!r)throw psErr('Missing property name after reference operator.');P.i+=r[0].length;if(P.s[P.i]==='('){P.i++;const a=await psArgs(P);v=await psCallM(v,r[0],a)}else v=psProp(v,r[0]);continue}
if(c==='['){const e=psClose(P.s,P.i);const sv=P.nc;P.nc=0;let ix;try{const Q={s:P.s.slice(P.i+1,e),i:0};ix=await psOr(Q);psWs(Q);if(Q.i<Q.s.length)throw psErr('Missing ] at end of index expression.')}finally{P.nc=sv}P.i=e+1;v=psIdx(v,ix);continue}
break}return v}
function psNumLit(t){if(/^0x/i.test(t))return parseInt(t,16);const m=/^(.*?)(kb|mb|gb|tb)$/i.exec(t);if(m){const k={kb:1024,mb:1048576,gb:1073741824,tb:1099511627776}[m[2].toLowerCase()];return Number(m[1])*k}return Number(t)}
async function psPrimary(P){psWs(P);const s=P.s,c=s[P.i];if(c===undefined)throw psErr('Unexpected end of expression.');
if(/\d/.test(c)||(c==='.'&&/\d/.test(s[P.i+1]||''))){const re=/0x[0-9a-f]+|(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?(?:kb|mb|gb|tb)?/iy;re.lastIndex=P.i;const m=re.exec(s);P.i+=m[0].length;return psNumLit(m[0])}
if(c==="'"){let o='',j=P.i+1;for(;;){if(j>=s.length)throw psErr('The string is missing the terminator: \'.');if(s[j]==="'"){if(s[j+1]==="'"){o+="'";j+=2;continue}break}o+=s[j++]}P.i=j+1;return o}
if(c==='"'){let o='',j=P.i+1;const n=s.length;for(;;){if(j>=n)throw psErr('The string is missing the terminator: ".');const ch=s[j];
if(ch==='`'){const x=s[j+1];o+=x==='n'?'\n':x==='t'?'\t':x==='r'?'\r':x==='0'?'\0':x==='a'?'\x07':x===undefined?'':x;j+=2;continue}
if(ch==='"'){if(s[j+1]==='"'){o+='"';j+=2;continue}break}
if(ch==='$'){if(s[j+1]==='('){const e=psClose(s,j+1);o+=psStr(await psStmtsVal(s.slice(j+2,e)));j=e+1;continue}
const m=/\$(?:\{([^}]+)\}|((?:env|global|script|local):\w+|\w+)|(\?))/y;m.lastIndex=j;const r=m.exec(s);if(r){o+=psStr(psVar(r[1]||r[2]||'?'));j+=r[0].length;continue}}
o+=ch;j++}P.i=j+1;return o}
if(c==='$'){if(s[P.i+1]==='('){const e=psClose(s,P.i+1);const inner=s.slice(P.i+2,e);P.i=e+1;return await psStmtsVal(inner)}
const m=/\$(?:\{([^}]+)\}|((?:env|global|script|local|private):\w+|\w+)|([?$^]))/y;m.lastIndex=P.i;const r=m.exec(s);if(!r)throw psErr("Variable reference is not valid: '$' was not followed by a valid variable name character.");P.i+=r[0].length;return psVar(r[1]||r[2]||r[3])}
if(c==='('){const e=psClose(s,P.i);const inner=s.slice(P.i+1,e);P.i=e+1;return await psStmtsVal(inner)}
if(c==='@'&&s[P.i+1]==='('){const e=psClose(s,P.i+1);const inner=s.slice(P.i+2,e);P.i=e+1;const acc=[];await psStmts(inner,acc);return acc}
if(c==='@'&&s[P.i+1]==='{'){const e=psClose(s,P.i+1);const inner=s.slice(P.i+2,e);P.i=e+1;const ht={__ht:1};for(const part of psSplit(inner,';\n')){const t=part.trim();if(!t||t[0]==='#')continue;const m=/^("[^"]*"|'[^']*'|[\w.$-]+)\s*=\s*([\s\S]*)$/.exec(t);if(!m)throw psErr('Missing = operator after key in hash literal.');let k=m[1];if(k[0]==='"'||k[0]==="'")k=k.slice(1,-1);ht[k]=await psStmtsVal(m[2])}return ht}
if(c==='{'){const e=psClose(s,P.i);const inner=s.slice(P.i+1,e);P.i=e+1;return{__sb:1,sb:inner.trim(),__str:'{'+inner+'}'}}
if(c==='['){const e=psClose(s,P.i);const tn=s.slice(P.i+1,e).trim();P.i=e+1;
if(s.startsWith('::',P.i)){P.i+=2;const m=/[A-Za-z_]\w*/y;m.lastIndex=P.i;const r=m.exec(s);if(!r)throw psErr('Missing name after :: operator.');P.i+=r[0].length;let a=null;if(s[P.i]==='('){P.i++;a=await psArgs(P)}return await psStatic(tn,r[0],a)}
const v=await psUnary(P);return psCast(tn,v)}
throw psErr("Unexpected token '"+s.slice(P.i).split(/\s/)[0]+"' in expression or statement.")}
async function psStmtsVal(text){const acc=[];await psStmts(text,acc);return acc.length===0?null:acc.length===1?acc[0]:acc}
async function psStmts(text,acc){acc=acc||[];for(const t of psParts(text))await psStmt(t,acc);return acc}
function psBlock(t,k){while(/\s/.test(t[k]||''))k++;if(t[k]!=='{')throw psErr('Missing statement block.');const e=psClose(t,k);return{body:t.slice(k+1,e),end:e+1}}
function psHdr(t,from){const j=t.indexOf('(',from);if(j<0)throw psErr('Missing ( after keyword.');const e=psClose(t,j);return{text:t.slice(j+1,e),end:e+1}}
async function psLoopBody(body,acc){try{await psStmts(body,acc)}catch(e){if(e&&e.psflow==='break')return 1;if(e&&e.psflow==='continue')return 0;throw e}return 0}
function psChk(){if(stopBat)throw new Error('^C');if(!W[w.id])throw new Error('^C')}
async function psStmt(t,acc){t=t.trim();if(!t||t[0]==='#')return;let m;
if(/^if\s*\(/i.test(t)){let i=2;for(;;){const h=psHdr(t,i),b=psBlock(t,h.end);i=b.end;if(psTruthy(await psStmtsVal(h.text))){await psStmts(b.body,acc);return}const rest=t.slice(i);let mm=/^\s*elseif\b/i.exec(rest);if(mm){i+=mm[0].length;continue}mm=/^\s*else\b/i.exec(rest);if(mm){const eb=psBlock(t,i+mm[0].length);await psStmts(eb.body,acc)}return}}
if(/^foreach\s*\(/i.test(t)){const h=psHdr(t,7),b=psBlock(t,h.end);const mm=/^\s*\$(\w+)\s+in\s+([\s\S]+)$/i.exec(h.text);if(!mm)throw psErr('Unexpected token in foreach statement.');const nm=psLo(mm[1]);const list=psArr(await psStmtsVal(mm[2]));let n=0;for(const it of list){PSV[nm]=it;if(++n%200===0){psChk();await sleep(0)}if(await psLoopBody(b.body,acc))break}return}
if(/^for\s*\(/i.test(t)){const h=psHdr(t,3),b=psBlock(t,h.end);const p=psSplit(h.text,';');if(p.length!==3)throw psErr('Unexpected token in for statement.');await psStmts(p[0],[]);let n=0;while(p[1].trim()===''||psTruthy(await psStmtsVal(p[1]))){if(++n%200===0){psChk();await sleep(0)}if(n>1e6)throw psErr('Loop stopped after 1000000 iterations.');if(await psLoopBody(b.body,acc))break;await psStmts(p[2],[])}return}
if(/^while\s*\(/i.test(t)){const h=psHdr(t,5),b=psBlock(t,h.end);let n=0;while(psTruthy(await psStmtsVal(h.text))){if(++n%200===0){psChk();await sleep(0)}else if(n%20===0)await sleep(0);if(n>1e6)throw psErr('Loop stopped after 1000000 iterations.');if(await psLoopBody(b.body,acc))break}return}
if(/^do\s*\{/i.test(t)){const b=psBlock(t,2);const mm=/^\s*(while|until)\s*\(/i.exec(t.slice(b.end));if(!mm)throw psErr("Missing while or until keyword in do loop.");const h=psHdr(t,b.end+mm[0].length-1);let n=0;for(;;){if(++n%100===0){psChk();await sleep(0)}if(n>1e6)throw psErr('Loop stopped after 1000000 iterations.');if(await psLoopBody(b.body,acc))break;const c=psTruthy(await psStmtsVal(h.text));if(psLo(mm[1])==='while'?!c:c)break}return}
if(/^try\s*\{/i.test(t)){const tb=psBlock(t,3);let i=tb.end,cb=null,fb=null;let mm=/^\s*catch\s*(\[[^\]]*\]\s*(,\s*\[[^\]]*\]\s*)*)?(?=\{)/i.exec(t.slice(i));if(mm){cb=psBlock(t,i+mm[0].length);i=cb.end}mm=/^\s*finally\b/i.exec(t.slice(i));if(mm){fb=psBlock(t,i+mm[0].length)}
try{await psStmts(tb.body,acc)}catch(e){if(e&&(e.psflow||e.message==='^C'))throw e;if(!cb)throw e;const msg=(e&&e.message)||String(e);const eo={Exception:{Message:msg},Message:msg,__str:msg};PSV.error=[eo].concat(PSV.error||[]);const sv=PSV._;PSV._=eo;try{await psStmts(cb.body,acc)}finally{PSV._=sv}}
finally{if(fb)await psStmts(fb.body,acc)}return}
if(m=/^(?:function|filter)\s+([\w:-]+)\s*/i.exec(t)){const name=m[1].replace(/^(global|script):/i,'');let k=m[0].length,params=[];if(t[k]==='('){const e=psClose(t,k);params=psParams(t.slice(k+1,e));k=e+1}const b=psBlock(t,k);let body=b.body;const pm=/^\s*param\s*\(/i.exec(body);if(pm){const pe=psClose(body,pm[0].length-1);params=psParams(body.slice(pm[0].length,pe));body=body.slice(pe+1)}PSFN[psLo(name)]={params,body};return}
if(m=/^(return|break|continue|throw|exit)\b\s*([\s\S]*)$/i.exec(t)){const kw=psLo(m[1]);const rv=m[2].trim()?await psStmtsVal(m[2]):null;
if(kw==='return')throw{psflow:'return',val:rv};if(kw==='break'||kw==='continue')throw{psflow:kw};if(kw==='throw')throw psErr(rv==null?'ScriptHalted':psStr(rv));
if(PSM.nested){PSM.on=false;PSM.nested=false;w.setTitle('Terminal');throw{psflow:'return',val:null}}closeW(w.id,true);throw{psflow:'return',val:null}}
if(m=/^(?:\[[\w.\[\]]+\]\s*)?\$(?:(?:global|script|local):)?(env:)?(\w+)\s*(\+|-|\*|\/|%)?=(?!=)\s*([\s\S]*)$/i.exec(t)){const cast=/^\[([\w.\[\]]+)\]/.exec(t);const op=m[3];let rhs=m[4].trim();if(rhs==='')throw psErr('An expression was expected after =.');let val=await psStmtsVal(rhs);if(/^@\(/.test(rhs)&&!Array.isArray(val))val=val==null?[]:[val];
if(m[1]){const k=m[2].toUpperCase();let cur=psEnv(k);if(op)val=psBin2(op,cur,val);if(val==null)delete ENV[k];else ENV[k]=psStr(val);return}
const k=psLo(m[2]);if(op)val=psBin2(op,psVar(k),val);if(cast)val=psCast(cast[1],val);PSV[k]=val;return}
if(m=/^\$(\w+)\s*(\+\+|--)$/.exec(t)){const k=psLo(m[1]);PSV[k]=psNum(psVar(k))+(m[2]==='++'?1:-1);return}
if(m=/^\$(\w+)((?:\.\w+|\[[^\]]+\])+)\s*(\+|-|\*|\/)?=(?!=)\s*([\s\S]*)$/.exec(t)){let obj=psVar(m[1]);const accs=[];m[2].replace(/\.(\w+)|\[([^\]]+)\]/g,(x,a,b)=>{accs.push(a!==undefined?{p:a}:{i:b})});
for(let i=0;i<accs.length-1;i++){const a=accs[i];obj=a.p!==undefined?psProp(obj,a.p):psIdx(obj,await psExpr(a.i))}
let val=await psStmtsVal(m[4]);const last=accs[accs.length-1];
if(last.p!==undefined){if(m[3])val=psBin2(m[3],psProp(obj,last.p),val);psSetProp(obj,last.p,val)}
else{const ix=await psExpr(last.i);if(Array.isArray(obj)){const n=psNum(ix);if(m[3])val=psBin2(m[3],obj[n],val);obj[n<0?obj.length+n:n]=val}else{if(m[3])val=psBin2(m[3],psIdx(obj,ix),val);psSetProp(obj,psStr(ix),val)}}return}
const o=await psPipe(t);for(const x of o)acc.push(x)}
function psBin2(op,l,r){if(op==='+')return psPlus(l,r);if(op==='-')return psNum(l)-psNum(r);if(op==='*')return typeof l==='string'?l.repeat(psNum(r)):psNum(l)*psNum(r);const d=psNum(r);if(d===0)throw psErr('Attempted to divide by zero.');return op==='/'?psNum(l)/d:psNum(l)%d}
function psParams(text){const o=[];for(const p of psSplit(text,',')){const m=/\$(\w+)(?:\s*=\s*([\s\S]+))?$/.exec(p.trim());if(m)o.push({n:psLo(m[1]),def:m[2],sw:/\[switch\]/i.test(p)})}return o}
async function psCallFn(fn,c){const ps=fn.params,vals={};
ps.forEach(p=>{if(c.named[p.n]!==undefined)vals[p.n]=c.named[p.n]});
let pi=0;const rest=[];for(const v of c.pos){while(pi<ps.length&&Object.prototype.hasOwnProperty.call(vals,ps[pi].n))pi++;if(pi<ps.length){vals[ps[pi].n]=v;pi++}else rest.push(v)}
const names=ps.map(p=>p.n).concat(['args']),old={};names.forEach(n=>{old[n]=PSV[n]});
const acc=[];try{for(const p of ps){if(Object.prototype.hasOwnProperty.call(vals,p.n))PSV[p.n]=vals[p.n];else PSV[p.n]=p.def!==undefined?await psStmtsVal(p.def):(p.sw?false:null)}PSV.args=rest;
try{await psStmts(fn.body,acc)}catch(e){if(e&&e.psflow==='return'){for(const x of psArr(e.val))acc.push(x)}else throw e}}
finally{names.forEach(n=>{if(old[n]===undefined)delete PSV[n];else PSV[n]=old[n]})}
return acc}
const psExprStart=s=>/^(?:\$|\(|\[|@[({]|['"]|\d|!|-\s*[\d$(]|-not\b)/i.test(s)||/^\.\d/.test(s);
function psRedir(t){let d=0,q=null;for(let j=0;j<t.length;j++){const ch=t[j];if(q){if(ch==='`'&&q==='"'){j++;continue}if(ch===q){if(t[j+1]===q){j++;continue}q=null}continue}
if(ch==='"'||ch==="'"){q=ch;continue}if(ch==='('||ch==='['||ch==='{')d++;else if(ch===')'||ch===']'||ch==='}')d--;
else if(ch==='>'&&d===0&&t[j-1]!=='-'){const app=t[j+1]==='>';const rest=t.slice(j+(app?2:1)).trim();if(!rest||rest[0]==='&')return null;return{cmd:t.slice(0,j).replace(/\s+\d?$/,''),append:app,file:rest}}}return null}
async function psPipe(t){const rd=psRedir(t);const stages=psSplit(rd?rd.cmd:t,'|').map(s=>s.trim());let data=[];
for(let i=0;i<stages.length;i++){if(!stages[i])throw psErr('An empty pipe element is not allowed.');data=await psStage(stages[i],data,i===0)}
if(rd){const text=psFmtOut(data).join('\n')+'\n';await psWriteFile(psStr(await psArg(rd.file)),text,rd.append);return[]}return data}
async function psStage(st,input,first){if(first&&psExprStart(st)){const v=await psExpr(st);return v==null?[]:Array.isArray(v)?v:[v]}return await psCmd(st,input)}
const PSVALP=new Set(['path','literalpath','destination','name','value','itemtype','uri','outfile','filepath','filter','include','exclude','first','last','skip','newname','method','body','headers','contenttype','timeoutsec','id','property','expandproperty','count','depth','pattern','separator','delimiter','format','uformat','seconds','milliseconds','totalcount','head','tail','encoding','foregroundcolor','backgroundcolor','inputobject','pathtype','message','minimum','maximum','scriptblock','process','membername','eq','ne','gt','lt','ge','le','like','notlike','match','notmatch','contains','notcontains','in','notin','computername','port','useragent','command','argumentlist','workingdirectory','prompt','date','year','month','day','hour','minute','second','objectnotation','unique_','pipelinevariable','erroraction','warningaction','outvariable','targetname']);
async function psArg(t){const c=t[0];
if(c==='{'&&t[t.length-1]==='}')return{__sb:1,sb:t.slice(1,-1).trim(),__str:t};
if(c==='$'||c==='('||c==='@'||c==='"'||c==="'"||c==='['){try{return await psExpr(t)}catch(e){if(c==='['||c==='$'&&/[\\\/]/.test(t))return t;throw e}}
if(/^-?\d/.test(t)){try{return await psExpr(t)}catch(e){return t}}
const parts=psSplit(t,',');if(parts.length>1&&parts.every(x=>x!==''))return await Promise.all(parts.map(x=>psArg(x)));
if(t.indexOf('$')>0){try{return await psExpr('"'+t.replace(/"/g,'`"')+'"')}catch(e){return t}}
return t}
async function psParseArgs(toks,extra){const pos=[],named={};for(let i=0;i<toks.length;i++){const t=toks[i];let m=/^-([A-Za-z]\w*):(.+)$/.exec(t);if(m){named[psLo(m[1])]=await psArg(m[2]);continue}
m=/^-([A-Za-z]\w*)(:?)$/.exec(t);if(m){const k=psLo(m[1]);if(m[2]===':'||PSVALP.has(k)||(extra&&extra.has(k))){if(i+1<toks.length)named[k]=await psArg(toks[++i]);else named[k]=true}else named[k]=true;continue}
pos.push(await psArg(t))}return{pos,named}}
const PSALIAS={ls:'get-childitem',dir:'get-childitem',gci:'get-childitem',cd:'set-location',chdir:'set-location',sl:'set-location',pwd:'get-location',gl:'get-location',pushd:'push-location',popd:'pop-location',cat:'get-content',type:'get-content',gc:'get-content',sc:'set-content',ac:'add-content',rm:'remove-item',del:'remove-item',erase:'remove-item',ri:'remove-item',rmdir:'remove-item',rd:'remove-item',cp:'copy-item',copy:'copy-item',cpi:'copy-item',mv:'move-item',move:'move-item',mi:'move-item',ren:'rename-item',rni:'rename-item',md:'mkdir',ni:'new-item',gi:'get-item',echo:'write-output',write:'write-output',cls:'clear-host',clear:'clear-host',ft:'format-table',fl:'format-list',select:'select-object',sort:'sort-object',where:'where-object','?':'where-object',foreach:'foreach-object','%':'foreach-object',measure:'measure-object',group:'group-object',sls:'select-string',iwr:'invoke-webrequest',wget:'invoke-webrequest',curl:'invoke-webrequest',irm:'invoke-restmethod',sleep:'start-sleep',gps:'get-process',ps:'get-process',kill:'stop-process',spps:'stop-process',start:'start-process',saps:'start-process',gcm:'get-command',gal:'get-alias',gm:'get-member',h:'get-history',history:'get-history',iex:'invoke-expression',man:'get-help',help:'get-help',oh:'out-host',gv:'get-variable',sv:'set-variable',rv:'remove-variable',gu:'get-unique',gdr:'get-psdrive',gjb:'get-job'};
const PSAPPS={notepad:'notes',calc:'calc',calculator:'calc',explorer:'files',files:'files',cmd:'term',powershell:'term',pwsh:'term',wt:'term',taskmgr:'taskmgr',control:'set',settings:'set',code:'code',chrome:'browser',msedge:'browser',edge:'browser',browser:'browser',trash:'trash',music:'music',media:'media',photos:'photos'};
const PSCAPS={'get-childitem':'Get-ChildItem','foreach-object':'ForEach-Object','where-object':'Where-Object','convertto-json':'ConvertTo-Json','convertfrom-json':'ConvertFrom-Json','invoke-webrequest':'Invoke-WebRequest','invoke-restmethod':'Invoke-RestMethod','get-executionpolicy':'Get-ExecutionPolicy','set-executionpolicy':'Set-ExecutionPolicy','test-netconnection':'Test-NetConnection','resolve-dnsname':'Resolve-DnsName','set-psreadlineoption':'Set-PSReadLineOption','set-strictmode':'Set-StrictMode','write-verbose':'Write-Verbose'};
const psCap=n=>PSCAPS[n]||(n.indexOf('-')<0?n:null)||n.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join('-');
async function psCmd(st,input){let toks=psSplit(st,' \t').filter(x=>x!=='');let name=toks[0];
if(name[0]==='&'){if(name==='&')toks.shift();else toks[0]=toks[0].slice(1);if(!toks.length)throw psErr('Missing expression after &.');const v=await psArg(toks[0]);if(psIsO(v)&&v.__sb){const acc=[];await psStmts(v.sb,acc);return acc}name=psStr(v);toks[0]=name}
else if(name[0]==='"'||name[0]==="'"){name=psStr(await psArg(name));toks[0]=name}
const ln=psLo(name),canon=PSALIAS[ln]||ln,fn=PSFN[ln];
const extra=fn?new Set(fn.params.filter(p=>!p.sw).map(p=>p.n)):null;
const pa=await psParseArgs(toks.slice(1),extra);const c={name:canon,pos:pa.pos,named:pa.named,input:input||[],raw:st,mode:PSM.mode||'ps'};
try{
if(fn)return await psCallFn(fn,c);
let key=canon;if(c.mode==='cmd'&&ln==='curl')key='curl.exe';
const impl=PSCMD[key];if(impl){const r=await impl(c);return r==null?[]:Array.isArray(r)?r:[r]}
if(PSAPPS[ln.replace(/\.exe$/,'')]&&A[PSAPPS[ln.replace(/\.exe$/,'')]]){return await PSCMD['start-process']({name:'start-process',pos:[ln.replace(/\.exe$/,'')].concat(c.pos),named:c.named,input:[]})}
if(/[\\\/]/.test(name)||/\.(bat|cmd|ps1)$/i.test(name)){let f=null;for(const cnd of[name,name+'.bat',name+'.cmd',name+'.ps1']){try{const r0=await rp(cnd);if(r0.it&&!r0.it.isDirectory&&/\.(bat|cmd|ps1)$/i.test(r0.it.name)){f=r0;break}}catch(e0){}}
if(f){if(/\.ps1$/i.test(f.path)){const txt=((await NF.readText({path:f.path})).text||'').replace(/^\uFEFF/,'').replace(/\r/g,'');const sv=PSV.args;PSV.args=c.pos;const acc=[];try{await psStmts(txt,acc)}catch(e){if(!(e&&e.psflow==='return'))throw e}finally{PSV.args=sv}return acc}
await runBat(f.path,c.pos.map(psStr));return[]}}
throw psErr("The term '"+name+"' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.")
}catch(e){if(e&&typeof e==='object'&&!e.cmd&&e.message!=='^C'&&!e.psflow&&!/is not recognized as the name/.test(e.message||''))e.cmd=psCap(canon);else if(e&&/is not recognized as the name/.test(e.message||'')&&!e.cmd)e.cmd=name;throw e}}
const psAval=(c,i,...nm)=>{for(const n of nm)if(c.named[n]!==undefined)return c.named[n];return i>=0?c.pos[i]:undefined};
const psSw=(c,n)=>c.named[n]===true||(c.named[n]!==undefined&&psTruthy(c.named[n]));
const psItemPath=x=>psIsO(x)&&x.__path?x.__path:psStr(x);
const psPathsOf=(c,i,...nm)=>{let a=psArr(psAval(c,i,...nm)).flat().map(psItemPath);if(!a.length&&c.input.length)a=c.input.map(psItemPath);return a};
function psWin(p){p=String(p);if(/^[A-Za-z]:/.test(p))return p.replace(/\//g,'\\');if(p[0]==='/'&&(p===root||p.startsWith(root+'/')))return win(p);const b=win(cwd).replace(/\\$/,'');return b+'\\'+p.replace(/^\.[\\\/]/,'').replace(/\//g,'\\')}
async function psTg(p){let r;try{if(/[*?]/.test(p))r=await tg(p);else{const x=await rp(p);r=x.it?[x.it]:[]}}catch(e){r=[]}
if(!r.length)throw psErr("Cannot find path '"+psWin(p)+"' because it does not exist.");return r}
function psFo(it,dir){const d=+(it.lastModified||it.modified||it.mtime||it.date||0),isD=!!it.isDirectory,nm=it.name,dot=nm.lastIndexOf('.');
return{Mode:isD?'d-----':'-a----',LastWriteTime:d?new Date(d):null,Length:isD?null:sz(it),Name:nm,__f:1,__dir:win(dir),__path:it.path,__isdir:isD,FullName:win(it.path),BaseName:!isD&&dot>0?nm.slice(0,dot):nm,Extension:!isD&&dot>0?nm.slice(dot):'',PSIsContainer:isD}}
async function psFoOf(p){const r=await rp(p);if(!r.it)return null;return psFo(r.it,r.parent)}
function psCell(v,tr){let s;if(v==null)s='';else if(Array.isArray(v))s='{'+v.map(x=>psCell(x)).join(', ')+'}';else if(v instanceof Date)s=psFmtDT(v);else if(psIsO(v)){s=v.__str!==undefined?String(v.__str):'@{'+psKeys(v).map(k=>k+'='+psCell(v[k])).join('; ')+'}'}else s=psStr(v);
if(tr&&(s.length>tr||s.indexOf('\n')>=0))s=s.split('\n')[0].replace(/\r/g,'').slice(0,tr)+'...';return s}
function psTbl(rows,keys){const cols=keys.map(k=>{const cells=rows.map(r=>psCell(psProp(r,k)));let w2=k.length;for(const x of cells)if(x.length>w2)w2=x.length;return{k,cells,w:w2,isNum:rows.length>0&&rows.every(r=>{const v=psProp(r,k);return v==null||typeof v==='number'})}});
const ln=f=>cols.map(c=>{const t=f(c);return c.isNum?t.padStart(c.w):t.padEnd(c.w)}).join(' ').replace(/\s+$/,'');
const L=[ln(c=>c.k),ln(c=>'-'.repeat(c.k.length))];for(let i=0;i<rows.length;i++)L.push(ln(c=>c.cells[i]));return L}
function psList(rows,keys){const L=[];let mk=0;for(const k of keys)if(k.length>mk)mk=k.length;for(const r of rows){for(const k of keys)L.push(k.padEnd(mk)+' : '+psCell(psProp(r,k),110));L.push('')}return L}
function psFmtOut(items){const L=[];let i=0;while(i<items.length){const v=items[i];
if(psIsO(v)&&v.__txt!==undefined){for(const l of String(v.__txt).split('\n'))L.push(l);i++;continue}
if(psIsO(v)&&v.__str!==undefined&&!v.__ht){for(const l of String(v.__str).split('\n'))L.push(l);i++;continue}
if(psIsO(v)&&v.__f){let j=i;const g=[];while(j<items.length&&psIsO(items[j])&&items[j].__f&&items[j].__dir===v.__dir){g.push(items[j]);j++}
L.push('','    Directory: '+v.__dir,'','Mode'.padEnd(7)+'LastWriteTime'.padStart(22)+'Length'.padStart(15)+' Name','----'.padEnd(7)+'-------------'.padStart(22)+'------'.padStart(15)+' ----');
for(const f of g){const d=f.LastWriteTime;const ds=d?psFmtD(d,'M/d/yyyy')+' '+String(psH12(d)).padStart(2)+':'+pad2(d.getMinutes())+' '+psTT(d):'';L.push(f.Mode.padEnd(7)+ds.padStart(22)+(f.Length==null?'':String(f.Length)).padStart(15)+' '+f.Name)}L.push('');i=j;continue}
if(psIsO(v)){if(v.__ht){const rows=psKeys(v).map(k=>({Name:k,Value:v[k]}));L.push('');for(const l of psTbl(rows,['Name','Value']))L.push(l);L.push('');i++;continue}
const ks=psKeys(v),sig=ks.join('\u0001');let j=i;const g=[];while(j<items.length&&psIsO(items[j])&&!items[j].__f&&items[j].__txt===undefined&&items[j].__str===undefined&&!items[j].__ht&&psKeys(items[j]).join('\u0001')===sig){g.push(items[j]);j++}
L.push('');if(ks.length>4||ks.length===0){for(const l of psList(g,ks))L.push(l)}else{for(const l of psTbl(g,ks))L.push(l);L.push('')}i=j;continue}
if(v instanceof Date){L.push(psFmtLong(v));i++;continue}
if(Array.isArray(v)){for(const x of v)L.push(psStr(x));i++;continue}
L.push(psStr(v));i++}return L}
async function psPrint(items){if(!items.length)return;for(const l of psFmtOut(items))put(esc(l))}
function psShowErr(e){if(!e)return;if(e.psflow)return;if(e.message==='^C'){E('^C');return}errl=1;PSV['?']=false;const m=(e&&e.message)||String(e);PSV.error=[{Exception:{Message:m},Message:m,__str:m}].concat((PSV.error||[]).slice(0,20));E((e.cmd?e.cmd+' : ':'')+m)}
async function psRun(raw,nested,mode){PSM.mode=mode||'ps';try{for(const t of psParts(raw)){psChk();const acc=[];try{await psStmt(t,acc)}catch(e){await psPrint(acc);throw e}await psPrint(acc)}}catch(e){psShowErr(e)}finally{if(PSM.pend){put(PSM.pend);PSM.pend=''}}return true}
function psBanner(){out.innerHTML='';w.setTitle('Windows PowerShell');T('Windows PowerShell (NexOS emulation)');T('Type Get-Help for the supported commands. Type cmd to switch to Command Prompt.');T('')}
async function psCmdMode(raw){const m=/^(powershell|pwsh)(?:\.exe)?(?:\s+([\s\S]*))?$/i.exec(raw);
if(m){const rest=(m[2]||'').trim();let cm=/^-(?:c|command)\s+([\s\S]+)$/i.exec(rest);if(cm){let cmd=cm[1].trim();if(/^"[\s\S]*"$/.test(cmd))cmd=cmd.slice(1,-1);await psRun(cmd,true,'ps');return true}
cm=/^-file\s+(\S+)([\s\S]*)$/i.exec(rest);if(cm){await psRun('& '+cm[1]+cm[2],true,'ps');return true}
PSM.on=true;PSM.nested=true;psBanner();return true}
if(/^(ping|ipconfig|nslookup|hostname|whoami|curl|systeminfo)(\.exe)?(\s|$)/i.test(raw)){await psRun(raw,true,'cmd');return true}
return false}
/* ---- cmdlets ---- */
const PSCMD={};
const PSCOL={red:'#f87171',green:'#4ade80',yellow:'#facc15',cyan:'#22d3ee',blue:'#60a5fa',magenta:'#e879f9',white:'#ffffff',gray:'#9ca3af',darkgray:'#6b7280',darkgreen:'#16a34a',darkred:'#dc2626',darkyellow:'#ca8a04',darkcyan:'#0891b2',darkblue:'#2563eb',darkmagenta:'#a21caf',black:'#000000'};
const PSDIRS=[];
let psNet;const psNetP=()=>{if(psNet!==undefined)return psNet;try{const C=window.Capacitor;psNet=C&&C.isNativePlatform&&C.isNativePlatform()&&C.registerPlugin?C.registerPlugin('AuroraNet'):null}catch(e){psNet=null}return psNet};
function psNetMsg(e,o){const m=(e&&e.message)||String(e);let host=o&&o.host;if(!host&&o&&o.url){try{host=new URL(o.url).hostname}catch(x){host=o.url}}
if(/UnknownHost|Unable to resolve|No address associated/i.test(m))return"The remote name could not be resolved: '"+host+"'";
if(/Timeout|timed out/i.test(m))return'The operation has timed out.';
if(/Connect|refused|Unreachable|Network is/i.test(m))return'Unable to connect to the remote server';
if(/not implemented|UNIMPLEMENTED/i.test(m))return'The NexOS native network plugin is not available in this build.';
return m.replace(/^[A-Za-z.]*Exception:\s*/,'')}
async function psFetchHttp(o){let r;try{r=await fetch(o.url,{method:o.method,headers:o.headers||{},body:o.body||undefined})}catch(e){throw psErr('Unable to connect to the remote server')}const body=await r.text();const h={};r.headers.forEach((v,k)=>{h[k]=v});return{status:r.status,statusText:r.statusText,url:r.url||o.url,headers:h,body,size:body.length,contentType:r.headers.get('content-type')||''}}
async function psNetCall(m,o){const n=psNetP();if(!n){if(m==='http')return await psFetchHttp(o);throw psErr('Network commands need the NexOS Android app (native plugin not available here).')}
try{return await n[m](o)}catch(e){throw psErr(psNetMsg(e,o))}}
async function psWriteFile(p,text,append){const r=await rp(p);if(r.it&&r.it.isDirectory)throw psErr("Access to the path '"+win(r.path)+"' is denied.");let old='';if(append&&r.it){try{old=(await NF.readText({path:r.path})).text||''}catch(e){}if(old&&!old.endsWith('\n'))old+='\n'}await NF.writeText({path:r.path,text:old+text})}
const psWrite=async(c,append)=>{const ps=psPathsOf({named:c.named,pos:c.pos,input:[]},0,'path','literalpath','filepath');if(!ps.length)throw psErr("Cannot bind argument to parameter 'Path' because it is null.");
let text;if(c.name==='out-file')text=psFmtOut(c.input).join('\n')+'\n';else{let v=psAval(c,1,'value');if(v===undefined)v=c.input;text=psArr(v).map(psStr).join('\n')+(psSw(c,'nonewline')?'':'\n')}
for(const p of ps){try{await psWriteFile(p,text,append)}catch(e){if(e&&e.message===NOPATH)throw psErr("Could not find a part of the path '"+psWin(p)+"'.");throw e}}return[]};
PSCMD['set-content']=c=>psWrite(c,false);PSCMD['add-content']=c=>psWrite(c,true);
PSCMD['out-file']=c=>psWrite(c,psSw(c,'append'));
PSCMD['clear-content']=async c=>{for(const p of psPathsOf(c,0,'path','literalpath'))await psWriteFile(p,'',false);return[]};
PSCMD['get-childitem']=async c=>{const ps=psPathsOf(c,0,'path','literalpath'),targets=ps.length?ps:['.'];
const rec=psSw(c,'recurse'),fil=psAval(c,-1,'filter'),inc=psArr(psAval(c,-1,'include')).map(psStr),exc=psArr(psAval(c,-1,'exclude')).map(psStr);
const nameOnly=psSw(c,'name'),fOnly=psSw(c,'file'),dOnly=psSw(c,'directory'),maxd=c.named.depth!=null?psNum(c.named.depth):(rec?99:0);
const res=[];let budget=20000;
const keep=(it,f2)=>{const n=it.name;if((fOnly&&it.isDirectory)||(dOnly&&!it.isDirectory))return false;if(f2&&!psWc(f2).test(n))return false;if(inc.length&&!inc.some(p=>psWc(p).test(n)))return false;if(exc.some(p=>psWc(p).test(n)))return false;return true};
async function walk(dir,rel,depth,f2){const items=await ls(dir);for(const it of items){if(keep(it,f2)){res.push(nameOnly?rel+it.name:psFo(it,dir))}if(--budget<0)return}
for(const it of items){if(budget<0)return;if(it.isDirectory&&depth<maxd){await walk(it.path,rel+it.name+'\\',depth+1,f2)}}}
for(const t of targets){const s=t.replace(/\\/g,'/'),wild=/[*?]/.test(s.slice(s.lastIndexOf('/')+1));
if(wild){const i=s.lastIndexOf('/');const base=await rp(i<0?'.':s.slice(0,i)||'/');if(!base.it||!base.it.isDirectory)throw psErr("Cannot find path '"+psWin(t)+"' because it does not exist.");
if(rec)await walk(base.path,'',0,s.slice(i+1));else{const re=psWc(s.slice(i+1));for(const it of await ls(base.path)){if(re.test(it.name)&&keep(it,fil?psStr(fil):null))res.push(nameOnly?it.name:psFo(it,base.path))}}
continue}
let r;try{r=await rp(t)}catch(e){if(e&&e.message===NOPATH)throw psErr("Cannot find path '"+psWin(t)+"' because it does not exist.");throw e}
if(!r.it)throw psErr("Cannot find path '"+psWin(t)+"' because it does not exist.");
if(r.it.isDirectory)await walk(r.path,'',0,fil?psStr(fil):null);else res.push(nameOnly?r.it.name:psFo(r.it,r.parent))}
if(budget<0)E('Listing stopped after 20000 items.');return res};
PSCMD['get-item']=async c=>{const o=[];for(const p of psPathsOf(c,0,'path','literalpath')){for(const it of await psTg(p)){const par=it.path.slice(0,it.path.lastIndexOf('/'))||'/';o.push(psFo(it,par))}}return o};
PSCMD['set-location']=async c=>{let p=psAval(c,0,'path','literalpath');if(p==null||p===true){return[]}p=psStr(psArr(p)[0]);if(p==='~')p=root;let r;try{r=await rp(p)}catch(e){r=null}
if(!r||!r.it)throw psErr("Cannot find path '"+psWin(p)+"' because it does not exist.");if(!r.it.isDirectory)throw psErr("Cannot set location because '"+win(r.path)+"' is not a container.");cwd=r.path;prompt();return[]};
const psLocStack=[];
PSCMD['push-location']=async c=>{psLocStack.push(cwd);const p=psAval(c,0,'path');if(p!=null)await PSCMD['set-location'](c);return[]};
PSCMD['pop-location']=async c=>{if(!psLocStack.length)throw psErr('Stack "default" cannot be found.');cwd=psLocStack.pop();prompt();return[]};
PSCMD['get-location']=c=>[{Path:win(cwd)}];
PSCMD['get-content']=async c=>{const out2=[];for(const p of psPathsOf(c,0,'path','literalpath')){for(const it of await psTg(p)){if(it.isDirectory)throw psErr("Access to the path '"+win(it.path)+"' is denied.");const t=(await NF.readText({path:it.path})).text||'';
if(psSw(c,'raw')){out2.push(t);continue}let L=t.replace(/\r/g,'').split('\n');if(L.length&&L[L.length-1]==='')L.pop();const hd=psAval(c,-1,'totalcount','head'),tl=psAval(c,-1,'tail');if(hd!=null)L=L.slice(0,psNum(hd));if(tl!=null)L=L.slice(-psNum(tl));for(const x of L)out2.push(x)}}return out2};
PSCMD['new-item']=async c=>{const ps=psArr(psAval(c,0,'path')).flat().map(psStr);const nm=psAval(c,-1,'name');const ty=psLo(psStr(psAval(c,-1,'itemtype')||'file'));const isDir=/^(directory|dir|d|folder|container)$/.test(ty);const val=psAval(c,-1,'value');const force=psSw(c,'force');
const list=nm!=null?psArr(nm).flat().map(n=>(ps[0]||'.')+'/'+psStr(n)):ps;if(!list.length)throw psErr("Cannot bind argument to parameter 'Path' because it is null.");const o=[];
for(const full of list){let r;try{r=await rp(full)}catch(e){if(e&&e.message===NOPATH)throw psErr("Could not find a part of the path '"+psWin(full)+"'.");throw e}
if(r.it&&!force)throw psErr(isDir?'An item with the specified name '+win(r.path)+' already exists.':"The file '"+win(r.path)+"' already exists.");
if(isDir){if(!r.it)await NF.mkdir({path:r.parent,name:r.name})}else await NF.writeText({path:r.path,text:val==null?'':psArr(val).map(psStr).join('\n')});
const f=await psFoOf(full);if(f)o.push(f)}return o};
PSCMD.mkdir=c=>PSCMD['new-item']({name:'new-item',pos:c.pos,named:Object.assign({},c.named,{itemtype:'Directory'}),input:c.input});
PSCMD['remove-item']=async c=>{const ps=psPathsOf(c,0,'path','literalpath');if(!ps.length)throw psErr("Cannot bind argument to parameter 'Path' because it is null.");const rec=psSw(c,'recurse'),ok=[];
for(const p of ps){for(const it of await psTg(p)){if(prot(it))throw psErr("Access to the path '"+win(it.path)+"' is denied.");if(it.isDirectory&&!rec&&(await ls(it.path)).length)throw psErr('The item at '+win(it.path)+' has children and the Recurse parameter was not specified.');ok.push(it)}}
if(ok.length){if(typeof trashFiles==='function')await trashFiles(ok);else await NF.remove({paths:ok.map(i=>i.path)})}return[]};
const psCpMv=async(c,mv)=>{const src=psPathsOf({named:c.named,pos:c.pos,input:c.input},0,'path','literalpath'),d=psAval(c,1,'destination');if(!src.length||d==null)throw psErr("Cannot bind argument to parameter 'Destination' because it is null.");
const dd=await rp(psStr(psArr(d)[0]));const items=[];for(const s of src)for(const it of await psTg(s))items.push(it);
if(dd.it&&dd.it.isDirectory){const par=s=>s.path.slice(0,s.path.lastIndexOf('/'))||'/';if(items.some(s=>par(s)===dd.path))throw psErr('Cannot copy or move an item onto itself.');const paths=items.filter(s=>s.path!==dd.path&&!dd.path.startsWith(s.path+'/')).map(s=>s.path);if(!paths.length)throw psErr('Cannot copy a folder into itself.');await NF.paste({paths,dest:dd.path,move:!!mv});return[]}
if(mv&&items.length===1&&!dd.it&&dd.parent===(items[0].path.slice(0,items[0].path.lastIndexOf('/'))||'/')){await NF.rename({path:items[0].path,name:dd.name});return[]}
throw psErr((mv?'Moving':'Copying')+' to a new name in another folder is not supported yet. Use an existing destination folder.')};
PSCMD['copy-item']=c=>psCpMv(c,false);PSCMD['move-item']=c=>psCpMv(c,true);
PSCMD['rename-item']=async c=>{const p=psStr(psArr(psAval(c,0,'path','literalpath'))[0]),nn=psStr(psAval(c,1,'newname'));const r=await rp(p);if(!r.it)throw psErr("Cannot find path '"+psWin(p)+"' because it does not exist.");if(/[\/\\]/.test(nn))throw psErr('Cannot rename because the new name contains a path separator.');if(prot(r.it))throw psErr("Access to the path '"+win(r.path)+"' is denied.");
if((await ls(r.parent)).some(x=>psLo(x.name)===psLo(nn)&&x.path!==r.it.path))throw psErr('Cannot create '+nn+' because a file or directory with the same name already exists.');await NF.rename({path:r.it.path,name:nn});return[]};
PSCMD['test-path']=async c=>{const ps=psPathsOf(c,0,'path','literalpath'),pt=psLo(psStr(psAval(c,-1,'pathtype')||''));let ok=ps.length>0;
for(const p of ps){let f=false;try{if(/[*?]/.test(p))f=(await tg(p)).length>0;else{const r=await rp(p);f=!!r.it&&(pt!=='container'||r.it.isDirectory)&&(pt!=='leaf'||!r.it.isDirectory)}}catch(e){f=false}if(!f)ok=false}return[ok]};
PSCMD['join-path']=c=>[psStr(psAval(c,0,'path')).replace(/[\\\/]+$/,'')+'\\'+psStr(psAval(c,1,'childpath','child')).replace(/^[\\\/]+/,'')];
PSCMD['split-path']=c=>{const p=psStr(psAval(c,0,'path')),i=Math.max(p.lastIndexOf('\\'),p.lastIndexOf('/'));return[psSw(c,'leaf')?p.slice(i+1):(i<0?'':p.slice(0,i))]};
PSCMD['resolve-path']=async c=>{const o=[];for(const p of psPathsOf(c,0,'path','literalpath'))for(const it of await psTg(p))o.push({Path:win(it.path),__str:win(it.path)});return o};
PSCMD['clear-host']=c=>{out.innerHTML='';return[]};
PSCMD['write-output']=c=>{const a=c.pos.length?c.pos:c.input;const o=[];for(const x of a){if(Array.isArray(x))for(const y of x)o.push(y);else o.push(x)}return o};
PSCMD['write-host']=c=>{const sep=c.named.separator!=null?psStr(c.named.separator):' ';const s=(c.pos.length?c.pos:c.input).map(x=>Array.isArray(x)?x.map(psStr).join(' '):psStr(x)).join(sep);const col=c.named.foregroundcolor?PSCOL[psLo(psStr(c.named.foregroundcolor))]:null;const hh=col?'<span style="color:'+col+'">'+esc(s)+'</span>':esc(s);
if(psSw(c,'nonewline')){PSM.pend=(PSM.pend||'')+hh;return[]}put((PSM.pend||'')+hh);PSM.pend='';return[]};
PSCMD['write-error']=c=>{E(psStr(psAval(c,0,'message')||c.input[0]));errl=1;return[]};
PSCMD['write-warning']=c=>{put('<span style="color:#facc15">WARNING: '+esc(psStr(psAval(c,0,'message')))+'</span>');return[]};
for(const n of['write-verbose','write-debug','write-information','write-progress','set-executionpolicy','set-psreadlineoption','set-strictmode'])PSCMD[n]=c=>[];
PSCMD['out-host']=async c=>{await psPrint(c.input);return[]};PSCMD['out-default']=PSCMD['out-host'];PSCMD['out-null']=c=>[];
PSCMD['out-string']=c=>[psFmtOut(c.input).join('\n')];
PSCMD['get-executionpolicy']=c=>['RemoteSigned'];
const psPropKeys=(items,sel)=>{const first=items.find(x=>psIsO(x));const base=first?psKeys(first):[];if(!sel.length)return null;const o=[];for(const s of sel.map(psStr)){if(s==='*'){for(const k of base)o.push(k)}else o.push(first?(base.find(k=>psLo(k)===psLo(s))||s):s)}return o};
PSCMD['format-table']=c=>{const items=c.input;if(!items.length)return[];const sel=psArr(psAval(c,0,'property')).flat();let keys=psPropKeys(items,sel);const f0=items[0];if(!keys)keys=psIsO(f0)&&f0.__f?['Mode','LastWriteTime','Length','Name']:psIsO(f0)?psKeys(f0):['Value'];const rows=psIsO(f0)?items:items.map(x=>({Value:x}));return[{__txt:'\n'+psTbl(rows,keys).join('\n')+'\n'}]};
PSCMD['format-list']=c=>{const items=c.input;if(!items.length)return[];const sel=psArr(psAval(c,0,'property')).flat();let keys=psPropKeys(items,sel);const f0=items[0];if(!keys)keys=psIsO(f0)?psKeys(f0):['Value'];const rows=psIsO(f0)?items:items.map(x=>({Value:x}));return[{__txt:'\n'+psList(rows,keys).join('\n')}]};
PSCMD['get-member']=c=>{const f=c.input[0];if(f==null)throw psErr('You must specify an object for the Get-Member cmdlet.');const rows=psIsO(f)?psKeys(f).map(k=>({Name:k,MemberType:'Property'})):[{Name:'Length',MemberType:'Property'}];return[{__txt:'\n'+psTbl(rows,['Name','MemberType']).join('\n')+'\n'}]};
const psRunSb=async(sb,item)=>{const sv=PSV._;PSV._=item;try{const acc=[];await psStmts(sb.sb,acc);return acc}finally{PSV._=sv}};
const psVal=a=>a.length===0?null:a.length===1?a[0]:a;
PSCMD['where-object']=async c=>{const o=[];const sb=c.pos[0];const ops=['eq','ne','gt','lt','ge','le','like','notlike','match','notmatch','contains','notcontains','in','notin'];
if(psIsO(sb)&&sb.__sb){for(const it of c.input){if(psTruthy(psVal(await psRunSb(sb,it))))o.push(it)}return o}
const op=ops.find(k=>c.named[k]!==undefined);const prop=psStr(sb!=null?sb:psAval(c,-1,'property'));if(!op&&c.pos.length<1)throw psErr('Where-Object needs a script block or a property and a comparison.');
const rv=op?(c.named[op]===true?c.pos[1]:c.named[op]):undefined;
for(const it of c.input){const lv=psProp(it,prop);let ok;if(!op)ok=psTruthy(lv);else ok=psTruthy(psBin(op,lv,rv));if(ok)o.push(it)}return o};
PSCMD['foreach-object']=async c=>{const o=[];const sb=psAval(c,0,'process','scriptblock');const mn=psAval(c,-1,'membername');
if(mn!=null){for(const it of c.input){const v=psProp(it,psStr(mn));for(const x of psArr(v))o.push(x)}return o}
if(!(psIsO(sb)&&sb.__sb)){if(typeof sb==='string'){for(const it of c.input){for(const x of psArr(psProp(it,sb)))o.push(x)}return o}throw psErr('ForEach-Object needs a script block.')}
let n=0;for(const it of c.input){if(++n%100===0){psChk();await sleep(0)}for(const x of await psRunSb(sb,it))o.push(x)}return o};
const psSortKey=async(it,p)=>{if(psIsO(p)&&p.__sb)return psVal(await psRunSb(p,it));if(psIsO(p)&&p.__ht){const e=psProp(p,'expression')||psProp(p,'e');if(e&&e.__sb)return psVal(await psRunSb(e,it))}return psProp(it,psStr(p))};
PSCMD['sort-object']=async c=>{const items=c.input.slice();const props=psArr(psAval(c,0,'property')).flat();const desc=psSw(c,'descending');const keyed=[];
for(const it of items){const ks=[];if(props.length){for(const p of props)ks.push(await psSortKey(it,p))}else ks.push(it);keyed.push({it,ks})}
keyed.sort((a,b)=>{for(let i=0;i<a.ks.length;i++){const x=a.ks[i],y=b.ks[i];let r;if(x==null||y==null)r=(x==null?0:1)-(y==null?0:1);else if(typeof x==='number'&&typeof y==='number')r=x-y;else r=psCmpv(x,y);if(r)return desc?-r:r}return 0});
let res=keyed.map(k=>k.it);if(psSw(c,'unique')){const seen=new Set();res=res.filter(x=>{const k=psStr(x);if(seen.has(k))return false;seen.add(k);return true})}return res};
PSCMD['select-object']=async c=>{let items=c.input.slice();const sel=psArr(psAval(c,0,'property')).flat();const ep=psAval(c,-1,'expandproperty');
if(psSw(c,'unique')){const seen=new Set();items=items.filter(x=>{const k=JSON.stringify(x,(kk,v)=>kk.slice(0,2)==='__'?undefined:v);if(seen.has(k))return false;seen.add(k);return true})}
if(c.named.skip!=null)items=items.slice(psNum(c.named.skip));if(c.named.first!=null)items=items.slice(0,psNum(c.named.first));if(c.named.last!=null)items=items.slice(-psNum(c.named.last));
if(ep!=null){const o=[];for(const it of items){for(const x of psArr(psProp(it,psStr(ep))))o.push(x)}return o}
if(!sel.length)return items;const o=[];
for(const it of items){const r={};for(const p of sel){if(psIsO(p)&&p.__ht){const nm=psStr(psProp(p,'name')||psProp(p,'n')||psProp(p,'label')||psProp(p,'l')),ex=psProp(p,'expression')||psProp(p,'e');r[nm]=ex&&ex.__sb?psVal(await psRunSb(ex,it)):psProp(it,psStr(ex))}
else{const s=psStr(p);if(s==='*'){if(psIsO(it))for(const k of psKeys(it))r[k]=it[k]}else{const ak=psIsO(it)?psKeys(it).find(k=>psLo(k)===psLo(s)):null;r[ak||s]=psProp(it,s)}}}o.push(r)}return o};
PSCMD['group-object']=async c=>{const p=psAval(c,0,'property');const m=new Map();for(const it of c.input){const k=p!=null?psStr(await psSortKey(it,psArr(p)[0])):psStr(it);if(!m.has(k))m.set(k,[]);m.get(k).push(it)}const o=[];for(const[k,g]of m){const r={Count:g.length,Name:k};if(!psSw(c,'noelement'))r.Group=g;o.push(r)}return o};
PSCMD['measure-object']=async c=>{const p=psAval(c,0,'property');let vals=[];for(const it of c.input)vals.push(p!=null?psProp(it,psStr(p)):it);vals=vals.filter(x=>x!=null);const nums=vals.map(x=>Number(x)).filter(x=>!isNaN(x));const r={Count:c.input.length};
if(psSw(c,'average'))r.Average=nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null;if(psSw(c,'sum'))r.Sum=nums.reduce((a,b)=>a+b,0);if(psSw(c,'maximum'))r.Maximum=nums.length?Math.max(...nums):null;if(psSw(c,'minimum'))r.Minimum=nums.length?Math.min(...nums):null;if(p!=null)r.Property=psStr(p);return[r]};
PSCMD['get-unique']=c=>{const o=[];let last;for(const x of c.input){const k=psStr(x);if(o.length===0||k!==last)o.push(x);last=k}return o};
PSCMD['select-string']=async c=>{const pat=psStr(psAval(c,0,'pattern'));const simple=psSw(c,'simplematch'),cs=psSw(c,'casesensitive'),inv=psSw(c,'notmatch'),quiet=psSw(c,'quiet');const re=new RegExp(simple?psEsc(pat):pat,cs?'':'i');const o=[];
const paths=psArr(psAval(c,1,'path','literalpath')).flat().map(psItemPath);const files=[];
if(paths.length){for(const p of paths)for(const it of await psTg(p))if(!it.isDirectory)files.push(it)}else if(c.input.length&&c.input.every(x=>psIsO(x)&&x.__f)){for(const x of c.input)if(!x.__isdir)files.push({path:x.__path,name:x.Name})}
if(files.length){for(const f of files){const t=(await NF.readText({path:f.path})).text||'';const L=t.replace(/\r/g,'').split('\n');L.forEach((ln,i)=>{if(re.test(ln)!==inv){o.push({Filename:f.name,LineNumber:i+1,Line:ln,__str:win(f.path)+':'+(i+1)+':'+ln})}})}}
else{for(const it of c.input){const s=psStr(it);for(const ln of s.split('\n'))if(re.test(ln)!==inv)o.push({Line:ln,__str:ln})}}
return quiet?[o.length>0]:o};
PSCMD['get-date']=c=>{let d=new Date();const a=psAval(c,0,'date');if(a!=null){d=a instanceof Date?a:new Date(psStr(a));if(isNaN(d))throw psErr('Cannot bind parameter \'Date\'. Cannot convert value "'+psStr(a)+'" to type "System.DateTime".')}
if(c.named.year!=null)d=new Date(d.getTime()),d.setFullYear(psNum(c.named.year));if(c.named.month!=null)d.setMonth(psNum(c.named.month)-1);if(c.named.day!=null)d.setDate(psNum(c.named.day));if(c.named.hour!=null)d.setHours(psNum(c.named.hour));if(c.named.minute!=null)d.setMinutes(psNum(c.named.minute));if(c.named.second!=null)d.setSeconds(psNum(c.named.second));
const f=psAval(c,-1,'format'),uf=psAval(c,-1,'uformat');if(f!=null&&f!==true)return[psFmtD(d,psStr(f))];if(uf!=null&&uf!==true)return[psStr(uf).replace(/%([YmdHMSyBAbaep])/g,(m,x)=>({Y:d.getFullYear(),m:pad2(d.getMonth()+1),d:pad2(d.getDate()),H:pad2(d.getHours()),M:pad2(d.getMinutes()),S:pad2(d.getSeconds()),y:pad2(d.getFullYear()%100),B:PSMON[d.getMonth()],A:PSDAY[d.getDay()],b:PSMON[d.getMonth()].slice(0,3),a:PSDAY[d.getDay()].slice(0,3),e:String(d.getDate()).padStart(2),p:psTT(d)})[x])];return[d]};
PSCMD['start-sleep']=async c=>{const ms=c.named.milliseconds!=null?psNum(c.named.milliseconds):psNum(psAval(c,0,'seconds')||0)*1000;const end=Date.now()+ms;while(Date.now()<end){psChk();await sleep(Math.max(1,Math.min(100,end-Date.now())))}return[]};
PSCMD['get-random']=c=>{const mx=psAval(c,-1,'maximum'),mn=psAval(c,-1,'minimum');const io=psAval(c,-1,'inputobject');const pool=io!=null?psArr(io):c.input;
if(pool.length){const cnt=c.named.count!=null?psNum(c.named.count):1;const a=pool.slice().sort(()=>Math.random()-.5);return a.slice(0,cnt)}
const lo2=mn!=null?psNum(mn):0,hi=mx!=null?psNum(mx):2147483647;return[lo2+Math.floor(Math.random()*(hi-lo2))]};
PSCMD['read-host']=async c=>{const p=psAval(c,0,'prompt');if(p!=null)put(esc(psStr(p)+': '));return[await readLine()]};
PSCMD['get-history']=c=>hist.map((l,i)=>({Id:i+1,CommandLine:l}));
PSCMD['invoke-expression']=async c=>{const acc=[];await psStmts(psStr(psAval(c,0,'command')),acc);return acc};
PSCMD['measure-command']=async c=>{const sb=psAval(c,0,'expression');const t0=performance.now();if(psIsO(sb)&&sb.__sb){await psStmts(sb.sb,[])}const ms=performance.now()-t0;return[{Days:0,Hours:Math.floor(ms/36e5),Minutes:Math.floor(ms/6e4)%60,Seconds:Math.floor(ms/1e3)%60,Milliseconds:Math.floor(ms)%1000,TotalSeconds:+(ms/1e3).toFixed(4),TotalMilliseconds:+ms.toFixed(4)}]};
PSCMD['get-variable']=c=>{const n=psAval(c,0,'name');const re=n!=null?psWc(psStr(n)):null;return Object.keys(PSV).filter(k=>PSV[k]!==undefined&&k!=='_'&&(!re||re.test(k))).sort().map(k=>({Name:k,Value:PSV[k]}))};
PSCMD['set-variable']=c=>{PSV[psLo(psStr(psAval(c,0,'name')))]=psAval(c,1,'value');return[]};
PSCMD['remove-variable']=c=>{for(const n of psArr(psAval(c,0,'name')))delete PSV[psLo(psStr(n))];return[]};
PSCMD['convertto-json']=c=>{const v=c.pos.length?c.pos[0]:(c.input.length===1?c.input[0]:c.input);const clean=(x,d)=>{if(x==null)return null;if(x instanceof Date)return x.toISOString();if(Array.isArray(x))return x.map(y=>clean(y,d+1));if(psIsO(x)){const r={};for(const k of psKeys(x))r[k]=clean(x[k],d+1);return r}return x};return[JSON.stringify(clean(v,0),null,psSw(c,'compress')?0:4)]};
PSCMD['convertfrom-json']=c=>{const t=c.pos.length?psStr(c.pos[0]):c.input.map(psStr).join('\n');let v;try{v=JSON.parse(t)}catch(e){throw psErr('Conversion from JSON failed with error: '+e.message)}return Array.isArray(v)?v:[v]};
PSCMD['get-help']=c=>{const n=psAval(c,0,'name');if(n!=null&&n!==true){const k=psLo(psStr(n));const rk=PSALIAS[k]||k;if(!PSCMD[rk]&&!PSFN[rk])throw psErr("Get-Help could not find "+psStr(n)+" in a help file in this session.");return[{__txt:'\nNAME\n    '+psCap(rk)+'\n\nSYNTAX\n    '+psCap(rk)+' [parameters]\n\nThis is the NexOS PowerShell emulation: common parameters are supported, full help is not available.'}]}
const names=Object.keys(PSCMD).filter(x=>x.indexOf('.')<0&&x.indexOf('-')>0).map(psCap).sort();return[{__txt:'\nNexOS PowerShell (emulation of Windows PowerShell '+PSVER+')\n\nCmdlets:\n  '+names.join('\n  ')+'\n\nAlso: native ping, ipconfig, nslookup, curl.exe, hostname, whoami, systeminfo; if/foreach/for/while/do/try/function; variables, pipelines, > and >> redirection, .ps1 / .bat scripts.\nType cmd to switch to Command Prompt, Get-Command to list all.'}]};
PSCMD['get-command']=c=>{const n=psAval(c,0,'name');const all=Object.keys(PSCMD).filter(x=>x.indexOf('.')<0&&x.indexOf('-')>0).map(x=>({CommandType:'Cmdlet',Name:psCap(x)})).concat(Object.keys(PSFN).map(x=>({CommandType:'Function',Name:x})));
if(n==null||n===true)return all.sort((a,b)=>psCmpv(a.Name,b.Name));const re=psWc(psStr(n));const r=all.filter(x=>re.test(x.Name));const al=PSALIAS[psLo(psStr(n))];if(!r.length&&al)return[{CommandType:'Alias',Name:psStr(n)+' -> '+psCap(al)}];if(!r.length)throw psErr("The term '"+psStr(n)+"' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.");return r};
PSCMD['get-alias']=c=>{const n=psAval(c,0,'name');const rows=Object.keys(PSALIAS).sort().map(k=>({CommandType:'Alias',Name:k,Definition:psCap(PSALIAS[k])}));if(n==null||n===true)return rows;const r=rows.filter(x=>x.Name===psLo(psStr(n)));if(!r.length)throw psErr("This command cannot find a matching alias because alias with name '"+psStr(n)+"' do not exist.");return r};
PSCMD['get-process']=c=>{const n=psAval(c,0,'name');const re=n!=null&&n!==true?psWc(psStr(n)):null;const L=[];for(const k of Object.keys(W)){let t='',a='';try{t=$('.tbar span',W[k].el).textContent;a=(A[W[k].app]||{}).n||W[k].app}catch(e){}if(re&&!re.test(a)&&!re.test(t))continue;L.push({Id:/^\d+$/.test(k)?+k:k,ProcessName:a||t,MainWindowTitle:t})}return L};
PSCMD['stop-process']=c=>{const id=psAval(c,-1,'id'),n=psAval(c,0,'name');const ids=id!=null?psArr(id).map(psStr):[];const re=n!=null?psWc(psStr(n)):null;let hit=0;
for(const x of c.input){if(psIsO(x)&&x.Id!==undefined)ids.push(String(x.Id))}
for(const k of Object.keys(W)){let a='',t='';try{t=$('.tbar span',W[k].el).textContent;a=(A[W[k].app]||{}).n||W[k].app}catch(e){}if(ids.includes(String(k))||(re&&(re.test(a)||re.test(t)))){closeW(k);hit++}}
if(!hit)throw psErr('Cannot find a process with the specified name or Id.');return[]};
PSCMD['start-process']=async c=>{const nm=psLo(psStr(psAval(c,0,'filepath','name'))).replace(/\.exe$/,'');const id=PSAPPS[nm]||(A[nm]?nm:null);if(!id||!A[id])throw psErr('This command cannot be run due to the error: The system cannot find the file specified.');
const rest=c.pos.slice(1).map(psStr);let arg;if(id==='code'&&rest.length){try{const r=await rp(rest[0]);if(r.it&&!r.it.isDirectory)arg={path:r.path}}catch(e){}}openApp(id,arg);return[]};
PSCMD.cmd=c=>{PSM.on=false;PSM.nested=false;w.setTitle('Terminal');T('NexOS [Version 3.0.10 alpha]');return[]};
PSCMD.exit=c=>{if(PSM.nested){PSM.on=false;PSM.nested=false;w.setTitle('Terminal')}else closeW(w.id,true);return[]};
PSCMD.hostname=c=>['NEXOS-PC'];PSCMD.whoami=c=>['nexos-pc\\user'];
PSCMD.systeminfo=async c=>{let m='';try{const s=await NF.sysInfo();const GB=1073741824;m='Total Physical Memory:     '+Math.round(s.total/1048576).toLocaleString('en-US')+' MB\nAvailable Physical Memory: '+Math.round(s.avail/1048576).toLocaleString('en-US')+' MB\nProcessors:                '+(s.cores||'?')+' core(s)'}catch(e){}
return[{__txt:'Host Name:                 NEXOS-PC\nOS Name:                   Microsoft Windows 11 Pro (NexOS)\nOS Version:                10.0.22631 N/A Build 22631\nSystem Type:               ARM-based PC (Android)\n'+m}]};
const psHttpReq=async c=>{const uri=psStr(psAval(c,0,'uri','url'));if(!uri||uri==='true')throw psErr("Cannot validate argument on parameter 'Uri'. The argument is null or empty.");const url=/^[a-z][a-z0-9+.-]*:\/\//i.test(uri)?uri:'http://'+uri;
let body=psAval(c,-1,'body');const ct=psAval(c,-1,'contenttype');const method=psStr(psAval(c,-1,'method')||(body!=null?'POST':'GET')).toUpperCase();const headers={};const hh=psAval(c,-1,'headers');if(psIsO(hh))for(const k of psKeys(hh))headers[k]=psStr(hh[k]);
if(ct)headers['Content-Type']=psStr(ct);
if(psIsO(body)){if(ct&&/json/i.test(psStr(ct)))body=JSON.stringify(Object.fromEntries(psKeys(body).map(k=>[k,body[k]])));else body=psKeys(body).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(psStr(body[k]))).join('&')}else if(body!=null)body=psStr(body);
let savePath=null;const of=psAval(c,-1,'outfile');if(of!=null&&of!==true){const r=await rp(psStr(of));if(r.it&&r.it.isDirectory)throw psErr("Access to the path '"+win(r.path)+"' is denied.");savePath=r.path}
const r=await psNetCall('http',{url,method,headers,body:body==null?null:body,timeout:(c.named.timeoutsec?psNum(c.named.timeoutsec):30)*1000,savePath,maxBytes:6*1048576});
if(r.status>=400)throw psErr('The remote server returned an error: ('+r.status+') '+(r.statusText||'')+'.');return{r,savePath}};
PSCMD['invoke-webrequest']=async c=>{const{r,savePath}=await psHttpReq(c);if(savePath)return[];const hd={__ht:1};for(const k of Object.keys(r.headers||{}))hd[k]=r.headers[k];return[{StatusCode:r.status,StatusDescription:r.statusText||'',Content:r.body||'',RawContentLength:r.size||(r.body||'').length,Headers:hd}]};
PSCMD['invoke-restmethod']=async c=>{const{r,savePath}=await psHttpReq(c);if(savePath)return[];const t=r.body||'';const isj=/json/i.test(r.contentType||'')||/^\s*[\[{]/.test(t);if(isj){try{const v=JSON.parse(t);return Array.isArray(v)?v:[v]}catch(e){}}return[t]};
PSCMD['curl.exe']=async c=>{const a=c.raw.replace(/^\S+\s*/,'');const tk=psSplit(a,' \t').filter(x=>x!=='').map(x=>x.replace(/^(["'])([\s\S]*)\1$/,'$2'));let method=null,body=null,url=null,outp=null,head=false,incl=false;const headers={};
for(let i=0;i<tk.length;i++){const t=tk[i];if(t==='-X'||t==='--request')method=tk[++i];else if(t==='-H'||t==='--header'){const h=tk[++i]||'',k=h.indexOf(':');if(k>0)headers[h.slice(0,k).trim()]=h.slice(k+1).trim()}else if(t==='-d'||t==='--data'||t==='--data-raw'){body=(body==null?'':body+'&')+tk[++i]}else if(t==='-o'||t==='--output')outp=tk[++i];else if(t==='-I'||t==='--head')head=true;else if(t==='-i'||t==='--include')incl=true;else if(t==='-A'||t==='--user-agent')headers['User-Agent']=tk[++i];else if(t==='-m'||t==='--max-time')i++;else if(t[0]==='-')continue;else url=t}
if(!url)throw psErr("curl: try 'curl --help' for more information");if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(url))url='http://'+url;let savePath=null;if(outp){const r=await rp(outp);savePath=r.path}
const r=await psNetCall('http',{url,method:(method||(head?'HEAD':body!=null?'POST':'GET')).toUpperCase(),headers,body,timeout:30000,savePath,maxBytes:6*1048576});const o=[];
if(head||incl){o.push('HTTP/1.1 '+r.status+' '+(r.statusText||''));for(const k of Object.keys(r.headers||{}))o.push(k+': '+r.headers[k]);o.push('')}
if(!head&&!savePath)for(const l of String(r.body||'').replace(/\r/g,'').split('\n'))o.push(l);return o};
PSCMD.ping=async c=>{const host=psStr(psAval(c,0,'host','computername','targetname'));if(!host||host==='true')throw psErr('Bad parameters.');let cnt=4;const n=c.named.n!==undefined?c.named.n:c.named.count;if(n!=null&&n!==true)cnt=psNum(n);const o=[];
const r=await psNetCall('ping',{host,count:cnt,timeout:2000});const reps=r.replies||[];o.push('');o.push('Pinging '+host+(host!==r.address?' ['+r.address+']':'')+' with TCP probes (ICMP is not available on Android apps):');
let ok=0,mn=1e9,mx=0,sum=0;for(const x of reps){if(x.ok){ok++;mn=Math.min(mn,x.ms);mx=Math.max(mx,x.ms);sum+=x.ms;o.push('Reply from '+r.address+': time='+x.ms+'ms')}else o.push('Request timed out.')}
o.push('','Ping statistics for '+r.address+':','    Packets: Sent = '+reps.length+', Received = '+ok+', Lost = '+(reps.length-ok)+' ('+Math.round((reps.length-ok)*100/Math.max(1,reps.length))+'% loss),');if(ok){o.push('Approximate round trip times in milli-seconds:','    Minimum = '+mn+'ms, Maximum = '+mx+'ms, Average = '+Math.round(sum/ok)+'ms')}return o};
PSCMD['test-connection']=async c=>{const host=psStr(psArr(psAval(c,0,'computername','targetname'))[0]);const cnt=c.named.count!=null?psNum(c.named.count):4;const r=await psNetCall('ping',{host,count:cnt,timeout:2000});const reps=(r.replies||[]);
if(psSw(c,'quiet'))return[reps.some(x=>x.ok)];const rows=reps.filter(x=>x.ok).map(x=>({Source:'NEXOS-PC',Destination:host,IPV4Address:r.address,Bytes:32,'Time(ms)':x.ms}));if(!rows.length)throw psErr('Testing connection to computer \''+host+'\' failed: Error due to lack of resources');return rows};
PSCMD['test-netconnection']=async c=>{const host=psStr(psArr(psAval(c,0,'computername','targetname'))[0]||'internetbeacon.msedge.net');const port=c.named.port!=null?psNum(c.named.port):null;const o={ComputerName:host};
const pr=await psNetCall('ping',{host,count:1,timeout:2000});o.RemoteAddress=pr.address;if(port!=null){const t=await psNetCall('tcp',{host,port,timeout:3000});o.RemotePort=port;o.TcpTestSucceeded=!!t.ok}else o.PingSucceeded=!!(pr.replies||[]).some(x=>x.ok);return[o]};
PSCMD['resolve-dnsname']=async c=>{const host=psStr(psAval(c,0,'name'));const r=await psNetCall('dns',{host});return(r.addresses||[]).map(a=>({Name:host,Type:a.family===6?'AAAA':'A',IPAddress:a.address}))};
PSCMD.nslookup=async c=>{const host=psStr(c.pos[0]);const r=await psNetCall('dns',{host});const ad=(r.addresses||[]).map(a=>a.address);return['Server:  UnKnown','Address:  (system DNS)','','Name:    '+host,'Addresses:  '+ad.join('\n          ')]};
PSCMD.ipconfig=async c=>{const r=await psNetCall('netinfo',{});const o=['','Windows IP Configuration','',''];
for(const it of(r.interfaces||[])){if(!it.up||!(it.addresses||[]).length)continue;const n=it.name||'';const kind=/^wlan/i.test(n)?'Wireless LAN adapter Wi-Fi':/^(rmnet|ccmni|pdp)/i.test(n)?'Mobile broadband adapter Cellular':/^eth/i.test(n)?'Ethernet adapter Ethernet':'Ethernet adapter '+n;o.push(kind+':','','   Connection-specific DNS Suffix  . : ');
for(const a of it.addresses){if(a.family===4)o.push('   IPv4 Address. . . . . . . . . . . : '+a.address)}for(const a of it.addresses){if(a.family===6)o.push('   Link-local IPv6 Address . . . . . : '+a.address)}o.push('')}return o};
for(const k of Object.keys(PSCMD)){if(typeof PSCMD[k]!=='function')delete PSCMD[k]}
