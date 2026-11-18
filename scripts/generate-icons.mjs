/**
 * Generates the PWA raster icons with zero dependencies (Node zlib + manual PNG
 * chunk encoding). Run once: `node scripts/generate-icons.mjs`
 *
 * Design (64×64 unit space):
 *   • background — cream, rounded square (full-bleed cocoa for maskable)
 *   • monogram   — "L" built from two rounded bars
 *   • accent     — gold dot
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "public", "icons");

const COCOA = [59, 42, 32];
const CREAM = [251, 247, 239];
const GOLD = [201, 162, 39];

const CRC_TABLE = (() => {
  const table = new Int32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }

  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const roundedRect = (x, y, w, h, r) => (px, py) => {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
};

const circle = (cx, cy, r) => (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r;

function render(size, { maskable = false } = {}) {
  const SS = 3; // supersampling factor
  const unit = (size * SS) / 64;

  const background = maskable ? roundedRect(0, 0, 64, 64, 0) : roundedRect(0, 0, 64, 64, 14);
  const barVertical = roundedRect(22, 16, 7, 31, 3);
  const barHorizontal = roundedRect(22, 40, 21, 7, 3);
  const accent = circle(45, 20, 4);

  const backgroundInk = maskable ? COCOA : CREAM;
  const glyphInk = maskable ? CREAM : COCOA;

  const out = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let sa = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = (x * SS + sx + 0.5) / unit;
          const py = (y * SS + sy + 0.5) / unit;

          let color = null;

          if (background(px, py)) color = [...backgroundInk, 255];
          if (barVertical(px, py) || barHorizontal(px, py)) color = [...glyphInk, 255];
          if (accent(px, py)) color = [...GOLD, 255];

          if (color) {
            const alpha = color[3] / 255;
            sr += color[0] * alpha;
            sg += color[1] * alpha;
            sb += color[2] * alpha;
            sa += alpha;
          }
        }
      }

      const samples = SS * SS;
      const index = (y * size + x) * 4;

      if (sa > 0) {
        out[index] = Math.round(sr / sa);
        out[index + 1] = Math.round(sg / sa);
        out[index + 2] = Math.round(sb / sa);
        out[index + 3] = Math.round((sa / samples) * 255);
      }
    }
  }

  return encodePng(size, size, out);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];

for (const target of targets) {
  const png = render(target.size, { maskable: target.maskable });
  writeFileSync(resolve(OUT_DIR, target.file), png);
  console.log(`✓ public/icons/${target.file} (${target.size}×${target.size}, ${png.length} bytes)`);
}
