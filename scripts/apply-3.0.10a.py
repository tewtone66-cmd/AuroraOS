#!/usr/bin/env python3
"""NexOS 3.0.10a - PowerShell terminal (real pipeline/cmdlets/HTTP) + AuroraNet plugin."""
import re, subprocess, shutil, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
F = root / 'src' / 'index.html'
s = F.read_text(encoding='utf-8')
if 'PS-3.0.10a' in s:
    sys.exit('Already applied (PS-3.0.10a found in index.html).')

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, 'anchor not found %d times (found %d): %r' % (count, n, old[:80])
    s = s.replace(old, new)

block = (root / 'scripts' / 'ps-block-3.0.10a.js').read_text(encoding='utf-8')
assert '</script' not in block.lower() and '<!--' not in block

# 1) state + prompt
rep("const prompt=()=>{pr.textContent=win(cwd)+'>'};",
    "var PSM={on:false,nested:false,vars:{},funcs:{},mode:'ps',pend:''};\n"
    "const prompt=()=>{pr.textContent=(PSM.on?'PS ':'')+win(cwd)+'>'};")
# 2) engine, inserted right before the HELP table (after the BAT interpreter)
rep("const HELP=['NexOS terminal.", block + "\nconst HELP=['NexOS terminal.")
# 3) route every line through PowerShell when PS mode is on
rep("const run=async line=>{const raw=line.trim();if(!raw)return;",
    "const run=async line=>{const raw=line.trim();if(!raw)return;\n"
    "if(PSM.on){if(await psRun(raw,false,'ps'))return}else if(await psCmdMode(raw))return;")
# 4) terminal starts as PowerShell (batch-file launches stay in cmd)
rep("prompt();setTimeout(()=>inp.focus(),380);",
    "if(!(arg&&arg.bat)){PSM.on=true;psBanner()}\nprompt();setTimeout(()=>inp.focus(),380);")
# 5) version text
n = s.count('NexOS [Version 3.0.9 alpha]')
assert n >= 1, 'version text not found'
s = s.replace('NexOS [Version 3.0.9 alpha]', 'NexOS [Version 3.0.10 alpha]')

F.write_text(s, encoding='utf-8')

# 6) Java: register the new plugin
mj = root / 'android-src' / 'MainActivity.java'
j = mj.read_text(encoding='utf-8')
if 'AuroraNetPlugin' not in j:
    a = 'registerPlugin(AuroraWinePlugin.class);'
    assert j.count(a) == 1, 'MainActivity anchor missing'
    j = j.replace(a, a + '\n        registerPlugin(AuroraNetPlugin.class);')
    mj.write_text(j, encoding='utf-8')

# 7) notes
dn = root / 'DEV-NOTES.md'
note = ("\n\n## 3.0.10a - PowerShell terminal (PS-3.0.10a)\n"
        "- appTerm (src/index.html): block `/* PS-3.0.10a ... */` sits between the BAT interpreter and `const HELP`.\n"
        "- State `PSM` (declared next to `prompt`): on / nested / vars / funcs. `run()` calls `psRun` when PSM.on, else `psCmdMode` (powershell/pwsh + ping/ipconfig/nslookup/curl/whoami/hostname/systeminfo).\n"
        "- Engine: psParts/psSplit (statements) -> psStmt (if/foreach/for/while/do/try/function/assign) -> psPipe/psStage/psCmd -> PSCMD[cmdlet]. Expressions: psExpr (psOr..psPrimary). Output: psFmtOut (table/list/dir listing).\n"
        "- Cmdlets live in `const PSCMD`; aliases in `PSALIAS`; app names for Start-Process in `PSAPPS`.\n"
        "- Network: android-src/AuroraNetPlugin.java (http, ping[TCP probe], tcp, dns, netinfo) registered in MainActivity; JS `psNetCall`.\n"
        "- Terminal opens as PowerShell; `cmd` switches to Command Prompt, `powershell` goes back. Batch launches stay in cmd.\n")
if '3.0.10a' not in dn.read_text(encoding='utf-8'):
    dn.write_text(dn.read_text(encoding='utf-8') + note, encoding='utf-8')
nx = root / 'NEXT.md'
nn = ("\n\n## Done in 3.0.10a\n- PowerShell terminal + AuroraNet plugin (see DEV-NOTES).\n\n## Todo after 3.0.10a\n"
      "- 3.0.10b: full VS Code app (preinstalled, only in taskbar search, not on desktop).\n"
      "- PS: Copy-Item/Move-Item to a new file name (needs a copy API in AuroraFilesPlugin), tab completion, .ps1 run from Files/Code, switch statement, Get-PSDrive.\n"
      "- Found, not touched: none yet.\n")
if '3.0.10a' not in nx.read_text(encoding='utf-8'):
    nx.write_text(nx.read_text(encoding='utf-8') + nn, encoding='utf-8')

# 8) syntax check like CI does (skipped if node is missing)
js = '\n'.join(re.findall(r'<script>(.*?)</script>', s, re.S))
tmp = Path('/tmp/nexos-check.js'); tmp.write_text(js, encoding='utf-8')
if shutil.which('node'):
    r = subprocess.run(['node', '--check', str(tmp)], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); sys.exit('JS SYNTAX ERROR - patch NOT committed. Send me the message above.')
    print('node --check OK')
else:
    print('node not found: skipped syntax check (CI will run it)')
left = [m.start() for m in re.finditer(r'(?<![-\w])3\.0\.9(?!\d)', s)]
print('Other "3.0.9" mentions left in index.html:', len(left), '(About page / title? tell me if the version must change there)')
print('Applied 3.0.10a.')
