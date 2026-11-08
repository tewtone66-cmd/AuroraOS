"""d3d mode (build time): Direct3D wrapper selection for Wine containers.
Replaces the unconditional "force wined3d" with ensureWineD3DMode(), driven by Download/aurora-d3d.txt:
  (absent) or auto : wined3d + Mesa GL version override, so wined3d can report DX11 Feature Level 10+
                     (Roblox Studio installer: "requires DirectX 11 Feature Level 10 or greater")
  wined3d          : wined3d only, no override (the old verified-to-start setup)
  dxvk             : dxvk (needs a real Vulkan driver in the container; may hang on "Starting...")
The anchor must occur exactly once, otherwise nothing is written."""
import json
import re
from pathlib import Path

APP_ID = json.loads(Path('capacitor.config.json').read_text(encoding='utf-8'))['appId']
F = Path('android/app/src/main/java') / Path(*APP_ID.split('.')) / 'AuroraWinePlugin.java'
if not F.is_file():
    raise SystemExit('Missing %s: run scripts/patch-android.py first' % F)
s = F.read_text(encoding='utf-8')
if 'ensureWineD3DMode' in s:
    print('d3d mode patch already applied')
    raise SystemExit(0)
call = '            ensureWineD3D(ctx, containerId);'
mark = '    // aurora-p08: kill leftover wineserver/wine/box64 processes'
for a in (call, mark):
    if s.count(a) != 1:
        raise SystemExit('AuroraWinePlugin: %r found %d times (need 1)' % (a, s.count(a)))
JAVA = r'''    /**
     * aurora-d3d: Download/aurora-d3d.txt (first word) picks the Direct3D setup of the container.
     * absent/auto = wined3d + Mesa GL override (DX11 FL10+ checks); wined3d = wined3d only; dxvk = dxvk.
     * dxvk needs a real Vulkan driver in the container and may hang on "Starting...". Never throws.
     */
    private void ensureWineD3DMode(Context ctx, int containerId) {
        try {
            Container c = new ContainerManager(ctx).getContainerById(containerId);
            if (c == null || c.getRootDir() == null) return;
            String mode = "auto";
            File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File f = dl == null ? null : new File(dl, "aurora-d3d.txt");
            if (f != null && f.isFile()) {
                try {
                    String t = new String(java.nio.file.Files.readAllBytes(f.toPath()), java.nio.charset.StandardCharsets.UTF_8).trim().toLowerCase();
                    String w = t.split("\\s+")[0];
                    if (w.equals("auto") || w.equals("wined3d") || w.equals("dxvk")) mode = w;
                } catch (Exception e) {
                    addJavaNote("d3d: could not read aurora-d3d.txt: " + e);
                }
            }
            boolean dirty = false;
            String wrap = "dxvk".equals(mode) ? "dxvk" : "wined3d";
            if (!wrap.equals(c.getDXWrapper())) {
                c.setDXWrapper(wrap);
                dirty = true;
            }
            EnvVars env = new EnvVars(c.getEnvVars());
            String[][] gl = { { "MESA_GL_VERSION_OVERRIDE", "4.6COMPAT" }, { "MESA_GLSL_VERSION_OVERRIDE", "460" } };
            for (String[] kv : gl) {
                if ("auto".equals(mode)) {
                    if (!kv[1].equals(env.get(kv[0]))) {
                        env.put(kv[0], kv[1]);
                        dirty = true;
                    }
                } else if (env.get(kv[0]) != null) {
                    env.remove(kv[0]);
                    dirty = true;
                }
            }
            if (dirty) {
                c.setEnvVars(env.toString());
                c.saveData();
            }
            addJavaNote("d3d: mode=" + mode + " dxwrapper=" + wrap + (dirty ? " (container updated)" : ""));
        } catch (Throwable e) {
            addJavaNote("d3d: update FAILED: " + e);
        }
    }

'''
s = s.replace(call, '            ensureWineD3DMode(ctx, containerId);').replace(mark, JAVA + mark)
F.write_text(s, encoding='utf-8')
print('d3d mode patch applied')
