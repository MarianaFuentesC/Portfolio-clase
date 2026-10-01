// =========================================
// Gestión — admin panel for the portfolio
// CRUD of projects + profile editing.
// Data: getInfo() / saveInfo() / resetInfo() from js/storage.js
// Changes are saved in localStorage (only visible in THIS browser).
// =========================================

// IIFE: keeps all these variables private to this file
(() => {
  // ----- State -----
  let info = null;        // the whole info.json object
  let editIndex = null;   // index of the project being edited (null = creating)
  let sessionActive = false;

  // ----- DOM references -----
  const loginSection = document.getElementById("login");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const layout = document.querySelector(".admin-layout");
  const message = document.getElementById("admin-message");

  const projectForm = document.getElementById("project-form");
  const projectFormTitle = document.getElementById("project-form-title");
  const btnSubmit = document.getElementById("btn-submit");
  const btnCancel = document.getElementById("btn-cancel");

  const listShow = document.getElementById("list-show");
  const listUpdate = document.getElementById("list-update");
  const listDelete = document.getElementById("list-delete");

  const profileForm = document.getElementById("profile-form");
  const btnReset = document.getElementById("btn-reset");

  // Shortcut: read / write the value of an input by its id
  const field = (id) => document.getElementById(id);

  // ----- Panels -----
  function showPanel(panelName) {
    document.querySelectorAll(".panel").forEach((panel) => {
      panel.hidden = panel.id !== `panel-${panelName}`;
    });
    document.querySelectorAll(".sidebar-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.panel === panelName);
    });
    message.hidden = true;
  }

  function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
  }

  // ----- Save -----
  function persist() {
    if (!sessionActive) return;
    saveInfo(info);
  }

  // ----- Lists (Mostrar / Actualizar / Eliminar) -----
  function createListItem(project, buttonHtml) {
    const item = document.createElement("li");
    item.className = "admin-item";
    item.innerHTML = `
      <img src="${project.cover}" alt="" width="80" height="60">
      <div class="admin-item-info">
        <strong>${project.title}</strong>
        <span>${project.category} · ${project.year} · ${project.featured ? "Destacado" : "Oculto"}</span>
      </div>
      ${buttonHtml}
    `;
    return item;
  }

  function renderLists() {
    const projects = info.projects.items;

    listShow.innerHTML = "";
    listUpdate.innerHTML = "";
    listDelete.innerHTML = "";

    if (projects.length === 0) {
      const empty = `<li class="admin-empty">Todavía no hay proyectos.</li>`;
      listShow.innerHTML = empty;
      listUpdate.innerHTML = empty;
      listDelete.innerHTML = empty;
      return;
    }

    projects.forEach((project, index) => {
      listShow.appendChild(createListItem(project, ""));
      listUpdate.appendChild(
        createListItem(project, `<button class="btn btn-small btn-edit" type="button" data-index="${index}">Editar</button>`)
      );
      listDelete.appendChild(
        createListItem(project, `<button class="btn btn-small btn-danger btn-delete" type="button" data-index="${index}">Eliminar</button>`)
      );
    });
  }

  // ----- Project form -----
  function fillProjectForm(project) {
    field("input-title").value = project.title;
    field("input-category").value = project.category;
    field("input-year").value = project.year;
    field("input-tools").value = project.tools.join(", ");
    field("input-role").value = project.role;
    field("input-cover").value = project.cover;
    field("input-cover-alt").value = project.coverAlt;
    field("input-challenge").value = project.challenge;
    field("input-process").value = project.process;
    field("input-result").value = project.result;
    field("input-link").value = project.link;
    field("input-featured").checked = project.featured;
  }

  function readProjectForm() {
    return {
      title: field("input-title").value.trim(),
      category: field("input-category").value.trim(),
      year: Number(field("input-year").value),
      tools: field("input-tools")
        .value.split(",")
        .map((tool) => tool.trim())
        .filter((tool) => tool.length > 0),
      role: field("input-role").value.trim(),
      cover: field("input-cover").value.trim(),
      coverAlt: field("input-cover-alt").value.trim(),
      challenge: field("input-challenge").value.trim(),
      process: field("input-process").value.trim(),
      result: field("input-result").value.trim(),
      link: field("input-link").value.trim(),
      featured: field("input-featured").checked,
    };
  }

  // Back to "create" mode
  function resetProjectForm() {
    editIndex = null;
    projectForm.reset();
    field("input-year").value = new Date().getFullYear();
    projectFormTitle.textContent = "Crear proyecto";
    btnSubmit.textContent = "Agregar proyecto";
    btnCancel.hidden = true;
  }

  projectForm.addEventListener("submit", (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    if (!sessionActive) return;

    const projectData = readProjectForm();

    if (editIndex === null) {
      // Create: the id is used as the #anchor of the case (e.g. #case-1727800000000)
      projectData.id = `case-${Date.now()}`;
      info.projects.items.push(projectData);
      showMessage(`Proyecto "${projectData.title}" creado.`);
    } else {
      // Update: keep the original id so links don't break
      projectData.id = info.projects.items[editIndex].id;
      info.projects.items[editIndex] = projectData;
      showMessage(`Proyecto "${projectData.title}" actualizado.`);
    }

    persist();
    resetProjectForm();
    renderLists();
  });

  btnCancel.addEventListener("click", () => {
    resetProjectForm();
    showPanel("update");
  });

  // Event delegation: one listener on the <ul> handles all its buttons
  listUpdate.addEventListener("click", (event) => {
    if (!sessionActive) return;
    if (!event.target.classList.contains("btn-edit")) return;

    editIndex = Number(event.target.dataset.index);
    fillProjectForm(info.projects.items[editIndex]);
    projectFormTitle.textContent = "Editar proyecto";
    btnSubmit.textContent = "Guardar cambios";
    btnCancel.hidden = false;
    showPanel("create");
  });

  listDelete.addEventListener("click", (event) => {
    if (!sessionActive) return;
    if (!event.target.classList.contains("btn-delete")) return;

    const index = Number(event.target.dataset.index);
    const project = info.projects.items[index];
    if (!confirm(`¿Eliminar "${project.title}"? Esta acción no se puede deshacer.`)) return;

    info.projects.items.splice(index, 1);
    persist();

    // If we were editing the deleted project, leave edit mode
    if (editIndex === index) {
      resetProjectForm();
    } else if (editIndex !== null && editIndex > index) {
      editIndex--; // the list shifted one position
    }

    renderLists();
    showMessage(`Proyecto "${project.title}" eliminado.`);
  });

  // ----- Profile form -----
  function fillProfileForm() {
    field("input-name").value = info.profile.name;
    field("input-initials").value = info.profile.initials;
    field("input-profile-role").value = info.profile.role;
    field("input-tagline").value = info.profile.tagline;
    field("input-email").value = info.profile.email;
    field("input-bio").value = info.about.paragraphs.join("\n");
  }

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!sessionActive) return;

    info.profile.name = field("input-name").value.trim();
    info.profile.initials = field("input-initials").value.trim();
    info.profile.role = field("input-profile-role").value.trim();
    info.profile.tagline = field("input-tagline").value.trim();
    info.profile.email = field("input-email").value.trim();
    info.about.paragraphs = field("input-bio")
      .value.split("\n")
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);

    persist();
    showMessage("Perfil guardado.");
  });

  // ----- Reset: discard local changes, back to data/info.json -----
  btnReset.addEventListener("click", async () => {
    if (!confirm("¿Borrar todos los cambios guardados en este navegador y volver a info.json?")) return;

    resetInfo();
    info = await getInfo();
    resetProjectForm();
    renderLists();
    fillProfileForm();
    showMessage("Datos restablecidos desde info.json.");
  });

  // ----- Sidebar -----
  document.querySelectorAll(".sidebar-item").forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.panel));
  });

  // ----- Login -----
  function verifyLogin(user, password) {
    return user === ADMIN_USER && password === ADMIN_PASSWORD;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = field("login-user").value;
    const password = field("login-password").value;

    if (!verifyLogin(user, password)) {
      loginError.hidden = false;
      loginForm.reset();
      return;
    }

    try {
      info = await getInfo();
    } catch (error) {
      console.error("Error loading info:", error);
      loginError.textContent = "No se pudieron cargar los datos. Abre el sitio con un servidor local.";
      loginError.hidden = false;
      return;
    }

    sessionActive = true;
    loginSection.hidden = true;
    layout.hidden = false;
    resetProjectForm();
    renderLists();
    fillProfileForm();
    showPanel("create");
  });
})();
