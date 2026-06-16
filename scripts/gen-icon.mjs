// Generates /public/apple-touch-icon.png (180×180)
// Uses only Node.js built-ins (zlib + fs).
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../public/apple-touch-icon.png');
mkdirSync(join(__dir, '../public'), { recursive: true });

const W = 180, H = 180;
// RGBA buffer
const pixels = new Uint8Array(W * H * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
}

// Anti-aliased circle fill helper
function fillCircle(cx, cy, radius, r, g, b) {
  const r2 = radius * radius;
  for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(H-1, Math.ceil(cy + radius)); y++) {
    for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(W-1, Math.ceil(cx + radius)); x++) {
      const dx = x - cx, dy = y - cy;
      const d2 = dx*dx + dy*dy;
      if (d2 <= r2) setPixel(x, y, r, g, b);
    }
  }
}

function strokeCircle(cx, cy, radius, thickness, r, g, b) {
  const inner = (radius - thickness) * (radius - thickness);
  const outer = radius * radius;
  for (let y = Math.max(0, Math.floor(cy - radius - 1)); y <= Math.min(H-1, Math.ceil(cy + radius + 1)); y++) {
    for (let x = Math.max(0, Math.floor(cx - radius - 1)); x <= Math.min(W-1, Math.ceil(cx + radius + 1)); x++) {
      const dx = x - cx, dy = y - cy;
      const d2 = dx*dx + dy*dy;
      if (d2 >= inner && d2 <= outer) setPixel(x, y, r, g, b);
    }
  }
}

// White background
pixels.fill(255); // all white (a=255 for white bg)
// Actually set proper alpha channel
for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;

// Gold outer circle
fillCircle(90, 90, 88, 212, 160, 23);  // #D4A017

// Green inner circle (field)
fillCircle(90, 90, 78, 39, 174, 96);   // #27AE60

// Darker green center gradient effect
fillCircle(90, 90, 55, 26, 107, 47);   // #1A6B2F

// Re-draw smooth green ring from 55 to 78
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - 90, dy = y - 90;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d >= 55 && d <= 78) {
      // gradient: dark green center → bright green edge
      const t = (d - 55) / (78 - 55);
      const gr = Math.round(26 + t * (39 - 26));
      const gg = Math.round(107 + t * (174 - 107));
      const gb = Math.round(47 + t * (96 - 47));
      setPixel(x, y, gr, gg, gb);
    }
  }
}

// 3 gold stars at the top
function drawStar(cx, cy, outerR, innerR, points, r, g, b) {
  // Fill using point-in-polygon test
  const step = Math.PI / points;
  const verts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = i * step - Math.PI / 2;
    const rad = i % 2 === 0 ? outerR : innerR;
    verts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
  }
  const minX = Math.floor(Math.min(...verts.map(v => v[0])));
  const maxX = Math.ceil(Math.max(...verts.map(v => v[0])));
  const minY = Math.floor(Math.min(...verts.map(v => v[1])));
  const maxY = Math.ceil(Math.max(...verts.map(v => v[1])));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let inside = false;
      for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const [xi, yi] = verts[i], [xj, yj] = verts[j];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
      }
      if (inside) setPixel(x, y, r, g, b);
    }
  }
}

drawStar(66, 47, 8, 3.5, 5, 212, 160, 23);
drawStar(90, 41, 8, 3.5, 5, 212, 160, 23);
drawStar(114, 47, 8, 3.5, 5, 212, 160, 23);

// Football (white circle)
fillCircle(90, 100, 36, 255, 255, 255);

// Pentagon center
function drawPolygon(points, r, g, b) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const minX = Math.floor(Math.min(...xs)), maxX = Math.ceil(Math.max(...xs));
  const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
      }
      if (inside) setPixel(x, y, r, g, b);
    }
  }
}

// Football pentagon pattern
const cx = 90, cy = 100;
const pR = 13; // pentagon radius
const pVerts = Array.from({length: 5}, (_, i) => {
  const a = (i * 72 - 90) * Math.PI / 180;
  return [cx + Math.cos(a) * pR, cy + Math.sin(a) * pR];
});
drawPolygon(pVerts, 22, 39, 28);  // #162720

// Seam lines (dark lines from pentagon to edge)
function drawLine(x0, y0, x1, y1, r, g, b, thickness = 2) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx*dx + dy*dy);
  const steps = Math.ceil(len * 2);
  for (let t = 0; t <= steps; t++) {
    const x = x0 + dx * t / steps;
    const y = y0 + dy * t / steps;
    for (let oy = -thickness; oy <= thickness; oy++) {
      for (let ox = -thickness; ox <= thickness; ox++) {
        if (ox*ox + oy*oy <= thickness*thickness)
          setPixel(Math.round(x+ox), Math.round(y+oy), r, g, b);
      }
    }
  }
}

// From pentagon top vertex upward
drawLine(pVerts[0][0], pVerts[0][1], cx, cy - 36, 22, 39, 28, 1.5);
// Right upper
drawLine(pVerts[1][0], pVerts[1][1], cx + 36*Math.cos(18*Math.PI/180), cy - 36*Math.sin(18*Math.PI/180), 22, 39, 28, 1.5);
// Right lower
drawLine(pVerts[2][0], pVerts[2][1], cx + 36*Math.cos(54*Math.PI/180), cy + 36*Math.sin(54*Math.PI/180), 22, 39, 28, 1.5);
// Left lower
drawLine(pVerts[3][0], pVerts[3][1], cx - 36*Math.cos(54*Math.PI/180), cy + 36*Math.sin(54*Math.PI/180), 22, 39, 28, 1.5);
// Left upper
drawLine(pVerts[4][0], pVerts[4][1], cx - 36*Math.cos(18*Math.PI/180), cy - 36*Math.sin(18*Math.PI/180), 22, 39, 28, 1.5);

// ---- PNG encoding ----
function crc32(buf) {
  let c = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i;
    for (let j = 0; j < 8; j++) v = (v & 1) ? 0xEDB88320 ^ (v >>> 1) : v >>> 1;
    table[i] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const sig = Buffer.from([137,80,78,71,13,10,26,10]);

const ihdr = Buffer.allocUnsafe(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // RGB (no alpha — solid icon)
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// Build raw scanlines (RGB)
const scanlines = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.allocUnsafe(1 + W * 3);
  row[0] = 0; // filter = None
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const alpha = pixels[i+3] / 255;
    // Composite over white
    row[1 + x*3]   = Math.round(pixels[i]   * alpha + 255 * (1-alpha));
    row[1 + x*3+1] = Math.round(pixels[i+1] * alpha + 255 * (1-alpha));
    row[1 + x*3+2] = Math.round(pixels[i+2] * alpha + 255 * (1-alpha));
  }
  scanlines.push(row);
}

const raw = Buffer.concat(scanlines);
const compressed = deflateSync(raw, { level: 9 });

const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
writeFileSync(OUT, png);
console.log(`Written ${OUT} (${png.length} bytes)`);
