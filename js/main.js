// =========================================
// Portfolio — Mariana Fuentes
// All the content lives in data/info.json (or in localStorage if it was
// edited from gestion.html). getInfo() comes from js/storage.js.
// This file renders every section of the page. The animations and
// interactions (cursor, menu, marquee, side panel…) live in js/effects.js.
// =========================================

// ----- Helpers -----
// Two-digit index: 1 → "01"
const pad = (number) => String(number).padStart(2, "0");

// Small label above each section title: "01 — Sobre mí"
const sectionIndex = (number, label) =>
  `<p class="section-index" data-reveal><span>${pad(number)}</span>${label}</p>`;

// Splits a text into words wrapped in spans, so CSS can animate them one by one.
// Each word gets --i (its position) to stagger the animation.
function splitWords(text) {
  return text
    .split(" ")
    .map((word, i) => `<span class="word" style="--i:${i}"><span>${word}</span></span>`)
    .join(" ");
}

// Same idea, letter by letter. Screen readers get the full text from
// the visually-hidden copy; the animated letters are aria-hidden.
// Letters are grouped by word so a line never breaks in the middle of a word.
function splitChars(text) {
  let i = 0; // counts letters across all words, for the stagger
  const letters = text
    .split(" ")
    .map((word) => {
      const chars = [...word]
        .map((char) => `<span class="char" style="--i:${i++}">${char}</span>`)
        .join("");
      return `<span class="char-word">${chars}</span>`;
    })
    .join(" ");
  return `<span class="visually-hidden">${text}</span><span aria-hidden="true">${letters}</span>`;
}

// ----- Head (title + description for the browser tab and Google) -----
function renderMeta(meta) {
  document.title = meta.title;
  document.querySelector('meta[name="description"]').content = meta.description;
}

// ----- Header + overlay menu -----
function renderHeader(profile, nav, contact) {
  const logo = document.getElementById("logo");
  logo.textContent = profile.initials;
  logo.setAttribute("aria-label", `${profile.name}, volver al inicio`);

  document.getElementById("nav-list").innerHTML = nav
    .map(
      (item, i) => `
      <li style="--i:${i}">
        <a href="#${item.target}">
          <span class="nav-index">${pad(i + 1)}</span>
          <span class="nav-label">${item.label}</span>
        </a>
      </li>`
    )
    .join("");

  document.getElementById("nav-footer").innerHTML = `
    <a class="link-line" href="mailto:${profile.email}">${profile.email}</a>
    ${contact.social
      .map((link) => `<a class="link-line" href="${link.url}" target="_blank" rel="noopener">${link.label}</a>`)
      .join("")}
  `;
}

// ----- 1. Hero -----
// The rotating words come from the service titles, so they update by themselves
function renderHero(profile, hero, services) {
  const words = services.items.map((service) => service.title);
  const year = new Date().getFullYear();

  // In F4 the orb becomes a <model-viewer> when hero.model.src has a .glb
  document.getElementById("top").innerHTML = `
    <p class="hero-eyebrow"><span>Portfolio</span><span>©${year}</span></p>
    <h1 id="hero-title">
      <span class="hero-name">${splitChars(profile.name)}</span>
      <span class="hero-role">${profile.role}</span>
    </h1>
    <p class="hero-rotator" aria-label="${words.join(", ")}">
      <span class="hero-rotator-prefix" aria-hidden="true">Hago</span>
      <span class="hero-rotator-words" aria-hidden="true">
        ${words.map((word, i) => `<span class="${i === 0 ? "is-active" : ""}">${word}</span>`).join("")}
      </span>
    </p>
    <p class="hero-tagline">${profile.tagline}</p>
    <a class="btn btn-magnetic" href="#${hero.ctaTarget}" data-cursor="Ir"><span>${hero.ctaLabel}</span></a>
    <figure class="hero-3d">
      <div class="hero-orb" role="img" aria-label="${hero.model.alt}">
        <span class="hero-orb-core"></span>
        <svg class="hero-orb-ring" viewBox="0 0 200 200" aria-hidden="true">
          <defs><path id="orb-circle" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"/></defs>
          <text><textPath href="#orb-circle" textLength="510" lengthAdjust="spacing">${profile.name} ✦ ${profile.role} ✦ ${profile.name} ✦ ${profile.role} ✦</textPath></text>
        </svg>
      </div>
    </figure>
    <a class="hero-scroll" href="#about" aria-label="Bajar a la siguiente sección"><span>Scroll</span></a>
  `;
}

// ----- 2. About -----
// The first paragraph is the big statement that "lights up" while scrolling
function renderAbout(about) {
  const [statement = "", ...rest] = about.paragraphs;

  document.getElementById("about").innerHTML = `
    ${sectionIndex(1, about.title)}
    <h2 id="about-title" class="visually-hidden">${about.title}</h2>
    <p class="about-statement" data-scrub>${splitWords(statement)}</p>
    <figure class="about-photo" data-reveal>
      <img src="${about.photo}" alt="${about.photoAlt}" width="480" height="600" loading="lazy" data-parallax>
    </figure>
    <div class="about-text" data-reveal>
      ${rest.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    </div>
  `;
}

// ----- 3. Skills marquee -----
// The pills are small, so the list is repeated until one track is wider than
// any screen (otherwise the loop shows a gap). Screen readers get the
// plain list once; the animated copies are aria-hidden.
function renderSkills(skills) {
  const items = skills.items.map((skill) => `<li>${skill}</li>`).join("");
  const repeats = Math.max(1, Math.ceil(24 / skills.items.length)); // ~24 pills per track
  const track = items.repeat(repeats);

  document.getElementById("skills").innerHTML = `
    <h2 id="skills-title" class="visually-hidden">${skills.title}</h2>
    <ul class="visually-hidden">${items}</ul>
    <div class="marquee" data-speed="0.7" aria-hidden="true">
      <ul class="marquee-track">${track}</ul>
      <ul class="marquee-track">${track}</ul>
    </div>
  `;
}

// ----- 4. Services -----
function renderServices(services) {
  document.getElementById("services").innerHTML = `
    ${sectionIndex(2, services.title)}
    <h2 id="services-title" class="section-title">${splitWords(services.title)}</h2>
    <ol class="services-list">
      ${services.items
        .map(
          (service, i) => `
          <li data-reveal style="--d:${i}">
            <span class="services-index">${pad(i + 1)}</span>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
          </li>`
        )
        .join("")}
    </ol>
  `;
}

// ----- 5. Projects -----
// Row = clickable preview in the list. On desktop its cover follows the cursor.
function createRow(project, index) {
  const row = document.createElement("li");
  row.className = "project-row";
  row.dataset.reveal = "";

  row.innerHTML = `
    <a href="#${project.id}" data-case="${project.id}" data-cover="${project.cover}" data-cursor="Ver">
      <span class="project-index">${pad(index + 1)}</span>
      <h3>${project.title}</h3>
      <span class="project-meta">${project.category} · ${project.tools.join(", ")}</span>
      <span class="project-year">${project.year}</span>
      <img src="${project.cover}" alt="${project.coverAlt}" width="800" height="600" loading="lazy">
    </a>
  `;

  return row;
}

// Case = full case study, shown in the side panel when its row is clicked
function createCase(project) {
  const article = document.createElement("article");
  article.id = project.id;
  article.className = "case";
  article.setAttribute("aria-labelledby", `${project.id}-title`);

  article.innerHTML = `
    <img class="case-cover" src="${project.cover}" alt="${project.coverAlt}" width="800" height="600" loading="lazy">
    <p class="case-category">${project.category}</p>
    <h3 id="${project.id}-title">${project.title}</h3>
    <dl class="case-facts">
      <div><dt>Rol</dt><dd>${project.role}</dd></div>
      <div><dt>Herramientas</dt><dd>${project.tools.join(", ")}</dd></div>
      <div><dt>Año</dt><dd>${project.year}</dd></div>
    </dl>
    <h4>El reto</h4>
    <p>${project.challenge}</p>
    <h4>Lo que hice</h4>
    <p>${project.process}</p>
    <h4>Resultado</h4>
    <p>${project.result}</p>
    ${project.link ? `<a class="btn" href="${project.link}" target="_blank" rel="noopener"><span>Ver proyecto ↗</span></a>` : ""}
  `;

  return article;
}

function renderProjects(projects) {
  const section = document.getElementById("projects");
  section.innerHTML = `
    ${sectionIndex(3, projects.title)}
    <h2 id="projects-title" class="section-title">${splitWords(projects.title)}</h2>
    <ul class="project-list"></ul>
    <div class="project-preview" aria-hidden="true"><img alt=""></div>
  `;

  const projectList = section.querySelector(".project-list");
  const panelBody = document.querySelector(".case-panel-body");
  panelBody.innerHTML = "";

  // Only projects marked as "featured": true appear on the home
  const featuredProjects = projects.items.filter((project) => project.featured);

  featuredProjects.forEach((project, i) => {
    projectList.appendChild(createRow(project, i));
    panelBody.appendChild(createCase(project));
  });
}

// ----- 6. Process -----
// On desktop the section pins to the screen and the steps slide sideways
// while you scroll down (js/effects.js). On mobile it's a vertical timeline.
function renderProcess(process) {
  const total = pad(process.steps.length);

  document.getElementById("process").innerHTML = `
    <div class="process-pin" data-process>
      <div class="process-sticky">
        <div class="process-head">
          ${sectionIndex(4, process.title)}
          <h2 id="process-title" class="section-title">${splitWords(process.title)}</h2>
        </div>
        <ol class="process-steps">
          ${process.steps
            .map(
              (step, i) => `
              <li class="process-step">
                <span class="process-num" aria-hidden="true">${pad(i + 1)}</span>
                <div class="process-body">
                  <h3>${step.title}</h3>
                  <p>${step.description}</p>
                </div>
              </li>`
            )
            .join("")}
        </ol>
        <div class="process-hud" aria-hidden="true">
          <span class="process-count"><b>01</b> / ${total}</span>
          <span class="process-bar"><span></span></span>
          <span class="process-hint">Sigue bajando</span>
        </div>
      </div>
    </div>
  `;
}

// ----- 7. Lab -----
// An item can be an image or a looping video (e.g. a Blender render).
// The image doubles as the video's poster while it loads. The video has
// no `autoplay`: js/effects.js plays it only while it is on screen.
function labMedia(item) {
  if (item.video) {
    return `<video src="${item.video}" poster="${item.image}" muted loop playsinline preload="metadata"
      width="600" height="600" aria-label="${item.alt}" data-autoplay></video>
      <span class="lab-badge">Animación</span>`;
  }
  return `<img src="${item.image}" alt="${item.alt}" width="600" height="600" loading="lazy">`;
}

function renderLab(lab) {
  document.getElementById("lab").innerHTML = `
    ${sectionIndex(5, lab.title)}
    <h2 id="lab-title" class="section-title">${splitWords(lab.title)}</h2>
    <p class="lab-intro" data-reveal>${lab.intro}</p>
    <ul class="lab-grid">
      ${lab.items
        .map(
          (item, i) => `
          <li data-reveal style="--d:${i}">
            <figure class="lab-item" data-tilt>
              ${labMedia(item)}
              <figcaption>${item.caption}</figcaption>
            </figure>
          </li>`
        )
        .join("")}
    </ul>
  `;
}

// ----- 8. FAQ (<details>/<summary> = native accordion, animated in effects.js) -----
function renderFaq(faq) {
  document.getElementById("faq").innerHTML = `
    ${sectionIndex(6, faq.title)}
    <h2 id="faq-title" class="section-title">${splitWords(faq.title)}</h2>
    ${faq.items
      .map(
        (item) => `
        <details data-reveal>
          <summary>${item.question}</summary>
          <div class="faq-answer"><p>${item.answer}</p></div>
        </details>`
      )
      .join("")}
  `;
}

// ----- 9. Contact -----
function renderContact(profile, contact) {
  const loop = `<span>${contact.title}</span><span aria-hidden="true">✦</span>`.repeat(3);

  document.getElementById("contact").innerHTML = `
    ${sectionIndex(7, "Contacto")}
    <h2 id="contact-title" class="visually-hidden">${contact.title}</h2>
    <div class="marquee contact-marquee" data-speed="-0.6" aria-hidden="true">
      <div class="marquee-track">${loop}</div>
      <div class="marquee-track">${loop}</div>
    </div>
    <p class="contact-text" data-reveal>${contact.text}</p>
    <div class="contact-actions" data-reveal>
      <a class="btn btn-large btn-magnetic" href="mailto:${profile.email}" data-cursor="Hola"><span>${contact.ctaLabel}</span></a>
      <button class="btn btn-ghost copy-email" type="button" data-email="${profile.email}">
        <span>Copiar email</span>
      </button>
    </div>
    <ul class="social-links" data-reveal>
      ${contact.social
        .map((link) => `<li><a class="link-line" href="${link.url}" target="_blank" rel="noopener">${link.label} ↗</a></li>`)
        .join("")}
    </ul>
  `;
}

// ----- Footer -----
function renderFooter(profile, footer) {
  const year = new Date().getFullYear(); // updates by itself every year
  document.getElementById("site-footer").innerHTML = `
    <p class="footer-name" aria-hidden="true">${profile.name}</p>
    <div class="footer-bottom">
      <p>© ${year} ${profile.name}</p>
      <p>${profile.role}</p>
      <a class="link-line" href="#top">${footer.backToTop}</a>
    </div>
  `;
}

// ----- Render everything -----
function renderPage(info) {
  renderMeta(info.meta);
  renderHeader(info.profile, info.nav, info.contact);
  renderHero(info.profile, info.hero, info.services);
  renderAbout(info.about);
  renderSkills(info.skills);
  renderServices(info.services);
  renderProjects(info.projects);
  renderProcess(info.process);
  renderLab(info.lab);
  renderFaq(info.faq);
  renderContact(info.profile, info.contact);
  renderFooter(info.profile, info.footer);
}

function showPageError() {
  document.getElementById("main").innerHTML = `
    <p class="page-status">
      No se pudo cargar el contenido. Abre el sitio con un servidor local (Live Server), no con doble clic.
    </p>
  `;
}

// getInfo() is asynchronous (it may use fetch), so we wait for it with await
async function loadInfo() {
  try {
    const info = await getInfo();
    renderPage(info);

    // Tell effects.js the DOM is ready. The flag covers the case where
    // this runs before effects.js has loaded and started listening.
    document.body.dataset.rendered = "true";
    document.dispatchEvent(new Event("page:rendered"));
  } catch (error) {
    console.error("Error loading info.json:", error);
    showPageError();
  }
}

loadInfo();
