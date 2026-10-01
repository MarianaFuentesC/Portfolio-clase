// =========================================
// Portfolio — Mariana Fuentes
// All the content lives in data/info.json (or in localStorage if it was
// edited from gestion.html). getInfo() comes from js/storage.js.
// This file renders every section of the page.
// F3 will add: overlay menu, project side panel,
// marquee loop, preloader and reduced-motion checks.
// =========================================

// ----- Head (title + description for the browser tab and Google) -----
function renderMeta(meta) {
  document.title = meta.title;
  document.querySelector('meta[name="description"]').content = meta.description;
}

// ----- Header -----
function renderHeader(profile, nav) {
  const logo = document.getElementById("logo");
  logo.textContent = profile.initials;
  logo.setAttribute("aria-label", `${profile.name}, volver al inicio`);

  document.getElementById("nav-list").innerHTML = nav
    .map((item) => `<li><a href="#${item.target}">${item.label}</a></li>`)
    .join("");
}

// ----- 1. Hero -----
function renderHero(profile, hero) {
  // In F4 the placeholder becomes a <model-viewer> when hero.model.src has a .glb
  document.getElementById("top").innerHTML = `
    <h1 id="hero-title">
      <span class="hero-name">${profile.name}</span>
      <span class="hero-role">${profile.role}</span>
    </h1>
    <p class="hero-tagline">${profile.tagline}</p>
    <a class="btn" href="#${hero.ctaTarget}">${hero.ctaLabel}</a>
    <figure class="hero-3d">
      <div class="hero-3d-placeholder" role="img" aria-label="${hero.model.alt}">
        TODO: modelo 3D (.glb)
      </div>
    </figure>
  `;
}

// ----- 2. About -----
function renderAbout(about) {
  document.getElementById("about").innerHTML = `
    <h2 id="about-title">${about.title}</h2>
    <figure class="about-photo">
      <img src="${about.photo}" alt="${about.photoAlt}" width="480" height="600" loading="lazy">
    </figure>
    <div class="about-text">
      ${about.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    </div>
  `;
}

// ----- 3. Skills marquee -----
function renderSkills(skills) {
  document.getElementById("skills").innerHTML = `
    <h2 id="skills-title" class="visually-hidden">${skills.title}</h2>
    <ul class="marquee">
      ${skills.items.map((skill) => `<li>${skill}</li>`).join("")}
    </ul>
  `;
}

// ----- 4. Services -----
function renderServices(services) {
  document.getElementById("services").innerHTML = `
    <h2 id="services-title">${services.title}</h2>
    <ul class="services-list">
      ${services.items
        .map(
          (service) => `
          <li>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
          </li>`
        )
        .join("")}
    </ul>
  `;
}

// ----- 5. Projects -----
// Card = clickable preview in the grid
function createCard(project) {
  const card = document.createElement("li");
  card.className = "project-card";

  card.innerHTML = `
    <a href="#${project.id}">
      <img src="${project.cover}" alt="${project.coverAlt}" width="800" height="600" loading="lazy">
      <h3>${project.title}</h3>
      <p class="project-meta">${project.category} · ${project.tools.join(", ")}</p>
    </a>
  `;

  return card;
}

// Case = full case study, shown when its card is clicked
function createCase(project) {
  const article = document.createElement("article");
  article.id = project.id;
  article.className = "case";
  article.setAttribute("aria-labelledby", `${project.id}-title`);

  article.innerHTML = `
    <h3 id="${project.id}-title">${project.title}</h3>
    <dl class="case-facts">
      <dt>Rol</dt><dd>${project.role}</dd>
      <dt>Herramientas</dt><dd>${project.tools.join(", ")}</dd>
      <dt>Año</dt><dd>${project.year}</dd>
    </dl>
    <h4>El reto</h4>
    <p>${project.challenge}</p>
    <h4>Lo que hice</h4>
    <p>${project.process}</p>
    <h4>Resultado</h4>
    <p>${project.result}</p>
    ${project.link ? `<a class="btn" href="${project.link}" target="_blank" rel="noopener">Ver proyecto</a>` : ""}
    <a class="case-back" href="#projects">Volver a proyectos</a>
  `;

  return article;
}

function renderProjects(projects) {
  const section = document.getElementById("projects");
  section.innerHTML = `
    <h2 id="projects-title">${projects.title}</h2>
    <ul class="project-grid"></ul>
    <div class="cases"></div>
  `;

  const projectGrid = section.querySelector(".project-grid");
  const casesContainer = section.querySelector(".cases");

  // Only projects marked as "featured": true appear on the home
  const featuredProjects = projects.items.filter((project) => project.featured);

  featuredProjects.forEach((project) => {
    projectGrid.appendChild(createCard(project));
    casesContainer.appendChild(createCase(project));
  });
}

// ----- 6. Process -----
function renderProcess(process) {
  document.getElementById("process").innerHTML = `
    <h2 id="process-title">${process.title}</h2>
    <ol class="process-steps">
      ${process.steps
        .map(
          (step) => `
          <li>
            <h3>${step.title}</h3>
            <p>${step.description}</p>
          </li>`
        )
        .join("")}
    </ol>
  `;
}

// ----- 7. Lab -----
function renderLab(lab) {
  document.getElementById("lab").innerHTML = `
    <h2 id="lab-title">${lab.title}</h2>
    <p>${lab.intro}</p>
    <ul class="lab-grid">
      ${lab.items
        .map(
          (item) => `
          <li>
            <figure>
              <img src="${item.image}" alt="${item.alt}" width="600" height="600" loading="lazy">
              <figcaption>${item.caption}</figcaption>
            </figure>
          </li>`
        )
        .join("")}
    </ul>
  `;
}

// ----- 8. FAQ (<details>/<summary> = native accordion) -----
function renderFaq(faq) {
  document.getElementById("faq").innerHTML = `
    <h2 id="faq-title">${faq.title}</h2>
    ${faq.items
      .map(
        (item) => `
        <details>
          <summary>${item.question}</summary>
          <p>${item.answer}</p>
        </details>`
      )
      .join("")}
  `;
}

// ----- 9. Contact -----
function renderContact(profile, contact) {
  document.getElementById("contact").innerHTML = `
    <h2 id="contact-title">${contact.title}</h2>
    <p>${contact.text}</p>
    <a class="btn btn-large" href="mailto:${profile.email}">${contact.ctaLabel}</a>
    <ul class="social-links">
      ${contact.social
        .map((link) => `<li><a href="${link.url}" target="_blank" rel="noopener">${link.label}</a></li>`)
        .join("")}
    </ul>
  `;
}

// ----- Footer -----
function renderFooter(profile, footer) {
  const year = new Date().getFullYear(); // updates by itself every year
  document.getElementById("site-footer").innerHTML = `
    <p>© ${year} ${profile.name}</p>
    <a href="#top">${footer.backToTop}</a>
  `;
}

// ----- Render everything -----
function renderPage(info) {
  renderMeta(info.meta);
  renderHeader(info.profile, info.nav);
  renderHero(info.profile, info.hero);
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

    // The sections didn't exist when the page loaded, so if the URL
    // has a #hash (e.g. #contact) we scroll to it now that they do
    if (location.hash) {
      document.querySelector(location.hash)?.scrollIntoView();
    }
  } catch (error) {
    console.error("Error loading info.json:", error);
    showPageError();
  }
}

loadInfo();
