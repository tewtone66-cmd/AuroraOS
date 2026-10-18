package com.auroraos.desktop;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Finds out what a Windows installer added to the Wine prefix by comparing drive_c before and after the run:
 * Program Files, Program Files (x86), the Start Menu folders and the Desktop folders. Pure Java (no Android classes),
 * so it can be tested on a normal JDK. The "before" snapshot is stored in a file because the app process can be
 * restarted while the installer runs.
 */
public final class AuroraInstallScan {
    /** Converts a Windows path (C:\dir\file.exe) to a Unix path; returns "" when it cannot. */
    public interface PathMapper {
        String toUnix(String dosPath);
    }

    /** One program found: a shortcut (lnk != "") or, without a shortcut, the main exe of a new Program Files folder. */
    public static final class Item {
        public String lnk = "";
        public String name = "";
        public String target = "";
        public String args = "";
        public String cwd = "";
        public String iconPath = "";
        public int iconIndex = 0;
        public boolean startMenu = false;
    }

    private static final class Root {
        final File dir;
        final String key;
        final boolean startMenu;

        Root(File dir, String key, boolean startMenu) {
            this.dir = dir;
            this.key = key;
            this.startMenu = startMenu;
        }
    }

    private static final class Entry {
        final File file;
        final String key;
        final String val;
        final char kind; // L = shortcut, F = exe in Program Files, D = top-level folder of Program Files
        final boolean startMenu;

        Entry(File file, String key, String val, char kind, boolean startMenu) {
            this.file = file;
            this.key = clean(key);
            this.val = val;
            this.kind = kind;
            this.startMenu = startMenu;
        }
    }

    private static final class Scan {
        final List<Entry> entries = new ArrayList<>();
        boolean truncated = false;
        long deadline;
    }

    private static final int MAX_ENTRIES = 40000;
    private static final long MAX_MS = 6000;
    private static final int MAX_DEPTH_EXE = 4;
    private static final int MAX_DEPTH_LNK = 5;
    private static final long MAX_LNK_BYTES = 1 << 20;
    private static final String[] PROGRAM_FILES = {"Program Files", "Program Files (x86)"};

    private static final String[] JUNK_NAME = {"uninstall", "uninst", "remove", "readme", "read me", "release notes",
        "changelog", "change log", "license", "licence", "eula", "help", "manual", "documentation", "user guide",
        "website", "web site", "visit", "support", "faq", "repair", "what's new", "whats new"};
    private static final String[] JUNK_EXE_PREFIX = {"unins", "uninst", "setup", "install", "vcredist", "vc_redist",
        "dxsetup", "dotnet", "ndp", "crash", "report", "updat", "elevate", "notification_helper", "helper"};
    private static final String[] SKIP_PF_FOLDER = {"common files", "windowsapps", "windows nt", "internet explorer",
        "windows media player", "windows defender", "microsoft.net", "reference assemblies", "msbuild", "dotnet"};
    private static final String[] SYSTEM_PATHS = {"/windows nt/", "/internet explorer/", "/windows media player/",
        "/common files/"};

    private AuroraInstallScan() { }

    private static String clean(String k) {
        return k.replace('\n', ' ').replace('\t', ' ').replace('\r', ' ');
    }

    // ---------------------------------------------------------------- file helpers

    /** Child of dir whose name matches ignoring case (Wine prefixes are case-insensitive, Linux is not). */
    static File ci(File dir, String name) {
        if (dir == null) return null;
        File f = new File(dir, name);
        if (f.exists()) return f;
        String[] list = dir.list();
        if (list == null) return null;
        for (String s : list) {
            if (s.equalsIgnoreCase(name)) return new File(dir, s);
        }
        return null;
    }

    private static File descend(File dir, String... names) {
        File f = dir;
        for (String n : names) {
            f = ci(f, n);
            if (f == null) return null;
        }
        return f;
    }

    /** Resolves a path whose letter case may differ from the real one ("C:\Program Files\app.exe" vs app.EXE). */
    static File resolveCI(File f) {
        if (f == null) return null;
        if (f.exists()) return f;
        File parent = f.getParentFile();
        if (parent == null) return null;
        File rp = resolveCI(parent);
        if (rp == null || !rp.isDirectory()) return null;
        return ci(rp, f.getName());
    }

    private static byte[] readSmall(File f) {
        if (f.length() <= 0 || f.length() > MAX_LNK_BYTES) return null;
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0;
            while (off < b.length) {
                int n = in.read(b, off, b.length - off);
                if (n < 0) break;
                off += n;
            }
            return off == b.length ? b : null;
        } catch (IOException e) {
            return null;
        }
    }

    // ---------------------------------------------------------------- filters

    public static boolean isJunkName(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        for (String j : JUNK_NAME) {
            if (n.contains(j)) return true;
        }
        return false;
    }

    public static boolean isJunkExe(String fileName) {
        String n = fileName.toLowerCase(Locale.ROOT);
        for (String j : JUNK_EXE_PREFIX) {
            if (n.startsWith(j)) return true;
        }
        return false;
    }

    private static boolean isSystemPath(String unixLower) {
        for (String s : SYSTEM_PATHS) {
            if (unixLower.contains(s)) return true;
        }
        return false;
    }

    // ---------------------------------------------------------------- scanning

    private static List<Root> shortcutRoots(File driveC) {
        List<Root> out = new ArrayList<>();
        File sm = descend(driveC, "ProgramData", "Microsoft", "Windows", "Start Menu");
        if (sm != null && sm.isDirectory()) out.add(new Root(sm, "SM:common", true));
        File users = ci(driveC, "users");
        File[] us = users == null ? null : users.listFiles();
        if (us != null) {
            Arrays.sort(us);
            for (File u : us) {
                if (!u.isDirectory()) continue;
                String n = u.getName();
                File a = descend(u, "AppData", "Roaming", "Microsoft", "Windows", "Start Menu");
                if (a != null && a.isDirectory()) out.add(new Root(a, "SM:" + n, true));
                File b = ci(u, "Start Menu");
                if (b != null && b.isDirectory()) out.add(new Root(b, "SM2:" + n, true));
                File d = ci(u, "Desktop");
                if (d != null && d.isDirectory()) out.add(new Root(d, "DT:" + n, false));
            }
        }
        return out;
    }

    private static void walk(Scan s, File dir, String rel, int depth, int maxDepth, boolean lnkMode, boolean startMenu,
                             boolean pfTop, Set<String> visited) {
        if (s.truncated) return;
        String canon;
        try {
            canon = dir.getCanonicalPath();
        } catch (IOException e) {
            return;
        }
        if (!visited.add(canon)) return;
        File[] files = dir.listFiles();
        if (files == null) return;
        Arrays.sort(files);
        for (File f : files) {
            if (s.entries.size() >= MAX_ENTRIES || System.currentTimeMillis() > s.deadline) {
                s.truncated = true;
                return;
            }
            String r = rel + "/" + f.getName();
            if (f.isDirectory()) {
                if (pfTop && depth == 0) s.entries.add(new Entry(f, "D|" + r, "", 'D', false));
                if (depth < maxDepth) walk(s, f, r, depth + 1, maxDepth, lnkMode, startMenu, pfTop, visited);
            } else {
                String low = f.getName().toLowerCase(Locale.ROOT);
                if (lnkMode && low.endsWith(".lnk")) {
                    s.entries.add(new Entry(f, "L|" + r, f.length() + ":" + f.lastModified(), 'L', startMenu));
                } else if (!lnkMode && low.endsWith(".exe")) {
                    s.entries.add(new Entry(f, "F|" + r, f.length() + ":" + f.lastModified(), 'F', false));
                }
            }
        }
    }

    private static Scan scan(File driveC) {
        Scan s = new Scan();
        s.deadline = System.currentTimeMillis() + MAX_MS;
        Set<String> visited = new HashSet<>();
        for (Root r : shortcutRoots(driveC)) walk(s, r.dir, r.key, 0, MAX_DEPTH_LNK, true, r.startMenu, false, visited);
        for (String pf : PROGRAM_FILES) {
            File d = ci(driveC, pf);
            if (d != null && d.isDirectory()) walk(s, d, pf, 0, MAX_DEPTH_EXE, false, false, true, visited);
        }
        return s;
    }

    /** State of drive_c that matters for installs: key -> "size:mtime". Call before starting the program. */
    public static Map<String, String> snapshot(File driveC) {
        Scan s = scan(driveC);
        Map<String, String> m = new HashMap<>();
        for (Entry e : s.entries) m.put(e.key, e.val);
        if (s.truncated) m.put("#trunc", "1");
        return m;
    }

    public static void save(Map<String, String> m, File f) throws IOException {
        File tmp = new File(f.getPath() + ".tmp");
        try (BufferedWriter w = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(tmp), "UTF-8"))) {
            for (Map.Entry<String, String> e : m.entrySet()) {
                w.write(clean(e.getKey()));
                w.write('\t');
                w.write(clean(e.getValue()));
                w.write('\n');
            }
        }
        if (!tmp.renameTo(f)) {
            f.delete();
            if (!tmp.renameTo(f)) throw new IOException("Could not write " + f);
        }
    }

    /** Returns null when the file is missing or unreadable. */
    public static Map<String, String> load(File f) {
        if (!f.isFile()) return null;
        Map<String, String> m = new HashMap<>();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) {
                int t = line.indexOf('\t');
                if (t <= 0) continue;
                m.put(line.substring(0, t), line.substring(t + 1));
            }
        } catch (IOException e) {
            return null;
        }
        return m;
    }

    // ---------------------------------------------------------------- results

    private static String stripLnk(String name) {
        return name.toLowerCase(Locale.ROOT).endsWith(".lnk") ? name.substring(0, name.length() - 4) : name;
    }

    private static String existingOrEmpty(PathMapper pm, String dos) {
        if (dos == null || dos.isEmpty() || dos.indexOf('%') >= 0) return "";
        String u;
        try {
            u = pm.toUnix(dos);
        } catch (RuntimeException e) {
            return "";
        }
        if (u == null || u.isEmpty()) return "";
        File f = resolveCI(new File(u));
        return f == null ? "" : f.getPath();
    }

    /** Shortcut -> program, or null when it is not a launchable program (uninstaller, readme, system tool, ...). */
    private static Item toItem(File lnkFile, boolean startMenu, File windowsDir, PathMapper pm) {
        byte[] b = readSmall(lnkFile);
        AuroraLnk l = b == null ? null : AuroraLnk.parse(b);
        if (l == null || l.target.isEmpty()) return null;
        String name = stripLnk(lnkFile.getName());
        if (name.isEmpty() || isJunkName(name)) return null;
        String target = existingOrEmpty(pm, l.target);
        if (target.isEmpty()) return null;
        File tf = new File(target);
        String tl = tf.getName().toLowerCase(Locale.ROOT);
        if (!tf.isFile() || !tl.endsWith(".exe") || isJunkExe(tf.getName())) return null;
        if (isSystemPath(target.toLowerCase(Locale.ROOT))) return null;
        if (windowsDir != null && target.toLowerCase(Locale.ROOT).startsWith(windowsDir.getPath().toLowerCase(Locale.ROOT) + "/")) {
            return null;
        }
        Item it = new Item();
        it.lnk = lnkFile.getPath();
        it.name = name;
        it.target = target;
        it.args = l.args;
        it.cwd = existingOrEmpty(pm, l.workDir);
        it.iconPath = existingOrEmpty(pm, l.iconPath);
        it.iconIndex = l.iconIndex;
        it.startMenu = startMenu;
        return it;
    }

    private static void addUnique(List<Item> items, Set<String> seen, Item it) {
        if (it == null) return;
        if (seen.add((it.target + "|" + it.args).toLowerCase(Locale.ROOT))) items.add(it);
    }

    /** All launchable shortcuts that exist now (Start Menu first, then Desktop). */
    public static List<Item> allShortcuts(File driveC, PathMapper pm) {
        Scan s = scan(driveC);
        List<Entry> lnks = new ArrayList<>();
        for (Entry e : s.entries) {
            if (e.kind == 'L') lnks.add(e);
        }
        return fromShortcuts(driveC, lnks, pm);
    }

    private static List<Item> fromShortcuts(File driveC, List<Entry> lnks, PathMapper pm) {
        Collections.sort(lnks, new Comparator<Entry>() {
            @Override
            public int compare(Entry a, Entry b) {
                return Boolean.compare(!a.startMenu, !b.startMenu);
            }
        });
        File win = resolveCI(new File(driveC, "windows"));
        List<Item> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Entry e : lnks) addUnique(items, seen, toItem(e.file, e.startMenu, win, pm));
        return items;
    }

    private static boolean sameKey(String a, String b) {
        return a.equals(b);
    }

    /**
     * Programs added or refreshed since the snapshot: new/changed shortcuts first, then (only for Program Files
     * folders none of those shortcuts point into) the main exe of each new folder.
     */
    public static List<Item> changedSince(File driveC, Map<String, String> before, PathMapper pm) {
        Scan s = scan(driveC);
        boolean trustPf = !s.truncated && !before.containsKey("#trunc");
        List<Entry> lnks = new ArrayList<>();
        Map<String, List<Entry>> newExe = new LinkedHashMap<>();
        for (Entry e : s.entries) {
            String old = before.get(e.key);
            if (e.kind == 'L') {
                if (old == null || !sameKey(old, e.val)) lnks.add(e);
            } else if (e.kind == 'F' && trustPf && old == null) {
                String[] p = e.key.substring(2).split("/");
                if (p.length < 3) continue; // exe directly inside "Program Files": no folder to name it after
                String folder = p[0] + "/" + p[1];
                List<Entry> g = newExe.get(folder);
                if (g == null) {
                    g = new ArrayList<>();
                    newExe.put(folder, g);
                }
                g.add(e);
            }
        }
        List<Item> items = fromShortcuts(driveC, lnks, pm);
        Set<String> seen = new HashSet<>();
        for (Item it : items) seen.add((it.target + "|" + it.args).toLowerCase(Locale.ROOT));
        for (Map.Entry<String, List<Entry>> g : newExe.entrySet()) {
            String folderName = g.getKey().substring(g.getKey().indexOf('/') + 1);
            if (skipFolder(folderName)) continue;
            Entry best = pickMainExe(folderName, g.getValue());
            if (best == null) continue;
            File folder = best.file;
            for (int i = best.key.substring(2).split("/").length; i > 2; i--) folder = folder.getParentFile();
            String folderPath = folder.getPath().toLowerCase(Locale.ROOT) + "/";
            boolean covered = false;
            for (Item it : items) {
                if (it.target.toLowerCase(Locale.ROOT).startsWith(folderPath)) {
                    covered = true;
                    break;
                }
            }
            if (covered) continue;
            Item it = new Item();
            it.name = folderName;
            it.target = best.file.getPath();
            if (seen.add((it.target + "|").toLowerCase(Locale.ROOT))) items.add(it);
        }
        return items;
    }

    private static boolean skipFolder(String folderName) {
        String n = folderName.toLowerCase(Locale.ROOT);
        for (String s : SKIP_PF_FOLDER) {
            if (n.equals(s)) return true;
        }
        return false;
    }

    private static String norm(String s) {
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static Entry pickMainExe(String folderName, List<Entry> exes) {
        String fn = norm(folderName);
        Entry best = null;
        long bestScore = -1;
        for (Entry e : exes) {
            String name = e.file.getName();
            if (isJunkExe(name)) continue;
            long size;
            try {
                size = Long.parseLong(e.val.substring(0, e.val.indexOf(':')));
            } catch (RuntimeException ex) {
                size = 0;
            }
            long score = size;
            String base = norm(name.substring(0, name.length() - 4));
            if (!fn.isEmpty() && base.equals(fn)) score += 1L << 40;
            else if (!fn.isEmpty() && (fn.contains(base) || base.contains(fn)) && base.length() >= 3) score += 1L << 38;
            if (e.key.substring(2).split("/").length == 3) score += 1L << 30; // directly in the program folder
            if (score > bestScore) {
                bestScore = score;
                best = e;
            }
        }
        return best;
    }
}
