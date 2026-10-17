package com.auroraos.desktop;

import java.nio.charset.Charset;
import java.util.ArrayList;

/** Minimal reader for Windows Shell Link (.lnk) files: target, arguments, working dir, icon location. Pure Java. */
public final class AuroraLnk {
    public String target = "";
    public String args = "";
    public String workDir = "";
    public String iconPath = "";
    public int iconIndex = 0;

    private AuroraLnk() { }

    private static int u16(byte[] b, int o) {
        return (b[o] & 0xff) | ((b[o + 1] & 0xff) << 8);
    }

    private static int u32(byte[] b, int o) {
        return (b[o] & 0xff) | ((b[o + 1] & 0xff) << 8) | ((b[o + 2] & 0xff) << 16) | ((b[o + 3] & 0xff) << 24);
    }

    private static String cstr(byte[] b, int o, int end) {
        int e = o;
        while (e < end && b[e] != 0) e++;
        return new String(b, o, Math.max(0, e - o), Charset.forName("windows-1252"));
    }

    private static String ustr(byte[] b, int o, int end) {
        int e = o;
        while (e + 1 < end && (b[e] != 0 || b[e + 1] != 0)) e += 2;
        return new String(b, o, Math.max(0, e - o), Charset.forName("UTF-16LE"));
    }

    /** Returns null when the data is not a valid shell link. Never throws. */
    public static AuroraLnk parse(byte[] b) {
        try {
            return parseInner(b);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static AuroraLnk parseInner(byte[] b) {
        if (b == null || b.length < 0x4c || u32(b, 0) != 0x4c) return null;
        // CLSID 00021401-0000-0000-C000-000000000046
        if (u32(b, 4) != 0x00021401) return null;
        int flags = u32(b, 0x14);
        boolean hasIdList = (flags & 1) != 0, hasInfo = (flags & 2) != 0, hasName = (flags & 4) != 0;
        boolean hasRel = (flags & 8) != 0, hasDir = (flags & 16) != 0, hasArgs = (flags & 32) != 0, hasIcon = (flags & 64) != 0;
        boolean uni = (flags & 128) != 0;
        AuroraLnk r = new AuroraLnk();
        r.iconIndex = u32(b, 0x38);
        int p = 0x4c;
        String idListPath = "";
        if (hasIdList) {
            int sz = u16(b, p);
            idListPath = fromIdList(b, p + 2, Math.min(b.length, p + 2 + sz));
            p += 2 + sz;
        }
        if (hasInfo) {
            int start = p, size = u32(b, p);
            if (size >= 0x1c && start + size <= b.length) {
                int infoFlags = u32(b, p + 8);
                if ((infoFlags & 1) != 0) {
                    int baseOff = u32(b, p + 0x10), sufOff = u32(b, p + 0x18);
                    String base = "", suf = "";
                    if (size >= 0x24 && u32(b, p + 4) >= 0x24) {
                        int ubase = u32(b, p + 0x1c), usuf = u32(b, p + 0x20);
                        if (ubase > 0) base = ustr(b, start + ubase, start + size);
                        if (usuf > 0) suf = ustr(b, start + usuf, start + size);
                    }
                    if (base.isEmpty() && baseOff > 0) base = cstr(b, start + baseOff, start + size);
                    if (suf.isEmpty() && sufOff > 0) suf = cstr(b, start + sufOff, start + size);
                    r.target = base + suf;
                }
            }
            p = start + size;
        }
        String[] sv = new String[5];
        boolean[] has = {hasName, hasRel, hasDir, hasArgs, hasIcon};
        for (int i = 0; i < 5; i++) {
            sv[i] = "";
            if (!has[i]) continue;
            if (p + 2 > b.length) break;
            int n = u16(b, p);
            p += 2;
            int len = uni ? n * 2 : n;
            if (p + len > b.length) break;
            sv[i] = uni ? new String(b, p, len, Charset.forName("UTF-16LE")) : new String(b, p, len, Charset.forName("windows-1252"));
            p += len;
        }
        r.workDir = sv[2];
        r.args = sv[3];
        r.iconPath = sv[4];
        if (r.target.isEmpty()) r.target = idListPath;
        if (r.target.isEmpty() && !sv[1].isEmpty()) r.target = sv[1];
        return r;
    }

    /** Walks the item ID list: root, drive ("C:\"), then file/folder items. Returns "C:\dir\file.exe" or "". */
    private static String fromIdList(byte[] b, int p, int end) {
        ArrayList<String> parts = new ArrayList<>();
        String drive = "";
        while (p + 2 <= end) {
            int sz = u16(b, p);
            if (sz == 0) break;
            if (p + sz > end || sz < 3) break;
            int type = b[p + 2] & 0xff;
            if ((type & 0x70) == 0x20 && sz >= 6) {
                String d = cstr(b, p + 3, p + sz);
                if (d.length() >= 2 && d.charAt(1) == ':') drive = d.substring(0, 2);
            } else if ((type & 0x70) == 0x30 && sz > 14) {
                String name = cstr(b, p + 14, p + sz);
                parts.add(name);
            }
            p += sz;
        }
        if (drive.isEmpty() || parts.isEmpty()) return "";
        StringBuilder sb = new StringBuilder(drive);
        for (String s : parts) sb.append('\\').append(s);
        return sb.toString();
    }
}
