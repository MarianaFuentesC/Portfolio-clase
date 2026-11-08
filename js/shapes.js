/* =========================================================
   FORMAS DE PARTÍCULAS
   Cada forma es una lista de puntos (x, y, z) del mismo tamaño.
   Se construyen con primitivas de Three.js + dibujos en canvas,
   o a partir de un .glb exportado desde Blender.
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const V = THREE.Vector3;
const PI = Math.PI;

/* ---------- helpers ---------- */

function M({ p = [0, 0, 0], r = [0, 0, 0], s = 1, q = null } = {}) {
  const quat = q || new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2]));
  const scale = typeof s === 'number' ? new V(s, s, s) : new V(...s);
  return new THREE.Matrix4().compose(new V(...p), quat, scale);
}

// A transformed, non-indexed copy of a geometry + its sampling weight
function part(geo, opts = {}, w = 1, parent = null) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const m = M(opts);
  if (parent) m.premultiply(parent);
  g.applyMatrix4(m);
  return { geo: g, w };
}

// 4 thin bars forming a rectangle in the local XY plane
function rectOutline(parts, w, h, t, matrix, weight = 3) {
  const hb = new THREE.BoxGeometry(w + t, t, t);
  const vb = new THREE.BoxGeometry(t, h, t);
  parts.push(part(hb, { p: [0, h / 2, 0] }, weight, matrix));
  parts.push(part(hb, { p: [0, -h / 2, 0] }, weight, matrix));
  parts.push(part(vb, { p: [w / 2, 0, 0] }, weight, matrix));
  parts.push(part(vb, { p: [-w / 2, 0, 0] }, weight, matrix));
}

// Random points on the surface of the parts, weighted by area * w
function sampleParts(parts, n) {
  const tri = [];
  const cum = [];
  let total = 0;
  const a = new V(), b = new V(), c = new V(), ab = new V(), ac = new V();
  for (const { geo, w } of parts) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i);
      b.fromBufferAttribute(pos, i + 1);
      c.fromBufferAttribute(pos, i + 2);
      const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() * 0.5 * w;
      if (area <= 0) continue;
      total += area;
      cum.push(total);
      tri.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  }
  const out = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const r = Math.random() * total;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < r) lo = mid + 1; else hi = mid;
    }
    const t = lo * 9;
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    for (let d = 0; d < 3; d++) {
      out[k * 3 + d] = tri[t + d] + u * (tri[t + 3 + d] - tri[t + d]) + v * (tri[t + 6 + d] - tri[t + d]);
    }
  }
  return out;
}

// Points where a 2D canvas drawing has ink, placed on a W×H plane
function canvasSource({ cw = 400, ch = 400, W = 2, H = 2, depth = 0.02, matrix = null, draw }) {
  const cv = document.createElement('canvas');
  cv.width = cw;
  cv.height = ch;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.lineCap = ctx.lineJoin = 'round';
  draw(ctx, cw, ch);
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const px = [];
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) if (data[(y * cw + x) * 4 + 3] > 128) px.push(x, y);
  }
  const v = new V();
  return (n) => {
    const out = new Float32Array(n * 3);
    const count = px.length / 2;
    if (!count) return out;
    for (let k = 0; k < n; k++) {
      const i = ((Math.random() * count) | 0) * 2;
      v.set(
        ((px[i] + Math.random()) / cw - 0.5) * W,
        -((px[i + 1] + Math.random()) / ch - 0.5) * H,
        (Math.random() - 0.5) * depth
      );
      if (matrix) v.applyMatrix4(matrix);
      out[k * 3] = v.x; out[k * 3 + 1] = v.y; out[k * 3 + 2] = v.z;
    }
    return out;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Concatenate sources by fraction, shuffle, center and fit to `size`
function combine(n, sources, size) {
  const out = new Float32Array(n * 3);
  let offset = 0;
  sources.forEach(([frac, fn], i) => {
    const k = i === sources.length - 1 ? n - offset : Math.round(frac * n);
    out.set(fn(k), offset * 3);
    offset += k;
  });
  return normalize(shuffle(out), size);
}

function shuffle(arr) {
  const n = arr.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    for (let d = 0; d < 3; d++) {
      const t = arr[i * 3 + d];
      arr[i * 3 + d] = arr[j * 3 + d];
      arr[j * 3 + d] = t;
    }
  }
  return arr;
}

function normalize(arr, size) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    for (let d = 0; d < 3; d++) {
      min[d] = Math.min(min[d], arr[i + d]);
      max[d] = Math.max(max[d], arr[i + d]);
    }
  }
  const center = min.map((m, d) => (m + max[d]) / 2);
  const scale = size / Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  for (let i = 0; i < arr.length; i += 3) {
    for (let d = 0; d < 3; d++) arr[i + d] = (arr[i + d] - center[d]) * scale;
  }
  return arr;
}

/* ---------- 2D drawings used on screens / poster ---------- */

function drawWebsite(ctx, w, h) {
  ctx.lineWidth = 5;
  // nav
  ctx.beginPath(); ctx.arc(34, 30, 10, 0, PI * 2); ctx.fill();
  [330, 380, 430].forEach((x) => { roundRect(ctx, x, 26, 36, 8, 4); ctx.fill(); });
  roundRect(ctx, 470, 20, 34, 20, 10); ctx.stroke();
  // hero text
  roundRect(ctx, 30, 80, 230, 26, 6); ctx.fill();
  roundRect(ctx, 30, 116, 170, 26, 6); ctx.fill();
  roundRect(ctx, 30, 158, 200, 6, 3); ctx.fill();
  roundRect(ctx, 30, 172, 150, 6, 3); ctx.fill();
  roundRect(ctx, 30, 196, 90, 26, 13); ctx.stroke();
  // hero visual
  ctx.beginPath(); ctx.arc(390, 140, 62, 0, PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(390, 140, 34, 0, PI * 2); ctx.fill();
  // cards
  [30, 192, 354].forEach((x) => {
    roundRect(ctx, x, 245, 136, 58, 8); ctx.stroke();
    roundRect(ctx, x + 12, 284, 60, 6, 3); ctx.fill();
  });
}

function drawApp(ctx, w, h) {
  ctx.lineWidth = 4;
  roundRect(ctx, 80, 14, 60, 16, 8); ctx.fill(); // island
  [38, 86, 134, 182].forEach((x) => { ctx.beginPath(); ctx.arc(x, 64, 17, 0, PI * 2); ctx.stroke(); });
  roundRect(ctx, 16, 98, 188, 230, 12); ctx.stroke(); // post / reel
  ctx.beginPath(); ctx.moveTo(96, 190); ctx.lineTo(96, 238); ctx.lineTo(136, 214); ctx.closePath(); ctx.fill();
  [30, 62, 94].forEach((x) => { ctx.beginPath(); ctx.arc(x, 350, 9, 0, PI * 2); ctx.stroke(); });
  roundRect(ctx, 16, 374, 150, 6, 3); ctx.fill();
  roundRect(ctx, 16, 388, 110, 6, 3); ctx.fill();
  [30, 70, 110, 150, 190].forEach((x) => { ctx.beginPath(); ctx.arc(x, 428, 6, 0, PI * 2); ctx.fill(); });
}

function drawPoster(ctx, w, h) {
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.beginPath(); ctx.arc(w / 2, 165, 112, 0, PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  for (let y = 70; y < 280; y += 22) ctx.fillRect(0, y, w, 6 + (y - 70) / 30);
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = '700 92px "Inter Tight", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CREA', w / 2, 380);
  ctx.font = '500 18px "Inter Tight", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('2026', 30, 440);
  [440, 452].forEach((y, i) => { ctx.fillRect(190, y - 12, 120 - i * 40, 4); });
}

/* ---------- shapes ---------- */

const builders = {
  sphere(n) {
    const out = new Float32Array(n * 3);
    const golden = PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (2 * (i + 0.5)) / n;
      const r = Math.sqrt(1 - y * y);
      const phi = i * golden;
      out[i * 3] = Math.cos(phi) * r;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = Math.sin(phi) * r;
    }
    return normalize(shuffle(out), 2.6);
  },

  laptop(n) {
    const parts = [];
    parts.push(part(new RoundedBoxGeometry(2.6, 0.08, 1.75, 2, 0.03), {}, 0.5));
    const key = new THREE.BoxGeometry(0.15, 0.025, 0.14);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 13; c++) parts.push(part(key, { p: [-1.08 + c * 0.18, 0.05, -0.72 + r * 0.17] }, 2.2));
    }
    rectOutline(parts, 0.8, 0.46, 0.02, M({ p: [0, 0.045, 0.52], r: [-PI / 2, 0, 0] }), 3);
    const hinge = new THREE.Matrix4().makeTranslation(0, 0.04, -0.85).multiply(new THREE.Matrix4().makeRotationX(-0.22));
    parts.push(part(new RoundedBoxGeometry(2.6, 1.7, 0.05, 2, 0.03), { p: [0, 0.85, 0] }, 0.45, hinge));
    parts.push(part(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 16), { p: [0, 0.05, -0.86], r: [0, 0, PI / 2] }, 1));
    const screen = canvasSource({
      cw: 520, ch: 320, W: 2.36, H: 1.45, depth: 0.01,
      matrix: hinge.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.85, 0.04)),
      draw: drawWebsite,
    });
    return combine(n, [[0.55, (k) => sampleParts(parts, k)], [0.45, screen]], 3.0);
  },

  poster(n) {
    const parts = [];
    rectOutline(parts, 1.7, 2.4, 0.04, null, 1);
    // hanging string + nail
    const cord = new THREE.CylinderGeometry(0.008, 0.008, 1, 6);
    [[-0.6, 1.2], [0.6, 1.2]].forEach(([x, y]) => {
      const from = new V(x, y, 0), to = new V(0, 1.7, 0);
      const dir = to.clone().sub(from);
      const q = new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), dir.clone().normalize());
      parts.push(part(cord, { p: from.clone().add(to).multiplyScalar(0.5).toArray(), q, s: [1, dir.length(), 1] }, 4));
    });
    parts.push(part(new THREE.SphereGeometry(0.05, 12, 8), { p: [0, 1.7, 0] }, 3));
    const art = canvasSource({ cw: 340, ch: 480, W: 1.66, H: 2.36, depth: 0.03, draw: drawPoster });
    return combine(n, [[0.22, (k) => sampleParts(parts, k)], [0.78, art]], 3.0);
  },

  phone(n) {
    const parts = [];
    parts.push(part(new RoundedBoxGeometry(1.0, 2.05, 0.1, 4, 0.12), {}, 0.5));
    parts.push(part(new RoundedBoxGeometry(0.42, 0.42, 0.05, 2, 0.08), { p: [-0.22, 0.73, -0.07] }, 1.5));
    const lens = new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24);
    [[-0.32, 0.83], [-0.32, 0.63], [-0.12, 0.73]].forEach(([x, y]) =>
      parts.push(part(lens, { p: [x, y, -0.1], r: [PI / 2, 0, 0] }, 3)));
    parts.push(part(new THREE.BoxGeometry(0.03, 0.26, 0.04), { p: [0.515, 0.45, 0] }, 2));
    parts.push(part(new THREE.BoxGeometry(0.03, 0.16, 0.04), { p: [-0.515, 0.55, 0] }, 2));
    parts.push(part(new THREE.BoxGeometry(0.03, 0.16, 0.04), { p: [-0.515, 0.32, 0] }, 2));
    const screen = canvasSource({ cw: 220, ch: 450, W: 0.9, H: 1.84, depth: 0.005, matrix: M({ p: [0, 0, 0.06] }), draw: drawApp });
    return combine(n, [[0.42, (k) => sampleParts(parts, k)], [0.58, screen]], 2.7);
  },

  camera(n) {
    const parts = [];
    parts.push(part(new RoundedBoxGeometry(2.2, 1.35, 0.8, 3, 0.14), {}, 0.7));
    parts.push(part(new RoundedBoxGeometry(0.5, 1.25, 0.45, 3, 0.15), { p: [-0.78, -0.03, 0.4] }, 0.8));
    const prism = new THREE.CylinderGeometry(0.32, 0.55, 0.42, 4, 1).rotateY(PI / 4);
    parts.push(part(prism, { p: [0.05, 0.86, 0], s: [1.2, 1, 0.75] }, 1));
    parts.push(part(new THREE.BoxGeometry(0.4, 0.05, 0.32), { p: [0.05, 1.1, 0] }, 2));
    parts.push(part(new THREE.CylinderGeometry(0.58, 0.58, 0.3, 48, 1, true), { p: [0.15, -0.05, 0.55], r: [PI / 2, 0, 0] }, 1));
    parts.push(part(new THREE.CylinderGeometry(0.52, 0.52, 0.6, 48, 1, true), { p: [0.15, -0.05, 0.99], r: [PI / 2, 0, 0] }, 1));
    parts.push(part(new THREE.TorusGeometry(0.58, 0.03, 8, 64), { p: [0.15, -0.05, 0.72] }, 3));
    parts.push(part(new THREE.TorusGeometry(0.52, 0.035, 8, 64), { p: [0.15, -0.05, 1.29] }, 3));
    parts.push(part(new THREE.CircleGeometry(0.46, 48), { p: [0.15, -0.05, 1.22] }, 0.6));
    parts.push(part(new THREE.TorusGeometry(0.3, 0.015, 6, 48), { p: [0.15, -0.05, 1.24] }, 5));
    parts.push(part(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), { p: [-0.78, 0.71, 0.35] }, 2));
    parts.push(part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 32), { p: [0.75, 0.74, -0.05] }, 2));
    const lug = new THREE.TorusGeometry(0.08, 0.02, 6, 16);
    parts.push(part(lug, { p: [1.12, 0.45, 0], r: [0, PI / 2, 0] }, 3));
    parts.push(part(lug, { p: [-1.12, 0.45, 0], r: [0, PI / 2, 0] }, 3));
    rectOutline(parts, 1.3, 0.85, 0.02, M({ p: [0.25, -0.05, -0.41] }), 3);
    return combine(n, [[1, (k) => sampleParts(parts, k)]], 2.9);
  },

  light(n) {
    const parts = [];
    const hub = new V(0, -0.35, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * PI * 2 + 0.4;
      const foot = new V(Math.cos(a) * 0.85, -1.6, Math.sin(a) * 0.85);
      const dir = foot.clone().sub(hub);
      const q = new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), dir.clone().normalize());
      parts.push(part(new THREE.CylinderGeometry(0.025, 0.025, dir.length(), 8), { p: hub.clone().add(foot).multiplyScalar(0.5).toArray(), q }, 2.5));
    }
    parts.push(part(new THREE.CylinderGeometry(0.035, 0.035, 1.75, 12), { p: [0, 0.45, 0] }, 2.5));
    parts.push(part(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 16), { p: [0, -0.35, 0] }, 2));
    parts.push(part(new THREE.SphereGeometry(0.08, 16, 10), { p: [0, 1.32, 0] }, 2));
    const head = M({ p: [0, 1.35, 0.15], r: [0.18, 0, 0] });
    const box = new THREE.CylinderGeometry(0.95, 0.24, 0.85, 4, 1, true).rotateY(PI / 4).rotateX(PI / 2);
    parts.push(part(box, {}, 0.7, head));
    const side = 0.95 * Math.SQRT2;
    rectOutline(parts, side, side, 0.03, head.clone().multiply(M({ p: [0, 0, 0.425] })), 4);
    rectOutline(parts, side * 0.6, side * 0.6, 0.015, head.clone().multiply(M({ p: [0, 0, 0.43] })), 4);
    parts.push(part(new THREE.PlaneGeometry(side, side), { p: [0, 0, 0.42] }, 0.35, head));
    parts.push(part(new THREE.CircleGeometry(0.12, 24), { p: [0, 0, 0.44] }, 6, head));
    return combine(n, [[1, (k) => sampleParts(parts, k)]], 3.1);
  },

  hola(n) {
    const text = canvasSource({
      cw: 700, ch: 300, W: 4.2, H: 1.8, depth: 0.3,
      draw: (ctx, w, h) => {
        ctx.font = 'italic 250px "Instrument Serif", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('hola.', w / 2, h / 2 + 10);
      },
    });
    return combine(n, [[1, text]], 3.3);
  },
};

export function buildShape(name, n) {
  return (builders[name] || builders.sphere)(n);
}

// Particle portrait from a photo, dithered (Floyd–Steinberg) so the dots keep the contours.
// Points go where the photo is bright; an oval mask fades the edges.
// `crop` = [x, y, w, h] as fractions of the photo.
export async function samplePhoto(url, n, { crop = [0, 0, 1, 1], size = 2.9, depth = 0.45, gamma = 1.15 } = {}) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const [fx, fy, fw, fh] = crop;
  const sx = fx * img.naturalWidth, sy = fy * img.naturalHeight;
  const sw = fw * img.naturalWidth, sh = fh * img.naturalHeight;
  const aspect = sw / sh;

  // brightness (contrast-stretched) × oval mask, at a given resolution
  const weights = (cw, ch) => {
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    const data = ctx.getImageData(0, 0, cw, ch).data;
    const lum = new Float32Array(cw * ch);
    for (let i = 0; i < lum.length; i++) {
      lum[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
    }
    const sorted = Float32Array.from(lum).sort();
    const lo = sorted[(sorted.length * 0.05) | 0], hi = sorted[(sorted.length * 0.98) | 0];
    const w = new Float32Array(lum.length);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        lum[i] = Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(0.01, hi - lo)));
        const dx = (x / cw - 0.5) / 0.5, dy = (y / ch - 0.5) / 0.5;
        const m = 1 - Math.min(1, Math.max(0, (Math.sqrt(dx * dx + dy * dy) - 0.7) / 0.3));
        w[i] = Math.pow(lum[i], gamma) * m;
      }
    }
    return { lum, w };
  };

  // pick a grid so that roughly n pixels end up "on"
  const probe = weights(120, Math.round(120 / aspect)).w;
  const mean = probe.reduce((a, b) => a + b, 0) / probe.length || 0.1;
  const cells = n / mean;
  const cw = Math.max(40, Math.round(Math.sqrt(cells * aspect)));
  const ch = Math.max(40, Math.round(cw / aspect));
  const { lum, w } = weights(cw, ch);

  // Floyd–Steinberg error diffusion
  const on = [];
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = y * cw + x;
      const v = w[i];
      const bit = v >= 0.5 ? 1 : 0;
      if (bit) on.push(i);
      const e = v - bit;
      if (x + 1 < cw) w[i + 1] += e * 7 / 16;
      if (y + 1 < ch) {
        if (x > 0) w[i + cw - 1] += e * 3 / 16;
        w[i + cw] += e * 5 / 16;
        if (x + 1 < cw) w[i + cw + 1] += e * 1 / 16;
      }
    }
  }
  if (!on.length) on.push(((ch / 2) | 0) * cw + ((cw / 2) | 0));
  // shuffle so a subset (if there are too many) is spread evenly
  for (let k = on.length - 1; k > 0; k--) {
    const j = (Math.random() * (k + 1)) | 0;
    [on[k], on[j]] = [on[j], on[k]];
  }

  const out = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const i = on[k % on.length];
    const extra = k >= on.length; // leftover points stack on existing dots
    const j = extra ? 0.8 : 0.3;
    const x = i % cw, y = (i / cw) | 0;
    out[k * 3] = ((x + 0.5 + (Math.random() - 0.5) * j) / cw - 0.5) * aspect;
    out[k * 3 + 1] = -((y + 0.5 + (Math.random() - 0.5) * j) / ch - 0.5);
    // a little relief: brighter areas come forward
    out[k * 3 + 2] = (lum[i] - 0.5) * depth * 0.25 + (Math.random() - 0.5) * 0.02;
  }
  return normalize(shuffle(out), size);
}

// Points sampled from a Blender .glb (all meshes, with their transforms)
export async function sampleModel(url, n, size = 3) {
  const gltf = await new GLTFLoader().loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  const parts = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    parts.push({ geo: g, w: 1 });
  });
  if (!parts.length) throw new Error('El modelo no tiene mallas');
  return combine(n, [[1, (k) => sampleParts(parts, k)]], size);
}
