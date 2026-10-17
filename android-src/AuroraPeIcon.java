package com.auroraos.desktop;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.zip.CRC32;
import java.util.zip.Deflater;

/** Extracts the main icon of a Windows PE file (.exe/.dll, 32 and 64 bit) and returns it as PNG bytes. Pure Java. */
public final class AuroraPeIcon {
    private final RandomAccessFile f;
    private final long fileLen;
    private long[] secVa, secRaw, secSize;
    private int nSec;
    private long rsrcOff;     // file offset of the resource directory
    private long rsrcRva;

    private AuroraPeIcon(RandomAccessFile f) throws IOException {
        this.f = f;
        this.fileLen = f.length();
    }

    /** Returns PNG bytes of the icon at {@code index} (>=0: n-th group, <0: group with id -index), or null. Never throws. */
    public static byte[] extract(File file, int index) {
        if (file == null || !file.isFile()) return null;
        try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
            return new AuroraPeIcon(raf).run(index);
        } catch (Exception e) {
            return null;
        }
    }


    /** PNG bytes of the best image inside a standalone .ico file, or null. Never throws. */
    public static byte[] fromIco(File file) {
        try {
            if (file == null || !file.isFile() || file.length() > 4 * 1024 * 1024) return null;
            byte[] d = java.nio.file.Files.readAllBytes(file.toPath());
            if (d.length < 22 || u16(d, 0) != 0 || u16(d, 2) != 1) return null;
            int n = u16(d, 4), best = -1, bestScore = -1;
            for (int i = 0; i < n && 6 + i * 16 + 16 <= d.length; i++) {
                int o = 6 + i * 16, w = d[o] & 0xff;
                if (w == 0) w = 256;
                int score = (w <= 128 ? w : 64) * 100 + Math.min(u16(d, o + 6), 32);
                if (score > bestScore) { bestScore = score; best = i; }
            }
            if (best < 0) return null;
            int o = 6 + best * 16, size = (int) u32(d, o + 8), off = (int) u32(d, o + 12);
            if (off < 0 || size <= 0 || off + size > d.length) return null;
            byte[] img = java.util.Arrays.copyOfRange(d, off, off + size);
            if (img.length > 8 && (img[0] & 0xff) == 0x89 && img[1] == 'P') return img;
            return dibToPng(img);
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] read(long off, int len) throws IOException {
        if (off < 0 || len < 0 || off + len > fileLen) throw new IOException("range");
        byte[] b = new byte[len];
        f.seek(off);
        f.readFully(b);
        return b;
    }

    private static int u16(byte[] b, int o) {
        return (b[o] & 0xff) | ((b[o + 1] & 0xff) << 8);
    }

    private static long u32(byte[] b, int o) {
        return ((b[o] & 0xffL) | ((b[o + 1] & 0xffL) << 8) | ((b[o + 2] & 0xffL) << 16) | ((b[o + 3] & 0xffL) << 24));
    }

    private long rvaToOff(long rva) {
        for (int i = 0; i < nSec; i++) {
            long span = Math.max(secSize[i], 0);
            if (rva >= secVa[i] && rva < secVa[i] + Math.max(span, 1)) return secRaw[i] + (rva - secVa[i]);
        }
        return -1;
    }

    private byte[] run(int index) throws IOException {
        byte[] dos = read(0, 64);
        if (dos[0] != 'M' || dos[1] != 'Z') return null;
        long pe = u32(dos, 0x3c);
        byte[] hdr = read(pe, 24);
        if (hdr[0] != 'P' || hdr[1] != 'E') return null;
        nSec = u16(hdr, 6);
        int optSize = u16(hdr, 20);
        if (nSec <= 0 || nSec > 96 || optSize < 96) return null;
        byte[] opt = read(pe + 24, optSize);
        int magic = u16(opt, 0);
        int ddOff = magic == 0x20b ? 112 : magic == 0x10b ? 96 : -1;
        if (ddOff < 0 || optSize < ddOff + 24) return null;
        rsrcRva = u32(opt, ddOff + 16);
        long rsrcLen = u32(opt, ddOff + 20);
        if (rsrcRva == 0 || rsrcLen == 0) return null;
        byte[] st = read(pe + 24 + optSize, nSec * 40);
        secVa = new long[nSec];
        secRaw = new long[nSec];
        secSize = new long[nSec];
        for (int i = 0; i < nSec; i++) {
            long vsize = u32(st, i * 40 + 8), raw = u32(st, i * 40 + 20), rsize = u32(st, i * 40 + 16);
            secVa[i] = u32(st, i * 40 + 12);
            secRaw[i] = raw;
            secSize[i] = Math.max(vsize, rsize);
        }
        rsrcOff = rvaToOff(rsrcRva);
        if (rsrcOff < 0) return null;

        long groupDir = findSub(0, 14, -1);
        if (groupDir < 0) return null;
        long grp = pickEntry(groupDir, index);
        if (grp < 0) return null;
        byte[] grpData = leaf(grp);
        if (grpData == null || grpData.length < 6) return null;
        int count = u16(grpData, 4);
        int bestId = -1, bestScore = -1;
        for (int i = 0; i < count && 6 + i * 14 + 14 <= grpData.length; i++) {
            int o = 6 + i * 14;
            int w = grpData[o] & 0xff;
            if (w == 0) w = 256;
            int bpp = u16(grpData, o + 6), id = u16(grpData, o + 12);
            int score = (w <= 128 ? w : 64) * 100 + Math.min(bpp, 32);
            if (score > bestScore) {
                bestScore = score;
                bestId = id;
            }
        }
        if (bestId < 0) return null;
        long iconDir = findSub(0, 3, -1);
        if (iconDir < 0 || (iconDir & 0x80000000L) == 0) return null;
        iconDir &= 0x7fffffffL;
        long ic = findSub(iconDir, bestId, -1);
        if (ic < 0) return null;
        byte[] data = leaf(ic);
        if (data == null || data.length < 40) return null;
        if ((data[0] & 0xff) == 0x89 && data[1] == 'P' && data[2] == 'N' && data[3] == 'G') return data;
        return dibToPng(data);
    }

    /** In directory at {@code dir} (offset relative to resource start) find the entry with numeric id; returns its offset field. */
    private long findSub(long dir, int id, int unused) throws IOException {
        byte[] h = read(rsrcOff + dir, 16);
        int named = u16(h, 12), ids = u16(h, 14);
        int total = named + ids;
        if (total > 4096) return -1;
        byte[] e = read(rsrcOff + dir + 16, total * 8);
        for (int i = named; i < total; i++) {
            long nid = u32(e, i * 8);
            if ((nid & 0x80000000L) != 0) continue;
            if (nid == id) return u32(e, i * 8 + 4);
        }
        return -1;
    }

    /** From a type-level entry offset (maybe flagged as subdirectory) pick the n-th / id'ed group inside it. */
    private long pickEntry(long typeEntry, int index) throws IOException {
        if ((typeEntry & 0x80000000L) == 0) return -1;
        long dir = typeEntry & 0x7fffffffL;
        byte[] h = read(rsrcOff + dir, 16);
        int named = u16(h, 12), ids = u16(h, 14);
        int total = named + ids;
        if (total == 0 || total > 4096) return -1;
        byte[] e = read(rsrcOff + dir + 16, total * 8);
        int pick = 0;
        if (index < 0) {
            pick = -1;
            for (int i = named; i < total; i++) if ((int) u32(e, i * 8) == -index) pick = i;
            if (pick < 0) return -1;
        } else {
            // Windows numbers group icons by their order in the directory; fall back to the first one when out of range
            pick = index < total ? index : 0;
        }
        return u32(e, pick * 8 + 4);
    }

    /** Resolve a (possibly nested) entry offset down to the first data leaf and read its bytes. */
    private byte[] leaf(long entry) throws IOException {
        int guard = 0;
        while ((entry & 0x80000000L) != 0 && guard++ < 4) {
            long dir = entry & 0x7fffffffL;
            byte[] h = read(rsrcOff + dir, 16);
            int total = u16(h, 12) + u16(h, 14);
            if (total == 0) return null;
            entry = u32(read(rsrcOff + dir + 16, 8), 4);
        }
        if ((entry & 0x80000000L) != 0) return null;
        byte[] de = read(rsrcOff + entry, 16);
        long rva = u32(de, 0);
        long size = u32(de, 4);
        if (size <= 0 || size > 4 * 1024 * 1024) return null;
        long off = rvaToOff(rva);
        if (off < 0) return null;
        return read(off, (int) size);
    }

    // ---------- DIB (BMP inside ICO) -> PNG ----------

    static byte[] dibToPng(byte[] d) {
        try {
            int hs = (int) u32(d, 0);
            if (hs < 40) return null;
            int w = (int) u32(d, 4);
            int h2 = (int) u32(d, 8);
            int bpp = u16(d, 14);
            long comp = u32(d, 16);
            int colors = (int) u32(d, 32);
            if (comp != 0 || w <= 0 || w > 512) return null;
            int h = Math.abs(h2) / 2;
            if (h <= 0 || h > 512) return null;
            int palN = bpp <= 8 ? (colors > 0 ? colors : 1 << bpp) : 0;
            int palOff = hs;
            int px = palOff + palN * 4;
            int stride = ((w * bpp + 31) / 32) * 4;
            int maskOff = px + stride * h;
            int mstride = ((w + 31) / 32) * 4;
            int[] rgba = new int[w * h];
            boolean anyAlpha = false;
            for (int y = 0; y < h; y++) {
                int row = px + (h - 1 - y) * stride;
                for (int x = 0; x < w; x++) {
                    int r, g, b, a = 255;
                    if (bpp == 32) {
                        int o = row + x * 4;
                        b = d[o] & 0xff; g = d[o + 1] & 0xff; r = d[o + 2] & 0xff; a = d[o + 3] & 0xff;
                        if (a != 0) anyAlpha = true;
                    } else if (bpp == 24) {
                        int o = row + x * 3;
                        b = d[o] & 0xff; g = d[o + 1] & 0xff; r = d[o + 2] & 0xff;
                    } else if (bpp == 8 || bpp == 4 || bpp == 1) {
                        int idx;
                        if (bpp == 8) idx = d[row + x] & 0xff;
                        else if (bpp == 4) idx = ((d[row + x / 2] & 0xff) >> ((x & 1) == 0 ? 4 : 0)) & 15;
                        else idx = ((d[row + x / 8] & 0xff) >> (7 - (x & 7))) & 1;
                        int po = palOff + idx * 4;
                        if (idx >= palN) po = palOff;
                        b = d[po] & 0xff; g = d[po + 1] & 0xff; r = d[po + 2] & 0xff;
                    } else return null;
                    rgba[y * w + x] = (a << 24) | (r << 16) | (g << 8) | b;
                }
            }
            boolean useMask = bpp != 32 || !anyAlpha;
            if (useMask && maskOff + mstride * h <= d.length) {
                for (int y = 0; y < h; y++) {
                    int row = maskOff + (h - 1 - y) * mstride;
                    for (int x = 0; x < w; x++) {
                        boolean transparent = (((d[row + x / 8] & 0xff) >> (7 - (x & 7))) & 1) != 0;
                        if (bpp == 32) rgba[y * w + x] = (transparent ? 0 : 0xff) << 24 | (rgba[y * w + x] & 0xffffff);
                        else if (transparent) rgba[y * w + x] &= 0xffffff;
                    }
                }
            }
            return encodePng(rgba, w, h);
        } catch (RuntimeException e) {
            return null;
        }
    }

    static byte[] encodePng(int[] argb, int w, int h) {
        byte[] raw = new byte[(w * 4 + 1) * h];
        int p = 0;
        for (int y = 0; y < h; y++) {
            raw[p++] = 0;
            for (int x = 0; x < w; x++) {
                int c = argb[y * w + x];
                raw[p++] = (byte) (c >> 16);
                raw[p++] = (byte) (c >> 8);
                raw[p++] = (byte) c;
                raw[p++] = (byte) (c >>> 24);
            }
        }
        Deflater df = new Deflater(6);
        df.setInput(raw);
        df.finish();
        ByteArrayOutputStream z = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        while (!df.finished()) z.write(buf, 0, df.deflate(buf));
        df.end();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(new byte[]{(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10}, 0, 8);
        byte[] ihdr = new byte[13];
        put32(ihdr, 0, w);
        put32(ihdr, 4, h);
        ihdr[8] = 8;
        ihdr[9] = 6;
        chunk(out, "IHDR", ihdr);
        chunk(out, "IDAT", z.toByteArray());
        chunk(out, "IEND", new byte[0]);
        return out.toByteArray();
    }

    private static void put32(byte[] b, int o, int v) {
        b[o] = (byte) (v >>> 24);
        b[o + 1] = (byte) (v >>> 16);
        b[o + 2] = (byte) (v >>> 8);
        b[o + 3] = (byte) v;
    }

    private static void chunk(ByteArrayOutputStream out, String type, byte[] data) {
        byte[] l = new byte[4];
        put32(l, 0, data.length);
        out.write(l, 0, 4);
        byte[] t = type.getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        out.write(t, 0, 4);
        out.write(data, 0, data.length);
        CRC32 crc = new CRC32();
        crc.update(t, 0, 4);
        crc.update(data, 0, data.length);
        put32(l, 0, (int) crc.getValue());
        out.write(l, 0, 4);
    }
}
