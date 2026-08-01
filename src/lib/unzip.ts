import zlib from "zlib";

// Minimal ZIP reader (no deps) — enough to read an .xlsx (a ZIP of XML parts).
// Walks local file headers, inflating STORED (0) and DEFLATE (8) entries.
// Returns { "path/inside.zip": "utf8 contents" } for text parts.
// (Ported from the CORE platform's Zapmail credential-export reader.)
export default function unzip(buf: Buffer): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  const LFH = 0x04034b50; // local file header signature
  while (i + 4 <= buf.length && buf.readUInt32LE(i) === LFH) {
    const method = buf.readUInt16LE(i + 8);
    let compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const flags = buf.readUInt16LE(i + 6);
    const nameStart = i + 30;
    const name = buf.toString("utf8", nameStart, nameStart + nameLen);
    const dataStart = nameStart + nameLen + extraLen;

    if ((flags & 0x08) && compSize === 0) {
      let j = dataStart;
      while (j + 4 <= buf.length && buf.readUInt32LE(j) !== 0x08074b50 && buf.readUInt32LE(j) !== LFH) j++;
      compSize = j - dataStart;
    }

    const chunk = buf.subarray(dataStart, dataStart + compSize);
    try {
      const data = method === 8 ? zlib.inflateRawSync(chunk) : chunk;
      if (/\.(xml|rels|txt)$/i.test(name)) out[name] = data.toString("utf8");
    } catch { /* skip unreadable entry */ }

    i = dataStart + compSize;
    if (flags & 0x08) {
      if (buf.readUInt32LE(i) === 0x08074b50) i += 16; else i += 12;
    }
  }
  return out;
}
