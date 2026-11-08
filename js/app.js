import * as THREE from 'three';
import { profile, chapters } from './data.js';
import { buildShape, sampleModel, samplePhoto } from './shapes.js';

const isMobile = () => innerWidth <= 768;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

/* =========================================================
   1. PAGE CONTENT (from data.js)
   ========================================================= */

const splitChars = (text, start = 0) =>
  [...text].map((c, i) => `<span class="ch" style="--i:${start + i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');

function workMedia(w) {
  if (w.video) return `<video src="${esc(w.video)}" muted loop playsinline preload="metadata" ${w.image ? `poster="${esc(w.image)}"` : ''}></video>`;
  if (w.image) return `<img src="${esc(w.image)}" alt="${esc(w.alt || w.title)}" loading="lazy">`;
  return `<div class="work-ph"><span>${esc(w.title)}</span><small>Imagen pendiente · ${esc(w.ratio)}</small></div>`;
}

function workCard(w) {
  const tag = w.link ? 'a' : 'div';
  const href = w.link ? ` href="${esc(w.link)}" target="_blank" rel="noopener"` : '';
  return `
    <article class="work${w.full ? ' is-full' : ''}" style="--ratio:${esc(w.ratio || '4/3')};--tone:${esc(w.tone || '#444')}">
      <${tag} class="work-link"${href}>
        <div class="work-media">${workMedia(w)}</div>
        <div class="work-meta"><h3>${esc(w.title)}</h3><span>${esc(w.type)} · ${esc(w.year)}</span></div>
      </${tag}>
    </article>`;
}

function renderPage() {
  const total = chapters.length;
  const contactList = `
    <li><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></li>
    <li><a href="tel:+57${esc(profile.phone.replace(/ /g, ''))}">Cel. ${esc(profile.phone)}</a></li>
    ${profile.socials.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('')}`;

  const hero = `
    <section class="hero" id="top" aria-labelledby="hero-title">
      <p class="hero-kicker">${esc(profile.location)}</p>
      <h1 class="hero-name" id="hero-title">
        <span class="line">${splitChars(profile.firstName)}</span>
        <span class="line serif">${splitChars(profile.lastName, profile.firstName.length)}</span>
      </h1>
      <div class="hero-bottom">
        <div class="hero-role">
          <p class="label">${esc(profile.role)}</p>
          <p class="disciplines">${profile.disciplines.map(esc).join('<i>·</i>')}</p>
        </div>
        <p class="hero-bio">${esc(profile.bio)}</p>
        <ul class="hero-contact">${contactList}</ul>
      </div>
      <a class="scroll-cue" href="#${chapters[0].id}"><span></span>Baja y transforma el objeto</a>
    </section>`;

  const chapterHtml = chapters.map((c, i) => `
    <section class="chapter" id="${esc(c.id)}" data-side="${i % 2 ? 'left' : 'right'}" aria-labelledby="${esc(c.id)}-title">
      <header class="chapter-head">
        <p class="chapter-num"><span>${pad(i + 1)}</span> / ${pad(total)}</p>
        <p class="chapter-obj">Objeto — ${esc(c.object)}</p>
        <h2 id="${esc(c.id)}-title">${esc(c.title)}</h2>
        <p class="chapter-line">${esc(c.line)}</p>
      </header>
      <div class="chapter-works">${c.works.map(workCard).join('')}</div>
    </section>`).join('');

  const contact = `
    <section class="contact" id="contact" aria-labelledby="contact-title">
      <div class="contact-grid">
        <div class="contact-me">
          ${profile.photo ? `<img src="${esc(profile.photo)}" alt="Retrato de ${esc(profile.firstName)}" loading="lazy">` : ''}
          <p>${esc(profile.bio)}</p>
        </div>
        <div class="contact-main">
          <p class="label" id="contact-title">¿Hacemos algo juntos?</p>
          <a class="contact-email" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
          <ul class="contact-socials">
            <li><a href="tel:+57${esc(profile.phone.replace(/ /g, ''))}">Cel. ${esc(profile.phone)}</a></li>
            ${profile.socials.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('')}
          </ul>
        </div>
      </div>
      <footer class="site-footer">
        <span>© ${new Date().getFullYear()} ${esc(profile.firstName)} ${esc(profile.lastName)}</span>
        <span>Hecho en Blender + Three.js + Claude</span>
        <a href="#top">Volver arriba ↑</a>
      </footer>
    </section>`;

  document.getElementById('main').innerHTML = hero + chapterHtml + contact;
  document.getElementById('logo').textContent = profile.initials;
}

renderPage();

/* =========================================================
   2. UI: reveals, parallax, cursor, theme, HUD
   ========================================================= */

const sections = [...document.querySelectorAll('.hero, .chapter, .contact')];
const hudLabels = ['Materia prima', ...chapters.map((c) => `${c.object} — ${c.title}`), 'Hola'];
const hudIndex = document.getElementById('hud-index');
const hudLabel = document.getElementById('hud-label');
const hudBar = document.getElementById('hud-bar');
let hudCurrent = -1;

function updateHud(s) {
  const i = clamp(Math.round(s), 0, sections.length - 1);
  if (i !== hudCurrent) {
    hudCurrent = i;
    hudIndex.textContent = `${pad(i)}/${pad(sections.length - 1)}`;
    hudLabel.textContent = hudLabels[i];
  }
  document.body.classList.toggle('past-hero', s > 0.6 && s < sections.length - 1.4);
  const max = document.documentElement.scrollHeight - innerHeight;
  hudBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}

// Cards appear as they enter the viewport; videos only play while visible
const works = [...document.querySelectorAll('.work')];
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const video = e.target.querySelector('video');
    if (e.isIntersecting) {
      e.target.classList.add('in');
      video?.play().catch(() => {});
    } else {
      video?.pause();
    }
  });
}, { threshold: 0.12 });
works.forEach((w) => io.observe(w));

// Hover light follows the cursor inside each card
works.forEach((w) => {
  const media = w.querySelector(".work-media");
  w.addEventListener("pointermove", (e) => {
    const r = media.getBoundingClientRect();
    media.style.setProperty("--mx", `${e.clientX - r.left}px`);
    media.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

const parallaxEls = works.map((w) => w.querySelector('.work-media > *'));
function updateParallax() {
  if (reduced) return;
  const vh = innerHeight;
  parallaxEls.forEach((el) => {
    const r = el.closest(".work").getBoundingClientRect(); // untransformed box, avoids feedback with the tilt
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
    if (!el.closest(".is-full")) el.style.transform = `translate3d(0, ${p * -6}%, 0)`;
    // the whole card tilts in 3D and settles flat when it reaches the middle of the screen
    el.closest(".work-link").style.transform = `perspective(1100px) rotateX(${p * 10}deg) scale(${1 - Math.abs(p) * 0.1})`;
  });
}

// Focus-reticle cursor
const cursor = document.querySelector('.cursor');
const mouse = { x: 0, y: 0, nx: 0, ny: 0, cx: innerWidth / 2, cy: innerHeight / 2 };
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.nx = (e.clientX / innerWidth) * 2 - 1;
  mouse.ny = (e.clientY / innerHeight) * 2 - 1;
  if (finePointer) cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
});
if (finePointer) {
  document.body.classList.add('has-cursor');
  document.addEventListener('pointerover', (e) => {
    const hoverCard = e.target.closest('.work');
    const hoverLink = e.target.closest('a, button');
    cursor.classList.toggle('is-card', !!hoverCard);
    cursor.classList.toggle('is-link', !hoverCard && !!hoverLink);
  });
}

// Theme ("la luz del estudio")
const root = document.documentElement;
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : darkQuery.matches;
document.querySelector('.theme-toggle').addEventListener('click', () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  applyThemeColors();
});
darkQuery.addEventListener('change', () => applyThemeColors());

/* =========================================================
   3. THREE.JS PARTICLE SCENE
   ========================================================= */

const shapeNames = ['portrait', ...chapters.map((c) => c.shape), 'hola'];
const models = [null, ...chapters.map((c) => c.model), null];
const N = shapeNames.length;
const COUNT = isMobile() ? 11000 : 22000;

let renderer, scene, camera, group, geometry, material;
let shapes = [];
let ready = false;

const uniforms = {
  uMix: { value: 0 },
  uTime: { value: 0 },
  uSize: { value: 0.015 },
  uViewH: { value: innerHeight },
  uNoise: { value: reduced ? 0 : 0.7 },
  uWobble: { value: reduced ? 0 : 0.012 },
  uSharp: { value: 1 }, // 1 = crisp portrait at the top of the page
  // cherry palette, read from --p0..--p3 in the CSS (changes with the theme)
  uC0: { value: new THREE.Color('#5c0a1c') },
  uC1: { value: new THREE.Color('#9b1030') },
  uC2: { value: new THREE.Color('#d2204a') },
  uC3: { value: new THREE.Color('#ff7a98') },
  uAlpha: { value: 1 },
};

const vertexShader = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aRand;
  attribute vec3 aDir;
  attribute float aTone;
  uniform float uMix, uTime, uSize, uViewH, uNoise, uWobble, uSharp;
  uniform vec3 uC0, uC1, uC2, uC3;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    // each particle starts its trip at a slightly different moment
    float m = clamp(uMix * 1.35 - aRand * 0.35, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 p = mix(aFrom, aTo, m);
    p += aDir * sin(m * 3.14159) * uNoise;                 // burst mid-transition
    p += aDir * uWobble * (1.0 - uSharp) * sin(uTime * 1.5 + aRand * 40.0); // idle breathing (still while the portrait is on)
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * mix((0.55 + aRand * 0.9) * (1.0 + step(2.5, aTone) * 0.5), 0.85, uSharp);
    gl_PointSize = size * projectionMatrix[1][1] * uViewH * 0.5 / -mv.z;
    vFade = clamp(1.0 - (-mv.z - 6.0) / 4.0, 0.3, 1.0);
    vColor = aTone < 0.5 ? uC0 : aTone < 1.5 ? uC1 : aTone < 2.5 ? uC2 : uC3;
    vColor = mix(vColor, aTone > 2.5 ? uC3 : uC2, uSharp * 0.75); // brighter, even portrait
    vFade = mix(vFade, 1.0, uSharp);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(vColor, a * uAlpha * vFade);
  }
`;

function applyThemeColors() {
  const css = getComputedStyle(root);
  ['uC0', 'uC1', 'uC2', 'uC3'].forEach((u, i) => {
    const c = css.getPropertyValue(`--p${i}`).trim();
    if (c) uniforms[u].value.set(c);
  });
}

function initScene() {
  const canvas = document.getElementById('scene');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 50);
  camera.position.z = 7;
  group = new THREE.Group();
  scene.add(group);

  geometry = new THREE.BufferGeometry();
  const rand = new Float32Array(COUNT);
  const dir = new Float32Array(COUNT * 3);
  const tone = new Float32Array(COUNT);
  const v = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    rand[i] = Math.random();
    v.randomDirection().multiplyScalar(0.3 + Math.random() * 0.7);
    dir.set([v.x, v.y, v.z], i * 3);
    const r = Math.random(); // 40% deep, 30% cherry, 20% bright, 10% highlight
    tone[i] = r < 0.4 ? 0 : r < 0.7 ? 1 : r < 0.9 ? 2 : 3;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geometry.setAttribute('aFrom', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geometry.setAttribute('aTo', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geometry.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geometry.setAttribute('aTone', new THREE.BufferAttribute(tone, 1));

  material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);

  applyThemeColors();
  onResize();
}

let pairA = -1;
function setPair(a) {
  if (a === pairA) return;
  pairA = a;
  geometry.attributes.aFrom.array.set(shapes[a]);
  geometry.attributes.aTo.array.set(shapes[Math.min(a + 1, N - 1)]);
  geometry.attributes.aFrom.needsUpdate = true;
  geometry.attributes.aTo.needsUpdate = true;
}

// Where the object sits for each section (in world units)
function layoutFor(i) {
  const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const visW = visH * camera.aspect;
  const mobile = isMobile();
  const base = mobile ? Math.min(1, visW / 3.4) : Math.min(1, visH / 4.6);
  if (i === 0) return mobile ? { x: 0, y: visH * 0.14, s: base } : { x: visW * 0.2, y: 0, s: base };
  if (i === N - 1) return { x: 0, y: visH * (mobile ? 0.24 : 0.2), s: base * (mobile ? 0.82 : 0.9) };
  if (mobile) return { x: 0, y: 0.05 * visH, s: base };
  const side = sections[i].dataset.side === 'left' ? 1 : -1; // cards on the left → object on the right
  return { x: visW * 0.22 * side, y: -visH * 0.02, s: base * 0.88 };
}

function onResize() {
  if (!renderer) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  uniforms.uViewH.value = renderer.domElement.height;
}
addEventListener('resize', onResize);

// Scroll → a float from 0 (hero) to N-1 (contact). Morph happens as each section enters.
function scrollTarget() {
  const vh = innerHeight;
  let t = 0;
  for (let i = 1; i < sections.length; i++) {
    const top = sections[i].getBoundingClientRect().top;
    t += clamp((vh * 0.9 - top) / (vh * 0.7), 0, 1);
  }
  return t;
}

// While you stay in a chapter: 0 = the object just formed, 1 = about to turn into the next one.
// It runs from "this section finished its morph" to "the next section starts its morph".
function dwellTargets() {
  const vh = innerHeight;
  return sections.map((sec, k) => {
    if (k === 0 || k === N - 1) return 0; // hero and contact stay still
    const r = sec.getBoundingClientRect();
    return clamp((vh * 0.2 - r.top) / Math.max(1, r.height - vh * 0.7), 0, 1);
  });
}

const easeInOut = (f) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Pose of the object in section k at dwell progress q:
// it grows slowly, then near the end flies to the center and zooms in big.
function poseFor(k, q) {
  const L = layoutFor(k);
  if (k === 0 || k === N - 1) return { ...L, zoom: 0, swing: 0 };
  const grow = 0.8 + 0.45 * easeInOut(q);
  const zoom = reduced ? 0 : smooth(0.7, 1, q);
  return {
    x: L.x * (1 - zoom),
    y: L.y * (1 - zoom),
    s: L.s * grow * (1 + 0.75 * zoom * zoom),
    zoom,
    swing: (q - 0.5) * 1.3, // the scroll turns the object from one side to the other
  };
}

const heads = sections.map((sec) => sec.querySelector('.chapter-head'));
let s = 0;
let qs = sections.map(() => 0);
let rotX = 0, rotY = 0;
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const target = scrollTarget();
  updateHud(target);
  updateParallax();
  if (!ready) return;

  const t = clock.getElapsedTime();
  const k = reduced ? 0.25 : 0.085;
  s += (target - s) * k;
  if (Math.abs(target - s) < 0.0005) s = target;
  const qt = dwellTargets();
  qs = qs.map((q, i) => q + (qt[i] - q) * k);

  const a = clamp(Math.floor(s), 0, N - 2);
  const f = clamp(s - a, 0, 1);
  setPair(a);
  uniforms.uMix.value = f;
  uniforms.uSharp.value = 1 - clamp(s * 2.5, 0, 1); // crisp only while the portrait is on screen
  uniforms.uTime.value = t;

  // blend from "end of section a" (zoomed in) to "start of section a+1" (small, at its side)
  const e = easeInOut(f);
  const P0 = poseFor(a, qs[a]), P1 = poseFor(a + 1, qs[a + 1]);
  const lerp = (x, y) => x + (y - x) * e;
  group.position.set(lerp(P0.x, P1.x), lerp(P0.y, P1.y), 0);
  group.scale.setScalar(lerp(P0.s, P1.s));
  const zoom = lerp(P0.zoom, P1.zoom);
  uniforms.uAlpha.value = 1 - 0.25 * zoom;

  // chapter titles step back while their object zooms in
  heads.forEach((h, i) => {
    if (!h) return;
    const z = poseFor(i, qs[i]).zoom;
    h.style.opacity = String(1 - z);
    h.style.transform = z ? `translate3d(0, ${-z * 60}px, 0) scale(${1 - z * 0.08})` : '';
  });

  const spin = reduced ? 0 : (a + e) * Math.PI * 2 + lerp(P0.swing, P1.swing);
  const loose = 1 - uniforms.uSharp.value; // the portrait stays still and faces the camera
  const ty = spin + (Math.sin(t * 0.4) * 0.25 + mouse.nx * 0.35) * loose;
  const tx = (Math.sin(t * 0.3) * 0.06 + mouse.ny * 0.18) * loose + zoom * 0.25;
  rotY += (ty - rotY) * 0.08;
  rotX += (tx - rotX) * 0.08;
  group.rotation.set(rotX, rotY, 0);

  renderer.render(scene, camera);
}

/* =========================================================
   4. BOOT
   ========================================================= */

const loaderTime = document.getElementById('loader-time');
const t0 = performance.now();
let booting = true;
(function tick() {
  if (!booting) return;
  const ms = performance.now() - t0;
  const fr = Math.floor((ms / 1000) * 24) % 24;
  const sec = Math.floor(ms / 1000);
  loaderTime.textContent = `00:00:${pad(sec)}:${pad(fr)}`;
  requestAnimationFrame(tick);
})();

const timeout = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot() {
  try {
    initScene();
    // canvas drawings need the fonts loaded
    await Promise.race([
      Promise.all([
        document.fonts.load('italic 250px "Instrument Serif"'),
        document.fonts.load('700 92px "Inter Tight"'),
      ]),
      timeout(2500),
    ]);
    shapes = await Promise.all(shapeNames.map(async (name, i) => {
      if (models[i]) {
        try { return await sampleModel(models[i], COUNT); }
        catch (err) { console.warn(`No se pudo cargar ${models[i]}, uso la forma por defecto.`, err); }
      }
      if (name === 'portrait') {
        try { return await samplePhoto(profile.photo, COUNT, { crop: profile.photoCrop }); }
        catch (err) { console.warn('No se pudo cargar la foto, uso la esfera.', err); }
      }
      return buildShape(name, COUNT);
    }));
    s = scrollTarget();
    ready = true;
  } catch (err) {
    console.error('WebGL no disponible:', err);
    document.body.classList.add('no-webgl');
  }
  const elapsed = performance.now() - t0;
  await timeout(Math.max(0, 1100 - elapsed));
  booting = false;
  document.body.classList.add('is-ready');
}

frame();
boot();
