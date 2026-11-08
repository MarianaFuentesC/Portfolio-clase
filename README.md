# Portafolio 2026

Portafolio de **Mariana Fuentes** (Creación Digital). Al hacer scroll, una esfera de partículas se convierte en un objeto distinto en cada capítulo (computador → poster → celular → cámara → luz de estudio → "hola."). Los trabajos de cada capítulo aparecen junto a su objeto.

## Estructura

```
index.html          → esqueleto de la página
css/portfolio.css   → estilos (modo claro/oscuro con el botón "Luz")
js/data.js          → TODO el contenido: perfil, capítulos y trabajos
js/shapes.js        → formas de partículas (primitivas + dibujos en canvas, o .glb de Blender)
js/app.js           → escena Three.js, scroll, cursor, HUD
```

El sitio anterior (`gestion.html`, `css/style.css`, `js/main.js`, `js/effects.js`, `data/info.json`, …) sigue en la carpeta, pero `index.html` ya no lo usa.

## Verlo en local

Usa **Live Server** (clic derecho en `index.html` → *Open with Live Server*). Los módulos JS no funcionan si se abre con doble clic.

## Editar contenido

Todo está en `js/data.js`:

- **Perfil:** nombre, correo, redes, bio y foto.
- **Trabajos:** en cada capítulo, `works`. Pon `image: 'assets/img/mi-trabajo.jpg'` o `video: 'assets/videos/reel.mp4'`. `ratio` es la proporción de la tarjeta (`'16/9'`, `'4/5'`, `'9/16'`…) y `link` es opcional.
- **Capítulos:** puedes cambiar el orden, el título y la frase.

## Usar tus modelos de Blender

1. Exporta el objeto como **glTF binario (.glb)**: *File → Export → glTF 2.0*, con *Apply Modifiers* activado.
2. Guárdalo en `assets/models/`.
3. En `js/data.js`, en el capítulo correspondiente: `model: 'assets/models/camara.glb'`.

Las partículas se reparten sobre la superficie de todas las mallas del modelo. Tips:
- No hace falta textura ni material: solo importa la forma.
- El detalle se nota en la **silueta y los bordes** (lente, botones, teclas). Las superficies grandes y planas se ven como "relleno".
- Si el modelo falla al cargar, se usa la forma por defecto y aparece un aviso en la consola.
