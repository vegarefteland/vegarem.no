#!/usr/bin/env node
/* ============================================================================
 * build-manifest.js — scans images/ and writes images/manifest.json
 *
 * WHY THIS EXISTS
 * The site used to *guess* which files existed by requesting them and seeing
 * what 404'd. That cost ~86% wasted requests and made a project page take
 * 16+ seconds. This script records exactly what's on disk (and how big each
 * image is), so the browser can fetch only real files and reserve exactly the
 * right space for them — no probing, no layout shift.
 *
 * YOU DON'T NEED TO RUN THIS BY HAND.
 * The git pre-commit hook runs it automatically, so just drop files in a
 * folder and commit as usual. To refresh it manually (e.g. to preview
 * locally before committing):
 *
 *     node scripts/build-manifest.js
 *
 * Naming rules it understands (same as always):
 *   NN.webp / NN.mp4        single full-width item
 *   NN_player.mp4           video with sound controls
 *   NN/01.webp, NN/02.webp  side-by-side row
 *   NNA/…, NNB/…            flush group (seamless block), may contain rows
 * ========================================================================= */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const IMAGES = path.join(ROOT, "images");
const IMG_EXT = [".webp", ".jpg", ".jpeg", ".png", ".gif"];
const VID_EXT = [".mp4"];

/* ── dimension readers (no dependencies) ─────────────────────────────── */

function pngSize(b) {
  if (b.length < 24) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function webpSize(b) {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    // lossy: 3-byte start code at 23, then 14-bit w/h
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { w, h };
  }
  return null;
}

function jpegSize(b) {
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    // SOF0-SOF15 (excluding DHT/JPG/DAC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

function gifSize(b) {
  if (b.length < 10) return null;
  return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
}

function imageSize(file) {
  try {
    const fd = fs.openSync(file, "r");
    const b = Buffer.alloc(65536);
    const n = fs.readSync(fd, b, 0, 65536, 0);
    fs.closeSync(fd);
    const head = b.subarray(0, n);
    const ext = path.extname(file).toLowerCase();
    if (ext === ".png") return pngSize(head);
    if (ext === ".webp") return webpSize(head);
    if (ext === ".jpg" || ext === ".jpeg") return jpegSize(head);
    if (ext === ".gif") return gifSize(head);
  } catch (e) {}
  return null;
}

let ffprobeOK = null;
function videoSize(file) {
  if (ffprobeOK === false) return null;
  try {
    const out = execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", file,
    ], { encoding: "utf8" }).trim().split("x");
    ffprobeOK = true;
    const w = parseInt(out[0], 10), h = parseInt(out[1], 10);
    if (w && h) return { w, h };
  } catch (e) { ffprobeOK = false; }
  return null;
}

function measure(abs) {
  const ext = path.extname(abs).toLowerCase();
  return VID_EXT.includes(ext) ? videoSize(abs) : imageSize(abs);
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch (e) { return false; } };
const pad = (n) => String(n).padStart(2, "0");

// Find NN.<ext> in dir, preferring the order the site prefers
function findNumbered(dir, num) {
  for (const e of [...VID_EXT, ...IMG_EXT]) {
    const f = path.join(dir, num + e);
    if (fs.existsSync(f)) return num + e;
  }
  return null;
}

/* Still frame shown before a sound video is started.
   Player videos load with preload="none" (they're large and wait for a
   deliberate press), so without a poster the box is simply blank until you
   hit play. Drop NN_player_poster.webp beside NN_player.mp4 and it's picked
   up automatically — the name can't collide with the numbered-item scan,
   which only matches NN.<ext>. */
function findPoster(dir, relDir, num) {
  for (const e of IMG_EXT) {
    const f = path.join(dir, `${num}_player_poster${e}`);
    if (fs.existsSync(f)) return `${relDir}/${num}_player_poster${e}`;
  }
  return null;
}

// A "row" folder: NN/ containing 01, 02 … side by side.
// Rows started out images-only, so items carried no `type` and the site
// assumed one. A row can hold a clip just as a sequence can, so the type is
// stated here — same rule as readSequence, silent unless it's a _player file
// (which findNumbered doesn't match inside a row).
function readRow(absDir, relDir) {
  const items = [];
  for (let i = 1; ; i++) {
    const name = findNumbered(absDir, pad(i));
    if (!name) break;
    const abs = path.join(absDir, name);
    const d = measure(abs) || {};
    const isVid = VID_EXT.includes(path.extname(name).toLowerCase());
    items.push({ type: isVid ? "video" : "image", src: `${relDir}/${name}`,
                 w: d.w || null, h: d.h || null });
  }
  return items;
}

/* A "book": a folder named NN_book (any case — "09_Book" works) holding
   numbered pages 01, 02 … The site shows them one at a time with previous /
   next controls instead of stacking them. Pages are images only.
   The name is matched case-insensitively because it's typed by hand, but
   the real on-disk spelling is what goes into the path: GitHub Pages is
   case-sensitive, so "09_book" in a URL would 404 for a folder "09_Book". */
function findBookDir(absDir, num) {
  let names;
  try { names = fs.readdirSync(absDir); } catch (e) { return null; }
  const want = (num + "_book").toLowerCase();
  return names.find(n => n.toLowerCase() === want && isDir(path.join(absDir, n))) || null;
}

function readBook(absDir, relDir) {
  const pages = [];
  for (let i = 1; ; i++) {
    const num = pad(i);
    let name = null;
    for (const e of IMG_EXT) {
      if (fs.existsSync(path.join(absDir, num + e))) { name = num + e; break; }
    }
    if (!name) break;
    const d = measure(path.join(absDir, name)) || {};
    pages.push({ src: `${relDir}/${name}`, w: d.w || null, h: d.h || null });
  }
  return pages.length ? { type: "book", pages } : null;
}

// Walk a sequence of numbered slots inside `absDir`.
// Handles: nested row folders, videos (incl. _player), images.
function readSequence(absDir, relDir) {
  const out = [];
  for (let i = 1; ; i++) {
    const num = pad(i);
    const slot = readSlot(absDir, relDir, num);

    // NN_book/ sits alongside the slot. If the slot also has an ordinary
    // item, that item comes first and the book follows it — nothing is lost.
    const bookName = findBookDir(absDir, num);
    const book = bookName ? readBook(path.join(absDir, bookName), `${relDir}/${bookName}`) : null;

    if (!slot && !book) break;
    if (slot) out.push(slot);
    if (book) out.push(book);
  }
  return out;
}

// The ordinary content of one numbered slot: a row folder, a _player video,
// or a plain NN.<ext> file. Null when the slot is empty.
function readSlot(absDir, relDir, num) {
  // 1) row folder?
  const rowDir = path.join(absDir, num);
  if (isDir(rowDir)) {
    const row = readRow(rowDir, `${relDir}/${num}`);
    if (row.length) return { type: "row", items: row };
  }

  // 2) video with sound
  const player = path.join(absDir, `${num}_player.mp4`);
  if (fs.existsSync(player)) {
    const d = measure(player) || {};
    return { type: "video", src: `${relDir}/${num}_player.mp4`, sound: true,
             poster: findPoster(absDir, relDir, num), w: d.w || null, h: d.h || null };
  }

  // 3) plain numbered file (video or image)
  const name = findNumbered(absDir, num);
  if (!name) return null;
  const d = measure(path.join(absDir, name)) || {};
  const isVid = VID_EXT.includes(path.extname(name).toLowerCase());
  return { type: isVid ? "video" : "image", src: `${relDir}/${name}`, w: d.w || null, h: d.h || null };
}

/* ── project scanning ────────────────────────────────────────────────── */

function readProject(folder) {
  const absP = path.join(IMAGES, "projects", folder);
  if (!isDir(absP)) return null;
  const rel = `images/projects/${folder}`;
  const items = [];

  for (let i = 1; ; i++) {
    const num = pad(i);
    let consumed = false;

    // flush groups NNA, NNB, NNC …
    for (let li = 0; li < 26; li++) {
      const letter = String.fromCharCode(65 + li);
      const gAbs = path.join(absP, num + letter);
      if (!isDir(gAbs)) break;
      const gItems = readSequence(gAbs, `${rel}/${num}${letter}`);
      if (!gItems.length) break;
      items.push({ type: "group", name: num + letter, items: gItems });
      consumed = true;
    }
    if (consumed) continue;

    // row folder / _player video / single file at this slot, then any book
    const slot = readSlot(absP, rel, num);
    const bookName = findBookDir(absP, num);
    const book = bookName ? readBook(path.join(absP, bookName), `${rel}/${bookName}`) : null;
    if (!slot && !book) break;
    if (slot) items.push(slot);
    if (book) items.push(book);
  }

  // cover
  let cover = null;
  for (const e of [...IMG_EXT, ...VID_EXT]) {
    const f = path.join(absP, "cover" + e);
    if (fs.existsSync(f)) {
      const d = measure(f) || {};
      cover = { src: `${rel}/cover${e}`, w: d.w || null, h: d.h || null };
      break;
    }
  }

  return { cover, items };
}

/* ── archive scanning ────────────────────────────────────────────────── */

function readArchive() {
  const absA = path.join(IMAGES, "archive");
  if (!isDir(absA)) return [];
  const out = [];
  // archive is loose numbered files; scan generously and keep what exists
  for (let i = 1; i <= 500; i++) {
    const num = pad(i);
    const name = findNumbered(absA, num);
    if (!name) continue;
    const abs = path.join(absA, name);
    const d = measure(abs) || {};
    const isVid = VID_EXT.includes(path.extname(name).toLowerCase());
    out.push({ src: `images/archive/${name}`, type: isVid ? "video" : "image", w: d.w || null, h: d.h || null });
  }
  return out;
}

/* ── main ────────────────────────────────────────────────────────────── */

const projects = {};
const projRoot = path.join(IMAGES, "projects");
if (isDir(projRoot)) {
  for (const folder of fs.readdirSync(projRoot).sort()) {
    if (folder.startsWith(".") || folder.startsWith("_")) continue;
    if (!isDir(path.join(projRoot, folder))) continue;
    const p = readProject(folder);
    if (p) projects[folder] = p;
  }
}

const manifest = {
  generated: new Date().toISOString(),
  note: "Auto-generated by scripts/build-manifest.js (runs on every commit). Do not edit by hand.",
  projects,
  archive: readArchive(),
};

const outFile = path.join(IMAGES, "manifest.json");
fs.writeFileSync(outFile, JSON.stringify(manifest));

// Report
let totalItems = 0;
for (const [k, v] of Object.entries(projects)) {
  const count = (function walk(list) {
    let n = 0;
    for (const it of list) {
      if (it.type === "group") n += walk(it.items);
      else if (it.type === "row") n += it.items.length;
      else n++;
    }
    return n;
  })(v.items);
  totalItems += count;
  console.log(`  project ${k}: ${count} media`);
}
console.log(`  archive:    ${manifest.archive.length} media`);
console.log(`manifest.json written (${(fs.statSync(outFile).size / 1024).toFixed(1)} KB, ${totalItems + manifest.archive.length} entries)`);
if (ffprobeOK === false) console.log("  note: ffprobe not found — video dimensions omitted (harmless)");
