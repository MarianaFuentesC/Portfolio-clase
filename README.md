# Portfolio-clase

Portfolio personal de **Mariana Fuentes**, diseñadora UX/UI. Es un sitio one-page en HTML, CSS y JavaScript sin frameworks, cuyo contenido se renderiza desde un archivo JSON.

## Estructura

```
index.html        → portfolio (esqueleto: una <section> vacía por sección)
gestion.html      → panel de gestión (login + CRUD de proyectos + perfil)
data/info.json    → TODO el contenido del sitio
css/style.css     → estilos (portfolio + gestión)
js/storage.js     → getInfo / saveInfo / resetInfo (localStorage → info.json)
js/main.js        → renderiza cada sección del portfolio
js/gestion.js     → lógica del panel de gestión
js/credentials.js → usuario y contraseña del panel
```

## Cómo verlo en local

El sitio carga `data/info.json` con `fetch()`, y el navegador lo bloquea si se abre con doble clic (`file://`). Hay que abrirlo desde un servidor local, por ejemplo con la extensión **Live Server** de VS Code: clic derecho en `index.html` → *Open with Live Server*.

## Cómo editar el contenido

- **Permanente:** editar `data/info.json`.
- **Rápido (solo en tu navegador):** entrar a `gestion.html`. Los cambios se guardan en `localStorage` y no modifican `info.json`. El botón "Restablecer datos" vuelve al JSON original.

> El login de `gestion.html` está escrito en `js/credentials.js`, así que cualquiera puede leerlo con las DevTools. Solo oculta el panel; no es seguridad real.

## Estado

- [x] F1: estructura HTML semántica
- [x] F2: sistema visual (CSS)
- [x] Contenido en JSON + panel de gestión
- [ ] F3: interacciones (menú overlay, panel lateral de casos, marquee, preloader)
- [ ] F4: modelo 3D del hero (`<model-viewer>` + `.glb` de Blender)
- [ ] F5: revisión de accesibilidad y publicación en GitHub Pages
